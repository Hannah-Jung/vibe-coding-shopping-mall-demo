import { Container, Box, Typography } from "@mui/material";

/**
 * Reusable loading screen component
 */
const LoadingScreen = ({ message = "Loading..." }) => {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="body1" color="text.secondary">
          {message}
        </Typography>
      </Box>
    </Container>
  );
};

export default LoadingScreen;

