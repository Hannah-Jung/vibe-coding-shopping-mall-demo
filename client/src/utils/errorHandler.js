/**
 * Check if error is token expiration or invalid token
 */
export const isTokenError = (error) => {
  const errorMessage = error?.message || "";
  return (
    errorMessage.includes("Token has expired") ||
    errorMessage.includes("Invalid token") ||
    errorMessage.includes("expired") ||
    errorMessage.includes("Access token is required")
  );
};

/**
 * Handle and format error messages
 */
export const handleError = (err) => {
  if (err.message === "CONNECTION_TIMEOUT") {
    const url = err.url || "server";
    return `Connection timeout. The server at ${url} did not respond within 10 seconds. Please check if the server is running and try again.`;
  }
  
  if (err.message === "NETWORK_ERROR") {
    if (!navigator.onLine) {
      return "NO_INTERNET";
    }
    const url = err.url || "server";
    return `Unable to connect to ${url}. Please check if the server is running on port 5000 and try again.`;
  }
  
  if (err.name === "TypeError" && err.message.includes("fetch")) {
    if (!navigator.onLine) {
      return "NO_INTERNET";
    }
    return "Unable to connect to server. Please check your internet connection and try again.";
  }
  
  if (err.name === "AbortError") {
    return "Request timed out. Please check your internet connection and try again.";
  }
  
  return err.message || "An error occurred. Please try again.";
};

/**
 * Check if error is NO_INTERNET
 */
export const isNoInternetError = (error) => {
  return error === "NO_INTERNET";
};

