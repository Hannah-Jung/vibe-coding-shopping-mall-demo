const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
// CORS configuration - allow all origins in development, specific origins in production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // In development, allow all origins
    if (!process.env.CLIENT_URL) {
      return callback(null, true);
    }
    
    // In production, allow CLIENT_URL and any Vercel domain
    const isVercelDomain = origin.includes('.vercel.app');
    const matchesClientUrl = origin === process.env.CLIENT_URL;
    
    if (matchesClientUrl || isVercelDomain) {
      callback(null, true);
    } else {
      console.log(`[CORS] Blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
// Use MONGODB_ATLAS_URL if available, otherwise fall back to local MongoDB
const MONGODB_URI =
  process.env.MONGODB_ATLAS_URL || "mongodb://localhost:27017/shopping-mall";

// Log which MongoDB is being used (without exposing credentials)
const mongoUriDisplay = process.env.MONGODB_ATLAS_URL
  ? `MongoDB Atlas (${process.env.MONGODB_ATLAS_URL.split("@")[1] || "Atlas"})`
  : "Local MongoDB (localhost:27017)";
console.log(`Attempting to connect to: ${mongoUriDisplay}`);

// MongoDB connection options for better performance
// Note: useNewUrlParser and useUnifiedTopology are deprecated in Mongoose 6+
// but kept for backward compatibility
const mongooseOptions = {
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 30000, // Increased to 30 seconds for Atlas
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  connectTimeoutMS: 30000, // Connection timeout set to 30 seconds
};

// MongoDB connection with event listeners
let connectionEstablished = false;

mongoose.connection.on("connected", () => {
  connectionEstablished = true;
  const dbName = mongoose.connection.db?.databaseName || "unknown";
  console.log(`✓ MongoDB connected successfully to database: ${dbName}`);
  console.log(`  Connection: ${mongoUriDisplay}`);
});

mongoose.connection.on("error", (error) => {
  console.error("✗ MongoDB connection error:", error.message);
  console.error(`  Failed to connect to: ${mongoUriDisplay}`);
  if (error.message.includes("authentication failed")) {
    console.error(
      "  → Check your MongoDB Atlas username and password in .env file"
    );
  } else if (
    error.message.includes("ENOTFOUND") ||
    error.message.includes("getaddrinfo")
  ) {
    console.error(
      "  → Check your internet connection and MongoDB Atlas cluster URL"
    );
  } else if (error.message.includes("timeout")) {
    console.error(
      "  → Connection timeout. Check MongoDB Atlas network access settings"
    );
    console.error(
      "  → Make sure your IP address is whitelisted in MongoDB Atlas"
    );
  }
});

mongoose.connection.on("disconnected", () => {
  console.warn("⚠ MongoDB disconnected");
  connectionEstablished = false;
});

// Routes
const userRoutes = require("./routes/user");
const productRoutes = require("./routes/product");
const cartRoutes = require("./routes/cart");
const orderRoutes = require("./routes/order");
const paymentRoutes = require("./routes/payment");
app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payment", paymentRoutes);

// Default route
app.get("/", (req, res) => {
  res.json({
    message: "Shopping Mall API Server",
    status: "running",
  });
});

// Global error handler middleware (must be after all routes)
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    success: false,
    message: "Internal server error occurred.",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  // Don't exit the process, just log the error
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  console.error("Uncaught Exception:", error);
  // Don't exit the process, just log the error
});

// Connect to MongoDB and start server
async function startServer() {
  console.log("Connecting to MongoDB...");

  try {
    // Connect to MongoDB first
    const connectionPromise = mongoose.connect(MONGODB_URI, mongooseOptions);

    // Set a timeout to detect if connection hangs
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        if (!connectionEstablished) {
          reject(
            new Error(
              "Connection timeout: MongoDB connection took too long. Check your network and MongoDB Atlas settings."
            )
          );
        }
      }, 15000); // 15 seconds timeout
    });

    await Promise.race([connectionPromise, timeoutPromise]);

    // Wait for connection event to fire (up to 5 seconds)
    let attempts = 0;
    while (!connectionEstablished && attempts < 10) {
      await new Promise((resolve) => setTimeout(resolve, 500));
      attempts++;
    }

    if (!connectionEstablished) {
      throw new Error(
        "MongoDB connection event not fired. Connection may have failed silently."
      );
    }

    // Start server only after MongoDB connection is successful
    app.listen(PORT, () => {
      console.log(`✓ Server is running on port ${PORT}`);
      console.log(`✓ Ready to accept requests`);
    });
  } catch (error) {
    console.error("\n✗ MongoDB connection failed:", error.message);
    if (error.message.includes("authentication failed")) {
      console.error(
        "  → Check your MongoDB Atlas username and password in .env file"
      );
    } else if (
      error.message.includes("ENOTFOUND") ||
      error.message.includes("getaddrinfo")
    ) {
      console.error(
        "  → Check your internet connection and MongoDB Atlas cluster URL"
      );
    } else if (error.message.includes("timeout")) {
      console.error(
        "  → Connection timeout. Check MongoDB Atlas network access settings"
      );
      console.error(
        "  → Make sure your IP address is whitelisted in MongoDB Atlas"
      );
      console.error(
        "  → Or add 0.0.0.0/0 to allow all IPs (for development only)"
      );
    }
    console.error(`  Failed to connect to: ${mongoUriDisplay}`);
    console.error("\n⚠ Server will not start without MongoDB connection.");
    console.error("⚠ Please fix MongoDB connection and restart the server.\n");
    process.exit(1); // Exit process on connection failure
  }
}

// Start the server
startServer();
