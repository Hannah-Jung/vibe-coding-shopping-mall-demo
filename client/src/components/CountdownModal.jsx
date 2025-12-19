import { useEffect, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Typography,
  Button,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { commonButtonStyles } from "../utils/constants";

const CountdownModal = memo(({
  open,
  onClose,
  title,
  message,
  userName,
  countdown,
  buttonText = "Go to Home",
  redirectMessage = "Redirecting to home page in",
  onButtonClick,
}) => {
  useEffect(() => {
    if (open && countdown === 0 && onClose) {
      onClose();
    }
  }, [open, countdown, onClose]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogContent sx={{ textAlign: "center", py: 4 }}>
        <CheckCircleIcon sx={{ color: "success.main", fontSize: 60, mb: 2 }} />
        <Typography 
          variant="h4" 
          component="h2" 
          gutterBottom 
          sx={{ 
            fontWeight: 900,
            mb: 2,
            fontFamily: '"Work Sans", sans-serif',
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
          }}
        >
          {title}
        </Typography>
        {userName && (
          <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
            {message || `Welcome${userName ? `, ${userName}` : ""}!`}
          </Typography>
        )}
        {countdown !== undefined && (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {redirectMessage}
            </Typography>
            <Typography variant="h2" color="primary" sx={{ fontWeight: 700, mb: 1 }}>
              {countdown}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button variant="contained" onClick={onButtonClick || onClose} sx={commonButtonStyles}>
          {buttonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
});

CountdownModal.displayName = "CountdownModal";

export default CountdownModal;

