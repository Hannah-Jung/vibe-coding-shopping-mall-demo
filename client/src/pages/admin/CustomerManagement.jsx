import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tooltip,
  Avatar,
  TextField,
  InputAdornment,
  TableSortLabel,
  Pagination,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import {
  EditOutlined as EditOutlinedIcon,
  DeleteOutlined as DeleteOutlinedIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { API_BASE_URL } from "../../utils/constants";

const CustomerManagement = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(800));
  const isTablet = useMediaQuery(theme.breakpoints.between(800, "md"));
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("all");
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const result = await response.json();

      if (result.success || result.data) {
        setUsers(result.data || result || []);
      } else {
        setError(result.message || "Failed to fetch users.");
      }
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("An error occurred while fetching users.");
    } finally {
      setLoading(false);
    }
  };

  // Filter and sort users
  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.email?.toLowerCase().includes(query) ||
          user.name?.toLowerCase().includes(query)
      );
    }

    // Apply user type filter
    if (userTypeFilter !== "all") {
      filtered = filtered.filter((user) => user.user_type === userTypeFilter);
    }

    // Apply sorting
    if (orderBy) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (orderBy) {
          case "name":
            aValue = a.name || "";
            bValue = b.name || "";
            break;
          case "email":
            aValue = a.email || "";
            bValue = b.email || "";
            break;
          case "user_type":
            aValue = a.user_type || "";
            bValue = b.user_type || "";
            break;
          case "createdAt":
            aValue = new Date(a.createdAt || 0);
            bValue = new Date(b.createdAt || 0);
            break;
          default:
            return 0;
        }

        if (aValue instanceof Date && bValue instanceof Date) {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        } else {
          return order === "asc"
            ? String(aValue).localeCompare(String(bValue))
            : String(bValue).localeCompare(String(aValue));
        }
      });
    }

    return filtered;
  }, [users, searchQuery, userTypeFilter, orderBy, order]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleDelete = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to delete a user.");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && (result.success || response.status === 200)) {
        setUsers(users.filter((u) => u._id !== userId));
        alert("User deleted successfully!");
      } else {
        alert(result.message || "Failed to delete user.");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("An error occurred while deleting the user.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
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
    <Box sx={{ minHeight: "100vh", backgroundColor: "#ffffff" }}>
      <Navbar />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "980px", mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4, position: "relative" }}>
          <Box
            sx={{
              position: "absolute",
              left: {
                xs: "16px",
                sm: "40px",
                md: "64px",
                lg: "96px",
              },
            }}
          >
            <IconButton onClick={() => navigate("/admin")}>
              <ArrowBackIcon />
            </IconButton>
          </Box>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 600,
              flex: 1,
              textAlign: "center",
              fontSize: {
                xs: "1.5rem",
                sm: "2.125rem",
              },
              "@media (max-width: 500px)": {
                fontSize: "1.25rem",
              },
            }}
          >
            Customer Management
          </Typography>
        </Box>

        {error && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: "#ffebee", borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {users.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              backgroundColor: "#fff",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No users found
            </Typography>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3, px: { xs: 2, sm: 4, md: 6, lg: 10 } }}>
              <Box
                sx={{
                  mb: 3,
                  display: "flex",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 2,
                  position: "relative",
                  maxWidth: "840px",
                  mx: "auto",
                }}
              >
                <Typography
                  variant="body1"
                  color="text.secondary"
                  sx={{ flex: "0 0 auto" }}
                >
                  {filteredAndSortedUsers.length} of {users.length}
                </Typography>
                <Box sx={{ flex: 1, display: "flex", justifyContent: "center" }}>
                  <TextField
                    placeholder="Search by email, name..."
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    sx={{
                      width: "100%",
                      maxWidth: 600,
                    }}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
                <FormControl
                  size="small"
                  sx={{ minWidth: { xs: "100%", sm: 150 }, flex: "0 0 auto" }}
                >
                  <InputLabel>User Type</InputLabel>
                  <Select
                    value={userTypeFilter}
                    label="User Type"
                    onChange={(e) => setUserTypeFilter(e.target.value)}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="customer">Customer</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>

            <Box sx={{ px: { xs: 2, sm: 4, md: 6, lg: 10 } }}>
              {isMobile ? (
                // Mobile: Card layout
                <Box sx={{ maxWidth: "840px", mx: "auto" }}>
                  {filteredAndSortedUsers.length === 0 ? (
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 4,
                        backgroundColor: "#fff",
                        borderRadius: 2,
                        border: "1px solid #e0e0e0",
                      }}
                    >
                      <Typography variant="body1" color="text.secondary">
                        No users found matching your search.
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {filteredAndSortedUsers.map((user) => (
                        <Card
                          key={user._id}
                          sx={{
                            boxShadow: 1,
                            "&:hover": {
                              boxShadow: 3,
                            },
                          }}
                        >
                          <CardContent>
                            <Box
                              sx={{
                                display: "flex",
                                gap: 2,
                                alignItems: "flex-start",
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 60,
                                  height: 60,
                                  backgroundColor: "#1976d2",
                                }}
                              >
                                <PersonIcon />
                              </Avatar>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body1"
                                  sx={{
                                    fontWeight: 600,
                                    mb: 0.5,
                                    fontSize: { xs: "0.875rem", sm: "1rem" },
                                  }}
                                >
                                  {user.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{
                                    mb: 0.5,
                                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {user.email}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    gap: 1,
                                    alignItems: "center",
                                    mb: 1,
                                  }}
                                >
                                  <Chip
                                    label={user.user_type || "customer"}
                                    size="small"
                                    color={
                                      user.user_type === "admin"
                                        ? "primary"
                                        : "default"
                                    }
                                    sx={{
                                      fontSize: { xs: "0.65rem", sm: "0.75rem" },
                                      height: { xs: 20, sm: 24 },
                                    }}
                                  />
                                </Box>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{
                                    display: "block",
                                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                                  }}
                                >
                                  Joined: {formatDate(user.createdAt)}
                                </Typography>
                                <Box
                                  sx={{
                                    display: "flex",
                                    justifyContent: "flex-end",
                                    gap: 1,
                                    mt: 1,
                                  }}
                                >
                                  <Tooltip title="Edit" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        alert("Edit functionality coming soon!");
                                      }}
                                      sx={{
                                        "&:hover": {
                                          backgroundColor: "#e3f2fd",
                                        },
                                      }}
                                    >
                                      <EditOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete" arrow>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDelete(user._id)}
                                      sx={{
                                        "&:hover": {
                                          backgroundColor: "#ffebee",
                                        },
                                      }}
                                    >
                                      <DeleteOutlinedIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      ))}
                    </Box>
                  )}
                </Box>
              ) : (
                // Tablet and above: Table layout
                <TableContainer
                  component={Paper}
                  sx={{
                    boxShadow: 1,
                    maxWidth: "840px",
                    mx: "auto",
                    overflowX: "hidden",
                    width: "100%",
                  }}
                >
                  <Table sx={{ width: "100%", tableLayout: "auto" }}>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        {!isTablet && (
                          <TableCell sx={{ fontWeight: 600 }}>
                            <TableSortLabel
                              active={orderBy === "name"}
                              direction={orderBy === "name" ? order : "asc"}
                              onClick={() => handleSort("name")}
                              hideSortIcon={false}
                              sx={{
                                "& .MuiTableSortLabel-icon": {
                                  opacity: orderBy === "name" ? 1 : 0.3,
                                },
                              }}
                            >
                              Name
                            </TableSortLabel>
                          </TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 600, minWidth: { xs: "150px", md: "200px" }, px: { xs: 1, md: 2 } }}>
                          <TableSortLabel
                            active={orderBy === "email"}
                            direction={orderBy === "email" ? order : "asc"}
                            onClick={() => handleSort("email")}
                            hideSortIcon={false}
                            sx={{
                              "& .MuiTableSortLabel-icon": {
                                opacity: orderBy === "email" ? 1 : 0.3,
                              },
                            }}
                          >
                            Email
                          </TableSortLabel>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 600, px: { xs: 1, md: 2 } }}>
                          <TableSortLabel
                            active={orderBy === "user_type"}
                            direction={orderBy === "user_type" ? order : "asc"}
                            onClick={() => handleSort("user_type")}
                            hideSortIcon={false}
                            sx={{
                              "& .MuiTableSortLabel-icon": {
                                opacity: orderBy === "user_type" ? 1 : 0.3,
                              },
                            }}
                          >
                            Type
                          </TableSortLabel>
                        </TableCell>
                        {!isTablet && (
                          <TableCell sx={{ fontWeight: 600, px: { xs: 1, md: 2 } }}>
                            <TableSortLabel
                              active={orderBy === "createdAt"}
                              direction={orderBy === "createdAt" ? order : "asc"}
                              onClick={() => handleSort("createdAt")}
                              hideSortIcon={false}
                              sx={{
                                "& .MuiTableSortLabel-icon": {
                                  opacity: orderBy === "createdAt" ? 1 : 0.3,
                                },
                              }}
                            >
                              Joined
                            </TableSortLabel>
                          </TableCell>
                        )}
                        <TableCell sx={{ fontWeight: 600, width: { xs: "80px", md: "100px" }, px: { xs: 0.5, md: 2 } }}>
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {filteredAndSortedUsers.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={isTablet ? 4 : 6}
                            align="center"
                            sx={{ py: 4 }}
                          >
                            <Typography variant="body1" color="text.secondary">
                              No users found matching your search.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredAndSortedUsers.map((user) => (
                          <TableRow
                            key={user._id}
                            sx={{
                              "&:hover": {
                                backgroundColor: "#fafafa",
                              },
                            }}
                          >
                            {!isTablet && (
                              <TableCell sx={{ px: { xs: 1, md: 2 }, fontSize: { xs: "0.75rem", md: "0.875rem" } }}>
                                {user.name}
                              </TableCell>
                            )}
                            <TableCell sx={{ px: { xs: 1, md: 2 } }}>
                              <Typography
                                variant="body1"
                                sx={{
                                  fontWeight: 500,
                                  fontSize: { xs: "0.875rem", md: "1rem" },
                                }}
                              >
                                {user.email}
                              </Typography>
                              {isTablet && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mt: 0.5 }}
                                >
                                  {user.name}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ px: { xs: 1, md: 2 } }}>
                              <Chip
                                label={user.user_type || "customer"}
                                size="small"
                                color={
                                  user.user_type === "admin" ? "primary" : "default"
                                }
                                sx={{
                                  fontSize: { xs: "0.7rem", md: "0.75rem" },
                                  height: { xs: 22, md: 24 },
                                }}
                              />
                            </TableCell>
                            {!isTablet && (
                              <TableCell
                                sx={{
                                  px: { xs: 1, md: 2 },
                                  fontSize: { xs: "0.75rem", md: "0.875rem" },
                                }}
                              >
                                {formatDate(user.createdAt)}
                              </TableCell>
                            )}
                            <TableCell sx={{ px: { xs: 0.5, md: 2 } }}>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Edit" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      alert("Edit functionality coming soon!");
                                    }}
                                    sx={{
                                      "&:hover": {
                                        backgroundColor: "#e3f2fd",
                                      },
                                    }}
                                  >
                                    <EditOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Delete" arrow>
                                  <IconButton
                                    size="small"
                                    onClick={() => handleDelete(user._id)}
                                    sx={{
                                      "&:hover": {
                                        backgroundColor: "#ffebee",
                                      },
                                    }}
                                  >
                                    <DeleteOutlinedIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          </>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default CustomerManagement;
