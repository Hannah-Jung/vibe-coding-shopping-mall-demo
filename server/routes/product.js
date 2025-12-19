const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
} = require("../controllers/productController");
const { authenticateToken } = require("../middleware/auth");

// CREATE - Create a new product (requires authentication)
router.post("/", authenticateToken, createProduct);

// READ - Get all products (with optional category filter)
router.get("/", getAllProducts);

// READ - Get a product by SKU
router.get("/sku/:sku", getProductBySku);

// READ - Get a specific product by ID
router.get("/:id", getProductById);

// UPDATE - Update product information (requires authentication)
router.put("/:id", authenticateToken, updateProduct);

// DELETE - Delete a product (requires authentication)
router.delete("/:id", authenticateToken, deleteProduct);

module.exports = router;

