const Cart = require("../models/cart");
const Product = require("../models/product");

// Helper function to calculate totals (optimized single pass)
const calculateTotals = (items) => {
  let totalItems = 0;
  let totalAmount = 0;
  
  for (const item of items) {
    totalItems += item.quantity;
    totalAmount += item.price * item.quantity;
  }
  
  return { totalItems, totalAmount };
};

// GET - Get user's cart
const getCart = async (req, res) => {
  try {
    const userId = req.userId;

    let cart = await Cart.findOne({ user: userId }).populate("items.product");

    // If cart doesn't exist, create one
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
      await cart.save();
    }

    // Calculate totals
    const { totalItems, totalAmount } = calculateTotals(cart.items);
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;
    await cart.save();

    res.status(200).json({
      success: true,
      data: cart,
    });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching cart.",
      error: error.message,
    });
  }
};

// POST - Add item to cart
const addItemToCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { productId, quantity, price, color, size } = req.body;

    // Validate required fields
    if (!productId || !quantity || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "productId, quantity, and price are required fields.",
      });
    }

    // Validate quantity
    if (typeof quantity !== "number" || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be a positive number.",
      });
    }

    // Validate price
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number.",
      });
    }

    // Verify product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    // Find or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = new Cart({
        user: userId,
        items: [],
        totalAmount: 0,
        totalItems: 0,
      });
    }

    // Check if item already exists in cart with same color and size
    const existingItemIndex = cart.items.findIndex(
      (item) => 
        item.product.toString() === productId &&
        item.color === color &&
        item.size === size
    );

    if (existingItemIndex !== -1) {
      // Update quantity if item exists with same color and size
      cart.items[existingItemIndex].quantity += quantity;
      cart.items[existingItemIndex].price = price; // Update price to latest
    } else {
      // Add new item
      cart.items.push({
        product: productId,
        quantity,
        price,
        color: color || undefined,
        size: size || undefined,
      });
    }

    // Calculate and update totals
    const { totalItems, totalAmount } = calculateTotals(cart.items);
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item added to cart successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("Error adding item to cart:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while adding item to cart.",
      error: error.message,
    });
  }
};

// PUT - Update item quantity, color, or size in cart
const updateCartItem = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;
    const { quantity, color, size } = req.body;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(
      (item) => item._id.toString() === itemId
    );

    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        message: "Item not found in cart.",
      });
    }

    // Update quantity if provided
    if (quantity !== undefined) {
      // Validate quantity
      if (typeof quantity !== "number" || quantity < 1) {
        return res.status(400).json({
          success: false,
          message: "Quantity must be a positive number.",
        });
      }
      cart.items[itemIndex].quantity = quantity;
    }

    // Update color if provided
    if (color !== undefined) {
      cart.items[itemIndex].color = color || undefined;
    }

    // Update size if provided
    if (size !== undefined) {
      cart.items[itemIndex].size = size || undefined;
    }

    // Calculate and update totals
    const { totalItems, totalAmount } = calculateTotals(cart.items);
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Cart item updated successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("Error updating cart item:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while updating cart item.",
      error: error.message,
    });
  }
};

// DELETE - Remove item from cart
const removeItemFromCart = async (req, res) => {
  try {
    const userId = req.userId;
    const { itemId } = req.params;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    // Remove item from cart
    cart.items = cart.items.filter((item) => item._id.toString() !== itemId);

    // Calculate and update totals
    const { totalItems, totalAmount } = calculateTotals(cart.items);
    cart.totalItems = totalItems;
    cart.totalAmount = totalAmount;

    await cart.save();
    await cart.populate("items.product");

    res.status(200).json({
      success: true,
      message: "Item removed from cart successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("Error removing item from cart:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while removing item from cart.",
      error: error.message,
    });
  }
};

// DELETE - Clear entire cart
const clearCart = async (req, res) => {
  try {
    const userId = req.userId;

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: "Cart not found.",
      });
    }

    // Clear all items
    cart.items = [];
    cart.totalItems = 0;
    cart.totalAmount = 0;

    await cart.save();

    res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
      data: cart,
    });
  } catch (error) {
    console.error("Error clearing cart:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while clearing cart.",
      error: error.message,
    });
  }
};

module.exports = {
  getCart,
  addItemToCart,
  updateCartItem,
  removeItemFromCart,
  clearCart,
};
