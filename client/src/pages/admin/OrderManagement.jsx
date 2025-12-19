import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useMediaQuery,
  useTheme,
  Tabs,
  Tab,
  Badge,
  Pagination,
} from "@mui/material";
import {
  ShoppingCart as ShoppingCartIcon,
  Search as SearchIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { API_BASE_URL } from "../../utils/constants";
import { storage } from "../../utils/localStorage";
import { formatPhoneNumber, formatDate, formatTime } from "../../utils/format";

const OrderManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("all");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const pageFromUrl = searchParams.get("page");
  const [page, setPage] = useState(pageFromUrl ? parseInt(pageFromUrl, 10) : 1);
  const filterRowRef = useRef(null);
  const searchBarRef = useRef(null);

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
        setError("Please login to view orders.");
        setLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/orders?limit=1000`, {
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


  const getStatusColor = (status) => {
    const colors = {
      pending: "warning",
      paid: "info",
      preparing: "info",
      shipping: "primary",
      delivered: "success",
      cancelled: "error",
      refunded: "error",
    };
    return colors[status] || "default";
  };

  const getPaymentStatusColor = (status) => {
    const colors = {
      pending: "warning",
      completed: "success",
      failed: "error",
      cancelled: "error",
      refunded: "error",
    };
    return colors[status] || "default";
  };

  // Count orders by status
  const orderCountsByStatus = useMemo(() => {
    const counts = {
      all: orders.length,
      pending: 0,
      paid: 0,
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

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((order) => {
        const orderNumberMatch = order.orderNumber?.toLowerCase().includes(query);
        const customerNameMatch = order.shippingInfo?.recipientName?.toLowerCase().includes(query);

        return orderNumberMatch || customerNameMatch;
      });
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((order) => order.status === statusFilter);
    }

    // Apply payment status filter
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter((order) => order.paymentStatus === paymentStatusFilter);
    }

    // Apply payment method filter
    if (paymentMethodFilter !== "all") {
      filtered = filtered.filter((order) => order.paymentMethod === paymentMethodFilter);
    }

    // Apply date filter
    if (dateFilter !== "all") {
      const now = new Date();
      const filterDate = new Date();
      switch (dateFilter) {
        case "today":
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter((order) => new Date(order.createdAt) >= filterDate);
          break;
        case "week":
          filterDate.setDate(now.getDate() - 7);
          filtered = filtered.filter((order) => new Date(order.createdAt) >= filterDate);
          break;
        case "month":
          filterDate.setMonth(now.getMonth() - 1);
          filtered = filtered.filter((order) => new Date(order.createdAt) >= filterDate);
          break;
        default:
          break;
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return filtered;
  }, [orders, searchQuery, statusFilter, paymentStatusFilter, paymentMethodFilter, dateFilter]);

  // Calculate pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, statusFilter, paymentStatusFilter, paymentMethodFilter, dateFilter]);

  const handlePageChange = (event, value) => {
    setPage(value);
    // Update URL with new page number
    const params = new URLSearchParams(searchParams);
    params.set("page", value.toString());
    navigate(`/admin/orders?${params.toString()}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Sync search bar width with tabs width (1000px)
  useEffect(() => {
    const updateSearchBarWidth = () => {
      if (searchBarRef.current) {
        searchBarRef.current.style.width = "1000px";
      }
    };

    updateSearchBarWidth();
    window.addEventListener("resize", updateSearchBarWidth);
    
    // Update after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(updateSearchBarWidth, 100);

    return () => {
      window.removeEventListener("resize", updateSearchBarWidth);
      clearTimeout(timeoutId);
    };
  }, []);

  const handleStatusChange = async () => {
    if (!selectedOrder || !newStatus) return;

    // If status hasn't changed and no tracking number or admin notes to update, just close the dialog
    if (selectedOrder.status === newStatus && !trackingNumber && !adminNotes) {
      setStatusDialogOpen(false);
      setSelectedOrder(null);
      setNewStatus("");
      setTrackingNumber("");
      setAdminNotes("");
      return;
    }

    try {
      const token = storage.getToken();
      const response = await fetch(`${API_BASE_URL}/orders/${selectedOrder._id}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber: trackingNumber || undefined,
          adminNotes: adminNotes || undefined,
        }),
      });

      const result = await response.json();

      if (result.success) {
        await fetchOrders();
        setStatusDialogOpen(false);
        setSelectedOrder(null);
        setNewStatus("");
        setTrackingNumber("");
        setAdminNotes("");
      } else {
        setError(result.message || "Failed to update order status.");
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      setError("An error occurred while updating order status.");
    }
  };

  const openStatusDialog = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status);
    setTrackingNumber(order.trackingNumber || "");
    setAdminNotes(order.adminNotes || "");
    setStatusDialogOpen(true);
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

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Navbar />
      <Box sx={{ py: { xs: 2, sm: 3, md: 4 }, px: { xs: 1, sm: 2, md: 4 }, maxWidth: "1400px", mx: "auto", width: "100%", overflowX: "hidden" }}>
        {/* Header */}
        <Box sx={{ mb: { xs: 2, sm: 3, md: 4 } }}>
          <Box sx={{ mb: { xs: 2, sm: 3 }, display: "flex", alignItems: "center", justifyContent: "center", gap: { xs: 1, sm: 2 } }}>
            <ShoppingCartIcon sx={{ fontSize: { xs: 24, sm: 28, md: 32 }, color: "#000" }} />
            <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem" } }}>
              Order Management
            </Typography>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "center", mb: { xs: 1, sm: 2 } }}>
            <Typography variant="body2" sx={{ color: "#666", fontSize: { xs: "0.875rem", sm: "1rem" } }}>
              {paginatedOrders.length} of {filteredAndSortedOrders.length}
            </Typography>
          </Box>

          {/* Search and Filters */}
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 1.5, sm: 2 }, mb: { xs: 2, sm: 3 }, alignItems: "center", maxWidth: "1000px", mx: "auto" }}>
            {/* Search Bar */}
            <Box ref={searchBarRef} sx={{ display: "flex", gap: 0, alignItems: "stretch", width: "1000px", maxWidth: "100%" }}>
              <TextField
                placeholder={isMobile ? "Search orders..." : "Search by order number or customer name..."}
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
                  fontSize: { xs: "0.875rem", sm: "1rem" },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: 0,
                    borderTopLeftRadius: "4px",
                    borderBottomLeftRadius: "4px",
                    borderTopRightRadius: 0,
                    borderBottomRightRadius: 0,
                    fontSize: { xs: "0.875rem", sm: "1rem" },
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
                  px: { xs: 2, sm: 3 },
                  whiteSpace: "nowrap",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                SEARCH
              </Button>
            </Box>

            {/* Filter Row */}
            <Box 
              ref={filterRowRef}
              sx={{ display: "flex", gap: { xs: 1, sm: 2 }, flexWrap: "wrap", mt: { xs: 1.5, sm: 2 }, justifyContent: "center" }}
            >
              <FormControl size="small" sx={{ minWidth: { xs: "auto", sm: 150 }, flex: "0 0 auto" }}>
                <InputLabel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>Payment Status</InputLabel>
                <Select
                  value={paymentStatusFilter}
                  label="Payment Status"
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                >
                  <MenuItem value="all">All Payment</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: "auto", sm: 150 }, flex: "0 0 auto" }}>
                <InputLabel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>Payment Method</InputLabel>
                <Select
                  value={paymentMethodFilter}
                  label="Payment Method"
                  onChange={(e) => setPaymentMethodFilter(e.target.value)}
                  sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                >
                  <MenuItem value="all">All Methods</MenuItem>
                  <MenuItem value="card">Card</MenuItem>
                  <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
                  <MenuItem value="virtual_account">Virtual Account</MenuItem>
                  <MenuItem value="mobile">Mobile</MenuItem>
                  <MenuItem value="cash">Cash</MenuItem>
                </Select>
              </FormControl>

              <FormControl size="small" sx={{ minWidth: { xs: "auto", sm: 150 }, flex: "0 0 auto" }}>
                <InputLabel sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}>Date Range</InputLabel>
                <Select
                  value={dateFilter}
                  label="Date Range"
                  onChange={(e) => setDateFilter(e.target.value)}
                  sx={{ fontSize: { xs: "0.875rem", sm: "1rem" } }}
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">Last 7 Days</MenuItem>
                  <MenuItem value="month">Last 30 Days</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {/* Search Results Count */}
          {searchQuery.trim() && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" sx={{ color: "#666" }}>
                {filteredAndSortedOrders.length} {filteredAndSortedOrders.length === 1 ? "order" : "orders"} matching "{searchQuery}"
              </Typography>
            </Box>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Status Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: { xs: 2, sm: 3 }, overflowX: "auto", width: "100%", maxWidth: "1000px", mx: "auto" }}>
          <Tabs
            value={statusFilter}
            onChange={(e, newValue) => setStatusFilter(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              minWidth: { xs: "100%", sm: "auto" },
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
                  <Box component="span" sx={{ textAlign: "center", width: "100%" }}>Paid</Box>
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", position: "relative", minHeight: 20 }}>
                    {orderCountsByStatus.paid > 0 && (
                      <Badge 
                        badgeContent={orderCountsByStatus.paid} 
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
              value="paid"
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

        {filteredAndSortedOrders.length === 0 ? (
          <Box sx={{ maxWidth: "1000px", mx: "auto" }}>
            <Card sx={{ boxShadow: "none", border: "1px solid #e0e0e0" }}>
              <CardContent sx={{ textAlign: "center", py: 6 }}>
                <Typography variant="h6" sx={{ mb: 2, color: "text.secondary" }}>
                  {orders.length === 0 ? "No orders found" : "No orders matching your filters"}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        ) : isMobile ? (
          // Mobile Card View
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, maxWidth: "1000px", mx: "auto" }}>
            {paginatedOrders.map((order) => (
              <Card
                key={order._id}
                sx={{
                  boxShadow: "none",
                  border: "1px solid #e0e0e0",
                }}
              >
                <CardContent>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Order Number
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 600 }}>
                        {order.orderNumber}
                      </Typography>
                    </Box>
                    <Chip
                      label={order.status.toUpperCase()}
                      color={getStatusColor(order.status)}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Customer: {order.shippingInfo?.recipientName || order.user?.name || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Email: {order.user?.email || "N/A"}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Phone: {formatPhoneNumber(order.shippingInfo?.recipientPhone)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Date: {formatDate(order.createdAt)}
                  </Typography>

                  <Divider sx={{ my: 1.5 }} />

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Products: {order.items?.[0]?.productName || order.items?.[0]?.product?.name || "N/A"}
                    {order.items?.length > 1 && ` + ${order.items.length - 1} more`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                    Payment: {order.paymentMethod?.toUpperCase()} -{" "}
                    <Chip
                      label={order.paymentStatus.toUpperCase()}
                      color={getPaymentStatusColor(order.paymentStatus)}
                      size="small"
                      sx={{ height: 20 }}
                    />
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                    Total: ${order.totalAmount?.toFixed(2)}
                  </Typography>

                  <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => navigate(`/order/${order._id}`)}
                      sx={{ flex: 1 }}
                    >
                      View
                    </Button>
                    <Button
                      variant="contained"
                      size="small"
                      onClick={() => openStatusDialog(order)}
                      sx={{ flex: 1, backgroundColor: "#000", "&:hover": { backgroundColor: "#333" } }}
                    >
                      Update Status
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          // Desktop Table View
          <Box sx={{ maxWidth: "1000px", mx: "auto" }}>
            <TableContainer 
              component={Paper} 
              sx={{ 
                boxShadow: "none", 
                border: "1px solid #e0e0e0",
                overflowX: "hidden",
                width: "100%",
              }}
            >
            <Table sx={{ width: "100%", tableLayout: "auto" }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#000" }}>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Order #</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Date/Time</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Customer</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Payment</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Status</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Total</TableCell>
                  <TableCell sx={{ color: "#fff", fontWeight: 600, textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 }, whiteSpace: "nowrap" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedOrders.map((order) => (
                  <TableRow
                    key={order._id}
                    sx={{
                      "&:hover": {
                        backgroundColor: "#f5f5f5",
                      },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          cursor: "pointer",
                          color: "#000",
                          fontSize: { xs: "0.7rem", sm: "0.875rem" },
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: { xs: 120, sm: "none" },
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        {order.orderNumber}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>
                      <Typography variant="body2" sx={{ fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>{formatDate(order.createdAt)}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.6rem", sm: "0.75rem" }, display: "block" }}>
                        {formatTime(order.createdAt)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: { xs: "0.7rem", sm: "0.875rem" }, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: { xs: 100, sm: "none" } }}>
                        {order.shippingInfo?.recipientName || order.user?.name || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>
                      <Typography variant="body2" sx={{ textTransform: "uppercase", fontSize: { xs: "0.7rem", sm: "0.875rem" } }}>
                        {order.paymentMethod === "card" ? "Card" : 
                         order.paymentMethod === "bank_transfer" ? "Bank" :
                         order.paymentMethod === "virtual_account" ? "Virtual" :
                         order.paymentMethod === "mobile" ? "Mobile" :
                         order.paymentMethod === "cash" ? "Cash" :
                         order.paymentMethod?.toUpperCase() || "N/A"}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Chip
                          label={order.status.toUpperCase()}
                          color={getStatusColor(order.status)}
                          size="small"
                          sx={{ fontSize: { xs: "0.6rem", sm: "0.7rem" }, height: { xs: 20, sm: 24 } }}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, textAlign: "center", fontSize: { xs: "0.7rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>${order.totalAmount?.toFixed(2)}</TableCell>
                    <TableCell sx={{ textAlign: "center", fontSize: { xs: "0.75rem", sm: "0.875rem" }, px: { xs: 0.5, sm: 1 } }}>
                      <Box sx={{ display: "flex", justifyContent: "center" }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => openStatusDialog(order)}
                          sx={{
                            backgroundColor: "#000",
                            color: "#fff",
                            "&:hover": { backgroundColor: "#333" },
                            minWidth: "auto",
                            px: { xs: 0.75, sm: 1.5 },
                            fontSize: { xs: "0.65rem", sm: "0.75rem" },
                          }}
                        >
                          Update
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          </Box>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
              sx={{
                "& .MuiPaginationItem-root.Mui-selected": {
                  backgroundColor: "rgba(0, 0, 0, 1)",
                  color: "#fff",
                  "&:hover": {
                    backgroundColor: "rgba(0, 0, 0, 0.8)",
                  },
                },
              }}
            />
          </Box>
        )}

        {/* Status Update Dialog */}
        <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle sx={{ textAlign: "center" }}>Update Order Status</DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Order: {selectedOrder?.orderNumber}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>Order Status</InputLabel>
                <Select
                  value={newStatus}
                  label="Order Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="paid">Paid</MenuItem>
                  <MenuItem value="preparing">Preparing</MenuItem>
                  <MenuItem value="shipping">Shipping</MenuItem>
                  <MenuItem value="delivered">Delivered</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Tracking Number (Optional)"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Admin Notes (Optional)"
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                fullWidth
                multiline
                rows={3}
                size="small"
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button
              onClick={handleStatusChange}
              variant="contained"
              sx={{ backgroundColor: "#000", "&:hover": { backgroundColor: "#333" } }}
            >
              Update
            </Button>
            <Button 
              onClick={() => setStatusDialogOpen(false)}
              variant="outlined"
              sx={{ 
                borderColor: "#000", 
                color: "#000",
                "&:hover": { 
                  borderColor: "#333",
                  backgroundColor: "#f5f5f5"
                } 
              }}
            >
              Cancel
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
      <Footer />
    </Box>
  );
};

export default OrderManagement;

