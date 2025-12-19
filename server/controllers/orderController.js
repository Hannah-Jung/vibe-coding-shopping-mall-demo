const mongoose = require("mongoose");
const Order = require("../models/order");
const Cart = require("../models/cart");
const Product = require("../models/product");
const User = require("../models/user");

// Initialize Stripe for payment verification
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeSecretKey ? require("stripe")(stripeSecretKey) : null;

// CREATE - Create a new order from cart
const createOrder = async (req, res) => {
  try {
    console.log("[DEBUG] Creating order...");
    console.log("[DEBUG] Request body:", JSON.stringify(req.body, null, 2));

    const userId = req.userId;
    const {
      shippingInfo,
      paymentMethod,
      shippingFee = 0,
      discountAmount = 0,
      shippingMethod = "free",
      paymentInfo,
      orderItemsFromMetadata,
    } = req.body;

    console.log("[DEBUG] User ID:", userId);
    console.log("[DEBUG] Shipping info:", shippingInfo);
    console.log("[DEBUG] Payment method:", paymentMethod);
    console.log("[DEBUG] Payment info:", paymentInfo);

    // ========== 1. DUPLICATE ORDER CHECK ==========
    // Check if order with this sessionId already exists (prevent duplicate orders)
    if (paymentInfo?.sessionId) {
      const existingOrder = await Order.findOne({
        "paymentInfo.sessionId": paymentInfo.sessionId,
      });

      if (existingOrder) {
        console.log(
          "[DEBUG] Order with this sessionId already exists:",
          existingOrder._id
        );
        return res.status(200).json({
          success: true,
          message: "Order already exists for this payment session.",
          data: existingOrder,
        });
      }
    }

    // Additional duplicate check: Check for recent orders with same user, similar amount, and same items
    // This prevents accidental duplicate submissions within a short time window
    const recentOrderWindow = 5 * 60 * 1000; // 5 minutes in milliseconds
    const recentOrders = await Order.find({
      user: userId,
      createdAt: { $gte: new Date(Date.now() - recentOrderWindow) },
      status: { $in: ["pending", "processing", "shipping"] },
    })
      .sort({ createdAt: -1 })
      .limit(5);

    if (recentOrders.length > 0) {
      console.log("[DEBUG] Found recent orders, checking for duplicates...");
      // This will be checked after we calculate the total amount
    }

    // ========== 2. PAYMENT VERIFICATION ==========
    // Verify payment if paymentInfo contains sessionId (Stripe checkout)
    if (paymentInfo?.sessionId && stripe) {
      try {
        console.log(
          "[DEBUG] Verifying payment with Stripe session:",
          paymentInfo.sessionId
        );

        // Retrieve Stripe checkout session
        const stripeSession = await stripe.checkout.sessions.retrieve(
          paymentInfo.sessionId
        );

        console.log(
          "[DEBUG] Stripe session payment status:",
          stripeSession.payment_status
        );
        console.log(
          "[DEBUG] Stripe session amount:",
          stripeSession.amount_total
        );

        // Verify payment status
        if (stripeSession.payment_status !== "paid") {
          console.error(
            "[DEBUG] Payment not completed. Status:",
            stripeSession.payment_status
          );
          return res.status(400).json({
            success: false,
            message:
              "Payment verification failed. Payment has not been completed.",
            error: "PAYMENT_NOT_COMPLETED",
            paymentStatus: stripeSession.payment_status,
          });
        }

        // Verify session metadata matches request
        const sessionUserId = stripeSession.metadata?.userId;
        if (sessionUserId && sessionUserId !== userId.toString()) {
          console.error(
            "[DEBUG] User ID mismatch. Session user:",
            sessionUserId,
            "Request user:",
            userId
          );
          return res.status(403).json({
            success: false,
            message: "Payment verification failed. User ID mismatch.",
            error: "USER_ID_MISMATCH",
          });
        }

        // Store verified payment info
        paymentInfo.paymentIntentId = stripeSession.payment_intent;
        paymentInfo.amount = stripeSession.amount_total / 100; // Convert from cents
        paymentInfo.currency = stripeSession.currency;
        paymentInfo.paymentStatus = stripeSession.payment_status;

        console.log("[DEBUG] Payment verified successfully");
      } catch (stripeError) {
        console.error("[DEBUG] Stripe verification error:", stripeError);
        return res.status(400).json({
          success: false,
          message: "Payment verification failed. Invalid payment session.",
          error: stripeError.message || "STRIPE_VERIFICATION_FAILED",
        });
      }
    } else if (paymentInfo?.sessionId && !stripe) {
      console.warn(
        "[DEBUG] Stripe not configured, skipping payment verification"
      );
    }

    // Validate required fields
    if (!shippingInfo || !paymentMethod) {
      console.error("[DEBUG] Missing required fields");
      return res.status(400).json({
        success: false,
        message: "shippingInfo and paymentMethod are required fields.",
      });
    }

    // Validate shipping info
    if (!shippingInfo.recipientName || !shippingInfo.address) {
      return res.status(400).json({
        success: false,
        message: "recipientName and address are required in shippingInfo.",
      });
    }

    // Phone is optional, use default if not provided
    if (
      !shippingInfo.recipientPhone ||
      shippingInfo.recipientPhone.trim() === ""
    ) {
      shippingInfo.recipientPhone = "0000000000";
    }

    // Validate payment method
    const validPaymentMethods = [
      "card",
      "bank_transfer",
      "virtual_account",
      "mobile",
      "cash",
    ];
    if (!validPaymentMethods.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // Get user's cart
    console.log("[DEBUG] Fetching cart for user:", userId);
    const cart = await Cart.findOne({ user: userId }).populate("items.product");

    console.log("[DEBUG] Cart found:", !!cart);
    if (cart) {
      console.log("[DEBUG] Cart items count:", cart.items?.length || 0);
      console.log(
        "[DEBUG] Cart items:",
        cart.items?.map((item) => ({
          productId: item.product?._id,
          quantity: item.quantity,
          price: item.price,
        }))
      );
    }

    // Build order items - use cart if available, otherwise use metadata
    let orderItems = [];

    if (cart && cart.items && cart.items.length > 0) {
      // Use cart items
      console.log("[DEBUG] Using cart items");
      orderItems = cart.items.map((item) => {
        const product = item.product;
        return {
          product: product._id,
          productName: product.name,
          productSku: product.sku,
          productImage: product.image || "",
          quantity: item.quantity,
          price: item.price,
          subtotal: item.price * item.quantity,
          color: item.color || undefined,
          size: item.size || undefined,
        };
      });
    } else if (orderItemsFromMetadata && orderItemsFromMetadata.length > 0) {
      // Use order items from metadata (fallback when cart is empty)
      console.log("[DEBUG] Using order items from metadata");
      const Product = require("../models/product");

      orderItems = await Promise.all(
        orderItemsFromMetadata.map(async (item) => {
          // Fetch product to get full details
          const product = await Product.findById(item.productId);
          if (!product) {
            console.warn(`[DEBUG] Product not found: ${item.productId}`);
            // Use metadata values as fallback
            return {
              product: item.productId,
              productName: item.productName || "Product",
              productSku: item.productSku || "",
              productImage: item.productImage || "",
              quantity: item.quantity,
              price: item.price,
              subtotal: item.price * item.quantity,
              color: item.color || undefined,
              size: item.size || undefined,
            };
          }
          return {
            product: product._id,
            productName: product.name,
            productSku: product.sku,
            productImage: product.image || "",
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
            color: item.color || undefined,
            size: item.size || undefined,
          };
        })
      );
    } else {
      console.error("[DEBUG] No cart items and no metadata items");
      return res.status(400).json({
        success: false,
        message: "Cart is empty and no order items found. Cannot create order.",
      });
    }

    console.log("[DEBUG] Order items prepared:", orderItems.length);

    // Calculate totals
    const itemsTotal = orderItems.reduce((sum, item) => sum + item.subtotal, 0);
    const totalAmount =
      Math.round((itemsTotal + shippingFee - discountAmount) * 100) / 100;

    // ========== 3. VERIFY PAYMENT AMOUNT ==========
    // Verify that payment amount matches calculated order total (if payment was verified)
    if (paymentInfo?.amount && paymentInfo.paymentStatus === "paid") {
      const paymentAmount = paymentInfo.amount;
      const amountDifference = Math.abs(paymentAmount - totalAmount);
      const tolerance = 0.01; // Allow 1 cent difference due to rounding

      if (amountDifference > tolerance) {
        console.error(
          "[DEBUG] Amount mismatch. Payment:",
          paymentAmount,
          "Order:",
          totalAmount
        );
        return res.status(400).json({
          success: false,
          message:
            "Payment verification failed. Payment amount does not match order total.",
          error: "AMOUNT_MISMATCH",
          paymentAmount: paymentAmount,
          orderAmount: totalAmount,
          difference: amountDifference,
        });
      }
      console.log(
        "[DEBUG] Payment amount verified:",
        paymentAmount,
        "matches order total:",
        totalAmount
      );
    }

    // ========== 4. ADDITIONAL DUPLICATE CHECK WITH CALCULATED AMOUNT ==========
    // Now that we have the total amount, check for duplicate orders with same amount
    if (recentOrders && recentOrders.length > 0) {
      const duplicateOrder = recentOrders.find((order) => {
        const orderAmount = order.totalAmount || 0;
        const amountDifference = Math.abs(orderAmount - totalAmount);
        return amountDifference < 0.01; // Same amount (within 1 cent)
      });

      if (duplicateOrder) {
        console.log(
          "[DEBUG] Potential duplicate order found:",
          duplicateOrder._id
        );
        // Check if items are similar (same number of items)
        const duplicateItemCount = duplicateOrder.items?.length || 0;
        if (duplicateItemCount === orderItems.length) {
          console.warn(
            "[DEBUG] Duplicate order detected with same amount and item count"
          );
          // Still allow if it's been more than 1 minute since last order
          const timeDifference =
            Date.now() - new Date(duplicateOrder.createdAt).getTime();
          if (timeDifference < 60000) {
            // Less than 1 minute
            return res.status(409).json({
              success: false,
              message:
                "A similar order was recently created. Please wait before creating another order.",
              error: "DUPLICATE_ORDER_DETECTED",
              existingOrderId: duplicateOrder._id,
            });
          }
        }
      }
    }

    // Create order
    console.log("[DEBUG] Creating new Order instance...");
    const order = new Order({
      user: userId,
      items: orderItems,
      shippingInfo,
      paymentMethod,
      shippingFee,
      shippingMethod,
      discountAmount,
      itemsTotal,
      totalAmount,
      status: "pending",
      // If paymentInfo is provided and payment is already completed (e.g., from Stripe), set paymentStatus to completed
      paymentStatus:
        paymentInfo?.paymentStatus === "paid" ? "completed" : "pending",
      // orderNumber will be auto-generated in pre-save hook
    });

    // Store payment info if provided
    if (paymentInfo) {
      console.log("[DEBUG] Storing payment info:", paymentInfo);
      order.paymentInfo = paymentInfo;
    }

    console.log("[DEBUG] Order instance created, isNew:", order.isNew);
    console.log("[DEBUG] Order number before save:", order.orderNumber);
    console.log("[DEBUG] Saving order...");
    const savedOrder = await order.save();
    console.log("[DEBUG] Order saved, orderNumber:", savedOrder.orderNumber);
    console.log("[DEBUG] Order saved with ID:", savedOrder._id);

    await savedOrder.populate("user", "name email");
    await savedOrder.populate("items.product");
    console.log("[DEBUG] Order populated successfully");

    // Clear cart after order creation (only if cart exists and has items)
    if (cart && cart.items && cart.items.length > 0) {
      console.log("[DEBUG] Clearing cart");
      cart.items = [];
      cart.totalItems = 0;
      cart.totalAmount = 0;
      await cart.save();
      console.log("[DEBUG] Cart cleared");
    } else {
      console.log(
        "[DEBUG] Cart was already empty or doesn't exist, skipping clear"
      );
    }

    res.status(201).json({
      success: true,
      message: "Order created successfully.",
      data: savedOrder,
    });
  } catch (error) {
    console.error("[DEBUG] Error creating order:");
    console.error("[DEBUG] Error message:", error.message);
    console.error("[DEBUG] Error stack:", error.stack);
    console.error("[DEBUG] Full error:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while creating order.",
      error: error.message,
    });
  }
};

