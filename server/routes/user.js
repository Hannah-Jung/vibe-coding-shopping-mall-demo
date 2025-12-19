const express = require("express");
const router = express.Router();
const {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  checkEmail,
  loginUser,
  getCurrentUser,
  getFavorites,
  addFavorite,
  removeFavorite,
} = require("../controllers/userController");
const { authenticateToken } = require("../middleware/auth");

// LOGIN - User login
router.post("/login", loginUser);

// GET - Get current user from token (protected route)
router.get("/me", authenticateToken, getCurrentUser);

// FAVORITES - Get user favorites (protected route)
router.get("/favorites", authenticateToken, getFavorites);

// FAVORITES - Add favorite (protected route)
router.post("/favorites", authenticateToken, addFavorite);

// FAVORITES - Remove favorite (protected route)
router.delete("/favorites/:productId", authenticateToken, removeFavorite);

// CREATE - Create a new user
router.post("/", createUser);

// CHECK - Check if email exists
router.get("/check-email", checkEmail);

// READ - Get all users
router.get("/", getAllUsers);

// READ - Get a specific user by ID
router.get("/:id", getUserById);

// UPDATE - Update user information
router.put("/:id", updateUser);

// DELETE - Delete a user
router.delete("/:id", deleteUser);

module.exports = router;
