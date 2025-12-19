import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  useMediaQuery,
  Collapse,
  Badge,
  Drawer,
  List,
  ListItem,
  Divider,
  TextField,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import ShoppingBagOutlinedIcon from "@mui/icons-material/ShoppingBagOutlined";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import LogoutIcon from "@mui/icons-material/Logout";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import ArrowBackIosNewOutlinedIcon from "@mui/icons-material/ArrowBackIosNewOutlined";
import ArrowForwardIosOutlinedIcon from "@mui/icons-material/ArrowForwardIosOutlined";
import { storage } from "../utils/localStorage";
import { getCurrentUser } from "../utils/api";
import { isTokenError } from "../utils/errorHandler";
import { getFirstName } from "../utils/format";
import { API_BASE_URL } from "../utils/constants";

// Move constants outside component
const BANNER_MESSAGES = [
  "FREE SHIPPING ON ORDERS OVER $75!*",
  "GET 20% OFF YOUR FIRST APP ORDER!",
  "TAKE AN EXTRA 30% OFF SALE STYLES",
  "HOLIDAY DOORBUSTERS FROM $3",
];

const NAV_ITEMS = ["WOMEN", "PLUS", "MEN", "KIDS", "SHOES", "ACCESSORIES"];

const ANIMATION_DURATION = 500; // ms
const BANNER_INTERVAL = 5000; // ms

