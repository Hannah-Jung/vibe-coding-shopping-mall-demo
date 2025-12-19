/**
 * Normalize email: trim whitespace and convert to lowercase
 */
export const normalizeEmail = (email) => {
  return email.trim().toLowerCase();
};

/**
 * Trim password: remove whitespace and newlines (IME input handling)
 */
export const trimPassword = (password) => {
  return password.trim().replace(/\n/g, "");
};

/**
 * Extract first name from full name
 */
export const getFirstName = (name) => {
  if (!name) return "";
  return name.split(" ")[0];
};

/**
 * Format phone number: +1 (000) 000-0000
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return "";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    // 11 digits starting with 1: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    // 10 digits: +1 (XXX) XXX-XXXX
    return `+1 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Format phone number for input (with formatting as user types)
 */
export const formatPhoneNumberInput = (value) => {
  const phoneNumber = value.replace(/\D/g, "");
  const phoneNumberDigits = phoneNumber.slice(0, 10);
  
  if (phoneNumberDigits.length === 0) {
    return "";
  } else if (phoneNumberDigits.length < 3) {
    return phoneNumberDigits;
  } else if (phoneNumberDigits.length === 3) {
    return `(${phoneNumberDigits})`;
  } else if (phoneNumberDigits.length <= 6) {
    return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3)}`;
  } else {
    return `(${phoneNumberDigits.slice(0, 3)}) ${phoneNumberDigits.slice(3, 6)}-${phoneNumberDigits.slice(6)}`;
  }
};

/**
 * Format date: MM/DD/YYYY
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
};

/**
 * Format time: HH:MM AM/PM
 */
export const formatTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

