// middlewares/combinedSanitizer.js
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
 * Sanitizes a single value recursively
 * @param {any} value - The value to sanitize
 * @param {number} depth - Current recursion depth
 * @param {number} maxDepth - Maximum allowed recursion depth
 * @param {WeakSet} visited - Set to track visited objects (circular reference protection)
 * @returns {any} - The sanitized value
 */
function sanitizeValue(
  value,
  depth = 0,
  maxDepth = 10,
  visited = new WeakSet()
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

  // Handle strings
  if (typeof value === "string") {
    try {
      // First sanitize XSS
      let sanitized = xss(value, xssOptions);

      // Remove MongoDB injection characters
      sanitized = sanitized.replace(/\$/g, "");
      sanitized = sanitized.replace(/\./g, "");

      // Remove null bytes and other dangerous characters
      sanitized = sanitized.replace(/\0/g, "");
      sanitized = sanitized.replace(/\x00/g, "");

      return sanitized;
    } catch (error) {
      console.error("String sanitization error:", error);
      return "";
    }
  }

  // Handle numbers, booleans, and other primitives
  if (typeof value === "number" || typeof value === "boolean") {
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
      const sanitized = value.map((item, index) => {
        try {
          return sanitizeValue(item, depth + 1, maxDepth, visited);
        } catch (error) {
          console.error(
            `Array item sanitization error at index ${index}:`,
            error
          );
          return null;
        }
      });

      visited.delete(value);
      return sanitized;
    } catch (error) {
      visited.delete(value);
      console.error("Array sanitization error:", error);
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

      // Use Object.keys to safely iterate
      const keys = Object.keys(value);

      for (const key of keys) {
        try {
          // Sanitize the key
          const sanitizedKey = sanitizeValue(key, depth + 1, maxDepth, visited);

          // Only proceed if key is a valid string
          if (typeof sanitizedKey === "string" && sanitizedKey.length > 0) {
            // Sanitize the value
            sanitized[sanitizedKey] = sanitizeValue(
              value[key],
              depth + 1,
              maxDepth,
              visited
            );
          }
        } catch (error) {
          console.error(
            `Object property sanitization error for key "${key}":`,
            error
          );
          // Continue with other properties
        }
      }

      visited.delete(value);
      return sanitized;
    } catch (error) {
      visited.delete(value);
      console.error("Object sanitization error:", error);
      return {};
    }
  }

  // Handle functions (remove them)
  if (typeof value === "function") {
    console.warn("Function detected and removed during sanitization");
    return undefined;
  }

  // Handle symbols (remove them)
  if (typeof value === "symbol") {
    console.warn("Symbol detected and removed during sanitization");
    return undefined;
  }

  // Handle other object types (Date, RegExp, etc.) - convert to string or remove
  if (typeof value === "object") {
    try {
      // For Date objects, return ISO string
      if (value instanceof Date) {
        return value.toISOString();
      }

      // For RegExp objects, return string representation
      if (value instanceof RegExp) {
        return value.toString();
      }

      // For other objects, try to convert to string
      const stringValue = String(value);
      return sanitizeValue(stringValue, depth + 1, maxDepth, visited);
    } catch (error) {
      console.error("Object conversion error:", error);
      return null;
    }
  }

  // Default: return null for unknown types
  console.warn("Unknown value type detected, returning null:", typeof value);
  return null;
}

/**
 * Sanitizes a request object (req.body, req.query, req.params)
 * @param {any} obj - The object to sanitize
 * @returns {any} - The sanitized object
 */
function sanitizeRequestObject(obj) {
  if (!obj) {
    return obj;
  }

  try {
    return sanitizeValue(obj);
  } catch (error) {
    console.error("Request object sanitization error:", error);
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
 * Creates the combined sanitizer middleware
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

  const excludedRoutes = options.excludedRoutes || defaultExcluded;
  const excludedMethods = options.excludedMethods || [];
  const maxDepth = options.maxDepth || 10;
  const logErrors = options.logErrors !== false; // Default to true

  return function (req, res, next) {
    try {
      // Validate request object
      if (!req || typeof req !== "object") {
        console.error("Invalid request object");
        return next(new Error("Invalid request object"));
      }

      // Check if current route should be excluded
      const shouldExclude = excludedRoutes.some((route) => {
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
      const methodExcluded = excludedMethods.includes(req.method);

      if (shouldExclude || methodExcluded) {
        return next(); // Skip sanitization
      }

      // Sanitize req.body (usually writable)
      if (req.body !== undefined) {
        try {
          req.body = sanitizeRequestObject(req.body);
        } catch (error) {
          if (logErrors) {
            console.error("Body sanitization error:", error);
          }
          req.body = {};
        }
      }

      // Handle req.query (often read-only)
      if (req.query && typeof req.query === "object") {
        try {
          const sanitizedQuery = sanitizeRequestObject(req.query);
          safeAssign(req.query, sanitizedQuery);
        } catch (error) {
          if (logErrors) {
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
          const sanitizedParams = sanitizeRequestObject(req.params);
          safeAssign(req.params, sanitizedParams);
        } catch (error) {
          if (logErrors) {
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
      if (logErrors) {
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
  isPlainObject,
  hasOwnProperty,
  safeAssign,
};
