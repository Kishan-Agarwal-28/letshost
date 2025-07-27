// middlewares/combinedSanitizer.js
import validator from "validator";
import xss from "xss";

// Configure XSS options for more robust sanitization
const xssOptions = {
  whiteList: {
    // Only allow very basic HTML tags if needed
    // Remove this entirely if you want to strip all HTML
  },
  stripIgnoreTag: true,
  stripIgnoreTagBody: ["script", "style"],
  allowCommentTag: false,
  css: false, // Disable CSS filtering to prevent CSS injection
};

// Validator.js sanitization options
const validatorOptions = {
  // Default options for various sanitization methods
  normalizeEmail: {
    gmail_lowercase: true,
    gmail_remove_dots: false,
    outlookdotcom_lowercase: true,
    yahoo_lowercase: true,
    icloud_lowercase: true,
  },
  escape: {
    // HTML entities to escape
  },
  trim: {
    chars: " \t\n\r\0\x0B", // Characters to trim
  },
};

/**
 * Safely checks if an object has its own property
 * @param {any} obj - The object to check
 * @param {string} key - The property key
 * @returns {boolean} - True if the object has the property
 */
function hasOwnProperty(obj, key) {
  try {
    return Object.prototype.hasOwnProperty.call(obj, key);
  } catch (error) {
    return false;
  }
}

/**
 * Determines if a value is a plain object (not array, null, Date, etc.)
 * @param {any} value - The value to check
 * @returns {boolean} - True if it's a plain object
 */
