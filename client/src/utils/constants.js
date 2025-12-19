// API Configuration
// Use environment variable for production, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
export const FETCH_TIMEOUT = 10000; // 10 seconds

// Cloudinary Configuration
// Get from environment variables or use default values
export const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "your-cloud-name";
export const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "your-upload-preset";

// Validation Regex
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SPECIAL_CHAR_REGEX = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
export const NAME_REGEX = /^[a-zA-Z가-힣]+([\s'-][a-zA-Z가-힣]+)*$/;

// Timing Constants
export const DEBOUNCE_DELAY = 500;
export const PASSWORD_WARNING_TIMEOUT = 3000;
export const SUCCESS_MODAL_COUNTDOWN = 3;

// Password Requirements Configuration
export const PASSWORD_REQUIREMENTS = [
  {
    label: "4-10 characters",
    check: (password) => password.length >= 4 && password.length <= 10,
  },
  {
    label: "At least 1 uppercase letter",
    check: (password) => /[A-Z]/.test(password),
  },
  {
    label: "At least 1 lowercase letter",
    check: (password) => /[a-z]/.test(password),
  },
  {
    label: "At least 1 number",
    check: (password) => /[0-9]/.test(password),
  },
  {
    label: "At least 1 special character",
    check: (password) => SPECIAL_CHAR_REGEX.test(password),
  },
];

// Common Styles
export const commonButtonStyles = {
  px: 4,
  py: 1.5,
  backgroundColor: "#000",
  "&:hover": {
    backgroundColor: "#333",
  },
};

// Common Layout Styles
export const fullHeightContainerStyles = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const paperStyles = {
  elevation: 3,
  p: 4,
  width: "100%",
  maxWidth: 500,
};

// Error Messages
export const ERROR_MESSAGES = {
  EMAIL_REQUIRED: "Email is required.",
  PASSWORD_REQUIRED: "Password is required.",
  EMAIL_INVALID: "Please enter a valid email address (e.g., example@domain.com).",
  EMAIL_EXISTS: "This email is already in use.",
  EMAIL_AVAILABLE: "This email is available.",
  NAME_INVALID: "Name must start and end with a letter. No consecutive spaces, hyphens, or apostrophes.",
  PASSWORD_MISMATCH: "Passwords do not match.",
  PASSWORD_WEAK: "Please create your password first.",
  FILL_ALL_FIELDS: "Please fill in all fields.",
  INVALID_CREDENTIALS: "Invalid email or password.",
};

// Success Messages
export const SUCCESS_MESSAGES = {
  SIGNUP_SUCCESS: "Your account has been created successfully!",
  LOGIN_SUCCESS: "Login successful.",
};