const Navbar = () => {
  const navigate = useNavigate();
  // Custom breakpoints
  const isDesktop = useMediaQuery("(min-width: 1000px)");
  const isTabletLarge = useMediaQuery("(min-width: 800px) and (max-width: 999px)");
  const isTabletSmall = useMediaQuery("(min-width: 700px) and (max-width: 799px)");
  const isTabletMedium = useMediaQuery("(min-width: 651px) and (max-width: 699px)");
  const isMobile = useMediaQuery("(max-width: 650px)");
  const isBannerNarrow = useMediaQuery("(max-width: 784px)");
  
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [mobileDropdownOpen, setMobileDropdownOpen] = useState(false);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showNext, setShowNext] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [cartItemCount, setCartItemCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const open = Boolean(anchorEl);
  
  // Memoized values
  const firstName = useMemo(() => (user?.name ? getFirstName(user.name) : ""), [user?.name]);

  // Get favorite count from localStorage
  useEffect(() => {
    const updateFavoriteCount = () => {
      const favorites = storage.getFavorites();
      setFavoriteCount(favorites.length);
    };

    updateFavoriteCount();
    // Listen for storage changes (when favorites are updated in other components)
    window.addEventListener("storage", updateFavoriteCount);
    // Custom event for same-window updates
    window.addEventListener("favoritesUpdated", updateFavoriteCount);

    return () => {
      window.removeEventListener("storage", updateFavoriteCount);
      window.removeEventListener("favoritesUpdated", updateFavoriteCount);
    };
  }, []);

  // Get cart item count from API (optimized with memoized handler)
  const updateCartCount = useCallback(async (abortSignal) => {
    const token = storage.getToken();
    if (!token) {
      setCartItemCount(0);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/cart`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        signal: abortSignal,
      });

      const result = await response.json();
      if (result.success && result.data) {
        setCartItemCount(result.data.totalItems || 0);
      } else {
        setCartItemCount(0);
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error fetching cart count:", error);
        setCartItemCount(0);
      }
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    
    updateCartCount(abortController.signal);
    
    // Listen for cart updates
    const handleCartUpdated = () => {
      updateCartCount(abortController.signal);
    };
    window.addEventListener("cartUpdated", handleCartUpdated);

    return () => {
      abortController.abort();
      window.removeEventListener("cartUpdated", handleCartUpdated);
    };
  }, [user, updateCartCount]);

  useEffect(() => {
    const abortController = new AbortController();
    
    const fetchUserData = async () => {
      const token = storage.getToken();
      
      if (!token) {
        return;
      }

      try {
        const response = await getCurrentUser(token);
        if (response.success && response.data && !abortController.signal.aborted) {
          setUser(response.data);
          storage.setUser(response.data);
        }
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Error fetching user data:", error);
          if (isTokenError(error) || error.isTokenError) {
            storage.clear();
            setUser(null);
          }
        }
      }
    };

    fetchUserData();
    
    return () => {
      abortController.abort();
    };
  }, []);

  const handleWelcomeClick = useCallback((event) => {
    setAnchorEl(event.currentTarget);
  }, []);

  const handleMenuClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const handleLogout = useCallback(() => {
    // Don't clear favorites - they are stored per user and will be restored on next login
    storage.clear();
    setUser(null);
    // Dispatch event to update components that depend on auth status
    window.dispatchEvent(new Event("authChanged"));
    window.dispatchEvent(new Event("favoritesUpdated"));
    handleMenuClose();
    navigate("/", { replace: true });
  }, [navigate, handleMenuClose]);

  const handleAdminClick = useCallback(() => {
    handleMenuClose();
    // Navigate to Admin page
    navigate("/admin");
    // Scroll to top
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate, handleMenuClose]);

  const handleMyOrdersClick = useCallback(() => {
    handleMenuClose();
    // Navigate to My Orders page
    navigate("/orders");
  }, [navigate, handleMenuClose]);

  const handleAccountClick = useCallback(() => {
    handleMenuClose();
    // Navigate to Account page
    navigate("/account");
  }, [navigate, handleMenuClose]);

  const handleMobileDropdownToggle = useCallback(() => {
    setMobileDropdownOpen((prev) => !prev);
  }, []);

  // Handle logo click - navigate to home and scroll to top
  const handleLogoClick = useCallback(() => {
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [navigate]);

  // Handle search
  const handleSearchClick = useCallback((e) => {
    e.currentTarget.blur(); // Remove focus immediately
    setSearchOpen((prev) => !prev);
  }, []);

  const handleSearchClose = useCallback(() => {
    setSearchOpen(false);
    setSearchQuery("");
    // Remove focus from any active element
    setTimeout(() => {
      if (document.activeElement) {
        document.activeElement.blur();
      }
    }, 100);
  }, []);

  const handleSearchSubmit = useCallback((e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      window.scrollTo({ top: 0, behavior: "smooth" });
      // Remove focus from any active element
      setTimeout(() => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
      }, 100);
    }
  }, [navigate, searchQuery]);

  // Memoize Logo component
  const LogoComponent = useMemo(() => {
    const logoProps = {
      onClick: handleLogoClick,
      sx: {
        cursor: "pointer",
        width: "fit-content",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
      },
    };

    const typographyProps = {
      variant: "h5",
      component: "div",
      sx: {
        fontFamily: '"Work Sans", sans-serif',
        fontWeight: 600,
        fontSize: isMobile
          ? "0.7rem"
          : isDesktop
          ? "1.05rem"
          : isTabletLarge
          ? "0.84rem"
          : "0.6825rem",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        transform: "scaleY(1.5)",
        display: "block",
        width: "fit-content",
        mr: "-0.1em",
        whiteSpace: "nowrap",
        color: "#000",
        lineHeight: 1.2,
      },
    };

    return (
      <Box {...logoProps}>
        <Typography {...typographyProps}>FOREVER</Typography>
        <Typography {...typographyProps}>BYHJ</Typography>
      </Box>
    );
  }, [navigate, isMobile, isDesktop, isTabletLarge, handleLogoClick]);

  // Common IconButton styles
  const iconButtonSx = useMemo(
    () => ({
      color: "#000",
      padding: isMobile ? 0.25 : (isTabletSmall || isTabletMedium) ? 0.2 : isTabletLarge ? 0.3 : 0.5,
      minWidth: "auto",
      "&:hover": { backgroundColor: "rgba(0,0,0,0.05)" },
    }),
    [isMobile, isTabletSmall, isTabletMedium, isTabletLarge]
  );

  // Determine icon size
  const iconSize = useMemo(
    () => (isMobile || isTabletSmall || isTabletMedium || isTabletLarge ? "small" : "medium"),
    [isMobile, isTabletSmall, isTabletMedium, isTabletLarge]
  );

  // Banner auto slide
  useEffect(() => {
    const timeoutIds = [];
    
    const startAnimation = () => {
      // Step 1: Start fade out of current message
      setIsAnimating(true);
      setShowNext(false);
      
      // Step 2: After current message completely disappears, change index and start showing next message
      const timeout1 = setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % BANNER_MESSAGES.length);
        setIsAnimating(false);
        
        // Show next message after index change
        const timeout2 = setTimeout(() => {
          setShowNext(true);
        }, 10);
        timeoutIds.push(timeout2);
        
        // Step 3: Reset showNext state after next message appears
        const timeout3 = setTimeout(() => {
          setShowNext(false);
        }, ANIMATION_DURATION);
        timeoutIds.push(timeout3);
      }, ANIMATION_DURATION);
      timeoutIds.push(timeout1);
    };
    
    const interval = setInterval(startAnimation, BANNER_INTERVAL);
    
    return () => {
      clearInterval(interval);
      timeoutIds.forEach(clearTimeout);
    };
  }, []);

  const handleBannerPrev = useCallback(() => {
    setIsAnimating(true);
    setShowNext(false);
    setTimeout(() => {
      setShowNext(true);
      setCurrentBannerIndex((prev) => (prev - 1 + BANNER_MESSAGES.length) % BANNER_MESSAGES.length);
      setTimeout(() => {
        setIsAnimating(false);
        setShowNext(false);
      }, ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  }, []);

  const handleBannerNext = useCallback(() => {
    setIsAnimating(true);
    setShowNext(false);
    setTimeout(() => {
      setShowNext(true);
      setCurrentBannerIndex((prev) => (prev + 1) % BANNER_MESSAGES.length);
      setTimeout(() => {
        setIsAnimating(false);
        setShowNext(false);
      }, ANIMATION_DURATION);
    }, ANIMATION_DURATION);
  }, []);

  return (
    <AppBar
      position="sticky"
      sx={{
        backgroundColor: "#fff",
        color: "#000",
        boxShadow: "none",
        borderBottom: "none",
        top: 0,
        zIndex: 1100,
      }}
    >
      <Toolbar
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: { xs: 1, sm: 1.5, md: 2 },
          py: 1,
          minHeight: "90px !important",
          height: "90px",
        }}
      >
        {/* Top banner */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            backgroundColor: "#000",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            py: "calc(0.5rem + 3px)",
            fontSize: { xs: "0.75rem", sm: "0.875rem" },
            fontWeight: 600,
            zIndex: 1,
            px: 1,
            overflow: "visible",
          }}
        >
          <IconButton
            onClick={handleBannerPrev}
            sx={{
              color: "#fff",
              padding: 0.25,
              minWidth: "auto",
              position: "absolute",
              left: isBannerNarrow ? "calc(50% - 120px - 40px)" : "calc(50% - 15% - 40px)",
              transform: isBannerNarrow ? "translateX(-100%)" : "translateX(-100%)",
              cursor: "pointer",
              zIndex: 2,
              pointerEvents: "auto",
              transition: "background-color 0.2s ease",
              "&:hover": { 
                backgroundColor: "rgba(255,255,255,0.15)",
                "& .MuiSvgIcon-root": {
                  opacity: 0.9,
                },
              },
            }}
          >
            <ArrowBackIosNewOutlinedIcon sx={{ fontSize: "0.875rem", transition: "opacity 0.2s ease", pointerEvents: "none" }} />
          </IconButton>
          <Box
            sx={{
              textAlign: "center",
              whiteSpace: "nowrap",
              overflow: "visible",
              px: isBannerNarrow ? 3 : 0.5,
              flexShrink: 0,
              position: "relative",
              minHeight: "14px",
              height: "auto",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "100%",
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              fontWeight: 600,
            }}
          >
            {/* Current message - only show when showNext is false */}
            {!showNext && (
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  textAlign: "center",
                  transition: "opacity 0.5s ease, transform 0.5s ease",
                  opacity: isAnimating ? 0 : 1,
                  transform: isAnimating ? "translateY(-10px)" : "translateY(0)",
                  pointerEvents: isAnimating ? "none" : "auto",
                  whiteSpace: "nowrap",
                  width: "100%",
                  willChange: isAnimating ? "opacity, transform" : "auto",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  fontWeight: 600,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  {BANNER_MESSAGES[currentBannerIndex]}
                </Box>
              </Box>
            )}
            {/* Next message - appears after current message completely disappears */}
            <Box
              sx={{
                position: "absolute",
                left: 0,
                right: 0,
                textAlign: "center",
                transition: showNext ? "opacity 0.5s ease" : "none",
                opacity: showNext ? 1 : 0,
                pointerEvents: showNext ? "auto" : "none",
                whiteSpace: "nowrap",
                width: "100%",
                visibility: showNext ? "visible" : "hidden",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                fontWeight: 600,
              }}
            >
              {showNext && (
                <Box
                  component="span"
                  sx={{
                    cursor: "pointer",
                    display: "inline-block",
                  }}
                >
                  {BANNER_MESSAGES[currentBannerIndex]}
                </Box>
              )}
            </Box>
          </Box>
          <IconButton
            onClick={handleBannerNext}
            sx={{
              color: "#fff",
              padding: 0.25,
              minWidth: "auto",
              position: "absolute",
              right: isBannerNarrow ? "calc(50% - 120px - 40px)" : "calc(50% - 15% - 40px)",
              transform: isBannerNarrow ? "translateX(100%)" : "translateX(100%)",
              cursor: "pointer",
              zIndex: 2,
              pointerEvents: "auto",
              transition: "background-color 0.2s ease",
              "&:hover": { 
                backgroundColor: "rgba(255,255,255,0.15)",
                "& .MuiSvgIcon-root": {
                  opacity: 0.9,
                },
              },
            }}
          >
            <ArrowForwardIosOutlinedIcon sx={{ fontSize: "0.875rem", transition: "opacity 0.2s ease", pointerEvents: "none" }} />
          </IconButton>
        </Box>

        <Toolbar
          sx={{
            mt: "50px",
            mb: "10px",
            width: "100%",
            display: "flex",
            justifyContent: isMobile ? "space-between" : "space-between",
            alignItems: "center",
            position: "relative",
            gap: isMobile ? 1 : isTabletSmall ? 1 : isTabletLarge ? 1.5 : 2,
            flexWrap: "nowrap",
            minHeight: "48px !important",
            height: "48px",
          }}
        >
          {/* Left Section - Hamburger (Mobile) or Logo */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              flexShrink: 0,
              minWidth: isMobile ? "auto" : "fit-content",
            }}
          >
            {isMobile ? (
              <IconButton
                onClick={handleMobileDropdownToggle}
                sx={{
                  color: "#000",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  padding: 0,
                  position: "relative",
                  zIndex: 10,
                  "&:hover": { 
                    backgroundColor: "rgba(0,0,0,0.05)",
                    cursor: "pointer",
                  },
                  "& .MuiSvgIcon-root": {
                    pointerEvents: "none",
                  },
                  "& *": {
                    pointerEvents: "none",
                  },
                }}
              >
                <MenuIcon />
              </IconButton>
            ) : (
              <Box
                onClick={handleLogoClick}
                sx={{
                  cursor: "pointer",
                  width: "fit-content",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  justifyContent: "center",
                }}
              >
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontFamily: '"Work Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: isDesktop
                      ? "1.05rem"
                      : isTabletLarge
                      ? "0.84rem"
                      : "0.6825rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    transform: "scaleY(1.5)",
                    display: "block",
                    width: "fit-content",
                    mr: "-0.1em",
                    whiteSpace: "nowrap",
                    color: "#000",
                    lineHeight: 1.2,
                  }}
                >
                  FOREVER
                </Typography>
                <Typography
                  variant="h5"
                  component="div"
                  sx={{
                    fontFamily: '"Work Sans", sans-serif',
                    fontWeight: 600,
                    fontSize: isDesktop
                      ? "1.05rem"
                      : isTabletLarge
                      ? "0.84rem"
                      : "0.6825rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    transform: "scaleY(1.5)",
                    display: "block",
                    width: "fit-content",
                    mr: "-0.1em",
                    whiteSpace: "nowrap",
                    color: "#000",
                    lineHeight: 1.2,
                  }}
                >
                  BYHJ
                </Typography>
              </Box>
            )}
          </Box>

          {/* Center Section - Navigation Menu (Desktop/Tablet) or Logo (Mobile) */}
          <Box
            sx={{
              display: "flex",
              flex: isMobile ? 1 : 1,
              justifyContent: isMobile ? "center" : "center",
              alignItems: "center",
              minWidth: 0,
              position: isMobile ? "absolute" : "relative",
              left: isMobile ? 0 : "auto",
              right: isMobile ? 0 : "auto",
            }}
          >
            {isMobile ? (
              LogoComponent
            ) : (
              <Box
                sx={{
                  display: "flex",
                  gap: isDesktop ? 1.5 : isTabletLarge ? 1.2 : 0.975,
                  alignItems: "center",
                  flexWrap: "nowrap",
                  justifyContent: "center",
                  width: "100%",
                  py: "10px",
                }}
              >
                {NAV_ITEMS.map((item) => (
                  <Button
                    key={item}
                    onClick={() => {
                      navigate(`/?category=${encodeURIComponent(item)}`);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    sx={{
                      color: "#000",
                      textTransform: "none",
                      fontSize: isDesktop
                        ? "0.875rem"
                        : isTabletLarge
                        ? "0.7rem"
                        : "0.56875rem",
                      fontWeight: 400,
                      minWidth: "auto",
                      px: isDesktop ? 0.75 : isTabletLarge ? 0.6 : 0.4875,
                      whiteSpace: "nowrap",
                      flexShrink: 0,
                      "&:hover": {
                        backgroundColor: "transparent",
                        textDecoration: "underline",
                      },
                    }}
                  >
                    {item}
                  </Button>
                ))}
              </Box>
            )}
          </Box>

          {/* Right Section - Icons */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: user ? "flex-start" : "center",
              gap: 0,
              flexShrink: 0,
              mr: 0,
              pr: 0,
              minHeight: user ? "auto" : "1.5rem",
            }}
          >
            {user && (
              <Typography
                sx={{
                  fontSize: isMobile
                    ? "0.65rem"
                    : isTabletSmall || isTabletMedium
                    ? "0.55rem"
                    : isTabletLarge
                    ? "0.65rem"
                    : "0.75rem",
                  color: "#000",
                  whiteSpace: "nowrap",
                  lineHeight: 1,
                  mb: "-2px",
                  height: "1.5rem",
                  display: "flex",
                  alignItems: "center",
                  pt: "8px",
                }}
              >
                Welcome back, {firstName}
              </Typography>
            )}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 0.25 : (isTabletSmall || isTabletMedium) ? 0.2 : isTabletLarge ? 0.3 : 0.5,
                mt: user ? "-2px" : 0,
                pt: "10px",
                pb: "5px",
                mb: "5px",
              }}
            >
            <IconButton 
              onClick={handleSearchClick}
              sx={iconButtonSx}
            >
              <SearchIcon fontSize={iconSize} />
            </IconButton>
            {user && (
              <IconButton 
                onClick={() => {
                  navigate("/favorites");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                sx={iconButtonSx}
              >
                <Badge 
                  badgeContent={favoriteCount} 
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.65rem",
                      minWidth: "16px",
                      width: "16px",
                      height: "16px",
                      padding: 0,
                      lineHeight: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  }}
                >
                  <FavoriteBorderIcon fontSize={iconSize} />
                </Badge>
              </IconButton>
            )}
            {user && (
              <IconButton 
                onClick={() => navigate("/cart")}
                sx={iconButtonSx}
              >
                <Badge 
                  badgeContent={cartItemCount} 
                  color="error"
                  sx={{
                    "& .MuiBadge-badge": {
                      fontSize: "0.65rem",
                      minWidth: "16px",
                      width: "16px",
                      height: "16px",
                      padding: 0,
                      lineHeight: "16px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    },
                  }}
                >
                  <ShoppingBagOutlinedIcon fontSize={iconSize} />
                </Badge>
              </IconButton>
            )}
            <IconButton
              onClick={!user ? () => navigate("/login") : handleWelcomeClick}
              sx={iconButtonSx}
            >
              <PersonOutlineIcon fontSize={iconSize} />
            </IconButton>
            </Box>
            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              anchorOrigin={{
                vertical: "bottom",
                horizontal: "right",
              }}
              transformOrigin={{
                vertical: "top",
                horizontal: "right",
              }}
            >
              {user?.user_type === "admin" && (
                <MenuItem onClick={handleAdminClick}>
                  <ListItemIcon>
                    <AdminPanelSettingsIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Admin</ListItemText>
                </MenuItem>
              )}
              {user && (
                <MenuItem onClick={handleMyOrdersClick}>
                  <ListItemIcon>
                    <ShoppingCartIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>My Orders</ListItemText>
                </MenuItem>
              )}
              {user && (
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText>Logout</ListItemText>
                </MenuItem>
              )}
            </Menu>
          </Box>
        </Toolbar>

        {/* Mobile Side Drawer Menu */}
        {isMobile && (
          <Drawer
            anchor="left"
            open={mobileDropdownOpen}
            onClose={handleMobileDropdownToggle}
            sx={{
              "& .MuiDrawer-paper": {
                width: "auto",
                minWidth: "fit-content",
                maxWidth: "280px",
                boxSizing: "border-box",
                top: "37px", // X 버튼이 햄버거 버튼 위치(45px)에 오도록 조정 (paddingTop 8px 고려)
                height: "auto",
                maxHeight: "calc(100vh - 37px)",
                paddingTop: 1, // X 버튼 위 여백 추가
              },
            }}
          >
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                position: "relative",
              }}
            >
              {/* Close button (X icon) in hamburger button position */}
              <IconButton
                onClick={handleMobileDropdownToggle}
                sx={{
                  color: "#000",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 40,
                  height: 40,
                  padding: 0,
                  position: "absolute",
                  top: "0px", // drawer의 top이 45px이므로, drawer 내부에서 0px이면 45px 위치
                  left: "24px", // 햄버거 버튼과 동일한 left 위치
                  zIndex: 11,
                  "&:hover": { 
                    backgroundColor: "rgba(0,0,0,0.05)",
                    cursor: "pointer",
                  },
                  "& .MuiSvgIcon-root": {
                    pointerEvents: "none",
                  },
                  "& *": {
                    pointerEvents: "none",
                  },
                }}
              >
                <CloseIcon />
              </IconButton>
              <Box
                sx={{
                  pt: 7, // X 버튼 높이(40px) + 여백을 고려하여 충분한 padding-top
                  pb: 2,
                  display: "flex",
                  flexDirection: "column",
                  width: "100%",
                }}
              >
                <List sx={{ width: "100%", padding: 0 }}>
                  {NAV_ITEMS.map((item) => (
                    <ListItem
                      key={item}
                      disablePadding
                      sx={{ width: "100%" }}
                    >
                      <Button
                        onClick={() => {
                          handleMobileDropdownToggle();
                          navigate(`/?category=${encodeURIComponent(item)}`);
                          window.scrollTo({ top: 0, behavior: "smooth" });
                        }}
                        sx={{
                          color: "#000",
                          textTransform: "none",
                          fontSize: "1rem",
                          fontWeight: 400,
                          py: 1.5,
                          px: 3,
                          justifyContent: "flex-start",
                          whiteSpace: "nowrap",
                          width: "100%",
                          "&:hover": {
                            backgroundColor: "rgba(0,0,0,0.05)",
                          },
                        }}
                      >
                        {item}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Box>
            </Box>
          </Drawer>
        )}
      </Toolbar>

      {/* Search Drawer */}
      <Drawer
        anchor="top"
        open={searchOpen}
        onClose={handleSearchClose}
        ModalProps={{
          BackdropProps: {
            sx: {
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              top: "162px", // navbar + 검색창 높이 아래에서만 dim 시작
              pointerEvents: "auto",
            },
          },
        }}
        sx={{
          zIndex: 1099, // AppBar(1100)보다 낮게
          "& .MuiDrawer-paper": {
            top: "90px", // navbar 아래에서 시작
            maxHeight: "calc(100vh - 90px)",
            boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
            transition: "transform 225ms cubic-bezier(0, 0, 0.2, 1) !important",
          },
          "& .MuiBackdrop-root": {
            top: "162px", // navbar + 검색창 높이 아래에서만 dim 시작
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            gap: 2,
            maxWidth: "1200px",
            mx: "auto",
            width: "100%",
            backgroundColor: "#fff",
            "& *": {
              transition: "none !important",
              animation: "none !important",
            },
          }}
        >
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, display: "flex", gap: 0, alignItems: "stretch", width: "100%" }}>
            <TextField
              autoFocus
              fullWidth
              placeholder="SEARCH FOR..."
              variant="outlined"
              size="small"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                flex: 1,
                "& .MuiOutlinedInput-root": {
                  borderRadius: 0,
                  borderTopLeftRadius: "4px",
                  borderBottomLeftRadius: "4px",
                  borderTopRightRadius: 0,
                  borderBottomRightRadius: 0,
                  transition: "none !important",
                },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              sx={{
                backgroundColor: "#000",
                color: "#fff",
                borderRadius: 0,
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
                borderTopRightRadius: "4px",
                borderBottomRightRadius: "4px",
                px: 3,
                "&:hover": { backgroundColor: "#333" },
                transition: "none !important",
              }}
            >
              Search
            </Button>
            <IconButton 
              onClick={handleSearchClose}
              sx={{
                borderRadius: 0,
                ml: 0,
                transition: "none !important",
              }}
            >
              <CloseIcon />
            </IconButton>
          </form>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;

