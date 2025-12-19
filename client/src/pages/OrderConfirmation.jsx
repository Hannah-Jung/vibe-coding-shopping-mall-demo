import { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  Alert,
} from "@mui/material";
import { CheckCircle as CheckCircleIcon, Home as HomeIcon } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";
import { formatPhoneNumber } from "../utils/format";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!order);
  const [error, setError] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    
    // Replace history entry to prevent going back to Stripe payment page
    // This removes the Stripe checkout page from browser history
    const currentUrl = window.location.href;
    window.history.replaceState(null, "", currentUrl);
    
    if (!order && id) {
      fetchOrder();
    }
  }, [id, order]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError("");
      const token = storage.getToken();

      if (!token) {
        setError("Please login to view order.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setOrder(result.data);
      } else {
        setError(result.message || "Failed to load order.");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
      setError("An error occurred while fetching order.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (error || !order) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
            flexDirection: "column",
            gap: 2,
          }}
        >
          <Alert severity="error" sx={{ mb: 2 }}>
            {error || "Order not found."}
          </Alert>
          <Button
            variant="contained"
            onClick={() => navigate("/")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Go to Home
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Navbar />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "800px", mx: "auto" }}>
        {/* Success Message */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 4,
            textAlign: "center",
          }}
        >
          <CheckCircleIcon sx={{ fontSize: 80, color: "success.main", mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 600, mb: 1 }}>
            Order Confirmed!
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Thank you for your order. We've received your order and will process it shortly.
          </Typography>
        </Box>

        {/* Order Details */}
        <Card sx={{ boxShadow: "none", border: "1px solid #e0e0e0", mb: 3 }}>
          <CardContent>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 3,
                borderBottom: "1px solid #e0e0e0",
                pb: 1,
              }}
            >
              Order Details
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Order Number
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  {order.orderNumber}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Order Date
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ fontWeight: 600 }}
                  title={new Date(order.createdAt).toLocaleTimeString()}
                >
                  {new Date(order.createdAt).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Status
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                  {order.status}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                  Payment Method
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 600, textTransform: "capitalize" }}>
                  {order.paymentMethod.replace("_", " ")}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Shipping Information */}
        <Card sx={{ boxShadow: "none", border: "1px solid #e0e0e0", mb: 3 }}>
          <CardContent>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 3,
                borderBottom: "1px solid #e0e0e0",
                pb: 1,
              }}
            >
              Shipping Information
            </Typography>
            <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
              <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Recipient:
                </Typography>
              </Box>
              <Box sx={{ flex: 1, textAlign: "left" }}>
                <Typography variant="body1">
                  {order.shippingInfo?.recipientName}
                </Typography>
              </Box>
            </Box>
            {(order.shippingInfo?.email || order.user?.email) && (
              <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Email:
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography variant="body1">
                    {order.shippingInfo?.email || order.user?.email}
                  </Typography>
                </Box>
              </Box>
            )}
            
            {(() => {
              // Get address fields directly from shippingInfo
              const shippingInfo = order.shippingInfo || {};
              let address = shippingInfo.address || "";
              let apartment = shippingInfo.apartment || "";
              let city = shippingInfo.city || "";
              let state = shippingInfo.state || "";
              let zipCode = shippingInfo.postalCode || "";
              
              // If city/state/apartment don't exist, try to parse from address field (for legacy orders)
              if (!city && !state && !apartment && address) {
                // Try to parse address format: "address|apartment|city|state|zipCode" or "address, apartment, city, state, zipCode"
                let addressParts = [];
                if (address.includes("|")) {
                  addressParts = address.split("|").map(part => part.trim()).filter(part => part);
                } else if (address.includes(",")) {
                  const commaParts = address.split(",").map(part => part.trim()).filter(part => part);
                  if (commaParts.length === 4) {
                    addressParts = [commaParts[0], "", commaParts[1], commaParts[2], commaParts[3]];
                  } else {
                    addressParts = commaParts;
                  }
                }
                
                if (addressParts.length >= 1) {
                  address = addressParts[0];
                }
                if (addressParts.length >= 2) {
                  apartment = addressParts[1];
                }
                if (addressParts.length >= 3) {
                  city = addressParts[2];
                }
                if (addressParts.length >= 4) {
                  state = addressParts[3];
                }
                if (addressParts.length >= 5 && !zipCode) {
                  zipCode = addressParts[4];
                }
              }
              
              return (
                <>
                  {address && (
                    <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                      <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Address:
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography variant="body1">
                          {address}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {apartment && (
                    <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                      <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Apartment, suite, etc.:
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography variant="body1">
                          {apartment}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {city && (
                    <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                      <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          City:
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography variant="body1">
                          {city}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {state && (
                    <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                      <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          State:
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography variant="body1">
                          {state}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                  {zipCode && (
                    <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                      <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          ZIP code:
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1, textAlign: "left" }}>
                        <Typography variant="body1">
                          {zipCode}
                        </Typography>
                      </Box>
                    </Box>
                  )}
                </>
              );
            })()}
            
            {order.shippingInfo?.recipientPhone && order.shippingInfo.recipientPhone !== "0000000000" && (
              <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
                <Box sx={{ flex: "0 0 200px", textAlign: "right" }}>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    Phone:
                  </Typography>
                </Box>
                <Box sx={{ flex: 1, textAlign: "left" }}>
                  <Typography variant="body1">
                    {formatPhoneNumber(order.shippingInfo.recipientPhone)}
                  </Typography>
                </Box>
              </Box>
            )}
            {order.shippingInfo?.deliveryRequest && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Delivery Request:</strong> {order.shippingInfo.deliveryRequest}
              </Typography>
            )}
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card sx={{ boxShadow: "none", border: "1px solid #e0e0e0", mb: 3 }}>
          <CardContent>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 600, 
                mb: 3,
                borderBottom: "1px solid #e0e0e0",
                pb: 1,
              }}
            >
              Order Items
            </Typography>
            {order.items?.map((item) => {
              return (
                <Box key={item._id || item.product?._id} sx={{ mb: 2 }}>
                  <Box sx={{ display: "flex", gap: 2, mb: 1, alignItems: "center" }}>
                    <Box
                      component="img"
                      src={item.productImage || item.product?.image}
                      alt={item.productName || item.product?.name}
                      sx={{
                        width: 80,
                        height: 80,
                        objectFit: "contain",
                        backgroundColor: "#FFFFFF",
                        flexShrink: 0,
                        borderRadius: 1,
                      }}
                    />
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography 
                        variant="body1" 
                        onClick={() => {
                          const productId = item.product?._id || item.product;
                          if (productId) {
                            navigate(`/product/${productId}`);
                          }
                        }}
                        sx={{ 
                          fontWeight: 500, 
                          mb: 0.5,
                          cursor: "pointer",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {item.productName || item.product?.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Quantity: {item.quantity} × ${item.price.toFixed(2)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                        Color: {item.color || "-"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Size: {item.size || "-"}
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ fontWeight: 600, alignSelf: "center" }}>
                      ${item.subtotal.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              );
            })}

            <Divider sx={{ my: 2 }} />

            {/* Totals */}
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography>Items Total</Typography>
              <Typography>${order.itemsTotal.toFixed(2)}</Typography>
            </Box>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Box>
                {(() => {
                  // Determine shipping method from shippingFee (most reliable)
                  // If shippingMethod exists and matches the fee, use it; otherwise determine from fee
                  let shippingMethod = order.shippingMethod;
                  
                  // Always verify/override based on shippingFee to handle incorrect data
                  if (Math.abs(order.shippingFee - 0) < 0.01) {
                    shippingMethod = "free";
                  } else if (Math.abs(order.shippingFee - 9.99) < 0.01) {
                    shippingMethod = "standard";
                  } else if (Math.abs(order.shippingFee - 20.99) < 0.01) {
                    shippingMethod = "express";
                  }
                  
                  return (
                    <>
                      <Typography>
                        {shippingMethod === "free"
                          ? "Free Shipping"
                          : shippingMethod === "standard"
                          ? "Standard Shipping"
                          : shippingMethod === "express"
                          ? "Express Shipping"
                          : "Shipping"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {shippingMethod === "free"
                          ? "5 to 7 business days"
                          : shippingMethod === "standard"
                          ? "3 to 5 business days"
                          : shippingMethod === "express"
                          ? "1 to 2 business days"
                          : ""}
                      </Typography>
                    </>
                  );
                })()}
              </Box>
              <Typography>${order.shippingFee.toFixed(2)}</Typography>
            </Box>
            {order.discountAmount > 0 && (
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                <Typography>Discount</Typography>
                <Typography color="success.main">
                  -${order.discountAmount.toFixed(2)}
                </Typography>
              </Box>
            )}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", justifyContent: "space-between" }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Total
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                ${order.totalAmount.toFixed(2)}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button
            variant="outlined"
            onClick={() => navigate("/")}
            startIcon={<HomeIcon />}
            sx={{
              borderColor: "#000",
              color: "#000",
              "&:hover": { borderColor: "#333", backgroundColor: "#f5f5f5" },
            }}
          >
            Continue Shopping
          </Button>
          <Button
            variant="contained"
            onClick={() => navigate("/orders")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            View My Orders
          </Button>
        </Box>
      </Box>
      <Footer />
    </Box>
  );
};

export default OrderConfirmation;


