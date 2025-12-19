import { Box, Typography, Button, useMediaQuery, useTheme, CircularProgress, Select, MenuItem, FormControl, InputLabel, Chip } from "@mui/material";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ProductCard from "../components/ProductCard";
import { API_BASE_URL } from "../utils/constants";
import { storage } from "../utils/localStorage";

// Common style constants
const commonStyles = {
  sectionPadding: { py: { xs: "calc(2.125rem - 30px)", sm: "calc(2.5rem - 30px)", md: "calc(3rem - 30px)" }, px: { xs: 2, sm: 3, md: 4 } },
  sectionPaddingLarge: { py: { xs: "calc(2.125rem - 30px)", sm: "calc(3rem - 30px)", md: "calc(4rem - 30px)" }, px: { xs: 2, sm: 3, md: 4 } },
  maxWidth: { maxWidth: "1200px", mx: "auto" },
  gridSpacing: { xs: 1.5, sm: 2 },
  headingH4: {
    fontWeight: 500,
    mb: { xs: 3, md: 4 },
    textAlign: "center",
    fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" },
  },
  headingH3: {
    fontWeight: 700,
    fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem", lg: "3rem" },
  },
  headingH3Small: {
    fontWeight: 700,
    fontSize: { xs: "1.25rem", sm: "1.5rem", md: "2rem", lg: "2.5rem" },
  },
  bodyText: {
    fontSize: { xs: "0.875rem", sm: "1rem", md: "1.125rem" },
    px: { xs: 1, sm: 0 },
  },
  buttonBlack: {
    backgroundColor: "#000",
    color: "#fff",
    px: { xs: 3, sm: 4 },
    py: { xs: 1, sm: 1.5 },
    textTransform: "none",
    fontSize: { xs: "0.875rem", sm: "1rem" },
    "&:hover": { backgroundColor: "#333" },
  },
  buttonWhite: {
    backgroundColor: "#fff",
    color: "#000",
    px: { xs: 3, sm: 4 },
    py: { xs: 1, sm: 1.5 },
    textTransform: "none",
    fontSize: { xs: "0.875rem", sm: "1rem" },
    "&:hover": { backgroundColor: "#e0e0e0" },
  },
};


