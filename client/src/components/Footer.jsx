import { Box, Typography, Link, Grid } from "@mui/material";
import FacebookIcon from "@mui/icons-material/Facebook";
import XIcon from "@mui/icons-material/X";
import InstagramIcon from "@mui/icons-material/Instagram";
import PinterestIcon from "@mui/icons-material/Pinterest";
import YouTubeIcon from "@mui/icons-material/YouTube";

const Footer = () => {
  return (
    <Box
      sx={{
        backgroundColor: "#fff",
        borderTop: "1px solid #e0e0e0",
        py: 6,
        px: { xs: 2, md: 4 },
      }}
    >
      <Grid container spacing={{ xs: 3, md: 4 }} sx={{ maxWidth: "1200px", mx: "auto" }}>
        {/* HELP + INFO */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              textTransform: "uppercase",
            }}
          >
            HELP + INFO
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.75, sm: 1 } }}>
            {[
              "My Account",
              "Returns & Orders",
              "Store Locator",
              "Contact Us",
              "Size Guide",
            ].map((item) => (
              <Link
                key={item}
                href="#"
                sx={{
                  color: "#666",
                  textDecoration: "none",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  position: "relative",
                  display: "inline-block",
                  width: "fit-content",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 0,
                    height: "1px",
                    backgroundColor: "#666",
                    transition: "width 0.3s ease",
                  },
                  "&:hover::after": {
                    width: "100%",
                  },
                }}
              >
                {item}
              </Link>
            ))}
          </Box>
        </Grid>

        {/* QUICK LINKS */}
        <Grid item xs={12} sm={6} md={4}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              textTransform: "uppercase",
            }}
          >
            QUICK LINKS
          </Typography>
          <Box sx={{ display: "flex", flexDirection: "column", gap: { xs: 0.75, sm: 1 } }}>
            {[
              "International Customers",
              "F BYHJ Red",
              "Shopping Policies",
              "Privacy Policy",
              "Terms of Use",
            ].map((item) => (
              <Link
                key={item}
                href="#"
                sx={{
                  color: "#666",
                  textDecoration: "none",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  position: "relative",
                  display: "inline-block",
                  width: "fit-content",
                  "&::after": {
                    content: '""',
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    width: 0,
                    height: "1px",
                    backgroundColor: "#666",
                    transition: "width 0.3s ease",
                  },
                  "&:hover::after": {
                    width: "100%",
                  },
                }}
              >
                {item}
              </Link>
            ))}
          </Box>
        </Grid>

        {/* FOREVER 21 APP */}
        <Grid item xs={12} md={4}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
              textTransform: "uppercase",
            }}
          >
            FOREVER BYHJ APP
          </Typography>
          <Typography
            variant="body2"
            sx={{
              color: "#666",
              mb: { xs: 1.5, md: 2 },
              fontSize: { xs: "0.75rem", sm: "0.875rem" },
            }}
          >
            Download the Forever BYHJ App
          </Typography>
          <Box
            sx={{
              display: "flex",
              gap: { xs: 1.5, sm: 2 },
              mb: { xs: 2, md: 3 },
              flexWrap: "wrap",
            }}
          >
            <Box
              sx={{
                width: { xs: 100, sm: 120 },
                height: { xs: 36, sm: 40 },
                backgroundColor: "#000",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                cursor: "pointer",
              }}
            >
              App Store
            </Box>
            <Box
              sx={{
                width: { xs: 100, sm: 120 },
                height: { xs: 36, sm: 40 },
                backgroundColor: "#000",
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#fff",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                cursor: "pointer",
              }}
            >
              Google Play
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Social Media Icons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: { xs: 1.5, sm: 2 },
          mt: { xs: 3, md: 4 },
          mb: { xs: 2, md: 3 },
        }}
      >
        <Box
          component="a"
          href="https://www.facebook.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
          }}
        >
          <FacebookIcon
            sx={{
              color: "#666",
              cursor: "pointer",
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              width: { xs: "1.5rem", sm: "1.75rem" },
              height: { xs: "1.5rem", sm: "1.75rem" },
              transition: "color 0.2s ease",
              "&:hover": {
                color: "#1877f2",
              },
            }}
          />
        </Box>
        <Box
          component="a"
          href="https://www.x.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
          }}
        >
          <XIcon
            sx={{
              color: "#666",
              cursor: "pointer",
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              width: { xs: "1.5rem", sm: "1.75rem" },
              height: { xs: "1.5rem", sm: "1.75rem" },
              transition: "color 0.2s ease",
              "&:hover": {
                color: "#000",
              },
            }}
          />
        </Box>
        <Box
          component="a"
          href="https://www.instagram.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
          }}
        >
          <InstagramIcon
            sx={{
              color: "#666",
              cursor: "pointer",
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              width: { xs: "1.5rem", sm: "1.75rem" },
              height: { xs: "1.5rem", sm: "1.75rem" },
              transition: "color 0.2s ease",
              "&:hover": {
                color: "#e4405f",
              },
            }}
          />
        </Box>
        <Box
          component="a"
          href="https://www.pinterest.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
          }}
        >
          <PinterestIcon
            sx={{
              color: "#666",
              cursor: "pointer",
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              width: { xs: "1.5rem", sm: "1.75rem" },
              height: { xs: "1.5rem", sm: "1.75rem" },
              transition: "color 0.2s ease",
              "&:hover": {
                color: "#bd081c",
              },
            }}
          />
        </Box>
        <Box
          component="a"
          href="https://www.youtube.com"
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "inline-flex",
            textDecoration: "none",
          }}
        >
          <YouTubeIcon
            sx={{
              color: "#666",
              cursor: "pointer",
              fontSize: { xs: "1.5rem", sm: "1.75rem" },
              width: { xs: "1.5rem", sm: "1.75rem" },
              height: { xs: "1.5rem", sm: "1.75rem" },
              transition: "color 0.2s ease",
              "&:hover": {
                color: "#ff0000",
              },
            }}
          />
        </Box>
      </Box>

      {/* Payment Methods */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          gap: { xs: 1, sm: 2 },
          mb: { xs: 2, md: 3 },
          flexWrap: "wrap",
          px: { xs: 1, sm: 0 },
        }}
      >
        {[
          { name: "Visa", url: "https://www.visa.com" },
          { name: "Mastercard", url: "https://www.mastercard.com" },
          { name: "Amex", url: "https://www.americanexpress.com" },
          { name: "Discover", url: "https://www.discover.com" },
          { name: "PayPal", url: "https://www.paypal.com" },
          { name: "Afterpay", url: "https://www.afterpay.com" },
          { name: "Klarna", url: "https://www.klarna.com" },
        ].map((method) => (
          <Box
            key={method.name}
            component="a"
            href={method.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.preventDefault();
              window.open(method.url, "_blank", "noopener,noreferrer");
            }}
            sx={{
              px: { xs: 1.5, sm: 2 },
              py: { xs: 0.25, sm: 0.5 },
              border: "1px solid #e0e0e0",
              borderRadius: 1,
              fontSize: { xs: "0.65rem", sm: "0.75rem" },
              color: "#666",
              cursor: "pointer",
              textDecoration: "none",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#000",
                color: "#000",
                backgroundColor: "#f5f5f5",
                transform: "translateY(-2px)",
                boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
              },
            }}
          >
            {method.name}
          </Box>
        ))}
      </Box>

      {/* Copyright */}
      <Typography
        variant="body2"
        sx={{
          textAlign: "center",
          color: "#999",
          fontSize: { xs: "0.65rem", sm: "0.75rem" },
          px: { xs: 1, sm: 0 },
        }}
      >
        © 2025 FOREVER BYHJ. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;

