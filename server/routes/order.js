const express = require("express");
const router = express.Router();
const {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByOrderNumber,
  getUserOrders,
  updateOrderStatus,
  completePayment,
  cancelOrder,
  processRefund,
} = require("../controllers/orderController");
const { authenticateToken } = require("../middleware/auth");

// All order routes require authentication
router.use(authenticateToken);

// CREATE - Create a new order from cart
router.post("/", createOrder);

// READ - Get all orders (admin sees all, user sees own)
router.get("/", getAllOrders);

// READ - Get user's orders
router.get("/my-orders", getUserOrders);

// READ - Get order by order number
router.get("/number/:orderNumber", getOrderByOrderNumber);

// READ - Get a specific order by ID
router.get("/:id", getOrderById);

// UPDATE - Update order status (admin only)
router.put("/:id/status", updateOrderStatus);

// UPDATE - Complete payment
router.put("/:id/payment", completePayment);

// UPDATE - Cancel order
router.put("/:id/cancel", cancelOrder);

// UPDATE - Process refund (admin only)
router.put("/:id/refund", processRefund);

module.exports = router;

