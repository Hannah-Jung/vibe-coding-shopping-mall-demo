import { useState, useCallback, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
} from "@mui/material";
import PasswordField from "../components/PasswordField";
import ErrorMessage from "../components/ErrorMessage";
import LoadingScreen from "../components/LoadingScreen";
import { useAuthCheck } from "../hooks/useAuthCheck";
import { loginUser, getFavorites } from "../utils/api";
import { handleError } from "../utils/errorHandler";
import { isValidEmailFormat } from "../utils/validation";
import { normalizeEmail, trimPassword } from "../utils/format";
import { storage } from "../utils/localStorage";
import { commonButtonStyles, fullHeightContainerStyles, paperStyles, ERROR_MESSAGES } from "../utils/constants";

const Login = () => {
  const navigate = useNavigate();
  const emailInputRef = useRef(null);
  const passwordInputRef = useRef(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const checkingAuth = useAuthCheck();

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    if (name === "email") {
      const trimmed = value.trim();
      if (trimmed) {
        if (trimmed.includes("@@")) {
          setEmailError("Email cannot contain consecutive @ symbols.");
        } else if (trimmed.startsWith("@") || trimmed.endsWith("@")) {
          setEmailError("Email format is invalid.");
        } else if (trimmed.includes(" ")) {
          setEmailError("Email cannot contain spaces.");
        } else if (!isValidEmailFormat(trimmed)) {
          setEmailError(ERROR_MESSAGES.EMAIL_INVALID);
        } else {
          setEmailError("");
        }
      } else {
        setEmailError("");
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setError("");
  }, []);

  const handleEmailBlur = useCallback((e) => {
    const normalizedEmail = normalizeEmail(e.target.value);
    setFormData((prev) => ({
      ...prev,
      email: normalizedEmail,
    }));
    if (normalizedEmail && !isValidEmailFormat(normalizedEmail)) {
      setEmailError(ERROR_MESSAGES.EMAIL_INVALID);
    } else {
      setEmailError("");
    }
  }, []);

  const handlePasswordBlur = useCallback((e) => {
    const trimmed = trimPassword(e.target.value);
    setFormData((prev) => ({
      ...prev,
      password: trimmed,
    }));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailError("");
    setLoading(true);

    const trimmedEmail = normalizeEmail(formData.email);
    const trimmedPassword = trimPassword(formData.password);

    if (!trimmedEmail) {
      setError(ERROR_MESSAGES.EMAIL_REQUIRED);
      setEmailError(ERROR_MESSAGES.EMAIL_REQUIRED);
      setLoading(false);
      emailInputRef.current?.focus();
      return;
    }

    if (!trimmedPassword) {
      setError(ERROR_MESSAGES.PASSWORD_REQUIRED);
      setLoading(false);
      passwordInputRef.current?.focus();
      return;
    }

    if (!isValidEmailFormat(trimmedEmail)) {
      setError(ERROR_MESSAGES.EMAIL_INVALID);
      setEmailError(ERROR_MESSAGES.EMAIL_INVALID);
      setLoading(false);
      emailInputRef.current?.focus();
      return;
    }

    try {
      const data = await loginUser(trimmedEmail, trimmedPassword);
      
      if (data.token) {
        storage.setToken(data.token);
        storage.setUser(data.data);
        
        // Fetch favorites from server and sync to localStorage
        try {
          const favoritesData = await getFavorites(data.token);
          if (favoritesData.success && favoritesData.data) {
            // Convert ObjectId strings to strings for localStorage
            const favoriteIds = favoritesData.data.map(id => id.toString());
            storage.setFavorites(favoriteIds);
          }
        } catch (favoritesError) {
          console.error("Error fetching favorites:", favoritesError);
          // Continue with login even if favorites fetch fails
        }
        
        // Dispatch event to update components that depend on auth status
        window.dispatchEvent(new Event("authChanged"));
        window.dispatchEvent(new Event("favoritesUpdated"));
        navigate("/", { replace: true });
      }
    } catch (err) {
      setError(handleError(err));
      console.error("Login error:", err);
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
            LOGIN
          </Typography>
          <Typography
            variant="body1"
            align="center"
            color="text.secondary"
            sx={{ mb: 4 }}
          >
            Enter your email and password to login:
          </Typography>

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              id="email"
              name="email"
              label="E-mail"
              type="email"
              variant="outlined"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              onBlur={handleEmailBlur}
              inputRef={emailInputRef}
              error={!!emailError}
              helperText={emailError}
              sx={{ mb: emailError ? 0.5 : 2 }}
              required
            />
            {emailError && (
              <Box sx={{ mb: 2 }} />
            )}
            <PasswordField
              id="password"
              name="password"
              label="Password"
              value={formData.password}
              onChange={handleChange}
              onBlur={handlePasswordBlur}
              inputRef={passwordInputRef}
              sx={{ mb: 1 }}
            />
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Link
                to="#"
                style={{
                  color: "#666",
                  textDecoration: "none",
                  fontSize: "0.875rem",
                }}
                onClick={(e) => {
                  e.preventDefault();
                  // TODO: Implement forgot password functionality
                }}
              >
                Forgot your password?
              </Link>
            </Box>

            <ErrorMessage error={error} />

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ mb: 2, py: 1.5, ...commonButtonStyles }}
            >
              {loading ? "Logging in..." : "LOGIN"}
            </Button>

            <Typography variant="body2" align="center" color="text.secondary">
              Don't have an account?{" "}
              <Box
                component={Link}
                to="/signup"
                sx={{
                  color: "#000",
                  textDecoration: "none",
                  "&:hover": {
                    textDecoration: "underline",
                    color: "#000",
                  },
                }}
              >
                Sign up
              </Box>
            </Typography>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
