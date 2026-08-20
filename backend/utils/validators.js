/**
 * Authentication & Registration Input Validation Utility
 */

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
const HEX_COLOR_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

/**
 * Validate Email address format
 */
const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return 'Email is required';
  const trimmed = email.trim();
  if (trimmed.length > 254) return 'Email is too long (maximum 254 characters)';
  if (!EMAIL_REGEX.test(trimmed)) return 'Please provide a valid email address (e.g. name@domain.com)';
  return null;
};

/**
 * Validate Password Strength
 * Requires: Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
 */
const validatePassword = (password) => {
  if (!password || typeof password !== 'string') return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters long';
  if (password.length > 128) return 'Password is too long (maximum 128 characters)';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter (A-Z)';
  if (!/[a-z]/.test(password)) return 'Password must include at least one lowercase letter (a-z)';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number (0-9)';
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    return 'Password must include at least one special character (e.g. @, #, $, %, !)';
  }
  return null;
};

/**
 * Validate Person Name (Customer or Store Owner)
 */
const validateName = (name, fieldName = 'Name') => {
  if (!name || typeof name !== 'string') return `${fieldName} is required`;
  const trimmed = name.trim();
  if (trimmed.length < 2) return `${fieldName} must be at least 2 characters long`;
  if (trimmed.length > 50) return `${fieldName} must not exceed 50 characters`;
  if (!/^[a-zA-Z\s.'-]+$/.test(trimmed)) {
    return `${fieldName} contains invalid characters (letters, spaces, hyphens only)`;
  }
  return null;
};

/**
 * Validate Store / Brand Name
 */
const validateStoreName = (storeName) => {
  if (!storeName || typeof storeName !== 'string') return 'Store name is required';
  const trimmed = storeName.trim();
  if (trimmed.length < 3) return 'Store name must be at least 3 characters long';
  if (trimmed.length > 50) return 'Store name must not exceed 50 characters';
  if (!/^[a-zA-Z0-9\s&.'-]+$/.test(trimmed)) {
    return 'Store name contains invalid characters';
  }
  return null;
};

/**
 * Validate Phone Number (optional or required)
 */
const validatePhone = (phone, isRequired = false) => {
  if (!phone || !phone.trim()) {
    if (isRequired) return 'Phone number is required';
    return null;
  }
  const cleanPhone = phone.replace(/[\s-]/g, '');
  if (!PHONE_REGEX.test(cleanPhone)) {
    return 'Please provide a valid 10-15 digit phone number';
  }
  return null;
};

/**
 * Validate Hex Color Code
 */
const validateHexColor = (color) => {
  if (!color) return null;
  if (!HEX_COLOR_REGEX.test(color.trim())) {
    return 'Please provide a valid hex color code (e.g. #6366f1 or #fff)';
  }
  return null;
};

/**
 * Full Customer Registration Validator
 */
const validateCustomerRegistration = ({ name, email, password, phone }) => {
  const errors = {};

  const nameError = validateName(name, 'Full Name');
  if (nameError) errors.name = nameError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const phoneError = validatePhone(phone, false);
  if (phoneError) errors.phone = phoneError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: Object.values(errors)[0] || null
  };
};

/**
 * Full Vendor / Store Registration Validator
 */
const validateVendorRegistration = ({ storeName, ownerName, email, password, phone, primaryColor }) => {
  const errors = {};

  const storeError = validateStoreName(storeName);
  if (storeError) errors.storeName = storeError;

  const ownerError = validateName(ownerName, 'Store Owner Name');
  if (ownerError) errors.ownerName = ownerError;

  const emailError = validateEmail(email);
  if (emailError) errors.email = emailError;

  const passwordError = validatePassword(password);
  if (passwordError) errors.password = passwordError;

  const phoneError = validatePhone(phone, false);
  if (phoneError) errors.phone = phoneError;

  const colorError = validateHexColor(primaryColor);
  if (colorError) errors.primaryColor = colorError;

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    firstError: Object.values(errors)[0] || null
  };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateName,
  validateStoreName,
  validatePhone,
  validateHexColor,
  validateCustomerRegistration,
  validateVendorRegistration
};
