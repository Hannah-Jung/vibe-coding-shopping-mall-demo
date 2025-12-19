import { API_BASE_URL, FETCH_TIMEOUT } from "./constants";

/**
 * Generic fetch function with timeout and error handling (optimized)
 */
export const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, FETCH_TIMEOUT);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (fetchErr) {
    clearTimeout(timeoutId);
    if (fetchErr.name === "AbortError") {
      const error = new Error("CONNECTION_TIMEOUT");
      error.url = url;
      throw error;
    }
    // Handle network errors
    if (fetchErr.message && fetchErr.message.includes("Failed to fetch")) {
      const error = new Error("NETWORK_ERROR");
      error.url = url;
      error.originalError = fetchErr;
      throw error;
    }
    throw fetchErr;
  }
};

/**
 * Parse JSON response or throw error
 */
export const parseJSONResponse = async (response) => {
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return await response.json();
  }
  const text = await response.text();
  throw new Error(text || "Server returned non-JSON response");
};

/**
 * Check network connectivity
 */
export const checkNetworkConnectivity = () => {
  if (!navigator.onLine) {
    throw new Error("NO_INTERNET");
  }
};

/**
 * API: Login user
 */
export const loginUser = async (email, password) => {
  checkNetworkConnectivity();

  const trimmedEmail = email.trim().toLowerCase();
  const response = await fetchWithTimeout(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: trimmedEmail,
      password,
    }),
  });

  const data = await parseJSONResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Login failed. Please check your credentials and try again."
    );
  }

  return data;
};

/**
 * API: Create user (sign up)
 */
export const createUser = async (email, password, name) => {
  checkNetworkConnectivity();

  const trimmedEmail = email.trim().toLowerCase();
  const response = await fetchWithTimeout(`${API_BASE_URL}/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: trimmedEmail,
      password,
      name: name.trim(),
    }),
  });

  const data = await parseJSONResponse(response);

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to create account. Please try again."
    );
  }

  return data;
};

/**
 * API: Get current user from token
 */
export const getCurrentUser = async (token) => {
  checkNetworkConnectivity();

  const response = await fetchWithTimeout(`${API_BASE_URL}/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await parseJSONResponse(response);

  if (!response.ok) {
    // Check for token expiration or invalid token
    const error = new Error(
      data.message || "Failed to fetch user information."
    );
    error.status = response.status;
    error.isTokenError =
      response.status === 401 &&
      (data.message?.includes("expired") ||
        data.message?.includes("Invalid token") ||
        data.message?.includes("Access token is required"));
    throw error;
  }

  return data;
};

/**
 * API: Check email availability
 */
export const checkEmailAvailability = async (email) => {
  checkNetworkConnectivity();

  try {
    const trimmedEmail = email.trim().toLowerCase();
    const response = await fetchWithTimeout(
      `${API_BASE_URL}/users/check-email?email=${encodeURIComponent(
        trimmedEmail
      )}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await parseJSONResponse(response);
      return data.exists;
    }
    return null;
  } catch (err) {
    // Silently fail for email check to avoid disrupting user experience
    if (err.name === "AbortError" || err.message === "NO_INTERNET") {
      return null;
    }
    console.error("Error checking email:", err);
    return null;
  }
};

/**
 * API: Get user favorites
 */
export const getFavorites = async (token) => {
  checkNetworkConnectivity();

  const response = await fetchWithTimeout(`${API_BASE_URL}/users/favorites`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  const data = await parseJSONResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch favorites.");
  }

  return data;
};

/**
 * API: Add favorite
 */
export const addFavorite = async (token, productId) => {
  checkNetworkConnectivity();

  const response = await fetchWithTimeout(`${API_BASE_URL}/users/favorites`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ productId }),
  });

  const data = await parseJSONResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to add favorite.");
  }

  return data;
};

/**
 * API: Remove favorite
 */
export const removeFavorite = async (token, productId) => {
  checkNetworkConnectivity();

  const response = await fetchWithTimeout(
    `${API_BASE_URL}/users/favorites/${productId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  const data = await parseJSONResponse(response);

  if (!response.ok) {
    throw new Error(data.message || "Failed to remove favorite.");
  }

  return data;
};
