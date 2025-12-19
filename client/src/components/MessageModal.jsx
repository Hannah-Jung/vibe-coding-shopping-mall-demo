import { memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import { commonButtonStyles } from "../utils/constants";

const MessageModal = memo(({
  open,
  onClose,
  type = "success", // "success" or "error"
  title,
  message,
  buttonText = "OK",
  onButtonClick,
}) => {
  const isSuccess = type === "success";
  const Icon = isSuccess ? CheckCircleIcon : ErrorIcon;
  const iconColor = isSuccess ? "success.main" : "error.main";

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogContent sx={{ textAlign: "center", py: 4 }}>
        <Icon sx={{ color: iconColor, fontSize: 60, mb: 2 }} />
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom 
          sx={{ 
            fontWeight: 600,
            mb: 2,
            color: isSuccess ? "success.main" : "error.main",
          }}
        >
          {title}
        </Typography>
        {message && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {message}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button 
          variant="contained" 
          onClick={onButtonClick || onClose} 
          sx={{
            ...commonButtonStyles,
            backgroundColor: isSuccess ? "#000" : "#d32f2f",
            "&:hover": {
              backgroundColor: isSuccess ? "#333" : "#b71c1c",
            },
          }}
        >
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

MessageModal.displayName = "MessageModal";

export default MessageModal;