// READ - Get all orders (admin only or user's own orders)
const getAllOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, paymentStatus, page, limit } = req.query;

    // Check if user is admin (optimized - use req.user if available)
    const user = req.user || (await User.findById(userId).select("user_type"));
    const isAdmin = user && user.user_type === "admin";

    // Build query
    const query = {};
    if (!isAdmin) {
      // Non-admin users can only see their own orders
      query.user = userId;
    }
    if (status) {
      query.status = status;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Pagination settings
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Get total count
    const totalOrders = await Order.countDocuments(query);

    // Get paginated orders
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Calculate pagination info
    const totalPages = Math.ceil(totalOrders / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      page: pageNumber,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching orders.",
      error: error.message,
    });
  }
};

// READ - Get order by ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format.",
      });
    }

    const order = await Order.findById(id)
      .populate("user", "name email")
      .populate("items.product");

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check if user is admin or order owner (optimized - use req.user if available)
    const user = req.user || (await User.findById(userId).select("user_type"));
    const isAdmin = user && user.user_type === "admin";

    if (!isAdmin && order.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders.",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching order.",
      error: error.message,
    });
  }
};

// READ - Get order by order number
const getOrderByOrderNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const userId = req.userId;

    if (!orderNumber) {
      return res.status(400).json({
        success: false,
        message: "Order number is required.",
      });
    }

    const order = await Order.findByOrderNumber(orderNumber);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check if user is admin or order owner (optimized - use req.user if available)
    const user = req.user || (await User.findById(userId).select("user_type"));
    const isAdmin = user && user.user_type === "admin";

    if (!isAdmin && order.user._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only view your own orders.",
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    console.error("Error fetching order by order number:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching order.",
      error: error.message,
    });
  }
};

