/**
 * LocalStorage utility functions
 */

export const storage = {
  setToken: (token) => {
    localStorage.setItem("token", token);
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  setUser: (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
  },

  getUser: () => {
    const userData = localStorage.getItem("user");
    if (!userData) return null;

    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error("Error parsing user data:", error);
      storage.clear();
      return null;
    }
  },

  clear: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  isAuthenticated: () => {
    return !!storage.getToken() && !!storage.getUser();
  },

  // Get favorites for current user
  getFavorites: () => {
    const user = storage.getUser();
    if (!user || !user._id) {
      // If not logged in, use default favorites key
      return JSON.parse(localStorage.getItem("favorites") || "[]");
    }
    const favoritesKey = `favorites_${user._id}`;
    return JSON.parse(localStorage.getItem(favoritesKey) || "[]");
  },

  // Set favorites for current user
  setFavorites: (favorites) => {
    const user = storage.getUser();
    if (!user || !user._id) {
      // If not logged in, use default favorites key
      localStorage.setItem("favorites", JSON.stringify(favorites));
      return;
    }
    const favoritesKey = `favorites_${user._id}`;
    localStorage.setItem(favoritesKey, JSON.stringify(favorites));
  },
};