function isPlainObject(value) {
  if (!value || typeof value !== "object") {
    return false;
  }

  // Check for null
  if (value === null) {
    return false;
  }

  // Check for arrays
  if (Array.isArray(value)) {
    return false;
  }

  // Check for Date, RegExp, and other built-in objects
  if (
    value instanceof Date ||
    value instanceof RegExp ||
    value instanceof Error
  ) {
    return false;
  }

  // Check for Buffer (Node.js)
  if (typeof Buffer !== "undefined" && value instanceof Buffer) {
    return false;
  }

  // Check for objects with null prototype or plain objects
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

/**
 * Detects the type of string content for appropriate sanitization
 * @param {string} value - The string value to analyze
 * @param {string} fieldName - The field name for context
 * @returns {string} - The detected type: 'email', 'url', 'html', 'json', 'number', 'boolean', 'text'
 */
function detectStringType(value, fieldName = "") {
  if (!value || typeof value !== "string") {
    return "text";
  }

  const trimmedValue = value.trim();

  // Check for email
  if (validator.isEmail(trimmedValue) || fieldName.toLowerCase().includes("email")) {
    return "email";
  }

  // Check for URL
  if (validator.isURL(trimmedValue, { require_protocol: false }) || 
      fieldName.toLowerCase().includes("url") || 
      fieldName.toLowerCase().includes("link")) {
    return "url";
  }

  // Check for HTML content
  if (/<[^>]*>/g.test(trimmedValue) || fieldName.toLowerCase().includes("html")) {
    return "html";
  }

  // Check for JSON
  if ((trimmedValue.startsWith("{") && trimmedValue.endsWith("}")) ||
      (trimmedValue.startsWith("[") && trimmedValue.endsWith("]"))) {
    try {
      JSON.parse(trimmedValue);
      return "json";
    } catch (e) {
      // Not valid JSON, continue checking
    }
  }

  // Check for numbers
  if (validator.isNumeric(trimmedValue) || validator.isFloat(trimmedValue)) {
    return "number";
  }

  // Check for booleans
  if (validator.isBoolean(trimmedValue)) {
    return "boolean";
  }

  // Default to text
  return "text";
}

/**
 * Sanitizes a string value based on its detected type
 * @param {string} value - The string value to sanitize
 * @param {string} fieldName - The field name for context
 * @param {object} options - Sanitization options
 * @returns {string} - The sanitized string
 */
function sanitizeString(value, fieldName = "", options = {}) {
  if (typeof value !== "string") {
    return String(value);
  }

  let sanitized = value;

  try {
    // First, basic cleanup
    sanitized = validator.trim(sanitized);
    
    // Remove null bytes and dangerous characters
    sanitized = sanitized.replace(/\0/g, "");
    sanitized = sanitized.replace(/\x00/g, "");
    
    // Detect string type for appropriate sanitization
    const stringType = detectStringType(sanitized, fieldName);

    switch (stringType) {
      case "email":
        // Normalize and escape email
        if (validator.isEmail(sanitized)) {
          sanitized = validator.normalizeEmail(sanitized, validatorOptions.normalizeEmail) || sanitized;
        }
        sanitized = validator.escape(sanitized);
        break;

      case "url":
        // Sanitize URL
        if (validator.isURL(sanitized, { require_protocol: false })) {
          // Add protocol if missing
          if (!sanitized.match(/^https?:\/\//)) {
            sanitized = "https://" + sanitized;
          }
          // Validate again after adding protocol
          if (!validator.isURL(sanitized)) {
            sanitized = "";
          }
        } else {
          sanitized = validator.escape(sanitized);
        }
        break;

      case "html":
        // Use XSS sanitization for HTML content
        sanitized = xss(sanitized, xssOptions);
        break;

      case "json":
        // For JSON strings, parse and re-stringify to ensure validity
        try {
          const parsed = JSON.parse(sanitized);
          sanitized = JSON.stringify(parsed);
        } catch (e) {
          // If not valid JSON, escape it
          sanitized = validator.escape(sanitized);
        }
        break;

      case "number":
        // Keep numeric strings as is, but validate
        if (!validator.isNumeric(sanitized) && !validator.isFloat(sanitized)) {
          sanitized = "";
        }
        break;

      case "boolean":
        // Normalize boolean strings
        if (validator.isBoolean(sanitized)) {
          sanitized = validator.toBoolean(sanitized, true).toString();
        }
        break;

      case "text":
      default:
        // For regular text, escape HTML entities and remove injection patterns
        sanitized = validator.escape(sanitized);
        break;
    }

    // Additional security sanitization
    // Remove MongoDB injection characters
    sanitized = sanitized.replace(/\$/g, "");
    
    // Handle dots more carefully - only remove if they appear to be injection attempts
    if (fieldName !== "email" && fieldName !== "url" && fieldName !== "domain") {
      // Only remove dots in suspicious patterns
      sanitized = sanitized.replace(/\.{2,}/g, ""); // Multiple consecutive dots
      sanitized = sanitized.replace(/\$\./g, ""); // $. patterns
    }

    // Remove script injection patterns
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");
    sanitized = sanitized.replace(/javascript:/gi, "");
    sanitized = sanitized.replace(/on\w+\s*=/gi, "");

    // Limit length to prevent DoS attacks
    const maxLength = options.maxLength || 10000;
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
      console.warn(`String truncated to ${maxLength} characters for field: ${fieldName}`);
    }

    return sanitized;

  } catch (error) {
    console.error(`String sanitization error for field "${fieldName}":`, error);
    return validator.escape(String(value));
  }
}

/**
 * Sanitizes a single value recursively with enhanced validator.js integration
 * @param {any} value - The value to sanitize
 * @param {string} fieldName - The field name for context
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum allowed recursion depth
 * @param {WeakSet} visited - Set to track visited objects (circular reference protection)
 * @param {object} options - Sanitization options
 * @returns {any} - The sanitized value
 */
function sanitizeValue(
  value,
  fieldName = "",
  depth = 0,
  maxDepth = 10,
  visited = new WeakSet(),
  options = {}
) {
  // Prevent infinite recursion
  if (depth > maxDepth) {
    console.warn("Maximum sanitization depth exceeded, truncating");
    return null;
  }

  // Handle primitive values
  if (value === null || value === undefined) {
    return value;
  }

  // Handle strings with enhanced validation
  if (typeof value === "string") {
    return sanitizeString(value, fieldName, options);
  }

  // Handle numbers
  if (typeof value === "number") {
    // Check for dangerous number values
    if (!Number.isFinite(value)) {
      console.warn(`Non-finite number detected for field "${fieldName}", converting to 0`);
      return 0;
    }
    
    // Check for extremely large or small numbers that might cause issues
    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      console.warn(`Unsafe number detected for field "${fieldName}", clamping`);
      return value > 0 ? Number.MAX_SAFE_INTEGER : Number.MIN_SAFE_INTEGER;
    }
    
    return value;
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value;
  }

  // Handle arrays
  if (Array.isArray(value)) {
    // Check for circular references
    if (visited.has(value)) {
      console.warn("Circular reference detected in array, skipping");
      return [];
    }

    visited.add(value);

    try {
      // Limit array length to prevent DoS
      const maxArrayLength = options.maxArrayLength || 1000;
      const limitedArray = value.slice(0, maxArrayLength);
      
      if (value.length > maxArrayLength) {
        console.warn(`Array truncated to ${maxArrayLength} items for field "${fieldName}"`);
      }

      const sanitized = limitedArray.map((item, index) => {
        try {
          const itemFieldName = `${fieldName}[${index}]`;
          return sanitizeValue(item, itemFieldName, depth + 1, maxDepth, visited, options);
        } catch (error) {
          console.error(
            `Array item sanitization error at index ${index} for field "${fieldName}":`,
            error
          );
          return null;
        }
      });

      visited.delete(value);
      return sanitized;
    } catch (error) {
      visited.delete(value);
      console.error(`Array sanitization error for field "${fieldName}":`, error);
      return [];
    }
  }

  // Handle plain objects
  if (isPlainObject(value)) {
    // Check for circular references
    if (visited.has(value)) {
      console.warn("Circular reference detected in object, skipping");
      return {};
    }

    visited.add(value);

    try {
      const sanitized = {};

      // Limit object properties to prevent DoS
      const keys = Object.keys(value);
      const maxObjectKeys = options.maxObjectKeys || 100;
      const limitedKeys = keys.slice(0, maxObjectKeys);
      
      if (keys.length > maxObjectKeys) {
        console.warn(`Object keys truncated to ${maxObjectKeys} for field "${fieldName}"`);
      }

      for (const key of limitedKeys) {
        try {
          // Sanitize the key
          const sanitizedKey = sanitizeString(key, "key", options);

          // Only proceed if key is a valid string
          if (typeof sanitizedKey === "string" && sanitizedKey.length > 0) {
            // Create field name for nested value
            const nestedFieldName = fieldName ? `${fieldName}.${sanitizedKey}` : sanitizedKey;
            
            // Sanitize the value
            sanitized[sanitizedKey] = sanitizeValue(
              value[key],
              nestedFieldName,
              depth + 1,
              maxDepth,
              visited,
              options
            );
          }
        } catch (error) {
          console.error(
            `Object property sanitization error for key "${key}" in field "${fieldName}":`,
            error
          );
          // Continue with other properties
        }
      }

      visited.delete(value);
      return sanitized;
    } catch (error) {
      visited.delete(value);
      console.error(`Object sanitization error for field "${fieldName}":`, error);
      return {};
    }
  }

  // Handle functions (remove them)
  if (typeof value === "function") {
    console.warn(`Function detected and removed during sanitization for field "${fieldName}"`);
    return undefined;
  }

  // Handle symbols (remove them)
  if (typeof value === "symbol") {
    console.warn(`Symbol detected and removed during sanitization for field "${fieldName}"`);
    return undefined;
  }

  // Handle other object types (Date, RegExp, etc.)
  if (typeof value === "object") {
    try {
      // For Date objects, validate and return ISO string
      if (value instanceof Date) {
        if (isNaN(value.getTime())) {
          console.warn(`Invalid Date detected for field "${fieldName}", returning null`);
          return null;
        }
        return value.toISOString();
      }

      // For RegExp objects, return string representation
      if (value instanceof RegExp) {
        return value.toString();
      }

      // For Error objects, return safe representation
      if (value instanceof Error) {
        return {
          name: validator.escape(value.name || "Error"),
          message: validator.escape(value.message || ""),
        };
      }

      // For other objects, try to convert to string and sanitize
      const stringValue = String(value);
      return sanitizeValue(stringValue, fieldName, depth + 1, maxDepth, visited, options);
    } catch (error) {
      console.error(`Object conversion error for field "${fieldName}":`, error);
      return null;
    }
  }

  // Default: return null for unknown types
  console.warn(`Unknown value type detected for field "${fieldName}", returning null:`, typeof value);
  return null;
}