// Reusable components
const ProductSection = ({ title, products, showSale = false, showViewMore = false, sectionId }) => {
  return (
  <Box sx={commonStyles.sectionPadding}>
    <Box sx={{ ...commonStyles.maxWidth, mb: { xs: 2, md: 3 }, display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", gap: 2 }}>
      <Typography 
        variant="h4" 
        sx={commonStyles.headingH4}
        id={sectionId}
      >
        {title}
      </Typography>
    </Box>
    <Box 
      sx={{ 
        ...commonStyles.maxWidth, 
        mb: showViewMore ? { xs: 3, md: 4 } : 0,
        display: "flex",
        flexWrap: "wrap",
        gap: { xs: 2, sm: 2, md: 2 },
        justifyContent: "center",
        alignItems: "stretch",
      }}
    >
      {products.map((product) => (
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
          <ProductCard product={product} showSale={showSale} useCard={true} />
        </Box>
      ))}
    </Box>
    {showViewMore && (
      <Box sx={{ textAlign: "center" }}>
        <Button 
          variant="contained" 
          sx={commonStyles.buttonBlack}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          VIEW MORE
        </Button>
      </Box>
    )}
  </Box>
  );
};

const PromotionalBanner = ({ title, subtitle, code, buttonText, backgroundColor, titleColor = "#000", onButtonClick }) => (
  <Box
    sx={{
      py: { xs: 2, sm: 3, md: 4 },
      px: { xs: 2, sm: 3, md: 4 },
      backgroundColor,
      textAlign: "center",
      position: "relative",
      overflow: backgroundColor === "#000" ? "visible" : "hidden",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      backgroundImage: title === "TAKE AN ADDITIONAL 30% OFF" 
        ? `url('https://images.unsplash.com/photo-1492584115029-f633e64c61fa?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`
        : undefined,
      backgroundSize: title === "TAKE AN ADDITIONAL 30% OFF" ? "cover" : undefined,
      backgroundPosition: title === "TAKE AN ADDITIONAL 30% OFF" ? "center" : undefined,
      backgroundRepeat: title === "TAKE AN ADDITIONAL 30% OFF" ? "no-repeat" : undefined,
    }}
  >
    {title === "TAKE AN ADDITIONAL 30% OFF" && (
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "100px",
          background: "linear-gradient(to bottom, transparent 0%, #ffffff 100%)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    )}
    {title === "TAKE AN ADDITIONAL 30% OFF" && (
      <>
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(255, 255, 255, 0.5)",
            zIndex: 0,
          }}
        />
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "150px",
            background: "linear-gradient(to bottom, #ffffff 0%, transparent 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "150px",
            background: "linear-gradient(to bottom, transparent 0%, #ffffff 100%)",
            zIndex: 1,
            pointerEvents: "none",
          }}
        />
      </>
    )}
    {backgroundColor === "linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)" && (
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)",
          backgroundSize: { xs: "15px 15px", md: "20px 20px" },
          opacity: 0.5,
        }}
      />
    )}
    {title === "TAKE AN ADDITIONAL 30% OFF" ? (
      <Box
        sx={{
          position: "relative",
          zIndex: 1,
          px: { xs: 1, sm: 0 },
          mb: subtitle ? 1 : { xs: 3, md: 4 },
        }}
      >
        <Typography
          variant="h2"
          sx={{
            color: "#f5312b",
            fontWeight: 700,
            fontSize: { xs: "1rem", sm: "1.25rem", md: "1.5rem", lg: "1.75rem" },
            lineHeight: 1.2,
            mb: 0.5,
            transform: "scaleY(1.8)",
            transformOrigin: "center",
            display: "block",
          }}
        >
          TAKE AN ADDITIONAL
        </Typography>
        <Typography
          variant="h2"
          sx={{
            color: "#f5312b",
            fontWeight: 700,
            fontSize: { xs: "3.75rem", sm: "5rem", md: "6.25rem", lg: "7.5rem" },
            lineHeight: 1,
            my: 0,
          }}
        >
          30% OFF
        </Typography>
      </Box>
    ) : (
      <Typography
        variant="h2"
        sx={{
          color: titleColor,
          fontWeight: 700,
          mb: subtitle ? 1 : { xs: 3, md: 4 },
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.5rem", lg: "3rem" },
          position: "relative",
          zIndex: 1,
          px: { xs: 1, sm: 0 },
        }}
      >
        {title}
      </Typography>
    )}
    {subtitle && (
      <Typography
        variant="h5"
        sx={{
          color: title === "TAKE AN ADDITIONAL 30% OFF" ? "#f5312b" : (titleColor === "#000" ? "#fff" : "#fff"),
          mb: title === "TAKE AN ADDITIONAL 30% OFF" ? (code ? 3 : { xs: 3, md: 4 }) : (code ? 2 : { xs: 3, md: 4 }),
          fontSize: title === "TAKE AN ADDITIONAL 30% OFF" 
            ? { xs: "1rem", sm: "1.25rem", md: "1.5rem", lg: "1.75rem" }
            : { xs: "0.875rem", sm: "1rem", md: "1.25rem" },
          position: "relative",
          zIndex: 1,
          transform: title === "TAKE AN ADDITIONAL 30% OFF" ? "scaleY(1.8)" : undefined,
          transformOrigin: title === "TAKE AN ADDITIONAL 30% OFF" ? "center" : undefined,
          display: title === "TAKE AN ADDITIONAL 30% OFF" ? "block" : undefined,
          fontWeight: title === "TAKE AN ADDITIONAL 30% OFF" ? 700 : undefined,
          lineHeight: title === "TAKE AN ADDITIONAL 30% OFF" ? 1.2 : undefined,
        }}
      >
        {subtitle}
      </Typography>
    )}
    {code && (
      <Typography 
        variant="body1" 
        sx={{ 
          mb: title === "TAKE AN ADDITIONAL 30% OFF" ? 2 : 3,
          position: "relative", 
          zIndex: 1, 
          fontSize: { xs: "0.875rem", sm: "1rem" },
          color: title === "TAKE AN ADDITIONAL 30% OFF" ? "#f5312b" : undefined,
          fontWeight: title === "TAKE AN ADDITIONAL 30% OFF" ? 700 : undefined,
          transform: title === "TAKE AN ADDITIONAL 30% OFF" ? "scaleY(1.8)" : undefined,
          transformOrigin: title === "TAKE AN ADDITIONAL 30% OFF" ? "center" : undefined,
          display: title === "TAKE AN ADDITIONAL 30% OFF" ? "block" : undefined,
        }}
      >
        {code}
      </Typography>
    )}
    {buttonText && (
      <Button
        variant={title === "TAKE AN ADDITIONAL 30% OFF" ? "text" : "contained"}
        onClick={onButtonClick || (() => window.scrollTo({ top: 0, behavior: "smooth" }))}
        sx={{
          ...(title === "TAKE AN ADDITIONAL 30% OFF" 
            ? { 
                color: "#f5312b",
                position: "relative",
                zIndex: 1,
                textTransform: "none",
                fontSize: { xs: "0.875rem", sm: "1rem" },
                fontWeight: 700,
                transform: "scaleY(1.8)",
                transformOrigin: "center",
                display: "block",
                mx: "auto",
                "&:hover": {
                  backgroundColor: "transparent",
                },
              }
            : (titleColor === "#fff" ? commonStyles.buttonWhite : commonStyles.buttonBlack)),
          position: "relative",
          zIndex: 1,
          ...(buttonText === "SHOP NOW" && {
            textDecoration: "none",
            "&:hover": {
              textDecoration: "underline",
            },
          }),
        }}
      >
        {buttonText}
      </Button>
    )}
  </Box>
);

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get("category");
  const searchQuery = searchParams.get("search");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortOrder, setSortOrder] = useState("default");

  // Check if we should scroll to top (from back button)
  useEffect(() => {
    const shouldScrollToTop = sessionStorage.getItem('scrollToTop');
    if (shouldScrollToTop === 'true') {
      sessionStorage.removeItem('scrollToTop');
      window.scrollTo(0, 0);
      // Also try with requestAnimationFrame and setTimeout
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      });
    }
  }, []);

  // Reset sort order when category filter changes
  useEffect(() => {
    setSortOrder("default");
  }, [categoryFilter]);

  // Fetch products from API (optimized with memoized URL)
  const productsUrl = useMemo(() => {
    let url = `${API_BASE_URL}/products?limit=1000`;
    if (categoryFilter) {
      url += `&category=${encodeURIComponent(categoryFilter)}`;
    }
    if (searchQuery) {
      url += `&search=${encodeURIComponent(searchQuery)}`;
    }
    return url;
  }, [categoryFilter, searchQuery]);

  // Check if we should scroll to top (from back button)
  useEffect(() => {
    const shouldScrollToTop = sessionStorage.getItem('scrollToTop');
    if (shouldScrollToTop === 'true') {
      sessionStorage.removeItem('scrollToTop');
      window.scrollTo(0, 0);
      // Also try with requestAnimationFrame and setTimeout
      requestAnimationFrame(() => {
        window.scrollTo(0, 0);
        setTimeout(() => {
          window.scrollTo(0, 0);
        }, 100);
      });
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError("");
        
        const response = await fetch(productsUrl, {
          signal: abortController.signal,
        });
        const result = await response.json();

        if (result.success && result.data) {
          // Transform API products to match component structure (optimized)
          const transformedProducts = result.data.map((product) => ({
            ...product,
            id: product._id,
            colors: product.colors || ["#000", "#fff", "#9e9e9e"],
          }));
          setProducts(transformedProducts);
        } else {
          setError(result.message || "Failed to fetch products.");
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching products:", error);
          setError("An error occurred while fetching products.");
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchProducts();
    
    return () => {
      abortController.abort();
    };
  }, [productsUrl]);

  // Organize products into sections
  const { bestSellers, thisJustIn, partyShop, doorbusterDeals } = useMemo(() => {
    if (products.length === 0) {
      return {
        bestSellers: [],
        thisJustIn: [],
        partyShop: [],
        doorbusterDeals: [],
      };
    }

    // Fisher-Yates shuffle algorithm for random order on each page load/refresh
    const shuffled = [...products];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return {
      bestSellers: shuffled.slice(0, 6),
      thisJustIn: shuffled.slice(6, 12),
      partyShop: shuffled.slice(12, 18),
      doorbusterDeals: shuffled.slice(18, 24).map((product) => ({
        ...product,
        price: product.price * 0.5, // Apply discount for doorbuster deals
      })),
    };
  }, [products]);


  // If category filter or search query is active, show filtered products instead of sections
  const filteredProducts = useMemo(() => {
    if (!categoryFilter && !searchQuery) return null;
    
    let sorted = [...products];
    
    // Apply sorting based on sortOrder
    if (sortOrder === "price-low") {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortOrder === "price-high") {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortOrder === "newest") {
      // Sort by creation date (newest first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateB - dateA;
      });
    } else if (sortOrder === "oldest") {
      // Sort by creation date (oldest first)
      sorted.sort((a, b) => {
        const dateA = new Date(a.createdAt || a.updatedAt || 0);
        const dateB = new Date(b.createdAt || b.updatedAt || 0);
        return dateA - dateB;
      });
    }
    
    return sorted;
  }, [categoryFilter, searchQuery, products, sortOrder]);

  // Memoize sorted filtered products for search results display
  const sortedFilteredProducts = useMemo(() => {
    if (!filteredProducts) return null;
    return filteredProducts;
  }, [filteredProducts]);


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
            onClick={() => window.location.reload()}
            sx={commonStyles.buttonBlack}
          >
            Retry
          </Button>
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", backgroundColor: "#fff" }}>
      <Navbar />

      {/* Show filtered products if category filter or search query is active */}
      {(categoryFilter || searchQuery) ? (
        <Box sx={{ ...commonStyles.sectionPadding, pt: { xs: 6, sm: 8, md: 10 } }}>
          <Box sx={{ ...commonStyles.maxWidth }}>
            <Box sx={{ mb: { xs: 3, md: 4 } }}>
              {searchQuery ? (
                <>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      ...commonStyles.headingH4, 
                      mb: 1,
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    SEARCH
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      textAlign: "center",
                      color: "text.secondary",
                      mb: 2,
                    }}
                  >
                    {sortedFilteredProducts?.length || 0} {sortedFilteredProducts?.length === 1 ? 'result' : 'results'} for "{searchQuery}"
                  </Typography>
                </>
              ) : (
                <>
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      ...commonStyles.headingH4, 
                      mb: 2,
                      textTransform: "uppercase",
                      textAlign: "center",
                    }}
                  >
                    {categoryFilter}
                  </Typography>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Sort by</InputLabel>
                      <Select
                        value={sortOrder || "default"}
                        label="Sort by"
                        onChange={(e) => setSortOrder(e.target.value)}
                        sx={{
                          backgroundColor: "#fff",
                        }}
                        displayEmpty={false}
                      >
                        <MenuItem value="default">Featured</MenuItem>
                        <MenuItem value="price-low">Price: Low to High</MenuItem>
                        <MenuItem value="price-high">Price: High to Low</MenuItem>
                        <MenuItem value="newest">Newest</MenuItem>
                        <MenuItem value="oldest">Oldest</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                </>
              )}
            </Box>
            {filteredProducts && filteredProducts.length > 0 ? (
              <Box 
                sx={{ 
                  display: "flex",
                  flexWrap: "wrap",
                  gap: { xs: 2, sm: 2, md: 2 },
                  justifyContent: "center",
                  alignItems: "stretch",
                }}
              >
                {filteredProducts.map((product) => (
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
                    <ProductCard product={product} useCard={true} />
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography variant="body1" sx={{ textAlign: "center", py: 4 }}>
                No products found in this category.
              </Typography>
            )}
          </Box>
        </Box>
      ) : (
        <>
          {/* 30% OFF Promotional Banner */}
          <PromotionalBanner
            title="TAKE AN ADDITIONAL 30% OFF"
            subtitle="SALE STYLES"
            code="USE CODE: EXTRA30"
            buttonText="SHOP NOW"
            backgroundColor="linear-gradient(135deg, #e0e0e0 0%, #bdbdbd 100%)"
            titleColor="#f44336"
            onButtonClick={() => {
              const bestSellersSection = document.getElementById("best-sellers-section");
              if (bestSellersSection) {
                const yOffset = -100; // 상단 여백 조정 (네비게이션 바 고려)
                const y = bestSellersSection.getBoundingClientRect().top + window.pageYOffset + yOffset;
                window.scrollTo({ top: y, behavior: "smooth" });
              }
            }}
          />

          {/* BEST SELLERS */}
          <ProductSection title="BEST SELLERS" products={bestSellers} showSale sectionId="best-sellers-section" />

      {/* NEW ARRIVALS */}
      <Box sx={{ ...commonStyles.sectionPadding, backgroundColor: "#f5f5f5", display: "flex", alignItems: "center", minHeight: "188px" }}>
        <Box sx={{ ...commonStyles.maxWidth, textAlign: "center", width: "100%", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", py: { xs: 2, md: 3 } }}>
          <Typography variant="h3" sx={{ ...commonStyles.headingH3, mb: { xs: 1.5, md: 2 } }}>
            NEW ARRIVALS
          </Typography>
          <Box sx={{ display: "flex", gap: 2, justifyContent: "center", overflowX: "auto", alignItems: "center" }}>
            {["NEW STYLES UNLOCKED"].map((item, idx) => (
              <Chip key={idx} label={item} sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" } }} />
            ))}
          </Box>
        </Box>
      </Box>

      {/* THIS JUST IN */}
      <Box sx={commonStyles.sectionPadding}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            mb: { xs: 3, md: 4 },
            ...commonStyles.maxWidth,
            px: { xs: 1, sm: 0 },
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Typography variant="h4" sx={{ fontWeight: 600, fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.75rem", lg: "2rem" } }}>
            THIS JUST IN...
          </Typography>
        </Box>
        <Box 
          sx={{ 
            ...commonStyles.maxWidth,
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 2, sm: 2, md: 2 },
            justifyContent: "center",
          }}
        >
          {thisJustIn.map((product) => (
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
              <ProductCard product={product} useCard={true} />
            </Box>
          ))}
        </Box>
      </Box>

      {/* FREE HOLIDAY TOTE BAG */}
      <PromotionalBanner
        title="FREE HOLIDAY TOTE BAG"
        subtitle="with $50 purchase, while supplies last"
        backgroundColor="#e3f2fd"
      />

      {/* THE PARTY SHOP */}
      <ProductSection title="THE PARTY SHOP" products={partyShop} showViewMore />

      {/* HOLIDAY DOORBUSTERS */}
      <PromotionalBanner
        title="HOLIDAY DOORBUSTERS FROM $3 & UP"
        subtitle="GIFTS FOR EVERYONE"
        buttonText="SHOP NOW"
        backgroundColor="#e3f2fd"
      />

      {/* GIFTS ON TIME */}
      <Box sx={{ ...commonStyles.sectionPadding, backgroundColor: "#fff", textAlign: "center" }}>
        <Typography variant="h3" sx={{ ...commonStyles.headingH3Small, mb: 1, px: { xs: 1, sm: 0 } }}>
          GIFTS ON TIME
        </Typography>
        <Typography variant="body1" sx={{ ...commonStyles.bodyText, mb: { xs: 3, md: 4 } }}>
          Holiday Shipping Cut-offs
        </Typography>
        <Box
          sx={{
            maxWidth: "600px",
            mx: "auto",
            border: "1px solid #e0e0e0",
            borderRadius: 1,
            overflow: "hidden",
          }}
        >
          <Box
            sx={{
              display: "flex",
              borderBottom: "1px solid #e0e0e0",
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: { xs: 1, sm: 2 },
                fontWeight: 600,
                borderRight: "1px solid #e0e0e0",
                fontSize: { xs: "0.75rem", sm: "1rem" },
              }}
            >
              Order by
            </Box>
            <Box
              sx={{
                flex: 1,
                p: { xs: 1, sm: 2 },
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "1rem" },
              }}
            >
              Shipping method
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: { xs: 1, sm: 2 },
                borderRight: "1px solid #e0e0e0",
                fontSize: { xs: "0.75rem", sm: "1rem" },
              }}
            >
              December 15
            </Box>
            <Box sx={{ flex: 1, p: { xs: 1, sm: 2 }, fontSize: { xs: "0.75rem", sm: "1rem" } }}>
              Standard Ground
            </Box>
          </Box>
          <Box
            sx={{
              display: "flex",
            }}
          >
            <Box
              sx={{
                flex: 1,
                p: { xs: 1, sm: 2 },
                borderRight: "1px solid #e0e0e0",
                fontSize: { xs: "0.75rem", sm: "1rem" },
              }}
            >
              December 20
            </Box>
            <Box sx={{ flex: 1, p: { xs: 1, sm: 2 }, fontSize: { xs: "0.75rem", sm: "1rem" } }}>
              Express Delivery
            </Box>
          </Box>
        </Box>
      </Box>

        </>
      )}
      <Footer />
    </Box>
  );
};

export default Home;
