import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser } from "../utils/api";
import { isTokenError } from "../utils/errorHandler";
import { storage } from "../utils/localStorage";

/**
 * Custom hook to check if user is already authenticated
 * Redirects to home if authenticated, otherwise allows access to the page
 */
export const useAuthCheck = (redirectIfAuthenticated = true) => {
  const navigate = useNavigate();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      const token = storage.getToken();

      if (token) {
        try {
          const response = await getCurrentUser(token);
          if (response.success && response.data) {
            // User is already authenticated
            if (redirectIfAuthenticated) {
              navigate("/", { replace: true });
              return;
            }
          }
        } catch (error) {
          // Token is invalid or expired, clear storage
          console.error("Token validation failed:", error);
          if (isTokenError(error) || error.isTokenError) {
            storage.clear();
          }
        }
      }
      setCheckingAuth(false);
    };

    checkAuthentication();
  }, [navigate, redirectIfAuthenticated]);

  return checkingAuth;
};

