import { storage } from "./localStorage";
import { isTokenError } from "./errorHandler";

/**
 * Intercept API responses to handle token expiration globally
 * This can be used as a wrapper for API calls that require authentication
 */
export const handleAuthError = (error, onTokenExpired) => {
  if (isTokenError(error) || error.isTokenError) {
    // Clear authentication data
    storage.clear();
    
    // Call callback if provided (e.g., redirect to login)
    if (onTokenExpired) {
      onTokenExpired();
    }
    
    return true; // Indicates token error was handled
  }
  return false; // Not a token error
};

