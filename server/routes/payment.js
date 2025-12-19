const express = require("express");
const router = express.Router();
const {
  createCheckoutSession,
  createPaymentIntent,
  confirmPayment,
  getCheckoutSession,
} = require("../controllers/paymentController");
const { authenticateToken } = require("../middleware/auth");

// All payment routes require authentication
router.use(authenticateToken);

// Create Checkout Session
router.post("/create-checkout-session", createCheckoutSession);

// Create Payment Intent
router.post("/create-payment-intent", createPaymentIntent);

// Confirm Payment
router.post("/confirm", confirmPayment);

// Get Checkout Session
router.get("/session/:sessionId", authenticateToken, getCheckoutSession);

module.exports = router;

