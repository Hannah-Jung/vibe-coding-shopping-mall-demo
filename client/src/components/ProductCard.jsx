import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Chip, IconButton, Checkbox } from "@mui/material";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import FavoriteIcon from "@mui/icons-material/Favorite";
import { storage } from "../utils/localStorage";
import { addFavorite, removeFavorite } from "../utils/api";

// Default colors for products
const DEFAULT_COLORS = ["#000", "#fff", "#9e9e9e"];

/**
 * ProductCard - Reusable product card component
 * @param {Object} product - Product object
 * @param {boolean} showSale - Show sale badge
 * @param {boolean} isSelected - Is product selected (for checkbox)
 * @param {Function} onSelect - Callback when checkbox is clicked
 * @param {Function} onRemove - Callback when product is removed (for favorites page)
 * @param {boolean} showCheckbox - Show checkbox overlay
 * @param {boolean} useCard - Use Card component (true) or Box component (false)
 */
const ProductCard = ({ 
  product, 
  showSale = false, 
  isSelected = false, 
  onSelect = null, 
  onRemove = null,
  showCheckbox = false,
  useCard = true 
}) => {
  const navigate = useNavigate();
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const imageRef = useRef(null);
  const containerRef = useRef(null);
  const [imageBounds, setImageBounds] = useState({ left: 0, right: 0, top: 0, bottom: 0 });
  const [boundsCalculated, setBoundsCalculated] = useState(false);
  
  // Memoize colors and productId
  const colors = useMemo(
    () => (product.colors && product.colors.length > 0 ? product.colors : DEFAULT_COLORS),
    [product.colors]
  );
  const productId = useMemo(() => product._id || product.id, [product._id, product.id]);

  // Check login status
  useEffect(() => {
    const token = storage.getToken();
    setIsLoggedIn(!!token);
    
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

  const handleCardClick = useCallback(() => {
    if (productId) {
      navigate(`/product/${productId}`);
    }
  }, [navigate, productId]);

  const handleFavoriteClick = useCallback(async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const token = storage.getToken();
    const currentUser = storage.getUser();
    const currentFavorite = isFavorite;
    const newFavorite = !currentFavorite;
    
    // Optimistically update UI
    setIsFavorite(newFavorite);
    
    // Update localStorage immediately
    const favorites = storage.getFavorites(currentUser?._id);
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
    storage.setFavorites(favorites, currentUser?._id);
    
    // Dispatch custom event to update Navbar badge
    window.dispatchEvent(new Event("favoritesUpdated"));
    
    // If unfavorited, call onRemove callback
    if (!newFavorite && onRemove) {
      onRemove(productId);
    }
    
    // Sync with server if logged in
    if (token && currentUser?._id) {
      try {
        if (newFavorite) {
          await addFavorite(token, productId);
        } else {
          await removeFavorite(token, productId);
        }
      } catch (error) {
        console.error("Error syncing favorite with server:", error);
        // Revert optimistic update on error
        setIsFavorite(currentFavorite);
        const revertedFavorites = storage.getFavorites(currentUser?._id);
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
        storage.setFavorites(revertedFavorites, currentUser?._id);
        window.dispatchEvent(new Event("favoritesUpdated"));
      }
    }
  }, [productId, onRemove, isFavorite]);

  // Check if product is already favorited on mount
  useEffect(() => {
    const currentUser = storage.getUser();
    const favorites = storage.getFavorites(currentUser?._id);
    setIsFavorite(favorites.includes(productId));
  }, [productId]);

  // Calculate actual image bounds for positioning checkbox and heart icon
  useEffect(() => {
    const calculateImageBounds = () => {
      if (!imageRef.current || !containerRef.current) return;

      const container = containerRef.current;
      const image = imageRef.current;
      
      // Get natural image dimensions
      const naturalWidth = image.naturalWidth;
      const naturalHeight = image.naturalHeight;
      
      if (naturalWidth === 0 || naturalHeight === 0) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Calculate actual displayed image size with objectFit: contain
      const containerAspect = containerWidth / containerHeight;
      const imageAspect = naturalWidth / naturalHeight;
      
      let displayedWidth, displayedHeight;
      if (imageAspect > containerAspect) {
        // Image is wider - fit to width
        displayedWidth = containerWidth;
        displayedHeight = containerWidth / imageAspect;
      } else {
        // Image is taller - fit to height
        displayedHeight = containerHeight;
        displayedWidth = containerHeight * imageAspect;
      }
      
      // Calculate offsets (centered in container)
      const left = (containerWidth - displayedWidth) / 2;
      const right = (containerWidth - displayedWidth) / 2;
      const top = (containerHeight - displayedHeight) / 2;
      const bottom = (containerHeight - displayedHeight) / 2;
      
      setImageBounds({ left, right, top, bottom });
      setBoundsCalculated(true);
    };

    // Calculate on mount and when image loads
    if (product.image) {
      // Wait a bit for image to render
      const timer = setTimeout(calculateImageBounds, 100);
      window.addEventListener("resize", calculateImageBounds);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener("resize", calculateImageBounds);
      };
    }
  }, [product.image]);

  const handleCheckboxChange = useCallback((e) => {
    e.stopPropagation();
    // Prevent default to avoid double toggle
    // The checked state is controlled by isSelected prop
    if (onSelect) {
      onSelect(productId);
    }
  }, [onSelect, productId]);

  const imageContainer = (
    <Box
      ref={containerRef}
      onClick={(e) => {
        // Don't trigger card click if checkbox or heart icon is clicked
        const target = e.target;
        const checkbox = target.closest('[role="checkbox"]') || 
                         target.closest('input[type="checkbox"]') || 
                         target.closest('.MuiCheckbox-root') ||
                         target.closest('span[class*="MuiCheckbox"]');
        const favoriteIcon = target.closest('.favorite-icon') || target.closest('.add-icon');
        if (!checkbox && !favoriteIcon) {
          handleCardClick();
        }
      }}
      sx={{
        position: "relative",
        width: "100%",
        aspectRatio: "3/4",
        backgroundColor: "#ffffff",
        borderRadius: "0 !important",
        overflow: "hidden",
        flexShrink: 0,
        cursor: "pointer",
        zIndex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        "&:hover": {
          "& .product-image": {
            transform: "scale(1.1)",
          },
          "& .favorite-icon": {
            opacity: 1,
          },
          "& .add-icon": {
            opacity: 1,
          },
        },
      }}
    >
      {product.image && (
        <Box
          ref={imageRef}
          component="img"
          src={product.image}
          alt={product.name}
          className="product-image"
          onLoad={() => {
            if (imageRef.current && containerRef.current) {
              setTimeout(() => {
                const container = containerRef.current;
                const image = imageRef.current;
                if (!container || !image) return;
                
                // Get natural image dimensions
                const naturalWidth = image.naturalWidth;
                const naturalHeight = image.naturalHeight;
                
                if (naturalWidth === 0 || naturalHeight === 0) return;
                
                const containerRect = container.getBoundingClientRect();
                const containerWidth = containerRect.width;
                const containerHeight = containerRect.height;
                
                // Calculate actual displayed image size with objectFit: contain
                const containerAspect = containerWidth / containerHeight;
                const imageAspect = naturalWidth / naturalHeight;
                
                let displayedWidth, displayedHeight;
                if (imageAspect > containerAspect) {
                  // Image is wider - fit to width
                  displayedWidth = containerWidth;
                  displayedHeight = containerWidth / imageAspect;
                } else {
                  // Image is taller - fit to height
                  displayedHeight = containerHeight;
                  displayedWidth = containerHeight * imageAspect;
                }
                
                // Calculate offsets (centered in container)
                const left = (containerWidth - displayedWidth) / 2;
                const right = (containerWidth - displayedWidth) / 2;
                const top = (containerHeight - displayedHeight) / 2;
                const bottom = (containerHeight - displayedHeight) / 2;
                
                setImageBounds({ left, right, top, bottom });
                setBoundsCalculated(true);
              }, 50);
            }
          }}
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            transition: "transform 0.5s ease-in-out",
            transform: "scale(1)",
            borderRadius: "0 !important",
            maxWidth: "100%",
            maxHeight: "100%",
          }}
        />
      )}
      {(showCheckbox || onSelect) && (
        <Checkbox
          checked={isSelected}
          onChange={handleCheckboxChange}
          onClick={(e) => {
            e.stopPropagation();
          }}
          sx={{
            position: "absolute",
            top: 8,
            left: imageBounds.left > 0 ? imageBounds.left + 8 + 5 + 2 : 8 + 5 + 2,
            zIndex: 3,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            borderRadius: "4px",
            padding: useCard ? 0.5 : 0.25,
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            pointerEvents: "auto",
            color: "#000",
            border: "none",
            opacity: boundsCalculated ? 1 : 0,
            transition: "opacity 0.2s ease-in-out",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            },
            "& .MuiSvgIcon-root": {
              fontSize: useCard ? 24 : 20,
              border: "none",
            },
            "& input": {
              cursor: "pointer",
              pointerEvents: "auto",
            },
            "&.Mui-checked": {
              color: "#000",
              backgroundColor: "rgba(255, 255, 255, 0.6)",
              border: "none",
              "& .MuiSvgIcon-root": {
                color: "#000",
              },
              "&:hover": {
                backgroundColor: "rgba(255, 255, 255, 0.8)",
              },
            },
          }}
        />
      )}
      {(isLoggedIn || useCard === false) && (
        <Box
          component="button"
          type="button"
          onClick={handleFavoriteClick}
          className={useCard ? "favorite-icon" : "add-icon"}
          sx={{
            position: "absolute",
            bottom: 8,
            right: imageBounds.right > 0 ? imageBounds.right + 8 + 8 : 8 + 8,
            zIndex: 2,
            backgroundColor: "rgba(255, 255, 255, 0.6)",
            borderRadius: "50%",
            width: { xs: 28, sm: 32 },
            height: { xs: 28, sm: 32 },
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0.5,
            opacity: boundsCalculated && isFavorite ? 1 : 0,
            transition: "opacity 0.2s ease-in-out, backgroundColor 0.3s",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.8)",
            },
          }}
        >
          {isFavorite ? (
            <FavoriteIcon sx={{ fontSize: { xs: useCard ? 18 : 20, sm: useCard ? 20 : 24 }, color: "#f44336" }} />
          ) : (
            <FavoriteBorderIcon sx={{ fontSize: { xs: useCard ? 18 : 20, sm: useCard ? 20 : 24 }, color: useCard ? "#666" : undefined }} />
          )}
        </Box>
      )}
    </Box>
  );

  const content = (
    <>
      <Typography
        onClick={handleCardClick}
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
        {product.name}
      </Typography>
      <Typography
        onClick={handleCardClick}
        variant="body2"
        sx={{
          fontWeight: 600,
          fontSize: { xs: "0.75rem", sm: "0.875rem" },
          color: "#000",
          cursor: "pointer",
          mb: 1,
          textAlign: "center",
        }}
      >
        ${product.price?.toFixed(2) || product.price}
      </Typography>
      <Box sx={{ display: "flex", gap: 0.5, justifyContent: "center", flexWrap: "wrap" }}>
        {colors.map((color, idx) => (
          <Box
            key={idx}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedColorIndex(idx);
            }}
            sx={{
              width: { xs: 12, sm: 16 },
              height: { xs: 12, sm: 16 },
              borderRadius: 0,
              backgroundColor: color,
              border: selectedColorIndex === idx 
                ? "1px solid #000"
                : "1px solid #e0e0e0",
              boxShadow: selectedColorIndex === idx
                ? "inset 0 0 0 1px #fff"
                : "none",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          />
        ))}
      </Box>
    </>
  );


  if (useCard) {
    return (
      <Card
        sx={{
          position: "relative",
          boxShadow: "none",
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          borderRadius: "0 !important",
          border: "none",
          outline: isSelected ? "2px solid #000" : "none",
          outlineOffset: isSelected ? "2px" : "0",
          "& .MuiCard-root": {
            borderRadius: "0 !important",
          },
        }}
      >
        {imageContainer}
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
          {content}
        </CardContent>
      </Card>
    );
  }

  return (
    <Box
      sx={{
        position: "relative",
        boxShadow: "none",
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        border: "none",
        borderRadius: "0 !important",
      }}
    >
      {imageContainer}
      <Box 
        sx={{ 
          p: { xs: 0.75, sm: 1 }, 
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          width: "100%",
          textAlign: "center",
          cursor: "default",
          position: "relative",
        }}
      >
        {content}
      </Box>
    </Box>
  );
};

export default memo(ProductCard);

