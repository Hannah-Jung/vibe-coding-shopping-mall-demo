import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  LocalShipping as LocalShippingIcon,
  Payment as PaymentIcon,
  ShoppingCart as ShoppingCartIcon,
  ExpandMore as ExpandMoreIcon,
  Edit as EditIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";
import { getCurrentUser } from "../utils/api";
import { formatPhoneNumberInput } from "../utils/format";

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const [originalAddress, setOriginalAddress] = useState("");
  const [originalPhone, setOriginalPhone] = useState("");
  const [saveAddress, setSaveAddress] = useState(false);
  const [savePhone, setSavePhone] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
    shippingMethod: "",
    paymentMethod: "",
    shippingFee: 0,
    discountAmount: 0,
  });
  const [formErrors, setFormErrors] = useState({});
  const [shippingMethodError, setShippingMethodError] = useState(false);
  const [expanded, setExpanded] = useState({
    shippingMethod: true,
  });
  const [activeStep, setActiveStep] = useState(1); // 0: Cart, 1: Shipping Method
  const [isHovered, setIsHovered] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const fillTimeoutRef = useRef(null);
  const [isContinueShoppingHovered, setIsContinueShoppingHovered] = useState(false);


  const isShippingDone = useMemo(() => {
    return formData.shippingMethod !== "";
  }, [formData.shippingMethod]);

  // Determine active step based on completion status
  useEffect(() => {
    const newStep = isShippingDone ? 1 : 1;
    setActiveStep((prev) => prev !== newStep ? newStep : prev);
  }, [isShippingDone]);

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded((prev) => ({
      ...prev,
      [panel]: isExpanded,
    }));
  };

  // Format phone number using common utility
  const formatPhoneNumber = useCallback((value) => {
    return formatPhoneNumberInput(value);
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCart();
    fetchUserData();
  }, [formatPhoneNumber]);

  const fetchUserData = async () => {
    try {
      const token = storage.getToken();
      if (!token) return;

      const response = await getCurrentUser(token);
      if (response.success && response.data) {
        const userData = response.data;
        setUser(userData);
        
        // Parse address if it exists
        let address = "";
        let apartment = "";
        let city = "";
        let state = "";
        let zipCode = "";
        
        if (userData.address) {
          // Try to parse address format: "address|apartment|city|state|zipCode" (using | as delimiter)
          // Fallback to comma-separated format for backward compatibility
          let addressParts = [];
          if (userData.address.includes("|")) {
            addressParts = userData.address.split("|").map(part => part.trim());
          } else {
            // Legacy format: "address, apartment, city, state, zipCode"
            // Need to handle cases where apartment might be empty
            const commaParts = userData.address.split(",").map(part => part.trim());
            // If we have exactly 4 parts, assume apartment is empty
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
          if (addressParts.length >= 5) {
            zipCode = addressParts[4];
          }
        }
        
        // Format phone number if it exists
        let phone = "";
        if (userData.phone) {
          phone = formatPhoneNumber(userData.phone);
        }
        
        // Store original values for comparison
        const originalAddressStr = address || apartment || city || state || zipCode ? 
          `${address}|${apartment}|${city}|${state}|${zipCode}` : "";
        const originalPhoneStr = phone;
        setOriginalAddress(originalAddressStr);
        setOriginalPhone(originalPhoneStr);
        
        // If address or phone is empty, show checkboxes (default checked)
        const hasAddress = !!(address || city || state || zipCode);
        const hasPhone = !!phone;
        setSaveAddress(!hasAddress);
        setSavePhone(!hasPhone);
        
        setFormData((prev) => ({
          ...prev,
          email: userData.email || "",
          firstName: userData.name ? userData.name.split(" ")[0] || "" : "",
          lastName: userData.name ? userData.name.split(" ").slice(1).join(" ") || "" : "",
          address: address,
          apartment: apartment,
          city: city,
          state: state,
          zipCode: zipCode,
          phone: phone,
        }));
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError("");
      const token = storage.getToken();

      if (!token) {
        setError("Please login to checkout.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        if (!result.data || !result.data.items || result.data.items.length === 0) {
          setError("Your cart is empty. Please add items to cart first.");
          return;
        }
        setCart(result.data);
      } else {
        setError(result.message || "Failed to load cart.");
      }
    } catch (error) {
      console.error("Error fetching cart:", error);
      setError("An error occurred while fetching cart.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Format phone number if it's the phone field
    if (name === "phone") {
      formattedValue = formatPhoneNumber(value);
    } 
    // Format ZIP code: only digits, max 5 digits
    else if (name === "zipCode") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      // Limit to 5 digits
      formattedValue = digitsOnly.slice(0, 5);
    }
    
    // Batch state updates using React's automatic batching
    setFormData((prev) => {
      // Only update if value actually changed
      if (prev[name] === formattedValue) {
        return prev;
      }
      const updated = {
        ...prev,
        [name]: formattedValue,
      };
      
      // Check if address fields changed (if user had original address)
      if (originalAddress && (name === "address" || name === "apartment" || name === "city" || name === "state" || name === "zipCode")) {
        const currentAddressStr = `${updated.address}|${updated.apartment}|${updated.city}|${updated.state}|${updated.zipCode}`;
        if (currentAddressStr !== originalAddress) {
          setSaveAddress(true); // Show checkbox if address changed
        } else {
          setSaveAddress(false); // Hide checkbox if address reverted to original
        }
      }
      
      // Check if phone changed (if user had original phone)
      if (originalPhone && name === "phone") {
        if (formattedValue !== originalPhone) {
          setSavePhone(true); // Show checkbox if phone changed
        } else {
          setSavePhone(false); // Hide checkbox if phone reverted to original
        }
      }
      
      return updated;
    });
    
    // Clear error when user starts typing (only if error exists)
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  }, [formatPhoneNumber, formErrors, originalAddress, originalPhone]);

  const handleUpdateQuantity = async (itemId, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 10) return;

    // Optimistic update: Update local state immediately
    const updatedItems = cart.items.map((item) =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    const newTotalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    setCart({
      ...cart,
      items: updatedItems,
      totalAmount: newTotalAmount,
      totalItems: newTotalItems,
    });

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      const result = await response.json();
      if (result.success) {
        // Update with server response to ensure consistency
        setCart(result.data);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        // Rollback on error
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      // Rollback on error
      await fetchCart();
    }
  };

  const handleRemoveItem = async (itemId) => {
    // Optimistic update: Remove item from local state immediately
    const updatedItems = cart.items.filter((item) => item._id !== itemId);
    const newTotalAmount = updatedItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const newTotalItems = updatedItems.reduce((sum, item) => sum + item.quantity, 0);
    
    // Check if cart will be empty after removal
    const willBeEmpty = updatedItems.length === 0;
    
    setCart({
      ...cart,
      items: updatedItems,
      totalAmount: newTotalAmount,
      totalItems: newTotalItems,
    });

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success) {
        // Update with server response to ensure consistency
        setCart(result.data);
        window.dispatchEvent(new Event("cartUpdated"));
        
        // If cart is empty, redirect to cart page
        if (willBeEmpty || !result.data?.items || result.data.items.length === 0) {
          navigate("/cart");
        }
      } else {
        // Rollback on error
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
      // Rollback on error
      await fetchCart();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) {
      errors.firstName = "First name is required";
    }
    if (!formData.lastName.trim()) {
      errors.lastName = "Last name is required";
    }
    if (!formData.address.trim()) {
      errors.address = "Address is required";
    }
    if (!formData.city.trim()) {
      errors.city = "City is required";
    }
    if (!formData.state.trim()) {
      errors.state = "State is required";
    }
    if (!formData.zipCode.trim()) {
      errors.zipCode = "ZIP code is required";
    } else if (!/^[0-9]{5}$/.test(formData.zipCode)) {
      errors.zipCode = "Please enter a valid 5-digit ZIP code";
    }
    if (!formData.phone.trim()) {
      errors.phone = "Phone number is required";
    } else {
      // Remove formatting characters and check if it's 10 digits
      const phoneDigits = formData.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        errors.phone = "Please enter a valid 10-digit phone number";
      }
    }

    // Validate email
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate shipping method only
    if (!formData.shippingMethod) {
      setError("Please select a shipping method.");
      setShippingMethodError(true);
      // Expand shipping method accordion to help user
      setExpanded((prev) => ({ ...prev, shippingMethod: true }));
      return;
    }
    
    // Clear shipping method error if method is selected
    setShippingMethodError(false);

    setSubmitting(true);

    const totalAmountUSD = (cart?.totalAmount || 0) + formData.shippingFee - formData.discountAmount;

    try {
      // Create Checkout Session on server
      const token = storage.getToken();
      const userId = token ? JSON.parse(atob(token.split('.')[1])).userId : "";

      const requestBody = {
        amount: totalAmountUSD,
        currency: "usd",
        metadata: {
          userId: userId,
          shippingFee: formData.shippingFee.toString(),
          discountAmount: formData.discountAmount.toString(),
          shippingMethod: formData.shippingMethod || "free",
        },
        shippingInfo: {}, // Empty - will be filled from Stripe
        orderItems: cart?.items || [],
        shippingFee: formData.shippingFee,
        discountAmount: formData.discountAmount,
      };

      const checkoutResponse = await fetch(`${API_BASE_URL}/payment/create-checkout-session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const checkoutResult = await checkoutResponse.json();

      if (!checkoutResult.success) {
        let errorMessage = checkoutResult.message || "Failed to create checkout session.";
        
        // Handle specific error cases
        if (checkoutResult.errorCode === "amount_too_small") {
          errorMessage = checkoutResult.message || 
            `Minimum order amount is $${checkoutResult.minimumAmount || 0.50}. Your order total is $${checkoutResult.currentAmount?.toFixed(2) || "0.00"}. Please add more items to your cart.`;
        } else if (checkoutResult.error) {
          errorMessage += ` Error: ${checkoutResult.error}`;
        }
        
        throw new Error(errorMessage);
      }

      // Redirect to Stripe Checkout
      if (checkoutResult.url) {
        window.location.href = checkoutResult.url;
      } else {
        throw new Error("Checkout URL not received from server.");
      }
    } catch (error) {
      setError(error.message || "An error occurred during payment. Please try again.");
      setSubmitting(false);
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

  if (error && !cart) {
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
          <Typography variant="h6" color="error">
            {error}
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate("/cart")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Back to Cart
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  const steps = ["Cart", "Shipping Method"];

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navbar />
      <Box sx={{ py: { xs: 3, md: 4 }, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "1200px", mx: "auto", width: "100%" }}>
        {/* Header Section */}
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3, position: "relative" }}>
            <IconButton
              onClick={() => navigate("/cart")}
              sx={{
                mr: 2,
                color: "#000",
                "&:hover": { backgroundColor: "#f5f5f5" },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 600,
                textTransform: "uppercase",
                flexGrow: 1,
                textAlign: "center",
              }}
            >
              Checkout
            </Typography>
          </Box>

          {/* Stepper */}
          <Paper
            elevation={0}
            sx={{
              p: 3,
              backgroundColor: "transparent",
              borderRadius: 0,
              border: "none",
            }}
          >
            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => {
                const stepIcons = {
                  0: <ShoppingCartIcon />,
                  1: <LocalShippingIcon />,
                };
                let isCompleted = false;
                if (index === 0) {
                  isCompleted = true; // Cart is always completed
                } else if (index === 1) {
                  isCompleted = isShippingDone;
                }
                const isActive = index === activeStep;
                return (
                  <Step key={label} completed={isCompleted}>
                    <StepLabel
                      icon={stepIcons[index]}
                      sx={{
                        "& .MuiStepLabel-iconContainer": {
                          "& .MuiSvgIcon-root": {
                            fontSize: "1.5rem",
                            color: isActive ? "#000000" : isCompleted ? "#000000" : "#9e9e9e",
                          },
                          "& .MuiStepIcon-root": {
                            color: isActive ? "#000000" : isCompleted ? "#000000" : "#9e9e9e",
                            "&.Mui-active": {
                              color: "#000000",
                            },
                            "&.Mui-completed": {
                              color: "#000000",
                            },
                          },
                        },
                        "& .MuiStepLabel-label": {
                          color: isActive ? "#000000" : isCompleted ? "#000000" : "#9e9e9e",
                          fontWeight: isActive ? 600 : 400,
                          fontSize: "0.875rem",
                          "&.Mui-active": {
                            color: "#000000",
                            fontWeight: 600,
                          },
                          "&.Mui-completed": {
                            color: "#000000",
                          },
                        },
                      }}
                    >
                      {label}
                    </StepLabel>
                  </Step>
                );
              })}
            </Stepper>
          </Paper>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
            {error}
          </Alert>
        )}

         <form onSubmit={handleSubmit}>
           <Box sx={{ display: "flex", flexDirection: { xs: "column", lg: "row" }, gap: { xs: 1, lg: 1.5 }, width: "100%", justifyContent: "center" }}>
             {/* Left Column - Shipping Method (50%) */}
             <Box sx={{ flex: { xs: "1 1 100%", lg: "0 0 49%" }, minWidth: 0, maxWidth: { lg: "49%" } }}>
              {/* Shipping Method */}
              <Accordion
                expanded={expanded.shippingMethod}
                onChange={handleAccordionChange("shippingMethod")}
                sx={{
                  boxShadow: "none",
                  border: shippingMethodError ? "1px solid #f44336" : "1px solid #e0e0e0",
                  borderRadius: "0 !important",
                  my: 1.5,
                  transition: "border-color 0.3s ease-in-out",
                  "&:before": {
                    display: "none",
                  },
                  "& .MuiAccordionSummary-root": {
                    borderRadius: "0 !important",
                  },
                  "& .MuiAccordionDetails-root": {
                    borderRadius: "0 !important",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  sx={{
                    px: { xs: 2, sm: 3 },
                    py: 2,
                    "& .MuiAccordionSummary-content": {
                      my: 0,
                    },
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <LocalShippingIcon sx={{ mr: 1, color: "#000" }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Shipping Method
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
                  <RadioGroup
                    name="shippingMethod"
                    value={formData.shippingMethod}
                    onChange={(e) => {
                      const method = e.target.value;
                      setFormData((prev) => ({
                        ...prev,
                        shippingMethod: method,
                        shippingFee: method === "free" ? 0 : method === "standard" ? 9.99 : 20.99,
                      }));
                      // Clear error when shipping method is selected
                      if (method) {
                        setShippingMethodError(false);
                        setError("");
                      }
                    }}
                  >
                    {/* Free Shipping */}
                    <Box
                      sx={{
                        border: formData.shippingMethod === "free" ? "1px solid #000" : "1px solid #e0e0e0",
                        borderRadius: 0,
                        p: 2,
                        mb: 2,
                        backgroundColor: formData.shippingMethod === "free" ? "#fafafa" : "#fff",
                        cursor: (cart?.totalAmount || 0) >= 75 ? "pointer" : "not-allowed",
                        opacity: (cart?.totalAmount || 0) >= 75 ? 1 : 0.5,
                        "&:hover": {
                          backgroundColor: (cart?.totalAmount || 0) >= 75 ? "#fafafa" : "#fff",
                        },
                      }}
                      onClick={() => {
                        if ((cart?.totalAmount || 0) >= 75) {
                          setFormData((prev) => ({
                            ...prev,
                            shippingMethod: "free",
                            shippingFee: 0,
                          }));
                          setShippingMethodError(false);
                          setError("");
                        }
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <Radio
                          checked={formData.shippingMethod === "free"}
                          value="free"
                          disabled={(cart?.totalAmount || 0) < 75}
                          onChange={(e) => {
                            if ((cart?.totalAmount || 0) >= 75) {
                              setFormData((prev) => ({
                                ...prev,
                                shippingMethod: e.target.value,
                                shippingFee: 0,
                              }));
                              setShippingMethodError(false);
                              setError("");
                            }
                          }}
                          sx={{ color: "#000", "&.Mui-checked": { color: "#000" }, "&.Mui-disabled": { color: "#ccc" } }}
                        />
                        <Box sx={{ flex: 1, ml: 1 }}>
                          <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
                            Free Shipping
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            5 to 7 business days
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600, ml: "auto", flexShrink: 0 }}>
                          $0.00
                        </Typography>
                      </Box>
                    </Box>

                    {/* Free Shipping Message */}
                    {(cart?.totalAmount || 0) < 75 && (
                      <Box
                        component={Link}
                        to="/"
                        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                        onMouseEnter={() => setIsContinueShoppingHovered(true)}
                        onMouseLeave={() => setIsContinueShoppingHovered(false)}
                        sx={{
                          mb: 2,
                          p: 1.5,
                          backgroundColor: "#f5f5f5",
                          borderRadius: 0,
                          textAlign: "center",
                          textDecoration: "none",
                          display: "block",
                        }}
                      >
                        <Box
                          sx={{
                            textAlign: "center",
                          }}
                        >
                          <Box
                            component="span"
                            sx={{
                              color: "#000",
                              fontSize: { xs: "0.875rem", lg: "0.875rem" },
                              position: "relative",
                              display: "inline-block",
                              transition: "opacity 0.3s ease-in-out",
                              "&::after": {
                                content: '""',
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                width: isContinueShoppingHovered ? "100%" : 0,
                                height: "1px",
                                backgroundColor: "#000",
                                transition: "width 0.5s ease-in-out",
                              },
                            }}
                          >
                            <Box
                              component="span"
                              sx={{
                                display: "inline-block",
                                opacity: isContinueShoppingHovered ? 0 : 1,
                                transition: "opacity 0.3s ease-in-out",
                                position: isContinueShoppingHovered ? "absolute" : "relative",
                                width: isContinueShoppingHovered ? 0 : "auto",
                                overflow: "hidden",
                              }}
                            >
                              Add <Box component="span" sx={{ fontWeight: 700 }}>${(75 - (cart?.totalAmount || 0)).toFixed(2)}</Box> more to unlock Free Shipping!
                            </Box>
                            <Box
                              component="span"
                              sx={{
                                display: "inline-block",
                                opacity: isContinueShoppingHovered ? 1 : 0,
                                transition: "opacity 0.3s ease-in-out",
                                position: isContinueShoppingHovered ? "relative" : "absolute",
                                width: isContinueShoppingHovered ? "auto" : 0,
                                overflow: "hidden",
                              }}
                            >
                              CONTINUE SHOPPING
                            </Box>
                          </Box>
                        </Box>
                      </Box>
                    )}

                    {/* Standard Shipping */}
                    <Box
                      sx={{
                        border: formData.shippingMethod === "standard" ? "1px solid #000" : "1px solid #e0e0e0",
                        borderRadius: 0,
                        p: 2,
                        mb: 2,
                        backgroundColor: formData.shippingMethod === "standard" ? "#fafafa" : "#fff",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#fafafa",
                        },
                      }}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          shippingMethod: "standard",
                          shippingFee: 9.99,
                        }));
                        setShippingMethodError(false);
                        setError("");
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <Radio
                          checked={formData.shippingMethod === "standard"}
                          value="standard"
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              shippingMethod: e.target.value,
                              shippingFee: 9.99,
                            }));
                            setShippingMethodError(false);
                            setError("");
                          }}
                          sx={{ color: "#000", "&.Mui-checked": { color: "#000" } }}
                        />
                        <Box sx={{ flex: 1, ml: 1 }}>
                          <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
                            Standard Shipping
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            3 to 5 business days
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600, ml: "auto", flexShrink: 0 }}>
                          $9.99
                        </Typography>
                      </Box>
                    </Box>

                    {/* Express Shipping */}
                    <Box
                      sx={{
                        border: formData.shippingMethod === "express" ? "1px solid #000" : "1px solid #e0e0e0",
                        borderRadius: 0,
                        p: 2,
                        backgroundColor: formData.shippingMethod === "express" ? "#fafafa" : "#fff",
                        cursor: "pointer",
                        "&:hover": {
                          backgroundColor: "#fafafa",
                        },
                      }}
                      onClick={() => {
                        setFormData((prev) => ({
                          ...prev,
                          shippingMethod: "express",
                          shippingFee: 20.99,
                        }));
                        setShippingMethodError(false);
                        setError("");
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", width: "100%" }}>
                        <Radio
                          checked={formData.shippingMethod === "express"}
                          value="express"
                          onChange={(e) => {
                            setFormData((prev) => ({
                              ...prev,
                              shippingMethod: e.target.value,
                              shippingFee: 20.99,
                            }));
                            setShippingMethodError(false);
                            setError("");
                          }}
                          sx={{ color: "#000", "&.Mui-checked": { color: "#000" } }}
                        />
                        <Box sx={{ flex: 1, ml: 1 }}>
                          <Typography sx={{ fontWeight: 500, mb: 0.5 }}>
                            Express Shipping
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            1 to 2 business days
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600, ml: "auto", flexShrink: 0 }}>
                          $20.99
                        </Typography>
                      </Box>
                    </Box>
                  </RadioGroup>
                </AccordionDetails>
              </Accordion>

             </Box>

             {/* Right Column - Order Summary (50%) */}
             <Box sx={{ flex: { xs: "1 1 100%", lg: "0 0 49%" }, minWidth: 0, maxWidth: { lg: "49%" } }}>
              <Box sx={{ position: "sticky", top: 20 }}>
                <Card
                  sx={{
                    boxShadow: "none",
                    border: "1px solid #e0e0e0",
                    borderRadius: 0,
                  }}
                >
                  <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <ShoppingCartIcon sx={{ mr: 1, color: "#000" }} />
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Order Summary
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 3 }} />

                    {/* Cart Items */}
                    <Box sx={{ maxHeight: "300px", overflowY: "auto", mb: 3, px: 1 }}>
                      {cart?.items?.map((item) => (
                        <Box key={item._id} sx={{ mb: 2.5, pb: 2, borderBottom: "1px solid #f0f0f0" }}>
                          <Box sx={{ display: "flex", gap: 2 }}>
                            <Box
                              component="img"
                              src={item.product?.image}
                              alt={item.product?.name}
                              onClick={() => navigate(`/product/${item.product?._id}`)}
                              sx={{
                                width: 70,
                                height: 70,
                                objectFit: "contain",
                                backgroundColor: "#FFFFFF",
                                flexShrink: 0,
                                cursor: "pointer",
                                transition: "transform 0.2s",
                                "&:hover": {
                                  transform: "scale(1.05)",
                                },
                              }}
                            />
                            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                              <Typography
                                variant="body2"
                                onClick={() => navigate(`/product/${item.product?._id}`)}
                                sx={{
                                  fontWeight: 500,
                                  mb: 0.5,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical",
                                  cursor: "pointer",
                                  "&:hover": {
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {item.product?.name}
                              </Typography>
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 0.5 }}>
                                <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5, alignItems: "center" }}>
                                  <Box
                                    sx={{
                                      display: "flex",
                                      alignItems: "center",
                                      border: "1px solid #e0e0e0",
                                      borderRadius: 0,
                                      width: "fit-content",
                                    }}
                                  >
                                    <IconButton
                                      onClick={() => handleUpdateQuantity(item._id, item.quantity - 1)}
                                      disabled={item.quantity <= 1}
                                      size="small"
                                      sx={{
                                        borderRadius: 0,
                                        width: 28,
                                        height: 28,
                                        minWidth: 28,
                                        "&:hover": {
                                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                                        },
                                      }}
                                    >
                                      <RemoveIcon sx={{ fontSize: "0.875rem" }} />
                                    </IconButton>
                                    <Typography
                                      sx={{
                                        minWidth: 32,
                                        textAlign: "center",
                                        fontSize: "0.875rem",
                                        fontWeight: 500,
                                      }}
                                    >
                                      {item.quantity}
                                    </Typography>
                                    <IconButton
                                      onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                                      disabled={item.quantity >= 10}
                                      size="small"
                                      sx={{
                                        borderRadius: 0,
                                        width: 28,
                                        height: 28,
                                        minWidth: 28,
                                        "&:hover": {
                                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                                        },
                                      }}
                                    >
                                      <AddIcon sx={{ fontSize: "0.875rem" }} />
                                    </IconButton>
                                  </Box>
                                  <Typography
                                    component="button"
                                    onClick={() => handleRemoveItem(item._id)}
                                    sx={{
                                      color: "#000",
                                      textDecoration: "underline",
                                      fontSize: "0.75rem",
                                      cursor: "pointer",
                                      border: "none",
                                      background: "none",
                                      padding: 0,
                                      textAlign: "center",
                                      "&:hover": {
                                        textDecoration: "none",
                                        opacity: 0.7,
                                      },
                                    }}
                                  >
                                    Remove
                                  </Typography>
                                </Box>
                                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 0.5 }}>
                                  <Typography variant="caption" color="text.secondary">
                                    ${item.price.toFixed(2)}
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                          </Box>
                        </Box>
                      ))}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    {/* Totals */}
                    <Box sx={{ mb: 2 }}>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Items ({cart?.totalItems || 0})
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          ${cart?.totalAmount?.toFixed(2) || "0.00"}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary">
                          Shipping
                        </Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          ${formData.shippingFee.toFixed(2)}
                        </Typography>
                      </Box>
                      {formData.discountAmount > 0 && (
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1.5,
                          }}
                        >
                          <Typography variant="body2" color="text.secondary">
                            Discount
                          </Typography>
                          <Typography variant="body2" color="success.main" sx={{ fontWeight: 500 }}>
                            -${formData.discountAmount.toFixed(2)}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 3,
                      }}
                    >
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Total
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        ${(
                          (cart?.totalAmount || 0) +
                          formData.shippingFee -
                          formData.discountAmount
                        ).toFixed(2)}
                      </Typography>
                    </Box>

                    <Button
                      type="submit"
                      variant="outlined"
                      fullWidth
                      disabled={submitting}
                      onMouseEnter={() => {
                        if (submitting) return;
                        setIsHovered(true);
                        setIsFilled(false);
                        if (hoverTimeoutRef.current) {
                          clearTimeout(hoverTimeoutRef.current);
                        }
                        if (fillTimeoutRef.current) {
                          clearTimeout(fillTimeoutRef.current);
                        }
                        fillTimeoutRef.current = setTimeout(() => {
                          setIsFilled(true);
                        }, 400);
                      }}
                      onMouseLeave={() => {
                        if (submitting) return;
                        setIsHovered(false);
                        if (fillTimeoutRef.current) {
                          clearTimeout(fillTimeoutRef.current);
                          setIsFilled(false);
                        } else if (isFilled) {
                          setTimeout(() => {
                            setIsFilled(false);
                          }, 400);
                        }
                      }}
                      sx={{
                        borderColor: submitting ? "#ccc" : "#000",
                        backgroundColor: submitting ? "#ccc" : "#fff",
                        color: submitting ? "#fff" : (isHovered ? "#fff" : "#000"),
                        py: 1.5,
                        borderRadius: 0,
                        textTransform: "uppercase",
                        fontWeight: 600,
                        fontSize: "0.875rem",
                        letterSpacing: "0.5px",
                        position: "relative",
                        overflow: "hidden",
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: isHovered && !submitting ? "100%" : "0%",
                          height: "100%",
                          backgroundColor: "#000",
                          transition: "width 0.4s ease-in-out",
                          zIndex: 0,
                        },
                        "&::after": {
                          content: '""',
                          position: "absolute",
                          top: 0,
                          left: 0,
                          width: !isHovered && isFilled && !submitting ? "100%" : "0%",
                          height: "100%",
                          backgroundColor: "#fff",
                          transition: "width 0.4s ease-in-out",
                          zIndex: 0,
                        },
                        color: `${submitting ? "#fff" : (isHovered ? "#fff" : "#000")} !important`,
                        "& *": {
                          position: "relative",
                          zIndex: 2,
                          transition: "color 0.4s ease-in-out",
                          color: `${submitting ? "#fff" : (isHovered ? "#fff" : "#000")} !important`,
                        },
                        "& .MuiButton-label": {
                          position: "relative",
                          zIndex: 2,
                          transition: "color 0.4s ease-in-out",
                          color: `${submitting ? "#fff" : (isHovered ? "#fff" : "#000")} !important`,
                        },
                        "&:hover": {
                          borderColor: submitting ? "#ccc" : "#000",
                          backgroundColor: submitting ? "#ccc" : "#fff",
                        },
                        "&:disabled": {
                          backgroundColor: "#ccc",
                          color: "#fff",
                          borderColor: "#ccc",
                        },
                      }}
                    >
                      {submitting ? (
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, position: "relative", zIndex: 2 }}>
                          <CircularProgress size={16} sx={{ color: "#fff" }} />
                          Processing...
                        </Box>
                      ) : (
                        <span style={{ 
                          position: "relative", 
                          zIndex: 2, 
                          color: isHovered ? "#fff" : "#000",
                          transition: "color 0.4s ease-in-out"
                        }}>
                          CONTINUE TO PAYMENT
                        </span>
                      )}
                    </Button>
                  </CardContent>
                 </Card>
               </Box>
             </Box>
           </Box>
         </form>
      </Box>
      <Footer />
    </Box>
  );
};

export default Checkout;

