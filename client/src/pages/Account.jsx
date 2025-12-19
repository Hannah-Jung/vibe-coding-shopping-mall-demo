import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { storage } from "../utils/localStorage";
import { getCurrentUser } from "../utils/api";
import { API_BASE_URL } from "../utils/constants";
import { formatPhoneNumberInput } from "../utils/format";

const Account = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
    email: "",
  });

  // Format phone number using common utility
  const formatPhoneNumber = useCallback((value) => {
    return formatPhoneNumberInput(value);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = storage.getToken();
        if (!token) {
          navigate("/login");
          return;
        }

        const response = await getCurrentUser(token);
        if (response.success && response.data) {
          const userData = response.data;
          setUser(userData);
          
          // Split name into firstName and lastName
          const nameParts = userData.name ? userData.name.split(" ") : ["", ""];
          const firstName = nameParts[0] || "";
          const lastName = nameParts.slice(1).join(" ") || "";

          // Parse address if it exists
          let address = "";
          let apartment = "";
          let city = "";
          let state = "";
          let zipCode = "";
          
          if (userData.address) {
            // Try to parse address format: "address|apartment|city|state|zipCode" (using | as delimiter)
            // Fallback to comma-separated format for backward compatibility
            let addressParts = [];
            if (userData.address.includes("|")) {
              addressParts = userData.address.split("|").map(part => part.trim());
            } else {
              // Legacy format: "address, apartment, city, state, zipCode"
              // Need to handle cases where apartment might be empty
              const commaParts = userData.address.split(",").map(part => part.trim());
              // If we have exactly 4 parts, assume apartment is empty
              if (commaParts.length === 4) {
                addressParts = [commaParts[0], "", commaParts[1], commaParts[2], commaParts[3]];
              } else {
                addressParts = commaParts;
              }
            }
            
            if (addressParts.length >= 1) {
              address = addressParts[0];
            }
            if (addressParts.length >= 2) {
              apartment = addressParts[1];
            }
            if (addressParts.length >= 3) {
              city = addressParts[2];
            }
            if (addressParts.length >= 4) {
              state = addressParts[3];
            }
            if (addressParts.length >= 5) {
              zipCode = addressParts[4];
            }
          }
          
          // Format phone number if it exists
          let phone = "";
          if (userData.phone) {
            phone = formatPhoneNumber(userData.phone);
          }

          setFormData({
            firstName,
            lastName,
            address: address,
            apartment: apartment,
            city: city,
            state: state,
            zipCode: zipCode,
            phone: phone,
            email: userData.email || "",
          });
        }
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load account information. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, formatPhoneNumber]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    let formattedValue = value;
    
    // Format phone number if it's the phone field
    if (name === "phone") {
      formattedValue = formatPhoneNumber(value);
    } 
    // Format ZIP code: only digits, max 5 digits
    else if (name === "zipCode") {
      // Remove all non-digit characters
      const digitsOnly = value.replace(/\D/g, "");
      // Limit to 5 digits
      formattedValue = digitsOnly.slice(0, 5);
    }
    
    setFormData((prev) => ({
      ...prev,
      [name]: formattedValue,
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
    if (error) setError("");
    if (success) setSuccess("");
  }, [formatPhoneNumber, formErrors, error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setFormErrors({});
    setSaving(true);

    try {
      const token = storage.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      // Validate form fields
      const errors = {};

      // Validate required fields
      if (!formData.address.trim()) {
        errors.address = "Address is required";
      }
      if (!formData.city.trim()) {
        errors.city = "City is required";
      }
      if (!formData.state.trim()) {
        errors.state = "State is required";
      }
      if (!formData.zipCode.trim()) {
        errors.zipCode = "ZIP code is required";
      } else if (!/^[0-9]{5}$/.test(formData.zipCode)) {
        errors.zipCode = "Please enter a valid 5-digit ZIP code";
      }
      if (!formData.phone.trim()) {
        errors.phone = "Phone number is required";
      } else {
        // Remove formatting characters and check if it's 10 digits
        const phoneDigits = formData.phone.replace(/\D/g, "");
        if (phoneDigits.length !== 10) {
          errors.phone = "Please enter a valid 10-digit phone number";
        }
      }

      // Validate email format
      if (!formData.email.trim()) {
        errors.email = "Email is required";
      } else {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email.trim())) {
          errors.email = "Please enter a valid email address";
        }
      }

      // If there are validation errors, set them and return
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        setSaving(false);
        return;
      }

      // Combine address fields for storage
      // Format: "address|apartment|city|state|zipCode" (using | as delimiter to avoid comma conflicts)
      const addressParts = [
        formData.address.trim(),
        formData.apartment.trim(),
        formData.city.trim(),
        formData.state.trim(),
        formData.zipCode.trim()
      ];
      const fullAddress = addressParts.join("|");

      const response = await fetch(`${API_BASE_URL}/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          address: fullAddress,
          phone: formData.phone.replace(/\D/g, ""), // Remove formatting, keep only digits
          // Don't update name - it's read-only
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update account information.");
      }

      setSuccess("Account information updated successfully!");
      
      // Update localStorage user data
      const updatedUser = { ...user, ...data.data };
      storage.setUser(updatedUser);
      
      // Dispatch event to update Navbar
      window.dispatchEvent(new Event("authChanged"));
    } catch (err) {
      console.error("Error updating account:", err);
      setError(err.message || "Failed to update account information. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            minHeight: "60vh",
          }}
        >
          <CircularProgress />
        </Box>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Box
        sx={{
          minHeight: "80vh",
          py: 4,
          px: { xs: 2, sm: 4, md: 6 },
          maxWidth: "1200px",
          mx: "auto",
        }}
      >
        <Typography variant="h4" sx={{ mb: 4, fontWeight: 600, textAlign: "center" }}>
          Account Settings
        </Typography>

        <Card sx={{ maxWidth: "800px", mx: "auto" }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              {success && (
                <Alert severity="success" sx={{ mb: 3 }}>
                  {success}
                </Alert>
              )}

              <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="firstName"
                  value={formData.firstName}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000",
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Last Name"
                  name="lastName"
                  value={formData.lastName}
                  disabled
                  sx={{
                    "& .MuiInputBase-input.Mui-disabled": {
                      WebkitTextFillColor: "#000",
                      backgroundColor: "#f5f5f5",
                    },
                  }}
                />
                
                {/* Address */}
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  error={!!formErrors.address}
                  helperText={formErrors.address}
                  required
                  placeholder="Address"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                    },
                  }}
                />

                {/* Apartment, suite, etc. */}
                <TextField
                  fullWidth
                  label="Apartment, suite, etc. (optional)"
                  name="apartment"
                  value={formData.apartment}
                  onChange={handleChange}
                  placeholder="Apartment, suite, etc. (optional)"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                    },
                  }}
                />

                {/* City, State, ZIP code */}
                <Box sx={{ display: "flex", gap: 2.5 }}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    error={!!formErrors.city}
                    helperText={formErrors.city}
                    required
                    placeholder="City"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 0,
                      },
                    }}
                  />
                  <FormControl fullWidth required error={!!formErrors.state}>
                    <InputLabel>State</InputLabel>
                    <Select
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      label="State"
                      required
                      sx={{
                        borderRadius: 0,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: "#e0e0e0",
                        },
                      }}
                    >
                      <MenuItem value="Alabama">Alabama</MenuItem>
                      <MenuItem value="Alaska">Alaska</MenuItem>
                      <MenuItem value="Arizona">Arizona</MenuItem>
                      <MenuItem value="Arkansas">Arkansas</MenuItem>
                      <MenuItem value="California">California</MenuItem>
                      <MenuItem value="Colorado">Colorado</MenuItem>
                      <MenuItem value="Connecticut">Connecticut</MenuItem>
                      <MenuItem value="Delaware">Delaware</MenuItem>
                      <MenuItem value="Florida">Florida</MenuItem>
                      <MenuItem value="Georgia">Georgia</MenuItem>
                      <MenuItem value="Hawaii">Hawaii</MenuItem>
                      <MenuItem value="Idaho">Idaho</MenuItem>
                      <MenuItem value="Illinois">Illinois</MenuItem>
                      <MenuItem value="Indiana">Indiana</MenuItem>
                      <MenuItem value="Iowa">Iowa</MenuItem>
                      <MenuItem value="Kansas">Kansas</MenuItem>
                      <MenuItem value="Kentucky">Kentucky</MenuItem>
                      <MenuItem value="Louisiana">Louisiana</MenuItem>
                      <MenuItem value="Maine">Maine</MenuItem>
                      <MenuItem value="Maryland">Maryland</MenuItem>
                      <MenuItem value="Massachusetts">Massachusetts</MenuItem>
                      <MenuItem value="Michigan">Michigan</MenuItem>
                      <MenuItem value="Minnesota">Minnesota</MenuItem>
                      <MenuItem value="Mississippi">Mississippi</MenuItem>
                      <MenuItem value="Missouri">Missouri</MenuItem>
                      <MenuItem value="Montana">Montana</MenuItem>
                      <MenuItem value="Nebraska">Nebraska</MenuItem>
                      <MenuItem value="Nevada">Nevada</MenuItem>
                      <MenuItem value="New Hampshire">New Hampshire</MenuItem>
                      <MenuItem value="New Jersey">New Jersey</MenuItem>
                      <MenuItem value="New Mexico">New Mexico</MenuItem>
                      <MenuItem value="New York">New York</MenuItem>
                      <MenuItem value="North Carolina">North Carolina</MenuItem>
                      <MenuItem value="North Dakota">North Dakota</MenuItem>
                      <MenuItem value="Ohio">Ohio</MenuItem>
                      <MenuItem value="Oklahoma">Oklahoma</MenuItem>
                      <MenuItem value="Oregon">Oregon</MenuItem>
                      <MenuItem value="Pennsylvania">Pennsylvania</MenuItem>
                      <MenuItem value="Rhode Island">Rhode Island</MenuItem>
                      <MenuItem value="South Carolina">South Carolina</MenuItem>
                      <MenuItem value="South Dakota">South Dakota</MenuItem>
                      <MenuItem value="Tennessee">Tennessee</MenuItem>
                      <MenuItem value="Texas">Texas</MenuItem>
                      <MenuItem value="Utah">Utah</MenuItem>
                      <MenuItem value="Vermont">Vermont</MenuItem>
                      <MenuItem value="Virginia">Virginia</MenuItem>
                      <MenuItem value="Washington">Washington</MenuItem>
                      <MenuItem value="West Virginia">West Virginia</MenuItem>
                      <MenuItem value="Wisconsin">Wisconsin</MenuItem>
                      <MenuItem value="Wyoming">Wyoming</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="ZIP code"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    error={!!formErrors.zipCode}
                    helperText={formErrors.zipCode}
                    required
                    placeholder="ZIP code"
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        borderRadius: 0,
                      },
                    }}
                  />
                </Box>
                {formErrors.state && (
                  <Typography variant="caption" color="error" sx={{ mt: -2, mb: 1 }}>
                    {formErrors.state}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  error={!!formErrors.phone}
                  helperText={formErrors.phone}
                  required
                  placeholder="(000) 000-0000"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                    },
                  }}
                />
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: 0,
                    },
                  }}
                />
              </Box>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end", gap: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={saving}
                  sx={{
                    backgroundColor: "#000",
                    color: "#fff",
                    "&:hover": {
                      backgroundColor: "#333",
                    },
                  }}
                >
                  {saving ? (
                    <>
                      <CircularProgress size={16} sx={{ mr: 1, color: "#fff" }} />
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={saving}
                  sx={{
                    borderColor: "#000",
                    color: "#000",
                    "&:hover": {
                      borderColor: "#333",
                      backgroundColor: "rgba(0, 0, 0, 0.04)",
                    },
                  }}
                >
                  Cancel
                </Button>
              </Box>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Footer />
    </>
  );
};

export default Account;

