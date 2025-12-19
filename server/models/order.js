const mongoose = require("mongoose");

// Order item schema (product information snapshot at order time)
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    productSku: {
      type: String,
      required: true,
      trim: true,
    },
    productImage: {
      type: String,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      validate: {
        validator: Number.isInteger,
        message: "Quantity must be an integer.",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    color: {
      type: String,
      trim: true,
    },
    size: {
      type: String,
      trim: true,
    },
  },
  {
    _id: true,
  }
);

// Auto-calculate order item subtotal
orderItemSchema.pre("validate", function (next) {
  if (this.price && this.quantity) {
    this.subtotal = Math.round(this.price * this.quantity * 100) / 100;
  }
  next();
});

// Shipping information schema
const shippingInfoSchema = new mongoose.Schema(
  {
    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, "Recipient name cannot exceed 50 characters."],
    },
    recipientPhone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[0-9-]+$/, "Invalid phone number format."],
    },
    email: {
      type: String,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters."],
    },
    apartment: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    state: {
      type: String,
      trim: true,
    },
    postalCode: {
      type: String,
      trim: true,
      match: [/^[0-9-]+$/, "Invalid postal code format."],
    },
    deliveryRequest: {
      type: String,
      trim: true,
      default: "",
      maxlength: [200, "Delivery request cannot exceed 200 characters."],
    },
  },
  {
    _id: false,
  }
);

// Order schema
const orderSchema = new mongoose.Schema(
  {
    // Order number (unique identifier)
    orderNumber: {
      type: String,
      required: false, // Will be auto-generated in pre-save hook, validated there
      unique: true,
      index: true,
    },
    // User information
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Order items list
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one order item is required.",
      },
    },
    // Shipping information
    shippingInfo: {
      type: shippingInfoSchema,
      required: true,
    },
    // Order status
    status: {
      type: String,
      required: true,
      enum: [
        "pending", // Order received (payment pending)
        "paid", // Payment completed
        "preparing", // Preparing for shipment
        "shipping", // Shipping
        "delivered", // Delivered
        "cancelled", // Order cancelled
        "refunded", // Refunded
      ],
      default: "pending",
      index: true,
    },
    // Payment information
    paymentMethod: {
      type: String,
      required: true,
      enum: ["card", "bank_transfer", "virtual_account", "mobile", "cash"],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ["pending", "completed", "failed", "cancelled", "refunded"],
      default: "pending",
    },
    paymentDate: {
      type: Date,
    },
    // Payment information (Stripe, etc.)
    paymentInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Amount information
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shippingFee: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shippingMethod: {
      type: String,
      enum: ["free", "standard", "express"],
      default: "free",
    },
    discountAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    // Tracking number
    trackingNumber: {
      type: String,
      trim: true,
    },
    // Shipping start date
    shippedAt: {
      type: Date,
    },
    // Delivery completion date
    deliveredAt: {
      type: Date,
    },
    // Cancellation/refund information
    cancelledAt: {
      type: Date,
    },
    cancelReason: {
      type: String,
      trim: true,
    },
    refundedAt: {
      type: Date,
    },
    refundReason: {
      type: String,
      trim: true,
    },
    // Admin notes
    adminNotes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index configuration (query performance optimization)
orderSchema.index({ user: 1, createdAt: -1 }); // User orders query
orderSchema.index({ orderNumber: 1 }); // Order number search
orderSchema.index({ status: 1, createdAt: -1 }); // Status-based orders query
orderSchema.index({ paymentStatus: 1, createdAt: -1 }); // Payment status query
orderSchema.index({ createdAt: -1 }); // Latest orders query
orderSchema.index({ "shippingInfo.recipientPhone": 1 }); // Phone number search

// Auto-generate order number middleware (with duplicate check)
orderSchema.pre("save", async function (next) {
  // Only generate orderNumber for new documents
  if (this.isNew) {
    if (!this.orderNumber) {
      console.log("[DEBUG] Generating order number for new order");
      let orderNumber;
      let isUnique = false;
      let attempts = 0;
      const maxAttempts = 10;

      while (!isUnique && attempts < maxAttempts) {
        const now = new Date();
        const dateStr = now
          .toISOString()
          .replace(/[-:T]/g, "")
          .substring(0, 14);
        const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
        orderNumber = `ORD${dateStr}${randomStr}`;

        const existingOrder = await mongoose.models.Order?.findOne({
          orderNumber,
        });
        if (!existingOrder) {
          isUnique = true;
        }
        attempts++;
      }

      if (!isUnique) {
        console.error(
          "[DEBUG] Failed to generate unique order number after",
          maxAttempts,
          "attempts"
        );
        return next(
          new Error("Failed to generate order number. Please try again.")
        );
      }

      this.orderNumber = orderNumber;
      console.log("[DEBUG] Generated order number:", orderNumber);
    } else {
      console.log("[DEBUG] Order number already set:", this.orderNumber);
    }
  } else {
    // For existing documents, ensure orderNumber exists
    if (!this.orderNumber) {
      console.error("[DEBUG] Existing order without orderNumber!");
      return next(new Error("Order number is required for existing orders."));
    }
    console.log("[DEBUG] Not a new document, orderNumber:", this.orderNumber);
  }
  next();
});

