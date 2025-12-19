import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  IconButton,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Badge,
} from "@mui/material";
import {
  Save as SaveIcon,
  SaveOutlined as SaveOutlinedIcon,
  CalendarMonthOutlined as CalendarMonthOutlinedIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  CloudUpload as CloudUploadIcon,
  ArrowBack as ArrowBackIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import RestoreOutlinedIcon from "@mui/icons-material/RestoreOutlined";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import MessageModal from "../../components/MessageModal";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_UPLOAD_PRESET, API_BASE_URL } from "../../utils/constants";

// Category and subcategory data
const categories = {
  WOMEN: [
    "Dresses",
    "Tops & Blouses",
    "Bottoms",
    "Outerwear",
    "Accessories",
  ],
  PLUS: [
    "Dresses",
    "Tops & Blouses",
    "Bottoms",
    "Outerwear",
    "Accessories",
  ],
  MEN: [
    "T-Shirts & Tops",
    "Pants & Jeans",
    "Outerwear",
    "Accessories",
    "Shoes",
  ],
  KIDS: [
    "Girls Clothing",
    "Boys Clothing",
    "Baby Clothing",
    "Shoes",
    "Accessories",
  ],
  SHOES: [
    "Women's Shoes",
    "Men's Shoes",
    "Kids' Shoes",
    "Sneakers",
    "Boots",
  ],
  ACCESSORIES: [
    "Bags & Handbags",
    "Jewelry",
    "Watches",
    "Hats & Caps",
    "Belts",
  ],
};