// READ - Get user's orders
const getUserOrders = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, page, limit } = req.query;

    // Build query
    const query = { user: userId };
    if (status) {
      query.status = status;
    }

    // Pagination settings
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 10;
    const skip = (pageNumber - 1) * pageSize;

    // Get total count
    const totalOrders = await Order.countDocuments(query);

    // Get paginated orders
    const orders = await Order.find(query)
      .populate("user", "name email")
      .populate("items.product")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Calculate pagination info
    const totalPages = Math.ceil(totalOrders / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      success: true,
      count: orders.length,
      total: totalOrders,
      page: pageNumber,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      data: orders,
    });
  } catch (error) {
    console.error("Error fetching user orders:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching user orders.",
      error: error.message,
    });
  }
};

// UPDATE - Update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber, adminNotes } = req.body;
    const userId = req.userId;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check if user is admin (optimized - use req.user if available)
    const user = req.user || (await User.findById(userId).select("user_type"));
    const isAdmin = user && user.user_type === "admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can update order status.",
      });
    }

    // Update status if provided
    if (status) {
      if (!order.canChangeStatus(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid order status: ${status}.`,
        });
      }

      // Allow all status changes - no restrictions
      order.status = status;
      
      // Set timestamps for specific status changes
      if (status === "shipping" && !order.shippedAt) {
        order.shippedAt = new Date();
      }
      if (status === "delivered" && !order.deliveredAt) {
        order.deliveredAt = new Date();
      }
      if (status === "cancelled" && !order.cancelledAt) {
        order.cancelledAt = new Date();
      }
      if (status === "refunded" && !order.refundedAt) {
        order.refundedAt = new Date();
      }
    }

    // Update tracking number if provided
    if (trackingNumber !== undefined) {
      order.trackingNumber = trackingNumber;
    }

    // Update admin notes if provided
    if (adminNotes !== undefined) {
      order.adminNotes = adminNotes;
    }

    await order.save();
    await order.populate("user", "name email");
    await order.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Order updated successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while updating order.",
      error: error.message,
    });
  }
};

// UPDATE - Complete payment
const completePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentDate } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Complete payment using instance method
    await order.completePayment(
      paymentDate ? new Date(paymentDate) : undefined
    );
    await order.populate("user", "name email");
    await order.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Payment completed successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error completing payment:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error occurred while completing payment.",
      error: error.message,
    });
  }
};

// UPDATE - Cancel order
const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check if user is admin or order owner (optimized - use req.user if available)
    const user = req.user || (await User.findById(userId).select("user_type"));
    const isAdmin = user && user.user_type === "admin";

    if (!isAdmin && order.user.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only cancel your own orders.",
      });
    }

    // Cancel order using instance method
    await order.cancel(reason || "");
    await order.populate("user", "name email");
    await order.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error occurred while cancelling order.",
      error: error.message,
    });
  }
};

// UPDATE - Process refund
const processRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.userId;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID format.",
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    // Check if user is admin (optimized - use req.user if available)
    const user = req.user || (await User.findById(userId).select("user_type"));
    const isAdmin = user && user.user_type === "admin";

    if (!isAdmin) {
      return res.status(403).json({
        success: false,
        message: "Access denied. Only admins can process refunds.",
      });
    }

    // Process refund using instance method
    await order.refund(reason || "");
    await order.populate("user", "name email");
    await order.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Refund processed successfully.",
      data: order,
    });
  } catch (error) {
    console.error("Error processing refund:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Error occurred while processing refund.",
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByOrderNumber,
  getUserOrders,
  updateOrderStatus,
  completePayment,
  cancelOrder,
  processRefund,
};
