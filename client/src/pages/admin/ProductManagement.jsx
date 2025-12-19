import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Grid,
} from "@mui/material";
import {
  EditOutlined as EditOutlinedIcon,
  ArrowBack as ArrowBackIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Clear as ClearIcon,
} from "@mui/icons-material";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { API_BASE_URL } from "../../utils/constants";

const ProductManagement = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(800)); // Below 800px
  const isTablet = useMediaQuery(theme.breakpoints.between(800, "md")); // 800px ~ 900px
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [orderBy, setOrderBy] = useState("");
  const [order, setOrder] = useState("asc");
  const categoryFilter = searchParams.get("category");
  const pageFromUrl = searchParams.get("page");
  const [page, setPage] = useState(pageFromUrl ? parseInt(pageFromUrl, 10) : 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);

  // Scroll to top when component mounts or page/category/search changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page, categoryFilter, searchQuery]);

  useEffect(() => {
    fetchProducts();
  }, [page, categoryFilter, searchQuery]);

  const fetchProducts = async () => {
    try {
      // Only show loading spinner on initial load or page change, not on search
      if (!searchQuery || page === 1) {
        setLoading(true);
      }
      setError("");
      let url = `${API_BASE_URL}/products?page=${page}&limit=10`;
      if (categoryFilter) {
        url += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      if (searchQuery) {
        url += `&search=${encodeURIComponent(searchQuery)}`;
      }
      const response = await fetch(url);
      const result = await response.json();

      if (result.success) {
        setProducts(result.data || []);
        setTotalPages(result.totalPages || 1);
        setTotalProducts(result.total || 0);
      } else {
        setError(result.message || "Failed to fetch products.");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("An error occurred while fetching products.");
    } finally {
      setLoading(false);
      setIsSearching(false);
    }
  };

  const handlePageChange = (event, value) => {
    setPage(value);
    // Update URL with new page number
    const params = new URLSearchParams(searchParams);
    params.set("page", value.toString());
    navigate(`/admin/products?${params.toString()}`, { replace: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value);
  };

  const handleSearch = () => {
    setSearchQuery(searchInput);
    setPage(1);
  };

  // Sort products (client-side for current page, search is now server-side)
  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...products];

    // Apply sorting
    if (orderBy) {
      filtered.sort((a, b) => {
        let aValue, bValue;

        switch (orderBy) {
          case "sku":
            aValue = a.sku || "";
            bValue = b.sku || "";
            break;
          case "category":
            aValue = a.category || "";
            bValue = b.category || "";
            break;
          case "price":
            aValue = a.price || 0;
            bValue = b.price || 0;
            break;
          default:
            return 0;
        }

        if (typeof aValue === "string" && typeof bValue === "string") {
          return order === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        } else {
          return order === "asc" ? aValue - bValue : bValue - aValue;
        }
      });
    }

    return filtered;
  }, [products, orderBy, order]);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("You must be logged in to delete a product.");
        navigate("/login");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Remove product from list
        setProducts(products.filter((p) => p._id !== productId));
        alert("Product deleted successfully!");
      } else {
        alert(result.message || "Failed to delete product.");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("An error occurred while deleting the product.");
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
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
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "1120px", mx: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 4, position: "relative" }}>
          <Box sx={{ 
            position: "absolute", 
            left: { 
              xs: "16px", 
              sm: "40px", 
              md: "64px", 
              lg: "96px" 
            } 
          }}>
            <IconButton
              onClick={() => navigate("/admin")}
            >
              <ArrowBackIcon />
            </IconButton>
          </Box>
          <Box sx={{ flex: 1, textAlign: "center" }}>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 600, 
                fontSize: {
                  xs: "1.5rem",
                  sm: "2.125rem"
                },
                "@media (max-width: 500px)": {
                  fontSize: "1.25rem",
                }
              }}
            >
              Product Management
            </Typography>
            {categoryFilter && (
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  mt: 0.5,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Category: {categoryFilter}
              </Typography>
            )}
          </Box>
        </Box>

        {error && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: "#ffebee", borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {!searchQuery && products.length === 0 ? (
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
              No products found
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/admin/add-product")}
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                "&:hover": { backgroundColor: "#333" },
              }}
            >
              Add Your First Product
            </Button>
          </Box>
        ) : (
          <>
            <Box sx={{ mb: 3, px: { xs: 4, sm: 6, md: 8, lg: 10 } }}>
              <Box sx={{ 
                mb: 2, 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                maxWidth: "960px",
                mx: "auto",
              }}>
                <Typography variant="body1" color="text.secondary">
                  {products.length} of {totalProducts}
                </Typography>
              </Box>
              <Box sx={{ 
                mb: 3, 
                display: "flex", 
                alignItems: "center", 
                flexWrap: "wrap", 
                gap: 2, 
                position: "relative",
                maxWidth: "960px",
                mx: "auto",
              }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => navigate("/admin/add-product")}
                  size="small"
                  sx={{
                    backgroundColor: "#000",
                    color: "#fff",
                    minWidth: { xs: "100%", sm: 48 },
                    width: { xs: "100%", sm: 48 },
                    height: 40,
                    flex: { xs: "1 1 100%", sm: "0 0 auto" },
                    borderRadius: 1,
                    textTransform: "none",
                    fontSize: "1rem",
                    p: { xs: "6px 16px", sm: "4px" },
                    px: { xs: 3, sm: "4px" },
                    "&:hover": { backgroundColor: "#333" },
                    "& .MuiButton-startIcon": {
                      margin: { xs: "0 8px 0 0", sm: 0 },
                    },
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      display: { xs: "inline", sm: "none" },
                    }}
                  >
                    ADD NEW PRODUCT
                  </Box>
                </Button>
                <Box sx={{ flex: { xs: "1 1 100%", sm: 1 }, display: "flex", justifyContent: "center", order: { xs: 2, sm: 0 } }}>
                  <Box sx={{ display: "flex", gap: 0, width: "100%", maxWidth: { xs: "100%", sm: 600 }, alignItems: "stretch" }}>
                    <TextField
                      placeholder="Search by name or category"
                      variant="outlined"
                      size="small"
                      value={searchInput}
                      onChange={handleSearchChange}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleSearch();
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
                        endAdornment: searchInput && (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={() => {
                                setSearchInput("");
                                setSearchQuery("");
                                setPage(1);
                              }}
                              edge="end"
                              size="small"
                              sx={{
                                padding: "4px",
                                "&:hover": {
                                  backgroundColor: "rgba(0, 0, 0, 0.04)",
                                },
                              }}
                            >
                              <ClearIcon fontSize="small" />
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleSearch}
                      size="small"
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
                        px: { xs: 1.5, sm: 3 },
                        whiteSpace: "nowrap",
                      }}
                    >
                      SEARCH
                    </Button>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Search Results Count */}
            {searchQuery.trim() && (
              <Box sx={{ mb: 2, px: { xs: 4, sm: 6, md: 8, lg: 10 } }}>
                <Box sx={{ maxWidth: "960px", mx: "auto", textAlign: "center" }}>
                  <Typography variant="body2" sx={{ color: "#666" }}>
                    {products.length} {products.length === 1 ? "result" : "results"} for "{searchQuery}"
                  </Typography>
                </Box>
              </Box>
            )}

            <Box sx={{ px: { xs: 2, sm: 4, md: 6, lg: 10 } }}>
              {isMobile ? (
                // Mobile: Card layout
                <Box sx={{ maxWidth: "960px", mx: "auto" }}>
                  {filteredAndSortedProducts.length === 0 ? (
                    searchQuery ? (
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
                          No products found matching your search.
                        </Typography>
                      </Box>
                    ) : null
                  ) : (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                      {filteredAndSortedProducts.map((product) => (
                        <Card
                          key={product._id}
                          sx={{
                            boxShadow: 1,
                            "&:hover": {
                              boxShadow: 3,
                            },
                          }}
                        >
                          <CardContent>
                            <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
                              <Avatar
                                src={product.image}
                                alt={product.name}
                                variant="rounded"
                                sx={{
                                  width: 80,
                                  height: 80,
                                  objectFit: "contain",
                                  backgroundColor: "#f5f5f5",
                                  flexShrink: 0,
                                }}
                              />
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography
                                  variant="body1"
                                  onClick={() => navigate(`/product/${product._id}`)}
                                  sx={{
                                    fontWeight: 600,
                                    mb: 0.5,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    display: "-webkit-box",
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: "vertical",
                                    cursor: "pointer",
                                    transition: "color 0.3s ease, text-decoration 0.3s ease",
                                    "&:hover": {
                                      textDecoration: "underline",
                                      color: "dimgray",
                                    },
                                  }}
                                >
                                  {product.name}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                  sx={{ mb: 0.5 }}
                                >
                                  {product.category}
                                </Typography>
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
                                  <Box>
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                      sx={{ display: "block", mb: 0.25 }}
                                    >
                                      SKU: {product.sku}
                                    </Typography>
                                    <Typography
                                      variant="h6"
                                      sx={{ fontWeight: 600, color: "primary.main" }}
                                    >
                                      ${product.price?.toFixed(2)}
                                    </Typography>
                                  </Box>
                                  <IconButton
                                    onClick={() => {
                                      navigate(`/admin/add-product?id=${product._id}`);
                                    }}
                                    sx={{
                                      "&:hover": {
                                        backgroundColor: "#e3f2fd",
                                      },
                                    }}
                                  >
                                    <EditOutlinedIcon />
                                  </IconButton>
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
                searchQuery && filteredAndSortedProducts.length === 0 ? (
                  <Box
                    sx={{
                      textAlign: "center",
                      py: 4,
                      backgroundColor: "#fff",
                      borderRadius: 2,
                      border: "1px solid #e0e0e0",
                      maxWidth: "960px",
                      mx: "auto",
                    }}
                  >
                    <Typography variant="body1" color="text.secondary">
                      No products found matching your search.
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer
                    component={Paper}
                    sx={{
                      boxShadow: 1,
                      maxWidth: "960px",
                      mx: "auto",
                      overflowX: "hidden",
                      width: "100%",
                    }}
                  >
                    <Table sx={{ width: "100%", tableLayout: "auto" }}>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#000" }}>
                          {!isTablet && (
                            <TableCell sx={{ fontWeight: 600, color: "#fff", backgroundColor: orderBy === "sku" ? "#333" : "transparent" }}>
                              <TableSortLabel
                                active={orderBy === "sku"}
                                direction={orderBy === "sku" ? order : "asc"}
                                onClick={() => handleSort("sku")}
                                hideSortIcon={false}
                                sx={{
                                  color: "#fff",
                                  fontWeight: orderBy === "sku" ? 700 : 600,
                                  "&:hover": {
                                    color: "#fff",
                                  },
                                  "&.Mui-active": {
                                    color: "#fff",
                                    fontWeight: 700,
                                  },
                                  "& .MuiTableSortLabel-icon": {
                                    opacity: orderBy === "sku" ? 1 : 0.3,
                                    color: "#fff !important",
                                  },
                                  "& .MuiSvgIcon-root": {
                                    color: "#fff !important",
                                  },
                                }}
                              >
                                SKU ID
                              </TableSortLabel>
                            </TableCell>
                          )}
                          <TableCell sx={{ fontWeight: 600, width: { xs: "80px", md: "100px" }, px: { xs: 1, md: 2 }, color: "#fff" }}>Image</TableCell>
                          <TableCell sx={{ fontWeight: 600, minWidth: { xs: "150px", md: "200px" }, px: { xs: 1, md: 2 }, color: "#fff" }}>Product Name</TableCell>
                          {!isTablet && (
                            <TableCell sx={{ fontWeight: 600, color: "#fff", backgroundColor: orderBy === "category" ? "#333" : "transparent" }}>
                              <TableSortLabel
                                active={orderBy === "category"}
                                direction={orderBy === "category" ? order : "asc"}
                                onClick={() => handleSort("category")}
                                hideSortIcon={false}
                                sx={{
                                  color: "#fff",
                                  fontWeight: orderBy === "category" ? 700 : 600,
                                  "&:hover": {
                                    color: "#fff",
                                  },
                                  "&.Mui-active": {
                                    color: "#fff",
                                    fontWeight: 700,
                                  },
                                  "& .MuiTableSortLabel-icon": {
                                    opacity: orderBy === "category" ? 1 : 0.3,
                                    color: "#fff !important",
                                  },
                                  "& .MuiSvgIcon-root": {
                                    color: "#fff !important",
                                  },
                                }}
                              >
                                Category
                              </TableSortLabel>
                            </TableCell>
                          )}
                          <TableCell sx={{ fontWeight: 600, width: { xs: "80px", md: "100px" }, px: { xs: 1, md: 2 }, whiteSpace: "nowrap", color: "#fff", backgroundColor: orderBy === "price" ? "#333" : "transparent" }}>
                            <TableSortLabel
                              active={orderBy === "price"}
                              direction={orderBy === "price" ? order : "asc"}
                              onClick={() => handleSort("price")}
                              hideSortIcon={false}
                              sx={{
                                color: "#fff",
                                fontWeight: orderBy === "price" ? 700 : 600,
                                "&:hover": {
                                  color: "#fff",
                                },
                                "&.Mui-active": {
                                  color: "#fff",
                                  fontWeight: 700,
                                },
                                "& .MuiTableSortLabel-icon": {
                                  opacity: orderBy === "price" ? 1 : 0.3,
                                  color: "#fff !important",
                                },
                                "& .MuiSvgIcon-root": {
                                  color: "#fff !important",
                                },
                              }}
                            >
                              Price
                            </TableSortLabel>
                          </TableCell>
                          <TableCell sx={{ fontWeight: 600, width: { xs: "60px", md: "80px" }, px: { xs: 0.5, md: 2 }, color: "#fff" }}>Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAndSortedProducts.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={isTablet ? 4 : 6}
                              align="center"
                              sx={{ py: 4 }}
                            >
                              <Typography variant="body1" color="text.secondary">
                                No products found.
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredAndSortedProducts.map((product) => (
                          <TableRow
                            key={product._id}
                            sx={{
                              "&:hover": {
                                backgroundColor: "#fafafa",
                              },
                            }}
                          >
                            {!isTablet && <TableCell sx={{ px: { xs: 1, md: 2 }, fontSize: { xs: "0.75rem", md: "0.875rem" } }}>{product.sku}</TableCell>}
                            <TableCell sx={{ px: { xs: 1, md: 2 } }}>
                              <Avatar
                                src={product.image}
                                alt={product.name}
                                variant="rounded"
                                sx={{
                                  width: { xs: 50, md: 60 },
                                  height: { xs: 50, md: 60 },
                                  objectFit: "contain",
                                  backgroundColor: "#f5f5f5",
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ px: { xs: 1, md: 2 } }}>
                              <Typography 
                                variant="body1" 
                                onClick={() => navigate(`/product/${product._id}`)}
                                sx={{ 
                                  fontWeight: 500, 
                                  fontSize: { xs: "0.875rem", md: "1rem" },
                                  cursor: "pointer",
                                  transition: "color 0.3s ease, text-decoration 0.3s ease",
                                  "&:hover": {
                                    textDecoration: "underline",
                                    color: "dimgray",
                                  },
                                }}
                              >
                                {product.name}
                              </Typography>
                              {isTablet && (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                  sx={{ display: "block", mt: 0.5 }}
                                >
                                  {product.category} • SKU: {product.sku}
                                </Typography>
                              )}
                            </TableCell>
                            {!isTablet && <TableCell sx={{ px: { xs: 1, md: 2 }, fontSize: { xs: "0.75rem", md: "0.875rem" } }}>{product.category}</TableCell>}
                            <TableCell sx={{ px: { xs: 1, md: 2 }, whiteSpace: "nowrap" }}>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 500, color: "primary.main", fontSize: { xs: "0.875rem", md: "1rem" } }}
                              >
                                ${product.price?.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ px: { xs: 0.5, md: 2 } }}>
                              <Tooltip title="Edit" arrow>
                                <IconButton
                                  onClick={() => {
                                    navigate(`/admin/add-product?id=${product._id}&page=${page}`);
                                  }}
                                  sx={{
                                    "&:hover": {
                                      backgroundColor: "#e3f2fd",
                                    },
                                  }}
                                >
                                  <EditOutlinedIcon />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
                )
              )}
            </Box>

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
          </>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default ProductManagement;

