import { Box, Typography, useMediaQuery, useTheme, CircularProgress, Button, Badge, FormControl, Select, MenuItem, InputLabel } from "@mui/material";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";
import { getFavorites as getFavoritesApi } from "../utils/api";

// Default colors for products
const DEFAULT_COLORS = ["#000", "#fff", "#9e9e9e"];


const Favorites = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedProducts, setSelectedProducts] = useState(new Set());
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [sortOrder, setSortOrder] = useState("default");

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Sort products based on sortOrder
  const sortedProducts = useMemo(() => {
    if (sortOrder === "default") {
      return products;
    }
    const sorted = [...products];
    if (sortOrder === "price-low") {
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === "price-high") {
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    }
    return sorted;
  }, [products, sortOrder]);

  // Handle removing a product from favorites list
  const handleRemoveProduct = useCallback((productId) => {
    setProducts((prevProducts) => 
      prevProducts.filter((p) => (p._id || p.id) !== productId)
    );
    // Also remove from selected products if it was selected
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      newSet.delete(productId);
      return newSet;
    });
  }, []);

  const handleProductSelect = useCallback((productId) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    const allProductIds = products.map((p) => p._id || p.id);
    setSelectedProducts(new Set(allProductIds));
  }, [products]);

  const handleDeselectAll = useCallback(() => {
    setSelectedProducts(new Set());
  }, []);

  const handleAddToCart = useCallback(async () => {
    if (selectedProducts.size === 0) return;

    const token = storage.getToken();
    if (!token) {
      navigate("/login");
      return;
    }

    setIsAddingToCart(true);
    const selectedProductIds = Array.from(selectedProducts);
    const productsToAdd = products.filter(
      (p) => selectedProductIds.includes(p._id || p.id)
    );

    try {
      // Add each product to cart sequentially
      for (const product of productsToAdd) {
        const response = await fetch(`${API_BASE_URL}/cart/items`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            productId: product._id || product.id,
            quantity: 1,
            price: product.price,
          }),
        });

        const result = await response.json();
        if (!result.success) {
          throw new Error(result.message || "Failed to add item to cart");
        }
      }

      // Dispatch event to update Navbar badge
      window.dispatchEvent(new Event("cartUpdated"));
      
      // Clear selections
      setSelectedProducts(new Set());
      
      // Navigate to cart page
      navigate("/cart");
    } catch (error) {
      console.error("Error adding items to cart:", error);
      alert("일부 상품을 카트에 추가하는데 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsAddingToCart(false);
    }
  }, [selectedProducts, products, navigate]);

  // Fetch favorite products from API
  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchFavoriteProducts = async () => {
      try {
        setLoading(true);
        setError("");
        
        const token = storage.getToken();
        const currentUser = storage.getUser();
        let favoriteProducts = [];
        
        // If logged in, try to fetch from server first
        if (token && currentUser?._id) {
          try {
            const favoritesResponse = await getFavoritesApi(token);
            if (favoritesResponse.success && favoritesResponse.data && Array.isArray(favoritesResponse.data)) {
              // Check if server returned product objects or just IDs
              const firstItem = favoritesResponse.data[0];
              if (firstItem && (firstItem.name || firstItem.image || firstItem.price)) {
                // Server returns full product objects, use them directly
                favoriteProducts = favoritesResponse.data.map((product) => ({
                  ...product,
                  id: product._id || product.id,
                  colors: product.colors || ["#000", "#fff", "#9e9e9e"],
                }));
                
                // Update localStorage to sync with server
                const favoriteIds = favoriteProducts.map(p => p._id || p.id);
                storage.setFavorites(favoriteIds);
                
                // Dispatch event to update Navbar badge
                window.dispatchEvent(new Event("favoritesUpdated"));
                
                setProducts(favoriteProducts);
                setLoading(false);
                return;
              } else {
                // Server returned IDs only, need to fetch products
                const favoriteIds = favoritesResponse.data.map(id => id.toString());
                storage.setFavorites(favoriteIds);
                // Continue to fetch products below
              }
            }
          } catch (serverError) {
            console.error("Error fetching favorites from server:", serverError);
            // Fallback to localStorage if server fails
          }
        }
        
        // Fallback: Get favorite IDs from localStorage
        const favoriteIds = storage.getFavorites();
        
        if (favoriteIds.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Fetch all products and filter by favorite IDs
        const response = await fetch(`${API_BASE_URL}/products?limit=1000`, {
          signal: abortController.signal,
        });
        const result = await response.json();

        if (result.success && result.data) {
          // Filter products to only include favorites
          favoriteProducts = result.data
            .filter((product) => favoriteIds.includes(product._id))
            .map((product) => ({
              ...product,
              id: product._id,
              colors: product.colors || DEFAULT_COLORS,
            }));
          
          setProducts(favoriteProducts);
        } else {
          setError(result.message || "Failed to fetch products.");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching favorite products:", error);
          setError("An error occurred while fetching favorite products.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchFavoriteProducts();

    // Listen for favorites updates (when adding from other pages)
    const handleFavoritesUpdated = () => {
      fetchFavoriteProducts();
    };
    window.addEventListener("favoritesUpdated", handleFavoritesUpdated);

    return () => {
      abortController.abort();
      window.removeEventListener("favoritesUpdated", handleFavoritesUpdated);
    };
  }, []);

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
          My Favorites
        </Typography>

        {error && (
          <Box sx={{ mb: 3, p: 2, backgroundColor: "#ffebee", borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}

        {products.length === 0 ? (
          <Box
            sx={{
              textAlign: "center",
              py: 8,
              backgroundColor: "#fff",
              borderRadius: 2,
              border: "1px solid #e0e0e0",
            }}
          >
            <FavoriteBorderIcon sx={{ fontSize: 64, color: "#e0e0e0", mb: 2 }} />
            <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
              No favorites yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Start adding products to your favorites to see them here
            </Typography>
          </Box>
        ) : (
          <>
            <Box 
              sx={{ 
                mb: 2, 
                display: "flex", 
                flexDirection: { xs: "column", md: "row" },
                alignItems: { xs: "stretch", md: "center" },
                gap: { xs: 2, md: 0 },
                position: "relative",
              }}
            >
              <Box 
                sx={{ 
                  order: { xs: 2, md: 1 },
                  display: "flex",
                  justifyContent: { xs: "center", md: "center" },
                  alignItems: "center",
                  gap: { xs: 1, md: 1 },
                  position: { xs: "static", md: "absolute" },
                  left: { xs: "auto", md: "50%" },
                  transform: { xs: "none", md: "translateX(-50%)" },
                  width: { xs: "100%", md: "auto" },
                }}
              >
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: "#000",
                    color: "#000",
                    px: { xs: 3, md: 4 },
                    py: { xs: 0.75, md: 1 },
                    textTransform: "none",
                    fontSize: { xs: "0.875rem", md: "1rem" },
                    "&:hover": { 
                      borderColor: "#000",
                      backgroundColor: "#000",
                      color: "#fff",
                    },
                    flex: { xs: "1 1 calc(50% - 4px)", md: "0 0 auto" },
                    width: { xs: "calc(50% - 4px)", md: "auto" },
                    minWidth: { xs: 0, md: "auto" },
                  }}
                  onClick={selectedProducts.size === products.length ? handleDeselectAll : handleSelectAll}
                  disabled={products.length === 0}
                >
                  {selectedProducts.size === products.length ? "Deselect All" : "Select All"}
                </Button>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "#000",
                    color: "#fff",
                    px: { xs: 3, md: 4 },
                    py: { xs: 0.75, md: 1 },
                    textTransform: "none",
                    fontSize: { xs: "0.875rem", md: "1rem" },
                    "&:hover": { backgroundColor: "#333" },
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 0.5,
                    flex: { xs: "1 1 calc(50% - 4px)", md: "0 0 auto" },
                    width: { xs: "calc(50% - 4px)", md: "auto" },
                    minWidth: { xs: 0, md: "auto" },
                  }}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || selectedProducts.size === 0}
                >
                  {isAddingToCart ? (
                    "추가 중..."
                  ) : (
                    <>
                      ADD TO{" "}
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
                        CART
                        {selectedProducts.size > 0 && (
                          <Box
                            sx={{
                              backgroundColor: "#f44336",
                              color: "#fff",
                              borderRadius: "50%",
                              minWidth: "20px",
                              height: "20px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "0.75rem",
                              fontWeight: 600,
                              px: 0.5,
                            }}
                          >
                            {selectedProducts.size}
                          </Box>
                        )}
                      </Box>
                    </>
                  )}
                </Button>
              </Box>
              <Box 
                sx={{ 
                  order: { xs: 1, md: 2 },
                  display: "flex",
                  justifyContent: { xs: "center", md: "flex-end" },
                  width: { xs: "100%", md: "auto" },
                  flexShrink: 0,
                  ml: { xs: 0, md: "auto" },
                }}
              >
                <FormControl size="small" sx={{ width: { xs: "100%", md: 200 }, minWidth: { xs: "100%", md: 200 } }}>
                  <InputLabel>Sort by Price</InputLabel>
                  <Select
                    value={sortOrder}
                    label="Sort by Price"
                    onChange={(e) => setSortOrder(e.target.value)}
                    sx={{
                      backgroundColor: "#fff",
                    }}
                  >
                    <MenuItem value="default">Default</MenuItem>
                    <MenuItem value="price-low">Price: Low to High</MenuItem>
                    <MenuItem value="price-high">Price: High to Low</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 2, sm: 2, md: 2 },
                justifyContent: "center",
                alignItems: "stretch",
              }}
            >
              {sortedProducts.map((product) => (
                <Box
                  key={product._id || product.id}
                  sx={{
                    display: "flex",
                    width: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                    flexBasis: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                    maxWidth: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                    minWidth: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                  }}
                >
                      <ProductCard 
                        product={product} 
                        onRemove={handleRemoveProduct}
                        isSelected={selectedProducts.has(product._id || product.id)}
                        onSelect={handleProductSelect}
                        showCheckbox={true}
                        useCard={false}
                      />
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>
      <Footer />
    </Box>
  );
};

export default Favorites;
