import { useMemo, memo } from "react";
import { Box, Typography } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { PASSWORD_REQUIREMENTS } from "../utils/constants";

const PasswordRequirements = memo(({ password }) => {
  const requirements = useMemo(
    () =>
      PASSWORD_REQUIREMENTS.map((req) => ({
        ...req,
        isValid: req.check(password),
      })),
    [password]
  );

  const allRequirementsMet = useMemo(
    () => requirements.every((req) => req.isValid),
    [requirements]
  );

  return (
    <Box>
      <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
        {allRequirementsMet ? (
          <>
            <CheckCircleIcon sx={{ color: "success.main", fontSize: 20, mr: 1 }} />
            <Typography variant="body2" sx={{ color: "success.main", fontWeight: 500 }}>
              Strong Password
            </Typography>
          </>
        ) : (
          <>
            <CancelIcon sx={{ color: "error.main", fontSize: 20, mr: 1 }} />
            <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
              Password must contain:
            </Typography>
          </>
        )}
      </Box>
      {!allRequirementsMet && (
        <Box sx={{ ml: 4 }}>
          {requirements.map((req, index) => (
            <Box key={index} sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
              {req.isValid ? (
                <CheckCircleIcon sx={{ color: "success.main", fontSize: 16, mr: 1 }} />
              ) : (
                <CancelIcon sx={{ color: "error.main", fontSize: 16, mr: 1 }} />
              )}
              <Typography
                variant="body2"
                sx={{
                  color: req.isValid ? "success.main" : "error.main",
                  fontSize: "0.875rem",
                }}
              >
                {req.label}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
});

PasswordRequirements.displayName = "PasswordRequirements";

export default PasswordRequirements;

