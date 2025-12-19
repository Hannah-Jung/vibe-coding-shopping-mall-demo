import { memo } from "react";
import { Box, Typography } from "@mui/material";
import { isNoInternetError } from "../utils/errorHandler";

const ErrorMessage = memo(({ error }) => {
  if (!error) return null;

  return (
    <Box sx={{ mb: 2, textAlign: "center" }}>
      {isNoInternetError(error) ? (
        <>
          <Typography color="error" sx={{ mb: 0.5 }}>
            No internet connection.
          </Typography>
          <Typography color="error">
            Please check your network and try again.
          </Typography>
        </>
      ) : (
        <Typography color="error">{error}</Typography>
      )}
    </Box>
  );
});

ErrorMessage.displayName = "ErrorMessage";

export default ErrorMessage;

