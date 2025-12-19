import { useState, useEffect, useMemo } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, CircularProgress, Avatar } from "@mui/material";
import { useNavigate } from "react-router-dom";
import AddIcon from "@mui/icons-material/Add";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import PersonIcon from "@mui/icons-material/Person";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CategoryIcon from "@mui/icons-material/Category";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import { API_BASE_URL } from "../../utils/constants";

const Admin = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch(`${API_BASE_URL}/products?limit=1000`);
      const result = await response.json();

      if (result.success && result.data) {
        setProducts(result.data || []);
      } else {
        setError(result.message || "Failed to fetch products.");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("An error occurred while fetching products.");
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const stats = useMemo(() => {
    if (products.length === 0) {
      return {
        totalProducts: 0,
        totalCategories: 0,
        averagePrice: 0,
      };
    }

    const categories = new Set(products.map((p) => p.category));
    const totalPrice = products.reduce((sum, p) => sum + (p.price || 0), 0);
    const averagePrice = totalPrice / products.length;

    return {
      totalProducts: products.length,
      totalCategories: categories.size,
      averagePrice: averagePrice.toFixed(2),
    };
  }, [products]);

  // 4 most recently added products
  const recentProducts = useMemo(() => {
    return [...products]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 4);
  }, [products]);

  // Statistics by category
  const categoryStats = useMemo(() => {
    if (products.length === 0) return [];

    const categoryMap = new Map();
    const categoryOrder = ["WOMEN", "PLUS", "MEN", "KIDS", "SHOES", "ACCESSORIES"];

    products.forEach((product) => {
      const category = product.category || "Uncategorized";
      if (!categoryMap.has(category)) {
        categoryMap.set(category, {
          name: category,
          count: 0,
          totalPrice: 0,
          products: [],
        });
      }
      const stats = categoryMap.get(category);
      stats.count += 1;
      stats.totalPrice += product.price || 0;
      stats.products.push(product);
    });

    return Array.from(categoryMap.values())
      .map((stats) => ({
        ...stats,
        averagePrice: (stats.totalPrice / stats.count).toFixed(2),
      }))
      .sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.name.toUpperCase());
        const indexB = categoryOrder.indexOf(b.name.toUpperCase());
        
        // Categories in order come first, others go to the end
        if (indexA === -1 && indexB === -1) return a.name.localeCompare(b.name);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });
  }, [products]);

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
      <Box sx={{ py: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "1200px", mx: "auto" }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 600,
            mb: { xs: 3, md: 4 },
            textAlign: "center",
            fontSize: {
              xs: "1.5rem",
              sm: "1.75rem",
              md: "2rem",
              lg: "2.125rem",
            },
          }}
        >
          Admin Dashboard
        </Typography>

        {error && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: "#ffebee", borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {/* Quick access buttons */}
        <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", mb: { xs: 4, md: 5 } }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate("/admin/add-product")}
            sx={{
              backgroundColor: "#000",
              color: "#fff",
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              minWidth: { xs: "100%", sm: 180 },
              maxWidth: { xs: "100%", sm: 180 },
              whiteSpace: "normal",
              lineHeight: 1.3,
              "&:hover": { backgroundColor: "#333" },
            }}
          >
            Add New<br />Product
          </Button>
          <Button
            variant="outlined"
            startIcon={<Inventory2OutlinedIcon />}
            onClick={() => navigate("/admin/products")}
            sx={{
              borderColor: "#000",
              color: "#000",
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              minWidth: { xs: "100%", sm: 180 },
              maxWidth: { xs: "100%", sm: 180 },
              whiteSpace: "normal",
              lineHeight: 1.3,
              "&:hover": {
                borderColor: "#333",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Product<br />Management
          </Button>
          <Button
            variant="outlined"
            startIcon={<ShoppingCartIcon />}
            onClick={() => navigate("/admin/orders")}
            sx={{
              borderColor: "#000",
              color: "#000",
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              minWidth: { xs: "100%", sm: 180 },
              maxWidth: { xs: "100%", sm: 180 },
              whiteSpace: "normal",
              lineHeight: 1.3,
              "&:hover": {
                borderColor: "#333",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Order<br />Management
          </Button>
          <Button
            variant="outlined"
            startIcon={<PersonIcon />}
            onClick={() => navigate("/admin/customers")}
            sx={{
              borderColor: "#000",
              color: "#000",
              px: 3,
              py: 1.5,
              textTransform: "none",
              fontSize: { xs: "0.875rem", sm: "1rem" },
              minWidth: { xs: "100%", sm: 180 },
              maxWidth: { xs: "100%", sm: 180 },
              whiteSpace: "normal",
              lineHeight: 1.3,
              "&:hover": {
                borderColor: "#333",
                backgroundColor: "#f5f5f5",
              },
            }}
          >
            Customer<br />Management
          </Button>
        </Box>

        {/* Statistics cards */}
        <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ mb: { xs: 4, md: 5 }, justifyContent: "center" }}>
          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              minWidth: { xs: "100%", sm: "280px", md: "300px" },
              maxWidth: { xs: "100%", sm: "320px", md: "350px" },
            }}
          >
            <Card
              sx={{
                width: "100%",
                height: { xs: "120px", sm: "140px", md: "160px" },
                boxShadow: 2,
                "&:hover": { boxShadow: 4 },
                transition: "box-shadow 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CardContent
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                  <Avatar
                    sx={{
                      backgroundColor: "#1976d2",
                      mr: { xs: 1.5, sm: 2 },
                      width: { xs: 48, sm: 56, md: 64 },
                      height: { xs: 48, sm: 56, md: 64 },
                      "& .MuiSvgIcon-root": {
                        fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem", lg: "2.25rem" },
                      },
                    }}
                  >
                    <Inventory2OutlinedIcon />
                  </Avatar>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" },
                        lineHeight: 1.2,
                        mb: { xs: 0.25, sm: 0.5 },
                      }}
                    >
                      {stats.totalProducts}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem", lg: "0.9rem" },
                        lineHeight: 1.3,
                      }}
                    >
                      Total Products
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              minWidth: { xs: "100%", sm: "280px", md: "300px" },
              maxWidth: { xs: "100%", sm: "320px", md: "350px" },
            }}
          >
            <Card
              sx={{
                width: "100%",
                height: { xs: "120px", sm: "140px", md: "160px" },
                boxShadow: 2,
                "&:hover": { boxShadow: 4 },
                transition: "box-shadow 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CardContent
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                  <Avatar
                    sx={{
                      backgroundColor: "#9c27b0",
                      mr: { xs: 1.5, sm: 2 },
                      width: { xs: 48, sm: 56, md: 64 },
                      height: { xs: 48, sm: 56, md: 64 },
                      "& .MuiSvgIcon-root": {
                        fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem", lg: "2.25rem" },
                      },
                    }}
                  >
                    <CategoryIcon />
                  </Avatar>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" },
                        lineHeight: 1.2,
                        mb: { xs: 0.25, sm: 0.5 },
                      }}
                    >
                      {stats.totalCategories}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem", lg: "0.9rem" },
                        lineHeight: 1.3,
                      }}
                    >
                      Categories
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid 
            item 
            xs={12} 
            sm={6} 
            md={4}
            sx={{
              display: "flex",
              justifyContent: "center",
              minWidth: { xs: "100%", sm: "280px", md: "300px" },
              maxWidth: { xs: "100%", sm: "320px", md: "350px" },
            }}
          >
            <Card
              sx={{
                width: "100%",
                height: { xs: "120px", sm: "140px", md: "160px" },
                boxShadow: 2,
                "&:hover": { boxShadow: 4 },
                transition: "box-shadow 0.3s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CardContent
                sx={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  p: { xs: 2, sm: 2.5, md: 3 },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", width: "100%" }}>
                  <Avatar
                    sx={{
                      backgroundColor: "#2e7d32",
                      mr: { xs: 1.5, sm: 2 },
                      width: { xs: 48, sm: 56, md: 64 },
                      height: { xs: 48, sm: 56, md: 64 },
                      "& .MuiSvgIcon-root": {
                        fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem", lg: "2.25rem" },
                      },
                    }}
                  >
                    <AttachMoneyIcon />
                  </Avatar>
                  <Box sx={{ textAlign: "center" }}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" },
                        lineHeight: 1.2,
                        mb: { xs: 0.25, sm: 0.5 },
                      }}
                    >
                      ${stats.averagePrice}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ 
                        fontSize: { xs: "0.7rem", sm: "0.8rem", md: "0.875rem", lg: "0.9rem" },
                        lineHeight: 1.3,
                      }}
                    >
                      Avg Price
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Statistics by category */}
        {categoryStats.length > 0 && (
          <Box sx={{ mb: { xs: 4, md: 5 } }}>
            <Box
              sx={{
                position: "relative",
                textAlign: "center",
                mb: { xs: 2, md: 3 },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  width: "100%",
                  height: "1px",
                  backgroundColor: "#e0e0e0",
                  transform: "translateY(-50%)",
                },
              }}
            >
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                  display: "inline-block",
                  position: "relative",
                  px: "5px",
                  backgroundColor: "#fff",
                }}
              >
                Categories
              </Typography>
            </Box>
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ justifyContent: "center" }}>
              {categoryStats.map((category) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={4} 
                  lg={3} 
                  key={category.name}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Card
                    sx={{
                      width: "280px",
                      height: "200px",
                      cursor: "pointer",
                      "&:hover": {
                        boxShadow: 4,
                        transform: "translateY(-4px)",
                      },
                      transition: "all 0.3s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                    onClick={() =>
                      navigate(`/admin/products?category=${encodeURIComponent(category.name)}`)
                    }
                  >
                    <CardContent 
                      sx={{ 
                        p: 2.5,
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        gap: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Avatar
                          sx={{
                            backgroundColor: "#9c27b0",
                            mr: 2,
                            width: { xs: 40, sm: 48 },
                            height: { xs: 40, sm: 48 },
                          }}
                        >
                          <CategoryIcon />
                        </Avatar>
                        <Box>
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 600,
                              fontSize: { xs: "1rem", sm: "1.125rem", md: "1.25rem" },
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              textAlign: "center",
                            }}
                          >
                            {category.name}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography
                          variant="h4"
                          sx={{
                            fontWeight: 700,
                            fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                            mb: 0.5,
                          }}
                        >
                          {category.count}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, mb: 1 }}
                        >
                          Products
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 500,
                            fontSize: { xs: "0.875rem", sm: "1rem" },
                          }}
                        >
                          Avg: ${category.averagePrice}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {/* Recently added products */}
        {recentProducts.length > 0 && (
          <Box sx={{ mb: { xs: 4, md: 5 } }}>
            <Box
              sx={{
                position: "relative",
                textAlign: "center",
                mb: { xs: 2, md: 3 },
                "&::before": {
                  content: '""',
                  position: "absolute",
                  left: 0,
                  top: "50%",
                  width: "100%",
                  height: "1px",
                  backgroundColor: "#e0e0e0",
                  transform: "translateY(-50%)",
                },
              }}
            >
              <Typography
                variant="h5"
                component="span"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                  display: "inline-block",
                  position: "relative",
                  px: "5px",
                  backgroundColor: "#fff",
                }}
              >
                Recent Products
              </Typography>
            </Box>
            <Grid container spacing={{ xs: 2, sm: 3 }} sx={{ justifyContent: "center" }}>
              {recentProducts.map((product) => (
                <Grid 
                  item 
                  xs={12} 
                  sm={6} 
                  md={3}
                  key={product._id}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                  }}
                >
                  <Card
                    sx={{
                      width: "260px",
                      height: "420px",
                      "&:hover": { boxShadow: 4 },
                      transition: "box-shadow 0.3s",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Box
                      onClick={() => navigate(`/product/${product._id}`)}
                      sx={{
                        position: "relative",
                        width: "100%",
                        height: "240px",
                        backgroundColor: "#ffffff",
                        overflow: "hidden",
                        flexShrink: 0,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        cursor: "pointer",
                      }}
                    >
                      {product.image && (
                        <Box
                          component="img"
                          src={product.image}
                          alt={product.name}
                          sx={{
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            maxWidth: "100%",
                            maxHeight: "100%",
                          }}
                        />
                      )}
                    </Box>
                    <CardContent 
                      sx={{ 
                        p: 2,
                        flexGrow: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        textAlign: "center",
                      }}
                    >
                      <Box>
                        <Typography
                          onClick={() => navigate(`/product/${product._id}`)}
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            mb: 0.5,
                            fontSize: "0.875rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            minHeight: "2.75rem",
                            textAlign: "center",
                            cursor: "pointer",
                            "&:hover": {
                              textDecoration: "underline",
                            },
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ 
                            fontSize: "0.75rem", 
                            mb: 0.5,
                            minHeight: "1.2rem",
                            textAlign: "center",
                          }}
                        >
                          {product.category}
                        </Typography>
                      </Box>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          fontSize: "1rem",
                          mt: "auto",
                          textAlign: "center",
                        }}
                      >
                        ${product.price?.toFixed(2) || product.price}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default Admin;

