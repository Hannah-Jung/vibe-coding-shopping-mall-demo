import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { CheckCircle as CheckCircleIcon, Home as HomeIcon } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";

const OrderSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [order, setOrder] = useState(null);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (sessionId && !isProcessingRef.current && !order) {
      processOrder();
    } else if (!sessionId) {
      setError("No session ID found.");
      setLoading(false);
    }
  }, [sessionId, order]);

  const processOrder = async () => {
    // Prevent duplicate processing
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    try {
      setLoading(true);
      setError("");
      const token = storage.getToken();

      if (!token) {
        setError("Please login to complete order.");
        setLoading(false);
        return;
      }

      // Get checkout session details
      const sessionResponse = await fetch(`${API_BASE_URL}/payment/session/${sessionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const sessionResult = await sessionResponse.json();

      if (!sessionResult.success) {
        throw new Error(sessionResult.message || "Failed to retrieve checkout session.");
      }

      if (sessionResult.session.payment_status !== "paid") {
        throw new Error("Payment was not completed successfully.");
      }

      // Get customer and shipping details from Stripe session
      const customerDetails = sessionResult.session.customer_details || {};
      const shippingDetails = sessionResult.session.shipping_details || {};

      // Extract shipping information from Stripe session
      // IMPORTANT: customer_details contains what the user entered in Checkout form
      // However, if a Customer object exists and user didn't change the pre-filled data,
      // customer_details will contain Customer object data
      // shipping_details contains shipping address if different from billing address (can be null)
      // When shipping_details is null, customer_details.address is the shipping address
      // 
      // The issue: When user enters an email that matches an existing Customer object,
      // Stripe pre-fills the form with Customer object data. If user doesn't change it,
      // customer_details will contain the Customer object data, not what user actually entered.
      // 
      // Solution: Always use customer_details as it represents what was submitted in the form.
      // Even if it matches Customer object data, it's what the user confirmed/submitted.
      // 
      // NOTE: There's no way to distinguish between "user entered new data" and
      // "user confirmed pre-filled Customer object data" - both result in customer_details
      // containing the same data. This is a limitation of Stripe's behavior.
      
      // Use customer_details directly - it contains what was submitted in the Checkout form
      // This is the most reliable source of truth for what the user actually submitted
      const shippingAddress = shippingDetails.address || customerDetails.address || {};
      const recipientName = customerDetails.name || shippingDetails.name || "";
      const recipientPhone = customerDetails.phone || shippingDetails.phone || "";
      const email = customerDetails.email || "";

      // Validate required fields
      if (!recipientName) {
        throw new Error("Recipient name is missing from payment session.");
      }
      if (!shippingAddress.line1) {
        throw new Error("Shipping address is missing from payment session.");
      }
      // Phone is optional in Stripe, use empty string if not provided
      const phoneNumber = recipientPhone || "";

      // Parse order items from metadata (fallback if cart is empty)
      const orderItemsFromMetadata = sessionResult.session.metadata?.orderItems
        ? JSON.parse(sessionResult.session.metadata.orderItems)
        : null;

      // Get shipping fee, discount, and shipping method from metadata
      const shippingFee = parseFloat(sessionResult.session.metadata?.shippingFee || "0");
      const discountAmount = parseFloat(sessionResult.session.metadata?.discountAmount || "0");
      const shippingMethod = sessionResult.session.metadata?.shippingMethod || "free";

      // Create order with information from Stripe
      const orderResponse = await fetch(`${API_BASE_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingInfo: {
            recipientName: recipientName,
            recipientPhone: phoneNumber.replace(/\D/g, "") || "0000000000", // Remove formatting, use default if empty
            email: email,
            address: shippingAddress.line1 || "",
            apartment: shippingAddress.line2 || "",
            city: shippingAddress.city || "",
            state: shippingAddress.state || "",
            postalCode: shippingAddress.postal_code || "",
            deliveryRequest: "",
          },
          paymentMethod: "card",
          shippingFee: shippingFee,
          discountAmount: discountAmount,
          shippingMethod: shippingMethod,
          paymentInfo: {
            sessionId: sessionId,
            amount: sessionResult.session.amount_total / 100,
            currency: sessionResult.session.currency,
            paymentStatus: sessionResult.session.payment_status,
          },
          // Include order items from metadata as fallback
          orderItemsFromMetadata: orderItemsFromMetadata,
        }),
      });

      const orderResult = await orderResponse.json();

      if (orderResult.success) {
        setOrder(orderResult.data);
        // Replace current history entry to prevent going back to Stripe
        window.history.replaceState(null, "", `/order/success?session_id=${sessionId}`);
        
        // Navigate to order confirmation page with replace to prevent back navigation to Stripe
        setTimeout(() => {
          navigate(`/order/${orderResult.data._id}`, {
            state: { order: orderResult.data },
            replace: true, // Replace history entry instead of adding new one
          });
        }, 2000);
      } else {
        const errorMessage = orderResult.error 
          ? `${orderResult.message || "Failed to create order."} (${orderResult.error})`
          : orderResult.message || "Failed to create order.";
        throw new Error(errorMessage);
      }
    } catch (error) {
      setError(error.message || "An error occurred while processing your order.");
      setLoading(false);
    } finally {
      isProcessingRef.current = false;
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            gap: 2,
          }}
        >
          <CircularProgress />
          <Typography variant="body1" color="text.secondary">
            Processing your order...
          </Typography>
        </Box>
        <Footer />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            gap: 2,
            px: 2,
          }}
        >
          <Alert severity="error" sx={{ mb: 2, maxWidth: 600 }}>
            {error}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/checkout")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Back to Checkout
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Navbar />
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
          textAlign: "center",
          px: 2,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
          Payment Successful!
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Redirecting to order confirmation...
        </Typography>
      </Box>
      <Footer />
    </Box>
  );
};

export default OrderSuccess;