/**
 * Sanitizes a request object (req.body, req.query, req.params) with enhanced validation
 * @param {any} obj - The object to sanitize
 * @param {string} objectName - Name of the object being sanitized (for logging)
 * @param {object} options - Sanitization options
 * @returns {any} - The sanitized object
 */
function sanitizeRequestObject(obj, objectName = "request", options = {}) {
  if (!obj) {
    return obj;
  }

  try {
    return sanitizeValue(obj, objectName, 0, options.maxDepth || 10, new WeakSet(), options);
  } catch (error) {
    console.error(`Request object sanitization error for ${objectName}:`, error);
    return {};
  }
}

/**
 * Safely assigns properties to a target object
 * @param {object} target - The target object
 * @param {object} source - The source object
 */
function safeAssign(target, source) {
  if (
    !target ||
    !source ||
    typeof target !== "object" ||
    typeof source !== "object"
  ) {
    return;
  }

  try {
    // Clear existing properties first
    const existingKeys = Object.keys(target);
    for (const key of existingKeys) {
      try {
        delete target[key];
      } catch (error) {
        // Some properties might not be deletable
        console.warn(`Cannot delete property "${key}":`, error.message);
      }
    }

    // Assign new properties
    Object.assign(target, source);
  } catch (error) {
    console.error("Safe assign error:", error);
  }
}

