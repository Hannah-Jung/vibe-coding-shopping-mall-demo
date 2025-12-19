const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

// JWT Secret (cached for performance)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// CREATE - Create a new user
const createUser = async (req, res) => {
  try {
    const { email, password, name, user_type, address } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: "Email, password, and name are required fields.",
      });
    }

    // Trim email and check for spaces
    const trimmedEmail = email.trim();
    if (trimmedEmail.includes(" ")) {
      return res.status(400).json({
        success: false,
        message: "Email address cannot contain spaces.",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address (e.g., example@domain.com).",
      });
    }

    // Validate password strength (optimized single pass)
    if (password.length < 4 || password.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Password must be between 4 and 10 characters.",
      });
    }

    // Check all password requirements in a single pass
    let hasUpperCase = false;
    let hasLowerCase = false;
    let hasNumber = false;
    let hasSpecialChar = false;
    const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;

    for (let i = 0; i < password.length; i++) {
      const char = password[i];
      if (char >= "A" && char <= "Z") hasUpperCase = true;
      else if (char >= "a" && char <= "z") hasLowerCase = true;
      else if (char >= "0" && char <= "9") hasNumber = true;
      else if (specialCharRegex.test(char)) hasSpecialChar = true;

      // Early exit if all requirements met
      if (hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar) break;
    }

    if (!hasUpperCase) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one uppercase letter.",
      });
    }

    if (!hasLowerCase) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one lowercase letter.",
      });
    }

    if (!hasNumber) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one number.",
      });
    }

    if (!hasSpecialChar) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least one special character.",
      });
    }

    // Check for duplicate email (use trimmed and lowercase email)
    const normalizedEmail = trimmedEmail.toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already exists.",
      });
    }

    // Hash password before saving
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      email: normalizedEmail,
      password: hashedPassword,
      name,
      user_type: user_type || "customer",
      address,
    });

    const savedUser = await user.save();

    // Exclude password from response
    const userResponse = savedUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: "User created successfully.",
      data: userResponse,
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while creating user.",
      error: error.message,
    });
  }
};

// READ - Get all users
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password"); // Exclude password

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching users.",
      error: error.message,
    });
  }
};

// READ - Get a specific user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    const user = await User.findById(id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching user.",
      error: error.message,
    });
  }
};

// UPDATE - Update user information
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, password, name, user_type, address, phone } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    // Build update data object
    const updateData = {};
    if (email) updateData.email = email;
    if (password) {
      // Hash password if being updated
      const saltRounds = 10;
      updateData.password = await bcrypt.hash(password, saltRounds);
    }
    if (name) updateData.name = name;
    if (user_type) updateData.user_type = user_type;
    if (address !== undefined) updateData.address = address;
    if (phone !== undefined) updateData.phone = phone;

    // Check for duplicate email when updating
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: id } });
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: "Email already exists.",
        });
      }
    }

    const user = await User.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while updating user.",
      error: error.message,
    });
  }
};

// DELETE - Delete a user
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID format.",
      });
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "User deleted successfully.",
      data: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while deleting user.",
      error: error.message,
    });
  }
};

// LOGIN - User login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    // Trim email and normalize
    const trimmedEmail = email.trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
        userType: user.user_type,
      },
      JWT_SECRET,
      {
        expiresIn: "7d", // Token expires in 7 days
      }
    );

    // Exclude password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(200).json({
      success: true,
      message: "Login successful.",
      token: token,
      data: userResponse,
    });
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while logging in.",
      error: error.message,
    });
  }
};

// GET - Get current user from token
const getCurrentUser = async (req, res) => {
  try {
    // User is already attached to req by authenticateToken middleware
    const user = req.user;

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error("Error fetching current user:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching user information.",
      error: error.message,
    });
  }
};

// CHECK - Check if email exists
const checkEmail = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required.",
      });
    }

    // Trim email and validate format
    const trimmedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format.",
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email: trimmedEmail });

    res.status(200).json({
      success: true,
      exists: !!existingUser,
    });
  } catch (error) {
    console.error("Error checking email:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while checking email.",
      error: error.message,
    });
  }
};

// GET - Get user favorites
const getFavorites = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required.",
      });
    }

    const user = await User.findById(userId).populate({
      path: "favorites",
      options: { lean: true }, // Use lean to avoid Mongoose document issues
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Filter out null values (products that may have been deleted)
    const validFavorites = (user.favorites || []).filter(
      (fav) => fav !== null && fav !== undefined
    );

    // Return only the IDs as strings for consistency
    const favoriteIds = validFavorites.map((fav) => {
      return fav._id ? fav._id.toString() : fav.toString();
    });

    res.status(200).json({
      success: true,
      data: favoriteIds,
    });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    // Return empty array instead of error to prevent login failure
    res.status(200).json({
      success: true,
      data: [],
    });
  }
};

// POST - Add favorite
const addFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Check if product is already in favorites
    if (user.favorites && user.favorites.includes(productId)) {
      return res.status(200).json({
        success: true,
        message: "Product is already in favorites.",
        data: user.favorites,
      });
    }

    // Add product to favorites
    if (!user.favorites) {
      user.favorites = [];
    }
    user.favorites.push(productId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Product added to favorites.",
      data: user.favorites,
    });
  } catch (error) {
    console.error("Error adding favorite:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while adding favorite.",
      error: error.message,
    });
  }
};

// DELETE - Remove favorite
const removeFavorite = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId } = req.params;

    if (!productId) {
      return res.status(400).json({
        success: false,
        message: "Product ID is required.",
      });
    }

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // Remove product from favorites
    if (user.favorites && user.favorites.length > 0) {
      user.favorites = user.favorites.filter(
        (id) => id.toString() !== productId
      );
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: "Product removed from favorites.",
      data: user.favorites || [],
    });
  } catch (error) {
    console.error("Error removing favorite:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while removing favorite.",
      error: error.message,
    });
  }
};

module.exports = {
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
};
