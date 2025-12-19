import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  InputAdornment,
  IconButton,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import PasswordRequirements from "../components/PasswordRequirements";
import PasswordField from "../components/PasswordField";
import ErrorMessage from "../components/ErrorMessage";
import LoadingScreen from "../components/LoadingScreen";
import CountdownModal from "../components/CountdownModal";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { createUser, checkEmailAvailability } from "../utils/api";
import { handleError } from "../utils/errorHandler";
import { isValidEmailFormat, isValidName } from "../utils/validation";
import { normalizeEmail, trimPassword } from "../utils/format";
import {
  PASSWORD_REQUIREMENTS,
  DEBOUNCE_DELAY,
  PASSWORD_WARNING_TIMEOUT,
  SUCCESS_MODAL_COUNTDOWN,
  commonButtonStyles,
  fullHeightContainerStyles,
  paperStyles,
  ERROR_MESSAGES,
} from "../utils/constants";

const SignUp = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    passwordConfirmation: "",
  });
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState(null); // null, "exists", "available"
  const [firstNameError, setFirstNameError] = useState("");
  const [lastNameError, setLastNameError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [countdown, setCountdown] = useState(SUCCESS_MODAL_COUNTDOWN);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordConfirmationFocused, setPasswordConfirmationFocused] = useState(false);
  const [showPasswordConfirmationWarning, setShowPasswordConfirmationWarning] = useState(false);

  const checkingAuth = useAuthCheck();

  // Check if password meets all requirements
  const isPasswordStrong = useMemo(() => {
    const password = formData.password;
    if (!password) return false;
    return PASSWORD_REQUIREMENTS.every((req) => req.check(password));
  }, [formData.password]);

  // Memoized handlers
  const handlePasswordFocus = useCallback(() => {
    setPasswordFocused(true);
  }, []);

  const handlePasswordBlur = useCallback(() => {
    setPasswordFocused(false);
  }, []);

  const handlePasswordConfirmationFocus = useCallback(() => {
    setPasswordConfirmationFocused(true);
    if (!isPasswordStrong) {
      setShowPasswordConfirmationWarning(true);
      setTimeout(() => setShowPasswordConfirmationWarning(false), PASSWORD_WARNING_TIMEOUT);
    }
  }, [isPasswordStrong]);

  const handlePasswordConfirmationBlur = useCallback(() => {
    setPasswordConfirmationFocused(false);
    setShowPasswordConfirmationWarning(false);
  }, []);

  const handleTogglePasswordConfirmationVisibility = useCallback(() => {
    setShowPasswordConfirmation((prev) => !prev);
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === "firstName") {
      setFirstNameError(value && !isValidName(value) ? ERROR_MESSAGES.NAME_INVALID : "");
    } else if (name === "lastName") {
      setLastNameError(value && !isValidName(value) ? ERROR_MESSAGES.NAME_INVALID : "");
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
    if (name === "email") {
      setEmailStatus(null);
    }
  }, []);

  // Check email availability with debounce
  const emailCheckTimeoutRef = useRef(null);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    const email = formData.email.trim();

    if (!email || !isValidEmailFormat(email)) {
      setEmailStatus(null);
      return;
    }

    emailCheckTimeoutRef.current = setTimeout(async () => {
      const exists = await checkEmailAvailability(email);
      if (exists !== null) {
        setEmailStatus(exists ? "exists" : "available");
      }
    }, DEBOUNCE_DELAY);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [formData.email]);

  // Handle countdown and redirect
  useEffect(() => {
    if (showSuccessModal && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (showSuccessModal && countdown === 0) {
      navigate("/login");
    }
  }, [showSuccessModal, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.passwordConfirmation) {
      setError(ERROR_MESSAGES.FILL_ALL_FIELDS);
      setLoading(false);
      return;
    }

    if (!isValidName(formData.firstName)) {
      setFirstNameError(ERROR_MESSAGES.NAME_INVALID);
      setLoading(false);
      return;
    }

    if (!isValidName(formData.lastName)) {
      setLastNameError(ERROR_MESSAGES.NAME_INVALID);
      setLoading(false);
      return;
    }

    const trimmedEmail = normalizeEmail(formData.email);

    if (!isValidEmailFormat(trimmedEmail)) {
      setError(ERROR_MESSAGES.EMAIL_INVALID);
      setLoading(false);
      return;
    }

    const failedRequirement = PASSWORD_REQUIREMENTS.find((req) => !req.check(formData.password));
    if (failedRequirement) {
      setError(`Password ${failedRequirement.label.toLowerCase()}.`);
      setLoading(false);
      return;
    }

    if (formData.password !== formData.passwordConfirmation) {
      setError(ERROR_MESSAGES.PASSWORD_MISMATCH);
      setLoading(false);
      return;
    }

    try {
      const name = `${formData.firstName} ${formData.lastName}`;
      await createUser(trimmedEmail, formData.password, name);
      setShowSuccessModal(true);
      setCountdown(SUCCESS_MODAL_COUNTDOWN);
    } catch (err) {
      setError(handleError(err));
      console.error("Sign up error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return <LoadingScreen message="Checking authentication..." />;
  }

  return (
    <Container maxWidth="sm">
      <Box sx={fullHeightContainerStyles}>
        <Paper sx={paperStyles}>
          <Typography
            variant="h4"
            component="h1"
            align="center"
            gutterBottom
            sx={{ mb: 2, fontWeight: 500 }}
          >
            SIGN UP
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Please fill in the information below:
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              id="first-name"
              name="firstName"
              label="First Name"
              variant="outlined"
              fullWidth
              value={formData.firstName}
              onChange={handleChange}
              error={!!firstNameError}
              sx={{ mb: firstNameError ? 0.5 : 2 }}
              required
            />
            {firstNameError && (
              <Box sx={{ mb: 2, ml: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CancelIcon sx={{ color: "error.main", fontSize: 16, mr: 1 }} />
                  <Typography variant="body2" sx={{ color: "error.main", fontSize: "0.875rem" }}>
                    {firstNameError}
                  </Typography>
                </Box>
              </Box>
            )}
            <TextField
              id="last-name"
              name="lastName"
              label="Last Name"
              variant="outlined"
              fullWidth
              value={formData.lastName}
              onChange={handleChange}
              error={!!lastNameError}
              sx={{ mb: lastNameError ? 0.5 : 2 }}
              required
            />
            {lastNameError && (
              <Box sx={{ mb: 2, ml: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CancelIcon sx={{ color: "error.main", fontSize: 16, mr: 1 }} />
                  <Typography variant="body2" sx={{ color: "error.main", fontSize: "0.875rem" }}>
                    {lastNameError}
                  </Typography>
                </Box>
              </Box>
            )}
            <TextField
              id="email"
              name="email"
              label="E-mail Address"
              type="email"
              variant="outlined"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              error={emailStatus === "exists"}
              sx={{ mb: emailStatus ? 0.5 : 2 }}
              required
            />
            {emailStatus === "exists" && (
              <Box sx={{ mb: 2, ml: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CancelIcon sx={{ color: "error.main", fontSize: 16, mr: 1 }} />
                  <Typography variant="body2" sx={{ color: "error.main", fontSize: "0.875rem" }}>
                    {ERROR_MESSAGES.EMAIL_EXISTS}
                  </Typography>
                </Box>
              </Box>
            )}
            {emailStatus === "available" && (
              <Box sx={{ mb: 2, ml: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <CheckCircleIcon sx={{ color: "success.main", fontSize: 16, mr: 1 }} />
                  <Typography variant="body2" sx={{ color: "success.main", fontSize: "0.875rem" }}>
                    {ERROR_MESSAGES.EMAIL_AVAILABLE}
                  </Typography>
                </Box>
              </Box>
            )}
            <PasswordField
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              onFocus={handlePasswordFocus}
              onBlur={handlePasswordBlur}
              sx={{ mb: passwordFocused ? 0.5 : 2 }}
            />
            {passwordFocused && (
              <Box sx={{ mb: 2, ml: 1 }}>
                <PasswordRequirements password={formData.password} />
              </Box>
            )}
            <TextField
              id="password-confirmation"
              name="passwordConfirmation"
              label="Password Confirmation"
              type={showPasswordConfirmation ? "text" : "password"}
              variant="outlined"
              fullWidth
              value={formData.passwordConfirmation}
              onChange={handleChange}
              onFocus={handlePasswordConfirmationFocus}
              onBlur={handlePasswordConfirmationBlur}
              sx={{ mb: (passwordConfirmationFocused || showPasswordConfirmationWarning) ? 0.5 : 3 }}
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password confirmation visibility"
                      onClick={handleTogglePasswordConfirmationVisibility}
                      edge="end"
                    >
                      {showPasswordConfirmation ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {passwordConfirmationFocused && (
              <>
                {showPasswordConfirmationWarning && !isPasswordStrong && (
                  <Box sx={{ mb: 3, ml: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CancelIcon sx={{ color: "error.main", fontSize: 20, mr: 1 }} />
                      <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>
                        {ERROR_MESSAGES.PASSWORD_WEAK}
                      </Typography>
                    </Box>
                  </Box>
                )}
                {isPasswordStrong && (
              <Box sx={{ mb: 3, ml: 1 }}>
                {formData.password === formData.passwordConfirmation ? (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CheckCircleIcon sx={{ color: "success.main", fontSize: 20, mr: 1 }} />
                    <Typography variant="body2" sx={{ color: "success.main", fontWeight: 500 }}>
                      Passwords match
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <CancelIcon sx={{ color: "error.main", fontSize: 20, mr: 1 }} />
                    <Typography variant="body2" sx={{ color: "error.main", fontWeight: 500 }}>
                      {ERROR_MESSAGES.PASSWORD_MISMATCH}
                    </Typography>
                  </Box>
                )}
              </Box>
                )}
              </>
            )}

            <ErrorMessage error={error} />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 2, py: 1.5, ...commonButtonStyles }}
            >
              {loading ? "Creating..." : "CREATE ACCOUNT"}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Already have an account?{" "}
              <Box
                component={Link}
                to="/login"
                sx={{
                  color: "#000",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                    color: "#000",
                  },
                }}
              >
                Login
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Box>

      <CountdownModal
        open={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate("/login");
        }}
        title="Welcome to FOREVER ByHJ"
        message="Your account has been created successfully!"
        countdown={countdown}
        buttonText="Go to Login"
        redirectMessage="Redirecting to login page in"
        onButtonClick={() => {
          setShowSuccessModal(false);
          navigate("/login");
        }}
      />
    </Container>
  );
};

export default SignUp;