/**
 * Creates the enhanced combined sanitizer middleware with validator.js integration
 * @param {object} options - Configuration options
 * @returns {function} - The middleware function
 */
export function combinedSanitizer(options = {}) {
  // Default excluded routes
  const defaultExcluded = [
    "/health",
    "/api/v1/csrf-token",
    "/api/v1/cdn/video/upload/callback",
    "/api/v1/users/auth/oauth/google/callback",
    "/api/v1/users/auth/oauth/github/callback",
    "/api/v1/users/auth/oauth/spotify/callback",
    "/api/v1/users/auth/oauth/facebook/callback",
    "/api/v1/users/auth/oauth/microsoft/callback",
    "/api/v1/users/auth/oauth/callback",
    "/api/v1/users/auth/oauth",
  ];

  const config = {
    excludedRoutes: options.excludedRoutes || defaultExcluded,
    excludedMethods: options.excludedMethods || [],
    maxDepth: options.maxDepth || 10,
    maxLength: options.maxLength || 10000,
    maxArrayLength: options.maxArrayLength || 1000,
    maxObjectKeys: options.maxObjectKeys || 100,
    logErrors: options.logErrors !== false, // Default to true
    strictMode: options.strictMode || false, // More aggressive sanitization
  };

  return function (req, res, next) {
    try {
      // Validate request object
      if (!req || typeof req !== "object") {
        console.error("Invalid request object");
        return next(new Error("Invalid request object"));
      }

      // Check if current route should be excluded
      const shouldExclude = config.excludedRoutes.some((route) => {
        try {
          if (typeof route === "string") {
            return req.path === route || req.path.startsWith(route);
          }
          if (route instanceof RegExp) {
            return route.test(req.path);
          }
          return false;
        } catch (error) {
          console.error("Route exclusion check error:", error);
          return false;
        }
      });

      // Check if current method should be excluded
      const methodExcluded = config.excludedMethods.includes(req.method);

      if (shouldExclude || methodExcluded) {
        return next(); // Skip sanitization
      }

      // Sanitize req.body (usually writable)
      if (req.body !== undefined) {
        try {
          req.body = sanitizeRequestObject(req.body, "body", config);
        } catch (error) {
          if (config.logErrors) {
            console.error("Body sanitization error:", error);
          }
          req.body = {};
        }
      }

      // Handle req.query (often read-only)
      if (req.query && typeof req.query === "object") {
        try {
          const sanitizedQuery = sanitizeRequestObject(req.query, "query", config);
          safeAssign(req.query, sanitizedQuery);
        } catch (error) {
          if (config.logErrors) {
            console.error("Query sanitization error:", error);
          }
          // Try to clear the query object
          try {
            Object.keys(req.query).forEach((key) => {
              delete req.query[key];
            });
          } catch (clearError) {
            console.error("Query clearing error:", clearError);
          }
        }
      }

      // Handle req.params (often read-only)
      if (req.params && typeof req.params === "object") {
        try {
          const sanitizedParams = sanitizeRequestObject(req.params, "params", config);
          safeAssign(req.params, sanitizedParams);
        } catch (error) {
          if (config.logErrors) {
            console.error("Params sanitization error:", error);
          }
          // Try to clear the params object
          try {
            Object.keys(req.params).forEach((key) => {
              delete req.params[key];
            });
          } catch (clearError) {
            console.error("Params clearing error:", clearError);
          }
        }
      }

      next();
    } catch (error) {
      if (config.logErrors) {
        console.error("Sanitization middleware error:", error);
      }

      // Pass the error to Express error handler
      next(error);
    }
  };
}

// Export individual functions for testing
export {
  sanitizeValue,
  sanitizeRequestObject,
  sanitizeString,
  detectStringType,
  isPlainObject,
  hasOwnProperty,
  safeAssign,
  validatorOptions,
};