import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  useMediaQuery,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Check as CheckIcon,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";

// Default colors and sizes
const DEFAULT_COLORS = ["#000", "#fff", "#9e9e9e"];
const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const PLUS_SIZES = ["1X", "2X", "3X"];
const COLOR_NAMES = ["BLACK", "WHITE", "GRAY"];

const Cart = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [isHovered, setIsHovered] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const fillTimeoutRef = useRef(null);
  const [optionsModalOpen, setOptionsModalOpen] = useState(false);
  const [itemsNeedingOptions, setItemsNeedingOptions] = useState([]);

  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const token = storage.getToken();

      if (!token) {
        setError("Please login to view your cart.");
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
  }, []);

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchCart();
  }, [fetchCart]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (fillTimeoutRef.current) {
        clearTimeout(fillTimeoutRef.current);
      }
    };
  }, []);

  const handleUpdateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1 || newQuantity > 10 || !cart) return;

    // Optimistic update with memoized calculations
    const updatedItems = cart.items.map((item) =>
      item._id === itemId ? { ...item, quantity: newQuantity } : item
    );
    
    // Calculate totals in a single pass
    let newTotalAmount = 0;
    let newTotalItems = 0;
    updatedItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      newTotalAmount += itemTotal;
      newTotalItems += item.quantity;
    });
    
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
        setCart(result.data);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating quantity:", error);
      await fetchCart();
    }
  }, [cart, fetchCart]);

  const handleRemoveItem = useCallback(async (itemId) => {
    if (!cart) return;

    // Optimistic update with memoized calculations
    const updatedItems = cart.items.filter((item) => item._id !== itemId);
    
    // Calculate totals in a single pass
    let newTotalAmount = 0;
    let newTotalItems = 0;
    updatedItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      newTotalAmount += itemTotal;
      newTotalItems += item.quantity;
    });
    
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
        setCart(result.data);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error removing item:", error);
      await fetchCart();
    }
  }, [cart, fetchCart]);

  const handleUpdateItemOptions = useCallback(async (itemId, color, size) => {
    if (!cart) return;

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ color, size }),
      });

      const result = await response.json();
      if (result.success) {
        setCart(result.data);
        window.dispatchEvent(new Event("cartUpdated"));
      } else {
        await fetchCart();
      }
    } catch (error) {
      console.error("Error updating item options:", error);
      await fetchCart();
    }
  }, [cart, fetchCart]);

  const handleCheckout = useCallback(() => {
    if (!cart || !cart.items) {
      navigate("/checkout");
      return;
    }

    // Check for items missing color or size
    const isAccessory = (item) => item.product?.category?.toLowerCase() === "accessories";
    const itemsNeedingOptions = cart.items.filter((item) => {
      if (isAccessory(item)) {
        return !item.color; // Accessories only need color
      }
      return !item.color || !item.size; // Other items need both
    });

    if (itemsNeedingOptions.length > 0) {
      setItemsNeedingOptions(itemsNeedingOptions);
      setOptionsModalOpen(true);
      return;
    }

    navigate("/checkout");
  }, [navigate, cart]);

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
            onClick={() => navigate("/")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Continue Shopping
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  const isEmpty = !cart || !cart.items || cart.items.length === 0;

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Navbar />
      <Box
        sx={{
          maxWidth: "1200px",
          mx: "auto",
          px: { xs: 2, sm: 3, md: 4 },
          py: { xs: 4, sm: 5, md: 6 },
        }}
      >
        {/* CART Title */}
        <Typography
          variant="h3"
          sx={{
            textAlign: "center",
            textTransform: "uppercase",
            fontWeight: 400,
            fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
            letterSpacing: "0.1em",
            mb: 3,
            color: "#000",
          }}
        >
          CART
        </Typography>

        <Divider sx={{ mb: 4 }} />

        {isEmpty ? (
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              minHeight: "40vh",
              gap: 3,
            }}
          >
            <Typography variant="h6" sx={{ color: "#666" }}>
              Your cart is empty
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/")}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                px: 4,
                py: 1.5,
                textTransform: "uppercase",
                borderRadius: 0,
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              Continue Shopping
            </Button>
          </Box>
        ) : (
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", lg: "row" },
              gap: { xs: 0, lg: 4 },
              alignItems: { xs: "stretch", lg: "flex-start" },
            }}
          >
            {/* Left: Product List */}
            <Box
              sx={{
                flex: { xs: "1 1 100%", lg: "1 1 65%" },
                minWidth: 0,
                order: { xs: 1, lg: 1 },
              }}
            >
              {/* Desktop Table View */}
              {!isMobile && (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    backgroundColor: "transparent",
                  }}
                >
                  <Table sx={{ borderCollapse: "separate", borderSpacing: "0" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            borderBottom: "1px solid #000",
                            py: 2,
                            px: 0,
                            textTransform: "uppercase",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            letterSpacing: "0.05em",
                            color: "#000",
                          }}
                        >
                          PRODUCT
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            borderBottom: "1px solid #000",
                            py: 2,
                            px: 0,
                            textTransform: "uppercase",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            letterSpacing: "0.05em",
                            color: "#000",
                          }}
                        >
                          QUANTITY
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            borderBottom: "1px solid #000",
                            py: 2,
                            px: 0,
                            textTransform: "uppercase",
                            fontWeight: 500,
                            fontSize: "0.875rem",
                            letterSpacing: "0.05em",
                            color: "#000",
                          }}
                        >
                          TOTAL
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell
                            sx={{
                              borderBottom: "1px solid #e0e0e0",
                              py: 3,
                              px: 0,
                            }}
                          >
                            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                              <Box
                                component="img"
                                src={item.product?.image}
                                alt={item.product?.name}
                                onClick={() => navigate(`/product/${item.product?._id}`)}
                                sx={{
                                  width: 120,
                                  height: 150,
                                  objectFit: "contain",
                                  backgroundColor: "#FFFFFF",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                              />
                              <Box sx={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 500,
                                    mb: 1,
                                    textTransform: "uppercase",
                                    fontSize: "0.875rem",
                                    letterSpacing: "0.05em",
                                    cursor: "pointer",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                  onClick={() => navigate(`/product/${item.product?._id}`)}
                                >
                                  {item.product?.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: "0.875rem",
                                    color: "#000",
                                    mb: 1,
                                  }}
                                >
                                  ${item.price.toFixed(2)}
                                </Typography>
                                
                                {/* Color Selection */}
                                {(() => {
                                  const isAccessory = item.product?.category?.toLowerCase() === "accessories";
                                  const hasColor = !!item.color;
                                  const availableColors = COLOR_NAMES;
                                  
                                  if (hasColor) {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important", mb: 1 }}>
                                        <Select
                                          value={item.color}
                                          onChange={(e) => handleUpdateItemOptions(item._id, e.target.value, item.size)}
                                            sx={{
                                              fontSize: "0.75rem",
                                              height: "28px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableColors.map((color) => (
                                            <MenuItem key={color} value={color} sx={{ fontSize: "0.75rem" }}>
                                              {color}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    );
                                  } else {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important", mb: 1 }}>
                                        <InputLabel sx={{ fontSize: "0.75rem" }}>Color</InputLabel>
                                        <Select
                                          value=""
                                          onChange={(e) => handleUpdateItemOptions(item._id, e.target.value, item.size)}
                                          label="Color"
                                            sx={{
                                              fontSize: "0.75rem",
                                              height: "28px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableColors.map((color) => (
                                            <MenuItem key={color} value={color} sx={{ fontSize: "0.75rem" }}>
                                              {color}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    );
                                  }
                                })()}
                                
                                {/* Size Selection */}
                                {(() => {
                                  const isAccessory = item.product?.category?.toLowerCase() === "accessories";
                                  if (isAccessory) return null;
                                  
                                  const hasSize = !!item.size;
                                  const isPlus = item.product?.category?.toLowerCase() === "plus";
                                  const availableSizes = isPlus ? PLUS_SIZES : DEFAULT_SIZES;
                                  
                                  const getDisabledSize = () => {
                                    if (isPlus) return "3X";
                                    return "XL";
                                  };
                                  const disabledSize = getDisabledSize();
                                  
                                  if (hasSize) {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important" }}>
                                        <Select
                                          value={item.size}
                                          onChange={(e) => {
                                            if (e.target.value !== disabledSize) {
                                              handleUpdateItemOptions(item._id, item.color, e.target.value);
                                            }
                                          }}
                                            sx={{
                                              fontSize: "0.75rem",
                                              height: "28px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableSizes.map((size) => {
                                            const isDisabled = size === disabledSize;
                                            return (
                                              <MenuItem 
                                                key={size} 
                                                value={size} 
                                                disabled={isDisabled}
                                                sx={{ 
                                                  fontSize: "0.75rem",
                                                  opacity: isDisabled ? 0.5 : 1,
                                                }}
                                              >
                                                {size}
                                              </MenuItem>
                                            );
                                          })}
                                        </Select>
                                      </FormControl>
                                    );
                                  } else {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important" }}>
                                        <InputLabel sx={{ fontSize: "0.75rem" }}>Size</InputLabel>
                                        <Select
                                          value=""
                                          onChange={(e) => {
                                            if (e.target.value !== disabledSize) {
                                              handleUpdateItemOptions(item._id, item.color, e.target.value);
                                            }
                                          }}
                                          label="Size"
                                            sx={{
                                              fontSize: "0.75rem",
                                              height: "28px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableSizes.map((size) => {
                                            const isDisabled = size === disabledSize;
                                            return (
                                              <MenuItem 
                                                key={size} 
                                                value={size} 
                                                disabled={isDisabled}
                                                sx={{ 
                                                  fontSize: "0.75rem",
                                                  opacity: isDisabled ? 0.5 : 1,
                                                }}
                                              >
                                                {size}
                                              </MenuItem>
                                            );
                                          })}
                                        </Select>
                                      </FormControl>
                                    );
                                  }
                                })()}
                                {item.finalSale && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: "0.75rem",
                                      color: "#666",
                                      fontStyle: "italic",
                                      mt: 0.5,
                                      display: "block",
                                    }}
                                  >
                                    Final Sale: No Return
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              borderBottom: "1px solid #e0e0e0",
                              py: 3,
                              px: 0,
                              verticalAlign: "middle",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  border: "1px solid #000",
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
                                    width: 32,
                                    height: 32,
                                    minWidth: 32,
                                    color: "#000",
                                    "&:hover": {
                                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                    "&.Mui-disabled": {
                                      color: "#ccc",
                                    },
                                  }}
                                >
                                  <RemoveIcon sx={{ fontSize: "1rem" }} />
                                </IconButton>
                                <Typography
                                  sx={{
                                    minWidth: 40,
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
                                    width: 32,
                                    height: 32,
                                    minWidth: 32,
                                    color: "#000",
                                    "&:hover": {
                                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                    "&.Mui-disabled": {
                                      color: "#ccc",
                                    },
                                  }}
                                >
                                  <AddIcon sx={{ fontSize: "1rem" }} />
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
                                  "&:hover": {
                                    textDecoration: "none",
                                    opacity: 0.7,
                                  },
                                }}
                              >
                                Remove
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              borderBottom: "1px solid #e0e0e0",
                              py: 3,
                              px: 0,
                              verticalAlign: "middle",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                              }}
                            >
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  fontSize: "0.875rem",
                                }}
                              >
                                ${(item.price * item.quantity).toFixed(2)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Mobile Table View */}
              {isMobile && (
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{
                    backgroundColor: "transparent",
                  }}
                >
                  <Table sx={{ borderCollapse: "separate", borderSpacing: "0" }}>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            borderBottom: "1px solid #000",
                            py: 1.5,
                            px: 0,
                            textTransform: "uppercase",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            letterSpacing: "0.05em",
                            color: "#000",
                            width: "50%",
                          }}
                        >
                          PRODUCT
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            borderBottom: "1px solid #000",
                            py: 1.5,
                            px: 0,
                            textTransform: "uppercase",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            letterSpacing: "0.05em",
                            color: "#000",
                            width: "30%",
                          }}
                        >
                          QUANTITY
                        </TableCell>
                        <TableCell
                          align="center"
                          sx={{
                            borderBottom: "1px solid #000",
                            py: 1.5,
                            px: 0,
                            textTransform: "uppercase",
                            fontWeight: 500,
                            fontSize: "0.75rem",
                            letterSpacing: "0.05em",
                            color: "#000",
                            width: "20%",
                          }}
                        >
                          TOTAL
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cart.items.map((item) => (
                        <TableRow key={item._id}>
                          <TableCell
                            sx={{
                              borderBottom: "1px solid #e0e0e0",
                              py: 2,
                              px: 0,
                              verticalAlign: "top",
                            }}
                          >
                            <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                              <Box
                                component="img"
                                src={item.product?.image}
                                alt={item.product?.name}
                                onClick={() => navigate(`/product/${item.product?._id}`)}
                                sx={{
                                  width: 60,
                                  height: 75,
                                  objectFit: "contain",
                                  backgroundColor: "#FFFFFF",
                                  cursor: "pointer",
                                  flexShrink: 0,
                                }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 500,
                                    mb: 0.5,
                                    textTransform: "uppercase",
                                    fontSize: "0.7rem",
                                    letterSpacing: "0.05em",
                                    cursor: "pointer",
                                    lineHeight: 1.3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                  onClick={() => navigate(`/product/${item.product?._id}`)}
                                >
                                  {item.product?.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontSize: "0.75rem",
                                    color: "#000",
                                    mb: 1,
                                  }}
                                >
                                  ${item.price.toFixed(2)}
                                </Typography>
                                
                                {/* Color Selection */}
                                {(() => {
                                  const isAccessory = item.product?.category?.toLowerCase() === "accessories";
                                  const hasColor = !!item.color;
                                  const availableColors = COLOR_NAMES;
                                  
                                  if (hasColor) {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important", mb: 1 }}>
                                        <Select
                                          value={item.color}
                                          onChange={(e) => handleUpdateItemOptions(item._id, e.target.value, item.size)}
                                            sx={{
                                              fontSize: "0.65rem",
                                              height: "24px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableColors.map((color) => (
                                            <MenuItem key={color} value={color} sx={{ fontSize: "0.65rem" }}>
                                              {color}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    );
                                  } else {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important", mb: 1 }}>
                                        <InputLabel sx={{ fontSize: "0.65rem" }}>Color</InputLabel>
                                        <Select
                                          value=""
                                          onChange={(e) => handleUpdateItemOptions(item._id, e.target.value, item.size)}
                                          label="Color"
                                            sx={{
                                              fontSize: "0.65rem",
                                              height: "24px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableColors.map((color) => (
                                            <MenuItem key={color} value={color} sx={{ fontSize: "0.65rem" }}>
                                              {color}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                    );
                                  }
                                })()}
                                
                                {/* Size Selection */}
                                {(() => {
                                  const isAccessory = item.product?.category?.toLowerCase() === "accessories";
                                  if (isAccessory) return null;
                                  
                                  const hasSize = !!item.size;
                                  const isPlus = item.product?.category?.toLowerCase() === "plus";
                                  const availableSizes = isPlus ? PLUS_SIZES : DEFAULT_SIZES;
                                  
                                  const getDisabledSize = () => {
                                    if (isPlus) return "3X";
                                    return "XL";
                                  };
                                  const disabledSize = getDisabledSize();
                                  
                                  if (hasSize) {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important" }}>
                                        <Select
                                          value={item.size}
                                          onChange={(e) => {
                                            if (e.target.value !== disabledSize) {
                                              handleUpdateItemOptions(item._id, item.color, e.target.value);
                                            }
                                          }}
                                            sx={{
                                              fontSize: "0.65rem",
                                              height: "24px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableSizes.map((size) => {
                                            const isDisabled = size === disabledSize;
                                            return (
                                              <MenuItem 
                                                key={size} 
                                                value={size} 
                                                disabled={isDisabled}
                                                sx={{ 
                                                  fontSize: "0.65rem",
                                                  opacity: isDisabled ? 0.5 : 1,
                                                }}
                                              >
                                                {size}
                                              </MenuItem>
                                            );
                                          })}
                                        </Select>
                                      </FormControl>
                                    );
                                  } else {
                                    return (
                                      <FormControl size="small" sx={{ width: "150px !important", minWidth: "150px !important" }}>
                                        <InputLabel sx={{ fontSize: "0.65rem" }}>Size</InputLabel>
                                        <Select
                                          value=""
                                          onChange={(e) => {
                                            if (e.target.value !== disabledSize) {
                                              handleUpdateItemOptions(item._id, item.color, e.target.value);
                                            }
                                          }}
                                          label="Size"
                                            sx={{
                                              fontSize: "0.65rem",
                                              height: "24px",
                                              width: "150px !important",
                                            "& .MuiSelect-select": {
                                              padding: "0 4px 0 10px !important",
                                              py: 0,
                                            },
                                            }}
                                        >
                                          {availableSizes.map((size) => {
                                            const isDisabled = size === disabledSize;
                                            return (
                                              <MenuItem 
                                                key={size} 
                                                value={size} 
                                                disabled={isDisabled}
                                                sx={{ 
                                                  fontSize: "0.65rem",
                                                  opacity: isDisabled ? 0.5 : 1,
                                                }}
                                              >
                                                {size}
                                              </MenuItem>
                                            );
                                          })}
                                        </Select>
                                      </FormControl>
                                    );
                                  }
                                })()}
                                {item.finalSale && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      fontSize: "0.65rem",
                                      color: "#666",
                                      fontStyle: "italic",
                                      mt: 0.25,
                                      display: "block",
                                    }}
                                  >
                                    Final Sale: No Return
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              borderBottom: "1px solid #e0e0e0",
                              py: 2,
                              px: 0,
                              verticalAlign: "middle",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.75,
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  alignItems: "center",
                                  border: "1px solid #000",
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
                                    width: 24,
                                    height: 24,
                                    minWidth: 24,
                                    color: "#000",
                                    "&:hover": {
                                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                    "&.Mui-disabled": {
                                      color: "#ccc",
                                    },
                                  }}
                                >
                                  <RemoveIcon sx={{ fontSize: "0.75rem" }} />
                                </IconButton>
                                <Typography
                                  sx={{
                                    minWidth: 28,
                                    textAlign: "center",
                                    fontSize: "0.75rem",
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
                                    width: 24,
                                    height: 24,
                                    minWidth: 24,
                                    color: "#000",
                                    "&:hover": {
                                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                                    },
                                    "&.Mui-disabled": {
                                      color: "#ccc",
                                    },
                                  }}
                                >
                                  <AddIcon sx={{ fontSize: "0.75rem" }} />
                                </IconButton>
                              </Box>
                              <Typography
                                component="button"
                                onClick={() => handleRemoveItem(item._id)}
                                sx={{
                                  color: "#000",
                                  textDecoration: "underline",
                                  fontSize: "0.65rem",
                                  cursor: "pointer",
                                  border: "none",
                                  background: "none",
                                  padding: 0,
                                  "&:hover": {
                                    textDecoration: "none",
                                    opacity: 0.7,
                                  },
                                }}
                              >
                                Remove
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell
                            align="center"
                            sx={{
                              borderBottom: "1px solid #e0e0e0",
                              py: 2,
                              px: 0,
                              verticalAlign: "middle",
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                height: "100%",
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 500,
                                  fontSize: "0.75rem",
                                }}
                              >
                                ${(item.price * item.quantity).toFixed(2)}
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Right: Order Summary (Desktop) / Bottom (Mobile) */}
            <Box
              sx={{
                flex: { xs: "0 0 auto", lg: "0 0 35%" },
                position: "relative",
                width: { xs: "100%", lg: "auto" },
                backgroundColor: { xs: "#fff", lg: "transparent" },
                borderTop: { xs: "1px solid #e0e0e0", lg: "none" },
                px: { xs: 2, lg: 0 },
                py: { xs: 2, lg: 0 },
                display: "flex",
                flexDirection: "column",
                order: { xs: 2, lg: 2 },
              }}
            >
              {/* Order Summary Header */}
              <Box
                sx={{
                  position: "static",
                  backgroundColor: { xs: "transparent", lg: "#fff" },
                  p: { xs: 0, lg: 3 },
                  pb: { xs: 0, lg: 2 },
                  border: { xs: "none", lg: "1px solid #e0e0e0" },
                  borderBottom: { xs: "none", lg: "1px solid #e0e0e0" },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.125rem", lg: "1.25rem" },
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Order Summary
                </Typography>
              </Box>

              {/* Order Summary Content */}
              <Paper
                elevation={0}
                sx={{
                  border: { xs: "none", lg: "1px solid #e0e0e0" },
                  borderTop: { xs: "none", lg: "none" },
                  borderRadius: 0,
                  p: { xs: 2, lg: 3 },
                  pt: { xs: 2, lg: 2 },
                  backgroundColor: { xs: "#fff", lg: "#fff" },
                  display: "flex",
                  flexDirection: "column",
                }}
              >

                <Box sx={{ py: 2 }}>
                  {cart.totalAmount < 75 ? (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 0,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "0.875rem", lg: "0.875rem" },
                          color: "#000",
                        }}
                      >
                        Add <Box component="span" sx={{ fontWeight: 700 }}>${(75 - cart.totalAmount).toFixed(2)}</Box> more to unlock Free Shipping!
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        backgroundColor: "#f5f5f5",
                        borderRadius: 0,
                        textAlign: "center",
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontSize: { xs: "0.875rem", lg: "0.875rem" },
                          color: "#000",
                        }}
                      >
                        Congrats! You've unlocked Free Shipping!
                      </Typography>
                    </Box>
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1.5,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.875rem", lg: "0.875rem" },
                        color: "#666",
                      }}
                    >
                      Subtotal
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.875rem", lg: "0.875rem" },
                        fontWeight: 500,
                      }}
                    >
                      ${cart.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.875rem", lg: "0.875rem" },
                        color: "#666",
                      }}
                    >
                      Shipping
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontSize: { xs: "0.875rem", lg: "0.875rem" },
                        fontWeight: 500,
                        textDecoration: "underline",
                        cursor: "pointer",
                      }}
                    >
                      {cart.totalAmount >= 75 ? "Free shipping" : "Calculated at checkout"}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    py: 2,
                  }}
                >
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1rem", lg: "1.125rem" },
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    Total
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: "1rem", lg: "1.125rem" },
                    }}
                  >
                    ${cart.totalAmount.toFixed(2)} USD
                  </Typography>
                </Box>

                <Button
                  variant="outlined"
                  onClick={handleCheckout}
                  fullWidth
                  onMouseEnter={() => {
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
                    borderColor: "#000",
                    backgroundColor: "#fff",
                    color: "#000",
                    py: { xs: 1.75, lg: 2 },
                    textTransform: "uppercase",
                    borderRadius: 0,
                    fontWeight: 700,
                    fontSize: { xs: "0.875rem", lg: "1rem" },
                    letterSpacing: "0.1em",
                    boxShadow: "none",
                    position: "relative",
                    overflow: "hidden",
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: isHovered ? "100%" : "0%",
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
                      width: !isHovered && isFilled ? "100%" : "0%",
                      height: "100%",
                      backgroundColor: "#fff",
                      transition: "width 0.4s ease-in-out",
                      zIndex: 0,
                    },
                    color: `${isHovered ? "#fff" : "#000"} !important`,
                    "& *": {
                      position: "relative",
                      zIndex: 2,
                      transition: "color 0.4s ease-in-out",
                      color: `${isHovered ? "#fff" : "#000"} !important`,
                    },
                    "& .MuiButton-label": {
                      position: "relative",
                      zIndex: 2,
                      transition: "color 0.4s ease-in-out",
                      color: `${isHovered ? "#fff" : "#000"} !important`,
                    },
                    "&:hover": {
                      borderColor: "#000",
                      backgroundColor: "#fff",
                      boxShadow: "none",
                    },
                  }}
                >
                  <span style={{ 
                    position: "relative", 
                    zIndex: 2, 
                    color: isHovered ? "#fff" : "#000",
                    transition: "color 0.4s ease-in-out"
                  }}>
                    CHECKOUT
                  </span>
                </Button>

                <Box
                  sx={{
                    textAlign: "center",
                    mt: 2,
                  }}
                >
                  <Box
                    component={Link}
                    to="/"
                    onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                    sx={{
                      color: "#000",
                      textDecoration: "none",
                      fontSize: { xs: "0.875rem", lg: "0.875rem" },
                      cursor: "pointer",
                      position: "relative",
                      display: "inline-block",
                      "&::after": {
                        content: '""',
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        width: 0,
                        height: "1px",
                        backgroundColor: "#000",
                        transition: "width 0.5s ease-in-out",
                      },
                      "&:hover::after": {
                        width: "100%",
                      },
                    }}
                  >
                    CONTINUE SHOPPING
                  </Box>
                </Box>
              </Paper>
            </Box>
          </Box>
        )}
      </Box>
      <Footer />

      {/* Options Selection Required Modal */}
      <Dialog
        open={optionsModalOpen}
        onClose={() => setOptionsModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            textAlign: "center",
            textTransform: "uppercase",
            fontWeight: 600,
            fontSize: "1rem",
            pb: 1,
          }}
        >
          Options Selection Required
        </DialogTitle>
        <DialogContent
          sx={{
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100px",
            paddingTop: "14px",
            paddingBottom: "24px",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <Box sx={{ width: "100%", mb: 2, pb: 1, borderBottom: "1px solid #e0e0e0" }}>
            <Typography variant="body1" sx={{ textAlign: "center" }}>
              Please select options for {itemsNeedingOptions.length} {itemsNeedingOptions.length === 1 ? 'item' : 'items'}
            </Typography>
          </Box>
          <Box sx={{ width: "100%", textAlign: "left" }}>
            {itemsNeedingOptions.map((item) => (
              <Box
                key={item._id}
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  py: 1,
                  borderBottom: "1px solid #e0e0e0",
                  minHeight: "37px",
                }}
              >
                <Typography 
                  variant="body2" 
                  sx={{ 
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  {item.product?.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: "#666", 
                    ml: 2,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  ${item.price.toFixed(2)}
                </Typography>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, pb: 2, justifyContent: "center" }}>
          <Button
            onClick={() => setOptionsModalOpen(false)}
            variant="contained"
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: 0,
              textTransform: "none",
              px: 3,
              "&:hover": {
                backgroundColor: "#333",
              },
            }}
          >
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Cart;

