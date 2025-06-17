/**
 * Validation Utilities
 * Common validation functions for user input
 */

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 255;
}

/**
 * Validate password strength
 * Requirements: At least 8 characters, uppercase, lowercase, number, and special character
 */
export function validatePassword(password: string): boolean {
  if (password.length < 8 || password.length > 128) {
    return false;
  }

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  return hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
}

/**
 * Validate name format (first name, last name)
 */
export function validateName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 50) {
    return false;
  }

  // Allow letters, spaces, hyphens, and apostrophes
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  return nameRegex.test(name.trim());
}

/**
 * Validate organization name
 */
export function validateOrganizationName(name: string): boolean {
  if (!name || name.length < 2 || name.length > 100) {
    return false;
  }

  // Allow letters, numbers, spaces, hyphens, apostrophes, and common punctuation
  const orgNameRegex = /^[a-zA-Z0-9\s\-'.,&()]+$/;
  return orgNameRegex.test(name.trim());
}

/**
 * Validate UUID format
 */
export function validateUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Validate phone number (international format)
 */
export function validatePhoneNumber(phone: string): boolean {
  if (!phone) return true; // Phone is optional

  // Remove all non-digit characters except + at the beginning
  const cleanPhone = phone.replace(/[^\d+]/g, '');
  
  // Must start with + and be 10-15 digits total
  const phoneRegex = /^\+\d{10,15}$/;
  return phoneRegex.test(cleanPhone);
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  if (!url) return true; // URL is optional

  try {
    const urlObj = new URL(url);
    return ['http:', 'https:'].includes(urlObj.protocol);
  } catch {
    return false;
  }
}

/**
 * Validate job title
 */
export function validateJobTitle(title: string): boolean {
  if (!title) return true; // Job title is optional

  if (title.length < 2 || title.length > 100) {
    return false;
  }

  // Allow letters, numbers, spaces, and common punctuation
  const titleRegex = /^[a-zA-Z0-9\s\-'.,&()\/]+$/;
  return titleRegex.test(title.trim());
}

/**
 * Validate industry
 */
export function validateIndustry(industry: string): boolean {
  if (!industry) return true; // Industry is optional

  if (industry.length < 2 || industry.length > 100) {
    return false;
  }

  // Allow letters, numbers, spaces, and common punctuation
  const industryRegex = /^[a-zA-Z0-9\s\-'.,&()\/]+$/;
  return industryRegex.test(industry.trim());
}

/**
 * Validate measurement value
 */
export function validateMeasurementValue(value: any): boolean {
  if (value === null || value === undefined || value === '') {
    return true; // Allow empty values
  }

  const numValue = Number(value);
  return !isNaN(numValue) && isFinite(numValue);
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string, endDate: string): boolean {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    // Check if dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return false;
    }

    // Start date should be before or equal to end date
    return start <= end;
  } catch {
    return false;
  }
}

/**
 * Sanitize HTML content (basic)
 */
export function sanitizeHTML(content: string): string {
  if (!content) return '';

  return content
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate and sanitize text input
 */
export function validateTextInput(text: string, minLength: number = 0, maxLength: number = 1000): {
  isValid: boolean;
  sanitized: string;
  error?: string;
} {
  if (!text) {
    if (minLength > 0) {
      return {
        isValid: false,
        sanitized: '',
        error: `Text must be at least ${minLength} characters`
      };
    }
    return { isValid: true, sanitized: '' };
  }

  const trimmed = text.trim();
  
  if (trimmed.length < minLength) {
    return {
      isValid: false,
      sanitized: trimmed,
      error: `Text must be at least ${minLength} characters`
    };
  }

  if (trimmed.length > maxLength) {
    return {
      isValid: false,
      sanitized: trimmed,
      error: `Text must not exceed ${maxLength} characters`
    };
  }

  return {
    isValid: true,
    sanitized: sanitizeHTML(trimmed)
  };
}