// Auto-calculate total amount middleware
orderSchema.pre("save", function (next) {
  if (this.items && this.items.length > 0) {
    this.itemsTotal =
      Math.round(
        this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0) * 100
      ) / 100;
    this.totalAmount =
      Math.round(
        (this.itemsTotal + this.shippingFee - this.discountAmount) * 100
      ) / 100;
  }
  next();
});

// Virtual field: Total quantity
orderSchema.virtual("totalQuantity").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Virtual field: Order active status (not cancelled/refunded)
orderSchema.virtual("isActive").get(function () {
  return !["cancelled", "refunded"].includes(this.status);
});

// Include virtual fields in JSON conversion
orderSchema.set("toJSON", { virtuals: true });
orderSchema.set("toObject", { virtuals: true });

// Instance method: Calculate total
orderSchema.methods.calculateTotal = function () {
  if (this.items && this.items.length > 0) {
    this.itemsTotal =
      Math.round(
        this.items.reduce((sum, item) => sum + (item.subtotal || 0), 0) * 100
      ) / 100;
    this.totalAmount =
      Math.round(
        (this.itemsTotal + this.shippingFee - this.discountAmount) * 100
      ) / 100;
  }
  return this.totalAmount;
};

// Instance method: Complete payment
orderSchema.methods.completePayment = function (paymentDate = new Date()) {
  if (this.paymentStatus === "completed") {
    throw new Error("Payment has already been completed for this order.");
  }
  this.paymentStatus = "completed";
  this.status = "paid";
  this.paymentDate = paymentDate;
  return this.save();
};

// Instance method: Cancel order
orderSchema.methods.cancel = function (reason = "") {
  if (["cancelled", "refunded", "delivered"].includes(this.status)) {
    throw new Error("Order cannot be cancelled in this status.");
  }
  this.status = "cancelled";
  this.paymentStatus = "cancelled";
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  return this.save();
};

// Instance method: Process refund
orderSchema.methods.refund = function (reason = "") {
  if (this.paymentStatus !== "completed") {
    throw new Error("Orders with incomplete payment cannot be refunded.");
  }
  if (this.status === "refunded") {
    throw new Error("Order has already been refunded.");
  }
  this.status = "refunded";
  this.paymentStatus = "refunded";
  this.refundedAt = new Date();
  this.refundReason = reason;
  return this.save();
};

// Instance method: Start shipping
orderSchema.methods.startShipping = function (trackingNumber = "") {
  if (!["paid", "preparing"].includes(this.status)) {
    throw new Error("Shipping cannot be started in this order status.");
  }
  this.status = "shipping";
  this.shippedAt = new Date();
  if (trackingNumber) {
    this.trackingNumber = trackingNumber;
  }
  return this.save();
};

// Instance method: Complete delivery
orderSchema.methods.completeDelivery = function () {
  if (this.status !== "shipping") {
    throw new Error(
      "Only orders in shipping status can be marked as delivered."
    );
  }
  this.status = "delivered";
  this.deliveredAt = new Date();
  return this.save();
};

// Instance method: Check if status can be changed
orderSchema.methods.canChangeStatus = function (newStatus) {
  // Allow all status changes - no restrictions
  const validStatuses = ["pending", "paid", "preparing", "shipping", "delivered", "cancelled", "refunded"];
  return validStatuses.includes(newStatus);
};

// Static method: Generate order number (helper)
orderSchema.statics.generateOrderNumber = async function () {
  let orderNumber;
  let isUnique = false;
  let attempts = 0;
  const maxAttempts = 10;

  while (!isUnique && attempts < maxAttempts) {
    const now = new Date();
    const dateStr = now.toISOString().replace(/[-:T]/g, "").substring(0, 14);
    const randomStr = Math.floor(1000 + Math.random() * 9000).toString();
    orderNumber = `ORD${dateStr}${randomStr}`;

    const existingOrder = await this.findOne({ orderNumber });
    if (!existingOrder) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new Error("Failed to generate order number.");
  }

  return orderNumber;
};

// Static method: Find orders by user
orderSchema.statics.findByUser = function (userId, options = {}) {
  const query = this.find({ user: userId }).sort({ createdAt: -1 });
  if (options.status) {
    query.where("status").equals(options.status);
  }
  if (options.limit) {
    query.limit(options.limit);
  }
  if (options.skip) {
    query.skip(options.skip);
  }
  return query.populate("user", "name email").populate("items.product");
};

// Static method: Find order by order number
orderSchema.statics.findByOrderNumber = function (orderNumber) {
  return this.findOne({ orderNumber })
    .populate("user", "name email")
    .populate("items.product");
};

const Order = mongoose.model("Order", orderSchema);

module.exports = Order;
