import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Chip,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Favorite as FavoriteIcon,
} from "@mui/icons-material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";
import { addFavorite, removeFavorite } from "../utils/api";

// Default colors for products
const DEFAULT_COLORS = ["#000", "#fff", "#9e9e9e"];
const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const COLOR_NAMES = ["MAUVE", "GREEN", "BLACK", "WHITE", "BROWN"];

// Common button styles
const buttonStyles = {
  prevNext: {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    backgroundColor: "transparent",
    color: "rgba(255, 255, 255, 0.3)",
    transition: "color 0.3s ease-in-out, background-color 0.3s ease-in-out",
    "&:hover": {
      backgroundColor: "rgba(128, 128, 128, 0.2)",
      color: "rgba(255, 255, 255, 1)",
    },
    zIndex: 3,
    margin: 0,
    padding: "8px",
    minWidth: "auto",
    width: "auto",
    height: "auto",
    borderRadius: "50%",
    inset: "auto",
    "& svg": {
      fontSize: "2rem",
    },
  },
};

// Generate product images for gallery - main image first, then additional images
const generateProductImages = (mainImage, additionalImages = []) => {
  const images = [];
  if (mainImage) {
    images.push(mainImage);
  }
  if (additionalImages && Array.isArray(additionalImages) && additionalImages.length > 0) {
    images.push(...additionalImages);
  }
  // If no images at all, return empty array
  return images.length > 0 ? images : [];
};

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
  const [colorModalOpen, setColorModalOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState(null);
  const [sizeModalOpen, setSizeModalOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [prevImageIndex, setPrevImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [soldOut, setSoldOut] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedFavorites, setRelatedFavorites] = useState({});
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [arrowPositions, setArrowPositions] = useState({ left: 0, right: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isFilled, setIsFilled] = useState(false);
  const [isHoveredFavorite, setIsHoveredFavorite] = useState(false);
  const [isFilledFavorite, setIsFilledFavorite] = useState(false);
  const hoverTimeoutRef = useRef(null);
  const fillTimeoutRef = useRef(null);
  const favoriteHoverTimeoutRef = useRef(null);
  const favoriteFillTimeoutRef = useRef(null);

  // Generate product images - main image first, then additional images (memoized)
  const productImages = useMemo(
    () => (product ? generateProductImages(product.image, product.images) : []),
    [product]
  );

  // Calculate discount info (mock - in real app, this would come from API) (memoized)
  const discountInfo = useMemo(
    () =>
      product
        ? {
            originalPrice: product.price * 2,
            currentPrice: product.price,
            discountPercent: 50,
          }
        : null,
    [product]
  );

  // Colors (memoized)
  const colors = useMemo(
    () => (product?.colors && product.colors.length > 0 ? product.colors : DEFAULT_COLORS),
    [product?.colors]
  );

  // Selected color name (memoized)
  const selectedColorName = useMemo(() => {
    if (selectedColorIndex === null) return null;
    // Map color hex to color name
    const colorHex = colors[selectedColorIndex];
    if (colorHex === "#000") return "BLACK";
    if (colorHex === "#fff" || colorHex === "#ffffff") return "WHITE";
    if (colorHex === "#9e9e9e" || colorHex === "#808080") return "GRAY";
    // Try to get from COLOR_NAMES array if available
    return COLOR_NAMES[selectedColorIndex] || "COLOR";
  }, [selectedColorIndex, colors]);

  // Handlers (memoized with useCallback)
  const handleQuantityChange = useCallback((delta) => {
    setQuantity((prev) => Math.max(1, Math.min(10, prev + delta)));
  }, []);

  const handlePrevImage = useCallback(() => {
    const nextIndex = currentImageIndex === 0 ? productImages.length - 1 : currentImageIndex - 1;
    setCurrentImageIndex(nextIndex);
  }, [productImages.length, currentImageIndex]);

  const handleNextImage = useCallback(() => {
    const nextIndex = currentImageIndex === productImages.length - 1 ? 0 : currentImageIndex + 1;
    setCurrentImageIndex(nextIndex);
  }, [productImages.length, currentImageIndex]);

  const handleSizeClick = useCallback(
    (size, isDisabled) => {
      if (isDisabled) {
        setSoldOut(true);
      } else {
        setSelectedSize(size);
        setSoldOut(false);
      }
    },
    []
  );

  const handleAddToCart = useCallback(async () => {
    if (!product || soldOut) return;

    // Check if both color and size are selected
    const isAccessory = product.category?.toLowerCase() === "accessories";
    const colorNotSelected = selectedColorIndex === null;
    const sizeNotSelected = !isAccessory && selectedSize === null;
    
    if (colorNotSelected && sizeNotSelected) {
      // Both not selected - show combined message
      setColorModalOpen(true);
      return;
    } else if (colorNotSelected) {
      // Only color not selected
      setColorModalOpen(true);
      return;
    } else if (sizeNotSelected) {
      // Only size not selected
      setSizeModalOpen(true);
      return;
    }

    const token = storage.getToken();
    if (!token) {
      // Redirect to login if not authenticated
      navigate("/login");
      return;
    }

    try {
      setAddingToCart(true);
      setError(""); // Clear any previous errors
      const response = await fetch(`${API_BASE_URL}/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product._id,
          quantity: quantity,
          price: product.price,
          color: selectedColorName,
          size: selectedSize,
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Dispatch event to update Navbar badge
        window.dispatchEvent(new Event("cartUpdated"));
        // Navigate to cart page on success
        navigate("/cart");
      } else {
        setError(result.message || "Failed to add item to cart.");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      setError("An error occurred while adding item to cart. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  }, [product, quantity, soldOut, selectedColorIndex, selectedSize, navigate]);

  // Scroll to top when component mounts or id changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (fillTimeoutRef.current) {
        clearTimeout(fillTimeoutRef.current);
      }
      if (favoriteHoverTimeoutRef.current) {
        clearTimeout(favoriteHoverTimeoutRef.current);
      }
      if (favoriteFillTimeoutRef.current) {
        clearTimeout(favoriteFillTimeoutRef.current);
      }
      if (favoriteHoverTimeoutRef.current) {
        clearTimeout(favoriteHoverTimeoutRef.current);
      }
      if (favoriteFillTimeoutRef.current) {
        clearTimeout(favoriteFillTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!id) return;
    
    const abortController = new AbortController();
    
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await fetch(`${API_BASE_URL}/products/${id}`, {
          signal: abortController.signal,
        });
        const result = await response.json();

        if (result.success && result.data) {
          setProduct(result.data);
        } else {
          setError(result.message || "Product not found.");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching product:", error);
          setError("An error occurred while fetching the product.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProduct();
    
    return () => {
      abortController.abort();
    };
  }, [id]);

  // Fetch related products
  useEffect(() => {
    if (!product?._id || !product?.category) return;
    
    const abortController = new AbortController();
    
    const fetchRelatedProducts = async () => {
      try {
        // Fetch products from the same category
        const response = await fetch(
          `${API_BASE_URL}/products?category=${encodeURIComponent(product.category)}&limit=100`,
          {
            signal: abortController.signal,
          }
        );
        const result = await response.json();
        if (result.success && result.data) {
          // Filter out current product
          const sameCategoryProducts = result.data.filter((p) => p._id !== id);
          
          // Shuffle array for randomness
          const shuffled = [...sameCategoryProducts].sort(() => Math.random() - 0.5);
          
          // Get 4 random products
          const filtered = shuffled.slice(0, 4);
          setRelatedProducts(filtered);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching related products:", error);
        }
      }
    };

    fetchRelatedProducts();
    
    return () => {
      abortController.abort();
    };
  }, [product?._id, product?.category, id]);

  // Calculate arrow positions based on actual image dimensions
  useEffect(() => {
    const calculateArrowPositions = () => {
      if (!imageRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const image = imageRef.current;
      
      const containerRect = container.getBoundingClientRect();
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      
      if (naturalWidth === 0 || naturalHeight === 0) return;
      
      // Calculate the displayed image size maintaining aspect ratio
      const containerAspect = containerRect.width / containerRect.height;
      const imageAspect = naturalWidth / naturalHeight;
      
      let displayedWidth;
      if (imageAspect > containerAspect) {
        // Image is wider - fit to width
        displayedWidth = containerRect.width;
      } else {
        // Image is taller - fit to height
        displayedWidth = containerRect.height * imageAspect;
      }
      
      // Calculate left and right positions (centered in container)
      const leftOffset = (containerRect.width - displayedWidth) / 2;
      const rightOffset = containerRect.width - (leftOffset + displayedWidth);
      
      setArrowPositions({
        left: leftOffset,
        right: rightOffset,
      });
    };

    // Calculate on mount and when image changes
    if (productImages.length > 0 && currentImageIndex >= 0) {
      // Wait for image to load
      const timer = setTimeout(calculateArrowPositions, 100);
      window.addEventListener("resize", calculateArrowPositions);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", calculateArrowPositions);
      };
    }
  }, [productImages, currentImageIndex]);

  // Check login status
  useEffect(() => {
    const token = storage.getToken();
    setIsLoggedIn(!!token);
    
    // Listen for login/logout events
    const handleAuthChange = () => {
      const token = storage.getToken();
      setIsLoggedIn(!!token);
    };
    
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("authChanged", handleAuthChange);
    
    return () => {
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("authChanged", handleAuthChange);
    };
  }, []);

  // Check if product is already favorited on mount
  useEffect(() => {
    if (id) {
      const favorites = storage.getFavorites();
      setIsFavorite(favorites.includes(id));
    }
  }, [id]);

  // Handle favorite click for main product
  const handleFavoriteClick = useCallback(async () => {
    if (!id) return;
    
    const token = storage.getToken();
    const currentFavorite = isFavorite;
    const newFavorite = !currentFavorite;
    
    // Optimistically update UI
    setIsFavorite(newFavorite);
    
    // Update localStorage immediately for better UX
    const favorites = storage.getFavorites();
    if (newFavorite) {
      if (!favorites.includes(id)) {
        favorites.push(id);
      }
    } else {
      const index = favorites.indexOf(id);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    }
    storage.setFavorites(favorites);
    
    // Dispatch custom event to update Navbar badge
    window.dispatchEvent(new Event("favoritesUpdated"));
    
    // Sync with server if logged in
    if (token) {
      try {
        if (newFavorite) {
          await addFavorite(token, id);
        } else {
          await removeFavorite(token, id);
        }
      } catch (error) {
        console.error("Error syncing favorite with server:", error);
        // Revert optimistic update on error
        setIsFavorite(currentFavorite);
        const revertedFavorites = storage.getFavorites();
        if (currentFavorite) {
          if (!revertedFavorites.includes(id)) {
            revertedFavorites.push(id);
          }
        } else {
          const index = revertedFavorites.indexOf(id);
          if (index > -1) {
            revertedFavorites.splice(index, 1);
          }
        }
        storage.setFavorites(revertedFavorites);
        window.dispatchEvent(new Event("favoritesUpdated"));
      }
    }
  }, [id, isFavorite]);

  // Initialize favorite status for related products
  useEffect(() => {
    const favorites = storage.getFavorites();
    const favoritesMap = {};
    relatedProducts.forEach((product) => {
      const productId = product._id || product.id;
      if (productId) {
        favoritesMap[productId] = favorites.includes(productId);
      }
    });
    setRelatedFavorites(favoritesMap);
  }, [relatedProducts]);

  // Handle favorite click for related products
  const handleRelatedFavoriteClick = useCallback(async (e, productId) => {
    e.stopPropagation();
    
    const token = storage.getToken();
    const currentFavorite = relatedFavorites[productId] || false;
    const newFavorite = !currentFavorite;
    
    // Optimistically update UI
    setRelatedFavorites((prev) => ({
      ...prev,
      [productId]: newFavorite,
    }));
    
    // Update localStorage immediately for better UX
    const favorites = storage.getFavorites();
    if (newFavorite) {
      if (!favorites.includes(productId)) {
        favorites.push(productId);
      }
    } else {
      const index = favorites.indexOf(productId);
      if (index > -1) {
        favorites.splice(index, 1);
      }
    }
    storage.setFavorites(favorites);
    
    // Dispatch custom event to update Navbar badge
    window.dispatchEvent(new Event("favoritesUpdated"));
    
    // Sync with server if logged in
    if (token) {
      try {
        if (newFavorite) {
          await addFavorite(token, productId);
        } else {
          await removeFavorite(token, productId);
        }
      } catch (error) {
        console.error("Error syncing favorite with server:", error);
        // Revert optimistic update on error
        setRelatedFavorites((prev) => ({
          ...prev,
          [productId]: currentFavorite,
        }));
        const revertedFavorites = storage.getFavorites();
        if (currentFavorite) {
          if (!revertedFavorites.includes(productId)) {
            revertedFavorites.push(productId);
          }
        } else {
          const index = revertedFavorites.indexOf(productId);
          if (index > -1) {
            revertedFavorites.splice(index, 1);
          }
        }
        storage.setFavorites(revertedFavorites);
        window.dispatchEvent(new Event("favoritesUpdated"));
      }
    }
  }, [relatedFavorites]);

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

  if (error || !product) {
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
            {error || "Product not found."}
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
            Go Back Home
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Navbar />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "1400px", mx: "auto", pr: { xs: 2, sm: 3, md: 4 } }}>
        {/* Back Button */}
        <IconButton onClick={() => navigate(-1)} sx={{ mb: 2 }}>
          <ArrowBackIcon />
        </IconButton>

        {/* Main Product Section - 2 columns: Left 60% (Images), Right 40% (Info) */}
        <Box sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", md: "row" } }}>
          {/* Left Column - Product Images (60% = 6/10) */}
          <Box sx={{ width: { xs: "100%", md: "60%" }, flexShrink: 0 }}>
            {/* Carousel Container */}
            <Box
              ref={containerRef}
              sx={{
                position: "relative",
                width: "100%",
                aspectRatio: "1 / 1",
                backgroundColor: "#ffffff",
                borderRadius: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Main Image - Render only current image, no transition */}
              {productImages[currentImageIndex] && (
                <Box
                  component="img"
                  ref={imageRef}
                  src={productImages[currentImageIndex]}
                  alt={`${product.name} - Image ${currentImageIndex + 1}`}
                  loading={currentImageIndex === 0 ? "eager" : "lazy"}
                  onLoad={() => {
                    if (imageRef.current && containerRef.current) {
                      setTimeout(() => {
                        const container = containerRef.current;
                        const image = imageRef.current;
                        if (!container || !image) return;
                        const containerRect = container.getBoundingClientRect();
                        const naturalWidth = image.naturalWidth;
                        const naturalHeight = image.naturalHeight;
                        if (naturalWidth === 0 || naturalHeight === 0) return;
                        const containerAspect = containerRect.width / containerRect.height;
                        const imageAspect = naturalWidth / naturalHeight;
                        let displayedWidth;
                        if (imageAspect > containerAspect) {
                          displayedWidth = containerRect.width;
                        } else {
                          displayedWidth = containerRect.height * imageAspect;
                        }
                        const leftOffset = (containerRect.width - displayedWidth) / 2;
                        const rightOffset = containerRect.width - (leftOffset + displayedWidth);
                        setArrowPositions({
                          left: leftOffset,
                          right: rightOffset,
                        });
                      }, 50);
                    }
                  }}
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                  }}
                />
              )}

              {/* Prev Button */}
              {productImages.length > 1 && (
                <IconButton 
                  onClick={handlePrevImage} 
                  sx={{ 
                    ...buttonStyles.prevNext, 
                    left: `${arrowPositions.left}px`,
                    marginLeft: 0,
                    marginRight: 0,
                  }}
                >
                  <ChevronLeftIcon />
                </IconButton>
              )}

              {/* Next Button */}
              {productImages.length > 1 && (
                <IconButton 
                  onClick={handleNextImage} 
                  sx={{ 
                    ...buttonStyles.prevNext, 
                    right: `${arrowPositions.right}px`,
                    marginLeft: 0,
                    marginRight: 0,
                  }}
                >
                  <ChevronRightIcon />
                </IconButton>
              )}
            </Box>

            {/* Dot Indicators - Outside the image */}
            {productImages.length > 1 && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 1,
                  mt: 2,
                }}
              >
                {productImages.map((_, idx) => (
                  <Box
                    key={idx}
                    onClick={() => {
                      setCurrentImageIndex(idx);
                    }}
                    sx={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: currentImageIndex === idx ? "#000" : "#d0d0d0",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        backgroundColor: currentImageIndex === idx ? "#000" : "#9e9e9e",
                      },
                    }}
                  />
                ))}
              </Box>
            )}
          </Box>

          {/* Right Column - Product Information (40% = 4/10) */}
          <Box sx={{ width: { xs: "100%", md: "40%" }, flexShrink: 0 }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
              {/* Product Name */}
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.5rem", sm: "1.75rem", md: "2rem" },
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                }}
              >
                {product.name}
              </Typography>

              {/* Price */}
              <Typography
                sx={{
                  fontWeight: 600,
                  fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem" },
                  color: "#000",
                }}
              >
                ${discountInfo ? discountInfo.currentPrice.toFixed(2) : (product.price?.toFixed(2) || product.price)}
              </Typography>

              {/* Description */}
              {product.description && (
                <Box>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 600,
                      fontSize: "1rem",
                      mb: 1,
                    }}
                  >
                    Details
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: "0.875rem",
                      color: "text.secondary",
                      lineHeight: 1.6,
                      whiteSpace: "pre-line",
                    }}
                  >
                    {product.description}
                  </Typography>
                </Box>
              )}

              {/* Content + Care */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    mb: 1,
                  }}
                >
                  Content + Care
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    lineHeight: 1.6,
                  }}
                >
                  - 100% polyester
                  <br />
                  {(product.category?.toLowerCase() === "shoes" || product.category?.toLowerCase() === "accessories")
                    ? "- Spot clean only. Wipe with a damp cloth and air dry."
                    : "- Machine wash cold"
                  }
                </Typography>
              </Box>

              {/* Size + Fit */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    mb: 1,
                  }}
                >
                  Size + Fit
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    fontSize: "0.875rem",
                    color: "text.secondary",
                    lineHeight: 1.6,
                  }}
                >
                  {product.category?.toLowerCase() === "kids" 
                    ? "- Model is 6 years old and wearing a size Small."
                    : product.category?.toLowerCase() === "men"
                    ? "- Model is 6'2\" and wearing a Medium"
                    : product.category?.toLowerCase() === "shoes"
                    ? "- Fits true to size"
                    : product.category?.toLowerCase() === "accessories"
                    ? "- One size fits most"
                    : product.category?.toLowerCase() === "plus"
                    ? "- Model is 5'9\" and wearing a 1X"
                    : "- Model is 5'9\" and wearing a Small"}
                </Typography>
              </Box>

              {/* Color Selection */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    mb: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Color{selectedColorName ? `: ${selectedColorName}` : ""}
                </Typography>
                <Box sx={{ display: "flex", gap: 0.75, flexWrap: "wrap" }}>
                  {colors.map((color, idx) => (
                    <Box
                      key={idx}
                      onClick={() => setSelectedColorIndex(idx)}
                      sx={{
                        width: 24,
                        height: 24,
                        borderRadius: 0,
                        backgroundColor: color,
                        border: selectedColorIndex === idx ? "1px solid #000" : "1px solid #e0e0e0",
                        boxShadow: selectedColorIndex === idx ? "inset 0 0 0 1px #fff" : "none",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: "#000",
                        },
                      }}
                    />
                  ))}
                </Box>
              </Box>

              {/* Size Selection */}
              {product.category?.toLowerCase() !== "accessories" && (
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    mb: 1.5,
                    textTransform: "uppercase",
                  }}
                >
                  Size{selectedSize ? `: ${selectedSize}` : ""}
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {(product.category?.toLowerCase() === "plus" ? ["1X", "2X", "3X"] : DEFAULT_SIZES).map((size) => {
                    const isDisabled = product.category?.toLowerCase() === "plus" ? size === "3X" : size === "XL";
                    return (
                      <Button
                        key={size}
                        variant={selectedSize === size ? "contained" : "outlined"}
                        onClick={() => handleSizeClick(size, isDisabled)}
                        sx={{
                          minWidth: 48,
                          width: 48,
                          height: 48,
                          borderColor: isDisabled ? "#e0e0e0" : "#000",
                          color: isDisabled 
                            ? "#e0e0e0" 
                            : selectedSize === size ? "#fff" : "#000",
                          backgroundColor: isDisabled 
                            ? "transparent" 
                            : selectedSize === size ? "#000" : "transparent",
                          borderRadius: 0,
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          textTransform: "uppercase",
                          position: "relative",
                          cursor: isDisabled ? "pointer" : "pointer",
                          padding: 0,
                          "&:hover": {
                            borderColor: isDisabled ? "#e0e0e0" : "#000",
                            backgroundColor: isDisabled 
                              ? "transparent" 
                              : selectedSize === size ? "#000" : "#f5f5f5",
                          },
                          ...(isDisabled && {
                            "&::after": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: "linear-gradient(to bottom right, transparent calc(50% - 0.5px), #e0e0e0 calc(50% - 0.5px), #e0e0e0 calc(50% + 0.5px), transparent calc(50% + 0.5px))",
                              pointerEvents: "none",
                            },
                          }),
                        }}
                      >
                        {size}
                      </Button>
                    );
                  })}
                </Box>
              </Box>
              )}

              {/* Quantity Selector */}
              <Box>
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    mb: 1.5,
                  }}
                >
                  Quantity:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    width: "fit-content",
                    border: "1px solid #e0e0e0",
                    borderRadius: 0,
                  }}
                >
                  <IconButton
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                    sx={{
                      borderRadius: 0,
                      "&.Mui-disabled": {
                        color: "#e0e0e0",
                      },
                    }}
                  >
                    <RemoveIcon />
                  </IconButton>
                  <Typography
                    sx={{
                      minWidth: 40,
                      textAlign: "center",
                      fontSize: "1rem",
                      fontWeight: 600,
                    }}
                  >
                    {quantity}
                  </Typography>
                  <IconButton
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= 10}
                    sx={{
                      borderRadius: 0,
                      "&.Mui-disabled": {
                        color: "#e0e0e0",
                      },
                    }}
                  >
                    <AddIcon />
                  </IconButton>
                </Box>
              </Box>

              {/* Add to Favorites Button */}
              {isLoggedIn && (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleFavoriteClick}
                  startIcon={isFavorite ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                  onMouseEnter={() => {
                    setIsHoveredFavorite(true);
                    setIsFilledFavorite(false);
                    // Clear any existing timeouts
                    if (favoriteHoverTimeoutRef.current) {
                      clearTimeout(favoriteHoverTimeoutRef.current);
                    }
                    if (favoriteFillTimeoutRef.current) {
                      clearTimeout(favoriteFillTimeoutRef.current);
                    }
                    // Set filled state after animation completes (400ms)
                    favoriteFillTimeoutRef.current = setTimeout(() => {
                      setIsFilledFavorite(true);
                    }, 400);
                  }}
                  onMouseLeave={() => {
                    setIsHoveredFavorite(false);
                    // Clear fill timeout if still running
                    if (favoriteFillTimeoutRef.current) {
                      clearTimeout(favoriteFillTimeoutRef.current);
                      // If timeout was cleared, it means it wasn't fully filled
                      setIsFilledFavorite(false);
                    } else if (isFilledFavorite) {
                      // If fully filled, show white bar, then reset after animation
                      setTimeout(() => {
                        setIsFilledFavorite(false);
                      }, 400);
                    }
                  }}
                  sx={{
                    borderColor: "#000",
                    backgroundColor: "#fff",
                    py: 2,
                    textTransform: "none",
                    fontSize: "1rem",
                    fontWeight: 600,
                    borderRadius: 0,
                    mt: 1,
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden",
                    // Black background (::before)
                    "&::before": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: isHoveredFavorite ? "100%" : "0%",
                      height: "100%",
                      backgroundColor: "#000",
                      transition: "width 0.4s ease-in-out",
                      zIndex: 0,
                    },
                    // White background (::after) - only when filled and not hovered
                    "&::after": {
                      content: '""',
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: !isHoveredFavorite && isFilledFavorite ? "100%" : "0%",
                      height: "100%",
                      backgroundColor: "#fff",
                      transition: "width 0.4s ease-in-out",
                      zIndex: 0,
                    },
                    // Text and icon color based on hover state
                    color: isHoveredFavorite ? "#fff" : "#000",
                    // Apply to label text, but not startIcon
                    "& .MuiButton-label": {
                      position: "relative",
                      zIndex: 2,
                      transition: "color 0.4s ease-in-out",
                      color: isHoveredFavorite ? "#fff" : "#000",
                    },
                    // StartIcon (heart icon) - always red when favorite, regardless of hover
                    "& .MuiButton-startIcon": {
                      position: "relative",
                      zIndex: 2,
                      transition: "color 0.4s ease-in-out",
                      "& svg": {
                        color: isFavorite ? "#f44336" : (isHoveredFavorite ? "#fff" : "#000"),
                      },
                    },
                  }}
                >
                  <span style={{ 
                    position: "relative", 
                    zIndex: 2, 
                    color: isHoveredFavorite ? "#fff" : "#000",
                    transition: "color 0.4s ease-in-out"
                  }}>
                    {isFavorite ? "REMOVE FROM FAVORITES" : "ADD TO FAVORITES"}
                  </span>
                </Button>
              )}

              {/* Add to Cart Button */}
              <Button
                variant="outlined"
                fullWidth
                disabled={soldOut || addingToCart}
                onClick={handleAddToCart}
                onMouseEnter={() => {
                  if (soldOut || addingToCart) return;
                  setIsHovered(true);
                  setIsFilled(false);
                  // Clear any existing timeouts
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                  }
                  if (fillTimeoutRef.current) {
                    clearTimeout(fillTimeoutRef.current);
                  }
                  // Set filled state after animation completes (400ms)
                  fillTimeoutRef.current = setTimeout(() => {
                    setIsFilled(true);
                  }, 400);
                }}
                onMouseLeave={() => {
                  if (soldOut || addingToCart) return;
                  setIsHovered(false);
                  // Clear fill timeout if still running
                  if (fillTimeoutRef.current) {
                    clearTimeout(fillTimeoutRef.current);
                    // If timeout was cleared, it means it wasn't fully filled
                    setIsFilled(false);
                  } else if (isFilled) {
                    // If fully filled, show white bar, then reset after animation
                    setTimeout(() => {
                      setIsFilled(false);
                    }, 400);
                  }
                }}
                sx={{
                  borderColor: soldOut ? "#e0e0e0" : "#000",
                  backgroundColor: soldOut ? "#f5f5f5" : "#fff",
                  py: 2,
                  textTransform: "none",
                  fontSize: "1rem",
                  fontWeight: 600,
                  borderRadius: 0,
                  mt: 1,
                  cursor: soldOut || addingToCart ? "not-allowed" : "pointer",
                  position: "relative",
                  overflow: "hidden",
                  // Black background (::before)
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
                  // White background (::after) - only when filled and not hovered
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
                  // Text and icon color based on hover state - apply to all possible text elements
                  color: `${soldOut ? "#e0e0e0" : (isHovered ? "#fff" : "#000")} !important`,
                  // Apply to all children including text nodes
                  "& *": {
                    position: "relative",
                    zIndex: 2,
                    transition: "color 0.4s ease-in-out",
                    color: `${soldOut ? "#e0e0e0" : (isHovered ? "#fff" : "#000")} !important`,
                  },
                  "& .MuiButton-startIcon": {
                    position: "relative",
                    zIndex: 2,
                    transition: "color 0.4s ease-in-out",
                    color: `${soldOut ? "#e0e0e0" : (isHovered ? "#fff" : "#000")} !important`,
                  },
                  "& .MuiButton-label": {
                    position: "relative",
                    zIndex: 2,
                    transition: "color 0.4s ease-in-out",
                    color: `${soldOut ? "#e0e0e0" : (isHovered ? "#fff" : "#000")} !important`,
                  },
                  // Force text color on the button itself
                  "&": {
                    color: `${soldOut ? "#e0e0e0" : (isHovered ? "#fff" : "#000")} !important`,
                  },
                  "&.Mui-disabled": {
                    cursor: "not-allowed",
                  },
                }}
                startIcon={!soldOut && !addingToCart && <AddIcon />}
              >
                <span style={{ 
                  position: "relative", 
                  zIndex: 2, 
                  color: soldOut ? "#e0e0e0" : (isHovered ? "#fff" : "#000"),
                  transition: "color 0.4s ease-in-out"
                }}>
                  {addingToCart ? "ADDING..." : soldOut ? "SOLD OUT" : "ADD TO CART"}
                </span>
              </Button>
            </Box>
          </Box>
        </Box>

        {/* Related Products Section */}
        {relatedProducts.length > 0 && (
          <Box sx={{ mt: 8, pt: 6 }}>
            <Typography
              variant="h4"
              sx={{
                textAlign: "center",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
                fontWeight: 600,
                color: "text.secondary",
                mb: 4,
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              RELATED PRODUCTS
            </Typography>
            <Box 
              sx={{ 
                display: "flex",
                flexWrap: "wrap",
                gap: { xs: 2, sm: 2, md: 2 },
                justifyContent: "center",
                alignItems: "stretch",
              }}
            >
              {relatedProducts.map((relatedProduct) => {
                // Use product ID for consistent discount calculation (deterministic instead of random)
                const relatedDiscount = Math.round(((relatedProduct._id?.charCodeAt(0) || 0) % 21) + 30);
                const relatedOriginalPrice = relatedProduct.price * (1 + relatedDiscount / 100);
                return (
                  <Box
                    key={relatedProduct._id}
                    sx={{ 
                      display: "flex",
                      width: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                      flexBasis: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                      maxWidth: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                      minWidth: { xs: "100%", sm: "calc(50% - 16px)", md: "calc(33.333% - 16px)", lg: "calc(25% - 16px)" },
                    }}
                  >
                    <Card
                      onClick={() => navigate(`/product/${relatedProduct._id}`)}
                      sx={{
                        position: "relative",
                        boxShadow: "none",
                        cursor: "pointer",
                        width: "100%",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        borderRadius: "0 !important",
                        "&:hover": {
                          "& .product-image": {
                            transform: "scale(1.05)",
                          },
                          "& .favorite-icon": {
                            opacity: 1,
                          },
                        },
                      }}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          aspectRatio: "3/4",
                          backgroundColor: "#ffffff",
                          overflow: "hidden",
                          flexShrink: 0,
                          borderRadius: "0 !important",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {relatedProduct.image && (
                          <Box
                            component="img"
                            src={relatedProduct.image}
                            alt={relatedProduct.name}
                            className="product-image"
                            sx={{
                              width: "100%",
                              height: "100%",
                              objectFit: "contain",
                              transition: "transform 0.3s ease",
                              borderRadius: "0 !important",
                              maxWidth: "100%",
                              maxHeight: "100%",
                            }}
                          />
                        )}
                        {isLoggedIn && (
                          <IconButton
                            className="favorite-icon"
                            onClick={(e) => handleRelatedFavoriteClick(e, relatedProduct._id)}
                            sx={{
                              position: "absolute",
                              bottom: { xs: 8, sm: 12 },
                              right: { xs: 8, sm: 12 },
                              zIndex: 2,
                              backgroundColor: "#fff",
                              borderRadius: "50%",
                              width: { xs: 28, sm: 32 },
                              height: { xs: 28, sm: 32 },
                              padding: 0.5,
                              opacity: relatedFavorites[relatedProduct._id] ? 1 : 0,
                              transition: "opacity 0.3s",
                              boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                              "&:hover": {
                                backgroundColor: "#f5f5f5",
                                opacity: 1,
                              },
                            }}
                          >
                            {relatedFavorites[relatedProduct._id] ? (
                              <FavoriteIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: "#f44336" }} />
                            ) : (
                              <FavoriteBorderIcon sx={{ fontSize: { xs: 18, sm: 20 }, color: "#666" }} />
                            )}
                          </IconButton>
                        )}
                      </Box>
                      <CardContent 
                        sx={{ 
                          p: { xs: 0.75, sm: 1 }, 
                          "&:last-child": { pb: { xs: 0.75, sm: 1 } },
                          flexGrow: 1,
                          display: "flex",
                          flexDirection: "column",
                          width: "100%",
                          textAlign: "center",
                          cursor: "default",
                          position: "relative",
                        }}
                      >
                        <Typography
                          onClick={() => navigate(`/product/${relatedProduct._id}`)}
                          variant="body2"
                          sx={{
                            fontSize: { xs: "0.7rem", sm: "0.8rem" },
                            color: "text.secondary",
                            minHeight: { xs: "2.5rem", sm: "3rem", md: "3.5rem" },
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            display: "-webkit-box",
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: "vertical",
                            lineHeight: 1.4,
                            textTransform: "uppercase",
                            cursor: "pointer",
                            mb: 1,
                            textAlign: "center",
                          }}
                        >
                          {relatedProduct.name}
                        </Typography>
                        <Typography
                          onClick={() => navigate(`/product/${relatedProduct._id}`)}
                          sx={{
                            fontSize: { xs: "0.75rem", sm: "0.875rem" },
                            fontWeight: 600,
                            color: "#000",
                            cursor: "pointer",
                            mb: 1,
                            textAlign: "center",
                          }}
                        >
                          ${relatedProduct.price.toFixed(2)}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
                          {DEFAULT_COLORS.slice(0, 3).map((color, idx) => (
                            <Box
                              key={idx}
                              sx={{
                                width: { xs: 12, sm: 16 },
                                height: { xs: 12, sm: 16 },
                                borderRadius: 0,
                                backgroundColor: color,
                                border: "1px solid #e0e0e0",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                              }}
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>
      <Footer />
      
      {/* Color Selection Modal */}
      <Dialog
        open={colorModalOpen}
        onClose={() => setColorModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 0,
            minWidth: { xs: "90%", sm: "400px" },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            borderBottom: "1px solid #e0e0e0",
            pb: 2,
            textAlign: "center",
          }}
        >
          {selectedColorIndex === null && selectedSize === null && product?.category?.toLowerCase() !== "accessories"
            ? "Selection Required"
            : "Color Selection Required"}
        </DialogTitle>
        <DialogContent 
          sx={{ 
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100px",
            paddingTop: "14px !important",
            paddingBottom: "24px !important",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <Typography variant="body1">
            {selectedColorIndex === null && selectedSize === null && product?.category?.toLowerCase() !== "accessories"
              ? "Please select both color and size."
              : "Please select a color."}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, pb: 2, justifyContent: "center" }}>
          <Button
            onClick={() => setColorModalOpen(false)}
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

      {/* Size Selection Modal */}
      <Dialog
        open={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 0,
            minWidth: { xs: "90%", sm: "400px" },
          },
        }}
      >
        <DialogTitle
          sx={{
            fontWeight: 600,
            textTransform: "uppercase",
            borderBottom: "1px solid #e0e0e0",
            pb: 2,
            textAlign: "center",
          }}
        >
          Size Selection Required
        </DialogTitle>
        <DialogContent 
          sx={{ 
            textAlign: "center",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100px",
            paddingTop: "14px !important",
            paddingBottom: "24px !important",
            paddingLeft: "24px",
            paddingRight: "24px",
          }}
        >
          <Typography variant="body1">
            Please select a size.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0, pb: 2, justifyContent: "center" }}>
          <Button
            onClick={() => setSizeModalOpen(false)}
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

export default ProductDetail;
