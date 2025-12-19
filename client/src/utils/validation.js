import { EMAIL_REGEX, NAME_REGEX } from "./constants";

/**
 * Validate email format
 * Checks for:
 * - Basic email format (user@domain.com)
 * - No spaces
 * - No consecutive @ symbols
 * - Valid domain with TLD
 */
export const isValidEmailFormat = (email) => {
  if (!email) return false;
  
  // Check for spaces
  if (email.includes(" ")) {
    return false;
  }
  
  // Check for consecutive @ symbols (e.g., aaa@@)
  if (email.includes("@@")) {
    return false;
  }
  
  // Check for @ at start or end
  if (email.startsWith("@") || email.endsWith("@")) {
    return false;
  }
  
  // Basic email regex validation
  return EMAIL_REGEX.test(email);
};

/**
 * Validate name format
 * Must start and end with a letter. No consecutive spaces, hyphens, or apostrophes.
 */
export const isValidName = (name) => {
  if (!name) return true; // Empty is valid (required check is separate)
  
  // Check if starts and ends with letter
  const letterRegex = /^[a-zA-Z가-힣]/;
  const endsWithLetterRegex = /[a-zA-Z가-힣]$/;
  
  if (!letterRegex.test(name) || !endsWithLetterRegex.test(name)) {
    return false;
  }
  
  // Check for consecutive spaces, hyphens, or apostrophes
  if (/\s{2,}/.test(name) || /--/.test(name) || /''/.test(name) || /'-/.test(name) || /-'/.test(name)) {
    return false;
  }
  
  // Check overall pattern
  return NAME_REGEX.test(name);
};

