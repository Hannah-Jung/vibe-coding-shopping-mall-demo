const express = require("express");
const router = express.Router();
const {
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
} = require("../controllers/cartController");
const { authenticateToken } = require("../middleware/auth");

// All cart routes require authentication
router.use(authenticateToken);

// GET - Get user's cart
router.get("/", getCart);

// POST - Add item to cart
router.post("/items", addItemToCart);

// PUT - Update item quantity in cart
router.put("/items/:itemId", updateCartItem);

// DELETE - Remove item from cart
router.delete("/items/:itemId", removeItemFromCart);

// DELETE - Clear entire cart
router.delete("/", clearCart);

module.exports = router;
