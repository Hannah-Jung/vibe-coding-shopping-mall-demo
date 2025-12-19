import { useState, useEffect } from "react";
import { Fab, Box, Typography } from "@mui/material";
import KeyboardArrowUpOutlinedIcon from "@mui/icons-material/KeyboardArrowUpOutlined";

const ScrollToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.pageYOffset > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);

    return () => {
      window.removeEventListener("scroll", toggleVisibility);
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <Fab
      onClick={scrollToTop}
      size="small"
      sx={{
        position: "fixed",
        bottom: 32,
        right: 32,
        zIndex: 1000,
        backgroundColor: "#000",
        color: "#fff",
        opacity: isVisible ? 0.5 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        pointerEvents: isVisible ? "auto" : "none",
        transition: "opacity 0.3s ease-in-out, transform 0.3s ease-in-out, backgroundColor 0.3s ease-in-out",
        "&:hover": {
          backgroundColor: "#000",
          opacity: 1,
          "& .scroll-icon": {
            opacity: 0,
          },
          "& .scroll-text": {
            opacity: 1,
            color: "#fff",
          },
        },
        "& .MuiSvgIcon-root": {
          fontSize: "1.5rem",
        },
      }}
      aria-label="scroll to top"
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <KeyboardArrowUpOutlinedIcon
          className="scroll-icon"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            transition: "opacity 0.3s ease-in-out",
            fontSize: "1.5rem",
          }}
        />
        <Typography
          className="scroll-text"
          variant="body2"
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0,
            transition: "opacity 0.3s ease-in-out",
            fontWeight: 600,
            fontSize: "0.75rem",
            lineHeight: 1,
            color: "#fff",
          }}
        >
          TOP
        </Typography>
      </Box>
    </Fab>
  );
};

export default ScrollToTop;

