import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Alert,
  Divider,
  Grid,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tabs,
  Tab,
  Badge,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ShoppingCart as ShoppingCartIcon, Home as HomeIcon, Search as SearchIcon, Close as CloseIcon, ArrowBack as ArrowBackIcon } from "@mui/icons-material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";

const MyOrders = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrders, setExpandedOrders] = useState({});
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const token = storage.getToken();

      if (!token) {
        setError("Please login to view your orders.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders/my-orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (result.success) {
        setOrders(result.data || []);
      } else {
        setError(result.message || "Failed to load orders.");
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      setError("An error occurred while fetching orders.");
    } finally {
      setLoading(false);
    }
  };

  // Count orders by status
  const orderCountsByStatus = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      preparing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
      refunded: 0,
    };

    orders.forEach((order) => {
      if (order.status && counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });

    return counts;
  }, [orders]);

  // Filter and sort orders
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        // Search by order number
        const orderNumberMatch = order.orderNumber?.toLowerCase().includes(query);
        
        // Search by order items (product names)
        const itemsMatch = order.items?.some((item) => {
          const productName = (item.productName || item.product?.name || "").toLowerCase();
          return productName.includes(query);
        });

        return orderNumberMatch || itemsMatch;
      });
    }

    // Apply sorting by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      
      if (sortOrder === "newest") {
        return dateB - dateA; // Newest first
      } else {
        return dateA - dateB; // Oldest first
      }
    });

    return filtered;
  }, [orders, statusFilter, searchQuery, sortOrder]);

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
            onClick={() => navigate("/")}
            startIcon={<HomeIcon />}
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
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "840px", mx: "auto" }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <IconButton 
            onClick={() => {
              // Store flag in sessionStorage to indicate we should scroll to top
              sessionStorage.setItem('scrollToTop', 'true');
              
              // Disable scroll restoration
              if ('scrollRestoration' in window.history) {
                window.history.scrollRestoration = 'manual';
              }
              
              // Navigate back
              navigate(-1);
              
              // Force scroll to top immediately and multiple times
              window.scrollTo(0, 0);
              requestAnimationFrame(() => {
                window.scrollTo(0, 0);
                setTimeout(() => {
                  window.scrollTo(0, 0);
                  setTimeout(() => {
                    window.scrollTo(0, 0);
                  }, 100);
                }, 100);
              });
            }} 
            sx={{ mb: 2 }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ mb: 3, display: "flex", alignItems: "center", gap: 2 }}>
            <ShoppingCartIcon sx={{ fontSize: 32, color: "#000" }} />
            <Typography variant="h4" sx={{ fontWeight: 600 }}>
              My Orders
            </Typography>
          </Box>
          
          {/* Search and Sort */}
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "center", mb: 3, justifyContent: "space-between" }}>
            <Box sx={{ display: "flex", gap: 0, flex: { xs: "1 1 100%", sm: "1 1 auto" }, minWidth: { xs: "100%", sm: 200 }, alignItems: "stretch" }}>
              <TextField
                placeholder="Search by order number or item..."
                variant="outlined"
                size="small"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setSearchQuery(searchInput);
                  }
                }}
                sx={{
                  flex: 1,
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    borderTopLeftRadius: "4px",
                    borderBottomLeftRadius: "4px",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                  },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                  endAdornment: searchInput ? (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => {
                          setSearchInput("");
                          setSearchQuery("");
                        }}
                        edge="end"
                        sx={{
                          padding: 0.5,
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                }}
              />
              <Button
                variant="contained"
                onClick={() => setSearchQuery(searchInput)}
                sx={{
                  borderRadius: 0,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  borderTopRightRadius: "4px",
                  borderBottomRightRadius: "4px",
                  backgroundColor: "#000",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "#333",
                  },
                  px: 3,
                  whiteSpace: "nowrap",
                }}
              >
                SEARCH
              </Button>
            </Box>
            <FormControl 
              size="small" 
              sx={{ 
                minWidth: 150, 
                ml: { xs: 0, sm: 0 },
                width: { xs: "100%", sm: 150 },
                display: "flex",
                justifyContent: "flex-end",
              }}
            >
              <InputLabel>Sort by Date</InputLabel>
              <Select
                value={sortOrder}
                label="Sort by Date"
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <MenuItem value="newest">Newest First</MenuItem>
                <MenuItem value="oldest">Oldest First</MenuItem>
              </Select>
            </FormControl>
          </Box>

          {/* Search Results Count */}
          {searchQuery.trim() && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {filteredAndSortedOrders.length} {filteredAndSortedOrders.length === 1 ? "order" : "orders"} matching "{searchQuery}"
              </Typography>
            </Box>
          )}

          {/* Status Tabs */}
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: { xs: 2, sm: 3 }, mt: 2, width: "100%" }}>
            <Tabs
              value={statusFilter}
              onChange={(e, newValue) => setStatusFilter(newValue)}
              variant="scrollable"
              scrollButtons={isSmallScreen ? "auto" : false}
              allowScrollButtonsMobile={isSmallScreen}
              textColor="inherit"
              indicatorColor="primary"
              sx={{
                width: "100%",
                "& .MuiTabs-scrollButtons": {
                  "&.Mui-disabled": {
                    opacity: 0.3,
                  },
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 500,
                  minWidth: { xs: 80, sm: 100 },
                  color: "#666",
                  textAlign: "center",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  px: { xs: 1, sm: 1.5 },
                  flexShrink: 0,
                },
                "& .Mui-selected": {
                  color: "#000 !important",
                  fontWeight: 600,
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#000",
                },
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>All</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.all > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.all} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="all"
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Pending</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.pending > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.pending} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="pending"
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Preparing</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.preparing > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.preparing} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="preparing"
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Shipping</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.shipping > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.shipping} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="shipping"
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Delivered</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.delivered > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.delivered} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="delivered"
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Cancelled</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.cancelled > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.cancelled} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="cancelled"
              />
              <Tab
                label={
                  <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0.5, py: 0.5, width: "100%", px: 1 }}>
                    <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Refunded</Box>
                    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                      {orderCountsByStatus.refunded > 0 && (
                        <Badge 
                          badgeContent={orderCountsByStatus.refunded} 
                          color="primary"
                          anchorOrigin={{
                            vertical: 'top',
                            horizontal: 'center',
                          }}
                          sx={{ 
                            "& .MuiBadge-root": {
                              display: "flex",
                              justifyContent: "center",
                              width: "100%",
                            },
                            "& .MuiBadge-badge": { 
                              backgroundColor: "#000",
                              position: "absolute",
                              top: 0,
                              left: "50%",
                              transform: "translateX(-50%)",
                              right: "auto",
                            } 
                          }}
                        >
                          <Box component="span" sx={{ width: 1, height: 1, visibility: "hidden" }} />
                        </Badge>
                      )}
                    </Box>
                  </Box>
                }
                value="refunded"
              />
            </Tabs>
          </Box>
        </Box>

        {filteredAndSortedOrders.length === 0 && orders.length === 0 ? (
          <Card sx={{ boxShadow: "none", border: "1px solid #e0e0e0" }}>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
                No orders found
              </Typography>
              <Button
                variant="contained"
                onClick={() => navigate("/")}
                startIcon={<HomeIcon />}
                sx={{
                  backgroundColor: "#000",
                  color: "#fff",
                  "&:hover": { backgroundColor: "#333" },
                }}
              >
                Go Shopping
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedOrders.length === 0 ? (
          <Card sx={{ boxShadow: "none", border: "1px solid #e0e0e0" }}>
            <CardContent sx={{ textAlign: "center", py: 6 }}>
              <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
                No orders found matching your search.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {filteredAndSortedOrders.map((order) => (
              <Card
                key={order._id}
                sx={{
                  boxShadow: "none",
                  border: "1px solid #e0e0e0",
                  transition: "all 0.2s",
                  "&:hover": {
                    borderColor: "#e0e0e0",
                    boxShadow: "4px 4px 8px rgba(0,0,0,0.15)",
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Grid container spacing={2} sx={{ flex: 1, alignSelf: "center" }}>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Order Number
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          {order.orderNumber}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
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
                        <Typography variant="body2" color="text.secondary">
                          Status
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            textTransform: "capitalize",
                            color:
                              order.status === "delivered"
                                ? "success.main"
                                : order.status === "cancelled"
                                ? "error.main"
                                : "#000",
                          }}
                        >
                          {order.status}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2" color="text.secondary">
                          Payment Status
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            fontWeight: 600,
                            textTransform: "capitalize",
                            color:
                              order.paymentStatus === "completed"
                                ? "success.main"
                                : order.paymentStatus === "cancelled"
                                ? "error.main"
                                : "#000",
                          }}
                        >
                          {order.paymentStatus}
                        </Typography>
                      </Grid>
                    </Grid>
                    <Button
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/order/${order._id}`);
                      }}
                      sx={{
                        ml: 2,
                        borderColor: "#000",
                        color: "#000",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        lineHeight: 1.2,
                        py: 1.5,
                        px: 1.5,
                        minWidth: "auto",
                        width: "auto",
                        "&:hover": {
                          borderColor: "#000",
                          backgroundColor: "#000",
                          color: "#fff",
                        },
                      }}
                    >
                      <Box component="span" sx={{ display: "block" }}>VIEW</Box>
                      <Box component="span" sx={{ display: "block" }}>DETAILS</Box>
                    </Button>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Order Items Summary */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Order Items
                    </Typography>
                    {(expandedOrders[order._id] ? order.items : order.items?.slice(0, 3)).map((item, index) => (
                      <Box key={index} sx={{ display: "flex", gap: 1.5, alignItems: "center", mb: 1 }}>
                        <Box
                          component="img"
                          src={item.productImage || item.product?.image}
                          alt={item.productName || item.product?.name}
                          sx={{
                            width: 50,
                            height: 50,
                            objectFit: "contain",
                            backgroundColor: "#FFFFFF",
                            flexShrink: 0,
                          }}
                        />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {item.productName || item.product?.name} × {item.quantity}
                        </Typography>
                      </Box>
                    ))}
                    {order.items?.length > 3 && !expandedOrders[order._id] && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrders(prev => ({ ...prev, [order._id]: true }));
                        }}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          "&:hover": {
                            color: "#000",
                          },
                        }}
                      >
                        + {order.items.length - 3} more items
                      </Typography>
                    )}
                    {order.items?.length > 3 && expandedOrders[order._id] && (
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedOrders(prev => ({ ...prev, [order._id]: false }));
                        }}
                        sx={{
                          cursor: "pointer",
                          textDecoration: "underline",
                          mt: 1,
                          "&:hover": {
                            color: "#000",
                          },
                        }}
                      >
                        Show less
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Total */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      Total Amount
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>
                      ${order.totalAmount.toFixed(2)}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default MyOrders;

