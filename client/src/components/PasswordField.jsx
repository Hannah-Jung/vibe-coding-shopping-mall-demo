import { useState, memo, useCallback } from "react";
import { TextField, InputAdornment, IconButton } from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";

const PasswordField = ({
  id,
  name,
  label,
  value,
  onChange,
  onBlur,
  onFocus,
  inputRef,
  sx = {},
  required = true,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleToggleVisibility = useCallback(() => {
    setShowPassword((prev) => !prev);
  }, []);

  return (
    <TextField
      id={id}
      name={name}
      label={label}
      type={showPassword ? "text" : "password"}
      variant="outlined"
      fullWidth
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      inputRef={inputRef}
      required={required}
      sx={sx}
      InputProps={{
        endAdornment: (
          <InputAdornment position="end">
            <IconButton
              aria-label="toggle password visibility"
              onClick={handleToggleVisibility}
              edge="end"
            >
              {showPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
            </IconButton>
          </InputAdornment>
        ),
      }}
      {...props}
    />
  );
};

export default memo(PasswordField);

