const mongoose = require("mongoose");
const Product = require("../models/product");

// CREATE - Create a new product
const createProduct = async (req, res) => {
  try {
    const { sku, name, price, category, image, description, images } = req.body;

    // Validate required fields
    if (!sku || !name || !price || !category || !image) {
      return res.status(400).json({
        success: false,
        message: "SKU, name, price, category, and image are required fields.",
      });
    }

    // Validate price is a number and positive
    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number.",
      });
    }

    // Check for duplicate SKU
    const existingProduct = await Product.findOne({ sku: sku.trim() });
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
    }

    const product = new Product({
      sku: sku.trim(),
      name: name.trim(),
      price,
      category: category.trim(),
      image: image.trim(),
      description: description ? description.trim() : undefined,
      images:
        images && Array.isArray(images) ? images.map((img) => img.trim()) : [],
    });

    const savedProduct = await product.save();

    res.status(201).json({
      success: true,
      message: "Product created successfully.",
      data: savedProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error occurred while creating product.",
      error: error.message,
    });
  }
};

// READ - Get all products
const getAllProducts = async (req, res) => {
  try {
    const { category, page, limit, search } = req.query;

    // Build query
    const query = {};
    if (category) {
      query.category = category.trim();
    }

    // Add search functionality
    if (search && search.trim()) {
      const searchTerm = search.trim();
      // Escape special regex characters
      const escapedSearch = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

      // Check if search term is a number (for price search)
      const isNumeric = !isNaN(searchTerm) && !isNaN(parseFloat(searchTerm));
      const searchNumber = isNumeric ? parseFloat(searchTerm) : null;

          // Search in specific fields: name and category only (exclude SKU and description)
      const searchConditions = [
        { name: { $regex: escapedSearch, $options: "i" } },
        { category: { $regex: escapedSearch, $options: "i" } },
      ];

      // Add price search if search term is numeric (optimized)
      if (searchNumber !== null) {
        // Use direct numeric comparison for better performance
        searchConditions.push({
          $expr: {
            $regexMatch: {
              input: { $toString: "$price" },
              regex: escapedSearch,
              options: "i",
            },
          },
        });
      }

      query.$or = searchConditions;
    }

    // Pagination settings
    const pageNumber = parseInt(page) || 1;
    const pageSize = parseInt(limit) || 4;
    const skip = (pageNumber - 1) * pageSize;

    // Get total count for pagination
    const totalProducts = await Product.countDocuments(query);

    // Get paginated products
    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    // Calculate pagination info
    const totalPages = Math.ceil(totalProducts / pageSize);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    res.status(200).json({
      success: true,
      count: products.length,
      total: totalProducts,
      page: pageNumber,
      totalPages: totalPages,
      hasNextPage: hasNextPage,
      hasPrevPage: hasPrevPage,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching products.",
      error: error.message,
    });
  }
};

// READ - Get a specific product by ID
const getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching product.",
      error: error.message,
    });
  }
};

// READ - Get a product by SKU
const getProductBySku = async (req, res) => {
  try {
    const { sku } = req.params;

    if (!sku) {
      return res.status(400).json({
        success: false,
        message: "SKU is required.",
      });
    }

    const product = await Product.findOne({ sku: sku.trim() });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Error fetching product by SKU:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while fetching product.",
      error: error.message,
    });
  }
};

// UPDATE - Update product information
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { sku, name, price, category, image, description, images } = req.body;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    // Validate price if provided
    if (price !== undefined && (typeof price !== "number" || price < 0)) {
      return res.status(400).json({
        success: false,
        message: "Price must be a positive number.",
      });
    }

    // Build update data object
    const updateData = {};
    if (sku) updateData.sku = sku.trim();
    if (name) updateData.name = name.trim();
    if (price !== undefined) updateData.price = price;
    if (category) updateData.category = category.trim();
    if (image) updateData.image = image.trim();
    if (description !== undefined)
      updateData.description = description ? description.trim() : description;
    if (images !== undefined) {
      updateData.images = Array.isArray(images)
        ? images.map((img) => img.trim())
        : [];
    }

    // Check for duplicate SKU when updating
    if (sku) {
      const existingProduct = await Product.findOne({
        sku: sku.trim(),
        _id: { $ne: id },
      });
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: "Product with this SKU already exists.",
        });
      }
    }

    const product = await Product.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product updated successfully.",
      data: product,
    });
  } catch (error) {
    console.error("Error updating product:", error);

    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Product with this SKU already exists.",
      });
    }

    res.status(500).json({
      success: false,
      message: "Error occurred while updating product.",
      error: error.message,
    });
  }
};

// DELETE - Delete a product
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate MongoDB ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format.",
      });
    }

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Product deleted successfully.",
      data: {
        id: product._id,
        sku: product.sku,
        name: product.name,
      },
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Error occurred while deleting product.",
      error: error.message,
    });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBySku,
  updateProduct,
  deleteProduct,
};