const AddProduct = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get("id");
  const page = searchParams.get("page") || "1";
  const isEditMode = !!productId;
  const [formData, setFormData] = useState({
    sku: "SKU",
    name: "",
    description: "",
    category: "",
    price: "",
    image: "",
    images: [],
  });
  const [loading, setLoading] = useState(false);
  const [cloudinaryWidget, setCloudinaryWidget] = useState(null);
  const [modalState, setModalState] = useState({
    open: false,
    type: "success", // "success" or "error"
    title: "",
    message: "",
  });
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingAdditionalImage, setUploadingAdditionalImage] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [imageToDelete, setImageToDelete] = useState(null);
  const [deletedImages, setDeletedImages] = useState([]); // Store deleted image information (array)
  const [fieldErrors, setFieldErrors] = useState({
    sku: false,
    name: false,
    price: false,
    category: false,
    image: false,
  });
  const [skuError, setSkuError] = useState("");
  const [checkingSku, setCheckingSku] = useState(false);

  // Scroll to top when component mounts or productId changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  // Load product data if in edit mode
  useEffect(() => {
    if (isEditMode && productId) {
      const fetchProduct = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${API_BASE_URL}/products/${productId}`);
          const result = await response.json();
          
          if (result.success && result.data) {
            const product = result.data;
            setFormData({
              sku: product.sku || "SKU",
              name: product.name || "",
              description: product.description || "",
              category: product.category || "",
              price: product.price?.toString() || "",
              image: product.image || "",
              images: product.images || [],
            });
          }
        } catch (error) {
          console.error("Error fetching product:", error);
          setModalState({
            open: true,
            type: "error",
            title: "Error",
            message: "Failed to load product data. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      };
      
      fetchProduct();
    }
  }, [isEditMode, productId]);

  useEffect(() => {
    // Initialize Cloudinary Upload Widget
    if (window.cloudinary) {
      const widget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          multiple: false,
          cropping: false,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            setUploadingMainImage(false);
            setModalState({
              open: true,
              type: "error",
              title: "Upload Failed",
              message: "Failed to upload image. Please try again.",
            });
            return;
          }
          if (result) {
            if (result.event === "show") {
              // Release loading state when widget opens
              setUploadingMainImage(false);
            } else if (result.event === "close") {
              // Release loading state when widget closes
              setUploadingMainImage(false);
            } else if (result.event === "success") {
              // Main image upload completed
              setUploadingMainImage(false);
              setFormData((prev) => ({
                ...prev,
                image: result.info.secure_url,
              }));
              // Clear image error when image is uploaded
              setFieldErrors((prev) => ({
                ...prev,
                image: false,
              }));
            }
          }
        }
      );
      setCloudinaryWidget(widget);
    } else {
      console.warn("Cloudinary widget script not loaded. Make sure the script is included in index.html");
    }
  }, []);

  const handleChange = (field) => (event) => {
    let value = event.target.value;
    
    // SKU 필드 처리: 공백 제거 및 숫자만 입력 가능
    if (field === "sku") {
      // "SKU"로 시작하는지 확인하고, 그 이후 숫자만 허용
      if (value.startsWith("SKU")) {
        // "SKU" 이후 부분에서 공백 제거 및 숫자만 추출
        const afterSku = value.substring(3).replace(/\s/g, "").replace(/\D/g, "");
        value = "SKU" + afterSku;
      } else if (value.length === 0) {
        // 빈 값이면 "SKU"로 초기화
        value = "SKU";
      } else {
        // "SKU"로 시작하지 않으면 "SKU"를 앞에 추가하고 숫자만 추출
        const numbersOnly = value.replace(/\s/g, "").replace(/\D/g, "");
        value = "SKU" + numbersOnly;
      }
    }
    
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: false,
      }));
    }
    
    // Clear SKU error when user starts typing
    if (field === "sku") {
      setSkuError("");
    }
  };

  // Check SKU duplication with debounce
  useEffect(() => {
    if (!formData.sku || formData.sku === "SKU" || formData.sku.length <= 3) {
      setSkuError("");
      setCheckingSku(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setCheckingSku(true);
        const skuToCheck = formData.sku.trim();
        
        // Skip check if editing and SKU hasn't changed
        if (isEditMode && productId) {
          try {
            const response = await fetch(`${API_BASE_URL}/products/${productId}`);
            const result = await response.json();
            if (result.success && result.data && result.data.sku === skuToCheck) {
              setCheckingSku(false);
              setSkuError("");
              return; // SKU hasn't changed, no need to check
            }
          } catch (error) {
            // Continue with check if product fetch fails
          }
        }
        
        const checkResponse = await fetch(`${API_BASE_URL}/products/sku/${encodeURIComponent(skuToCheck)}`);
        
        if (checkResponse.status === 404) {
          // SKU is available (product not found)
          setSkuError("");
          setFieldErrors((prev) => ({
            ...prev,
            sku: false,
          }));
        } else {
          const checkResult = await checkResponse.json();
          
          if (checkResult.success && checkResult.data) {
            // SKU already exists
            setSkuError("This SKU already exists. Please enter a new SKU number.");
            setFieldErrors((prev) => ({
              ...prev,
              sku: true,
            }));
          } else {
            // SKU is available
            setSkuError("");
            setFieldErrors((prev) => ({
              ...prev,
              sku: false,
            }));
          }
        }
      } catch (error) {
        // If product not found (404), SKU is available
        if (error.message?.includes("404") || error.message?.includes("not found")) {
          setSkuError("");
          setFieldErrors((prev) => ({
            ...prev,
            sku: false,
          }));
        } else {
          console.error("Error checking SKU:", error);
        }
      } finally {
        setCheckingSku(false);
      }
    }, 500); // 500ms debounce
    
    return () => clearTimeout(timeoutId);
  }, [formData.sku, isEditMode, productId]);

  const openCloudinaryWidget = (imageIndex = null) => {
    if (!window.cloudinary) {
      setModalState({
        open: true,
        type: "error",
        title: "Widget Error",
        message: "Cloudinary widget is not loaded. Please check your internet connection and refresh the page.",
      });
      return;
    }

    // Widget configuration for additional images
    if (imageIndex !== null) {
      setUploadingAdditionalImage(true);
      const additionalWidget = window.cloudinary.createUploadWidget(
        {
          cloudName: CLOUDINARY_CLOUD_NAME,
          uploadPreset: CLOUDINARY_UPLOAD_PRESET,
          multiple: false,
          cropping: false,
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            setUploadingAdditionalImage(false);
            setModalState({
              open: true,
              type: "error",
              title: "Upload Failed",
              message: "Failed to upload image. Please try again.",
            });
            return;
          }
          if (result) {
            if (result.event === "show") {
              // Release loading state when widget opens
              setUploadingAdditionalImage(false);
            } else if (result.event === "close") {
              // Release loading state when widget closes
              setUploadingAdditionalImage(false);
            } else if (result.event === "success") {
              setUploadingAdditionalImage(false);
              const newImages = [...formData.images];
              if (imageIndex >= 0 && imageIndex < newImages.length) {
                newImages[imageIndex] = result.info.secure_url;
              } else {
                newImages.push(result.info.secure_url);
              }
              setFormData((prev) => ({
                ...prev,
                images: newImages,
              }));
              // Clear image error when image is uploaded
              if (!formData.image && newImages.length > 0) {
                setFieldErrors((prev) => ({
                  ...prev,
                  image: false,
                }));
              }
            }
          }
        }
      );
      additionalWidget.open();
    } else {
      // Widget for main image
      if (!cloudinaryWidget) {
        setModalState({
          open: true,
          type: "error",
          title: "Widget Error",
          message: "Cloudinary widget is not initialized. Please check your configuration.",
        });
        return;
      }
      setUploadingMainImage(true);
      cloudinaryWidget.open();
    }
  };

  const addImageField = () => {
    openCloudinaryWidget(formData.images.length);
  };

  const removeImageField = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, images: newImages }));
  };

  const handleDeleteClick = (img) => {
    setImageToDelete(img);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (imageToDelete) {
      // Add deleted image information to array (for undo)
      const deletedImageInfo = {
        type: imageToDelete.type,
        url: imageToDelete.url,
        originalIndex: imageToDelete.type === "main" ? -1 : formData.images.findIndex((url) => url === imageToDelete.url),
      };
      setDeletedImages((prev) => [...prev, deletedImageInfo]);

      if (imageToDelete.type === "main") {
        // When main image is deleted, if there are additional images, set the first one as main image
        if (formData.images.length > 0) {
          const newMainImage = formData.images[0];
          const remainingImages = formData.images.slice(1);
          setFormData((prev) => ({
            ...prev,
            image: newMainImage,
            images: remainingImages,
          }));
        } else {
          // If no additional images, set to empty string
          setFormData((prev) => ({ ...prev, image: "" }));
        }
      } else {
        const additionalIndex = formData.images.findIndex((url) => url === imageToDelete.url);
        if (additionalIndex !== -1) {
          removeImageField(additionalIndex);
        }
      }
    }
    setDeleteConfirmOpen(false);
    setImageToDelete(null);
  };

  const handleUndo = () => {
    if (deletedImages.length > 0) {
      // Restore the most recently deleted image (last element in array)
      const deletedImage = deletedImages[deletedImages.length - 1];
      
      if (deletedImage.type === "main") {
        // Restore main image
        // If current main image exists, move it to additional images
        const currentMain = formData.image;
        const newImages = currentMain ? [currentMain, ...formData.images] : formData.images;
        
        setFormData((prev) => ({
          ...prev,
          image: deletedImage.url,
          images: newImages,
        }));
      } else {
        // Restore additional image
        const newImages = [...formData.images];
        const insertIndex = deletedImage.originalIndex >= 0 && deletedImage.originalIndex < newImages.length 
          ? deletedImage.originalIndex 
          : newImages.length;
        newImages.splice(insertIndex, 0, deletedImage.url);
        
        setFormData((prev) => ({
          ...prev,
          images: newImages,
        }));
      }
      
      // Remove restored image from array
      setDeletedImages((prev) => prev.slice(0, -1));
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmOpen(false);
    setImageToDelete(null);
  };

  // Get all images (main + additional) as a single array for ordering
  const getAllImages = () => {
    const allImages = [];
    if (formData.image) {
      allImages.push({ type: "main", url: formData.image });
    }
    formData.images.forEach((url) => {
      allImages.push({ type: "additional", url });
    });
    return allImages;
  };

  // Move image up or down
  const moveImage = (currentIndex, direction) => {
    const allImages = getAllImages();
    if (currentIndex === 0 && direction === "up") return;
    if (currentIndex === allImages.length - 1 && direction === "down") return;

    const newIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
    const newImages = [...allImages];
    [newImages[currentIndex], newImages[newIndex]] = [newImages[newIndex], newImages[currentIndex]];

    // Update formData based on new order
    // First image becomes main image, rest become additional images
    const newMainImage = newImages[0]?.url || "";
    const newAdditionalImages = newImages.slice(1).map((img) => img.url);

    setFormData((prev) => ({
      ...prev,
      image: newMainImage,
      images: newAdditionalImages,
    }));
  };

  // Drag and drop handlers
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleDragStart = (index) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const allImages = getAllImages();
    const newImages = [...allImages];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update formData based on new order
    const newMainImage = newImages[0]?.url || "";
    const newAdditionalImages = newImages.slice(1).map((img) => img.url);

    setFormData((prev) => ({
      ...prev,
      image: newMainImage,
      images: newAdditionalImages,
    }));

    setDraggedIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleSubmit = async (e) => {
    if (e) {
      e.preventDefault();
    }
    
    // Validation with field-specific error states
    const errors = {
      sku: false,
      name: false,
      price: false,
      category: false,
      image: false,
    };
    
    // Check SKU: must have "SKU" prefix and at least one number after it
    if (!formData.sku || formData.sku === "SKU" || formData.sku.length <= 3) {
      errors.sku = true;
    }
    
    // Check Name
    if (!formData.name || formData.name.trim() === "") {
      errors.name = true;
    }
    
    // Check Price
    if (!formData.price || formData.price.trim() === "" || isNaN(parseFloat(formData.price)) || parseFloat(formData.price) <= 0) {
      errors.price = true;
    }
    
    // Check Category
    if (!formData.category || formData.category.trim() === "") {
      errors.category = true;
    }
    
    // Check Image
    if (!formData.image || formData.image.trim() === "") {
      errors.image = true;
    }
    
    // Set field errors
    setFieldErrors(errors);
    
    // If any errors, show modal and return
    if (Object.values(errors).some(error => error)) {
      setModalState({
        open: true,
        type: "error",
        title: "Validation Error",
        message: "Please fill in all required fields (SKU, Name, Price, Category, and Image).",
      });
      return;
    }

    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        image: formData.image,
        description: formData.description || undefined,
        images: formData.images || [],
      };

      const token = localStorage.getItem("token");
      if (!token) {
        setModalState({
          open: true,
          type: "error",
          title: "Authentication Required",
          message: "You must be logged in to " + (isEditMode ? "update" : "create") + " a product.",
        });
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      const url = isEditMode 
        ? `${API_BASE_URL}/products/${productId}`
        : `${API_BASE_URL}/products`;
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(productData),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle authentication errors
        if (response.status === 401) {
          setModalState({
            open: true,
            type: "error",
            title: "Session Expired",
            message: "Your session has expired. Please log in again.",
          });
          localStorage.removeItem("token");
          setTimeout(() => navigate("/login"), 2000);
          return;
        }
        setModalState({
          open: true,
          type: "error",
          title: `Failed to ${isEditMode ? "Update" : "Create"} Product`,
          message: result.message || `Failed to ${isEditMode ? "update" : "create"} product. Please try again.`,
        });
        return;
      }

      if (result.success) {
        setModalState({
          open: true,
          type: "success",
          title: "Success!",
          message: `Product ${isEditMode ? "updated" : "created"} successfully!`,
        });
        // Reset form only if creating new product
        if (!isEditMode) {
          setFormData({
            sku: "SKU",
            name: "",
            description: "",
            category: "",
            price: "",
            image: "",
            images: [],
          });
          // Clear all errors
          setFieldErrors({
            sku: false,
            name: false,
            price: false,
            category: false,
            image: false,
          });
        }
        // Navigate to admin page after modal closes
        setTimeout(() => {
          navigate(`/admin/products?page=${page}`);
        }, 1500);
      } else {
        setModalState({
          open: true,
          type: "error",
          title: `Failed to ${isEditMode ? "Update" : "Create"} Product`,
          message: result.message || `Failed to ${isEditMode ? "update" : "create"} product. Please try again.`,
        });
      }
    } catch (error) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} product:`, error);
      setModalState({
        open: true,
        type: "error",
        title: "Error",
        message: `An error occurred while ${isEditMode ? "updating" : "creating"} the product. Please try again.`,
      });
    }
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, open: false }));
  };

  return (
      <Box sx={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      <Navbar />
      <Box sx={{ py: 4, px: { xs: 2, sm: 3, md: 4 }, maxWidth: "1400px", mx: "auto" }}>
        <Box sx={{ maxWidth: "500px", mx: "auto", position: "relative", mb: 4 }}>
          <Tooltip title="Back" arrow>
            <IconButton
              onClick={() => navigate(`/admin/products?page=${page}`)}
              sx={{ 
                position: "absolute",
                left: 0,
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 600, 
              textAlign: "center",
              fontSize: {
                xs: "1.5rem",
                sm: "2.125rem"
              },
              "@media (max-width: 500px)": {
                fontSize: "1.25rem",
              }
            }}
          >
            {isEditMode ? "Edit Product" : "Add New Product"}
          </Typography>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
            <CircularProgress />
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
          <Grid container spacing={3} sx={{ justifyContent: "center", maxWidth: "500px", mx: "auto" }}>
            {/* Left Column */}
            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", flex: "1 1 50%" }}>
              {/* Name and Description */}
              <Card sx={{ mb: 3, width: "100%" }}>
                <CardContent sx={{ width: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Name and Description
                  </Typography>
                  <TextField
                    fullWidth
                    label="Product Name"
                    value={formData.name}
                    onChange={handleChange("name")}
                    required
                    error={fieldErrors.name}
                    helperText={fieldErrors.name ? "Product name is required" : ""}
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Product Description"
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleChange("description")}
                    sx={{ mb: 2 }}
                  />
                </CardContent>
              </Card>

              {/* Price */}
              <Card sx={{ mb: 3, width: "100%" }}>
                <CardContent sx={{ width: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Price
                  </Typography>
                  <TextField
                    fullWidth
                    label="Price"
                    type="number"
                    value={formData.price}
                    onChange={handleChange("price")}
                    required
                    error={fieldErrors.price}
                    helperText={fieldErrors.price ? "Price is required and must be greater than 0" : ""}
                    inputProps={{ min: 0, step: 0.01 }}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                    }}
                    sx={{ mb: 2 }}
                  />
                </CardContent>
              </Card>

              {/* Manage Stock */}
              <Card sx={{ width: "100%" }}>
                <CardContent sx={{ width: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Stock Keeping Unit
                  </Typography>
                  <TextField
                    fullWidth
                    label="SKU"
                    value={formData.sku}
                    onChange={handleChange("sku")}
                    required
                    error={fieldErrors.sku || !!skuError}
                    helperText={
                      skuError 
                        ? skuError 
                        : fieldErrors.sku 
                        ? "SKU must include numbers after 'SKU'" 
                        : checkingSku 
                        ? "Checking SKU..." 
                        : ""
                    }
                    sx={{ mb: 2 }}
                    InputProps={{
                      endAdornment: checkingSku ? (
                        <CircularProgress size={20} sx={{ mr: 1 }} />
                      ) : null,
                    }}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Right Column */}
            <Grid item xs={12} md={6} sx={{ display: "flex", flexDirection: "column", flex: "1 1 50%" }}>
              {/* Category */}
              <Card sx={{ mb: 3, width: "100%" }}>
                <CardContent sx={{ width: "100%" }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Category
                  </Typography>
                  <FormControl fullWidth error={fieldErrors.category}>
                    <InputLabel>Product Category</InputLabel>
                    <Select
                      value={formData.category}
                      onChange={handleChange("category")}
                      label="Product Category"
                      required
                    >
                      {Object.keys(categories).map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat}
                        </MenuItem>
                      ))}
                    </Select>
                    {fieldErrors.category && (
                      <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>
                        Category is required
                      </Typography>
                    )}
                  </FormControl>
                </CardContent>
              </Card>

              {/* Product Image */}
              <Card sx={{ mb: 3, width: "100%" }}>
                <CardContent sx={{ width: "100%" }}>
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Product Image ({getAllImages().length})
                    </Typography>
                    {deletedImages.length > 0 && (
                      <Tooltip title="Undo delete">
                        <Badge 
                          badgeContent={deletedImages.length} 
                          color="error"
                          sx={{
                            "& .MuiBadge-badge": {
                              fontSize: "0.65rem",
                              minWidth: "16px",
                              height: "16px",
                              padding: "0 4px",
                            },
                          }}
                        >
                          <IconButton
                            onClick={handleUndo}
                            size="small"
                            sx={{
                              color: "#000",
                              "&:hover": {
                                backgroundColor: "rgba(0, 0, 0, 0.04)",
                              },
                            }}
                          >
                            <RestoreOutlinedIcon />
                          </IconButton>
                        </Badge>
                      </Tooltip>
                    )}
                  </Box>
                  
                  {/* Upload Main Image Button */}
                  <Box sx={{ mb: 3 }}>
                    <Button
                      variant="outlined"
                      startIcon={uploadingMainImage ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                      onClick={() => openCloudinaryWidget(null)}
                      disabled={uploadingMainImage}
                      fullWidth
                      sx={{ 
                        py: 1.5,
                        borderColor: fieldErrors.image ? "#d32f2f" : "#000",
                        color: fieldErrors.image ? "#d32f2f" : "#000",
                        "&:hover": {
                          borderColor: fieldErrors.image ? "#d32f2f" : "#000",
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                        },
                      }}
                    >
                      {uploadingMainImage ? "Loading..." : "Upload Main Image"}
                    </Button>
                  </Box>

                  {/* All Images with Order Controls */}
                  {getAllImages().map((img, index) => (
                    <Box 
                      key={`${img.type}-${index}`} 
                      sx={{ mb: 2 }}
                      draggable
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          height: img.type === "main" ? "300px" : "200px",
                          borderRadius: 2,
                          overflow: "hidden",
                          border: "1px solid #e0e0e0",
                          mb: 1,
                          backgroundColor: "#f5f5f5",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "move",
                          opacity: draggedIndex === index ? 0.5 : 1,
                          transition: "opacity 0.2s ease",
                          "&:hover": {
                            borderColor: "#000",
                          },
                        }}
                      >
                        <img
                          src={img.url}
                          alt={img.type === "main" ? "Main product preview" : `Additional image ${index}`}
                          style={{
                            maxWidth: "100%",
                            maxHeight: "100%",
                            width: "auto",
                            height: "auto",
                            objectFit: "contain",
                          }}
                        />
                        <Box
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            display: "flex",
                            flexDirection: "column",
                            gap: 0.5,
                          }}
                        >
                          <IconButton
                            onClick={() => moveImage(index, "up")}
                            disabled={index === 0}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
                              "&.Mui-disabled": {
                                backgroundColor: "rgba(255, 255, 255, 0.5)",
                              },
                            }}
                          >
                            <ArrowUpwardIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            onClick={() => moveImage(index, "down")}
                            disabled={index === getAllImages().length - 1}
                            size="small"
                            sx={{
                              backgroundColor: "rgba(255, 255, 255, 0.9)",
                              "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
                              "&.Mui-disabled": {
                                backgroundColor: "rgba(255, 255, 255, 0.5)",
                              },
                            }}
                          >
                            <ArrowDownwardIcon fontSize="small" />
                          </IconButton>
                        </Box>
                        <IconButton
                          onClick={() => handleDeleteClick(img)}
                          color="error"
                          sx={{
                            position: "absolute",
                            top: 8,
                            right: 8,
                            backgroundColor: "rgba(255, 255, 255, 0.9)",
                            "&:hover": { backgroundColor: "rgba(255, 255, 255, 1)" },
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                        {img.type === "main" && (
                          <Box
                            sx={{
                              position: "absolute",
                              bottom: 8,
                              left: 8,
                              backgroundColor: "rgba(0, 0, 0, 0.7)",
                              color: "#fff",
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              fontSize: "0.75rem",
                              fontWeight: 600,
                            }}
                          >
                            MAIN
                          </Box>
                        )}
                      </Box>
                    </Box>
                  ))}

                  {/* Add Image Button - Below all images (only show when at least 1 image is uploaded) */}
                  {getAllImages().length > 0 && (
                    <Box sx={{ mt: 2 }}>
                      <Button
                        startIcon={uploadingAdditionalImage ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                        onClick={addImageField}
                        variant="outlined"
                        disabled={uploadingAdditionalImage}
                        fullWidth
                        sx={{ 
                          py: 1.5,
                          borderColor: "#000",
                          color: "#000",
                          "&:hover": {
                            borderColor: "#000",
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        {uploadingAdditionalImage ? "Loading..." : "Add Image"}
                      </Button>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <Button
                  variant="contained"
                  startIcon={isEditMode ? <SaveIcon /> : <AddIcon />}
                  onClick={handleSubmit}
                  type="submit"
                  disabled={loading}
                  sx={{
                    backgroundColor: "#000",
                    color: "#fff",
                    textTransform: "none",
                    "&:hover": { backgroundColor: "#333" },
                  }}
                >
                  {isEditMode ? "UPDATE" : "Add Product"}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
        )}
      </Box>
      <Footer />
      
      <MessageModal
        open={modalState.open}
        onClose={handleCloseModal}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        buttonText="OK"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleDeleteCancel}
        PaperProps={{
          sx: {
            borderRadius: 2,
            minWidth: "300px",
            maxWidth: "400px",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, pb: 1, px: 2.5, pt: 2.5 }}>
          Delete Image
        </DialogTitle>
        <DialogContent sx={{ px: 2.5 }}>
          <DialogContentText>
            Are you sure you want to delete this image?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, gap: 1 }}>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            color="error"
            sx={{
              backgroundColor: "#d32f2f",
              textTransform: "none",
              "&:hover": {
                backgroundColor: "#b71c1c",
              },
            }}
          >
            Delete
          </Button>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
              borderColor: "#000",
              color: "#000",
              textTransform: "none",
              "&:hover": {
                borderColor: "#333",
                backgroundColor: "rgba(0, 0, 0, 0.04)",
              },
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AddProduct;

