// middlewares/combinedSanitizer.js
import xss from 'xss';

function sanitizeValue(value) {
  if (typeof value === 'string') {
    // First sanitize XSS
    let sanitized = xss(value);
    
    // Then remove MongoDB injection characters
    sanitized = sanitized.replace(/\$/g, '');
    sanitized = sanitized.replace(/\./g, '');
    
    return sanitized;
  }
  
  if (Array.isArray(value)) {
    return value.map(item => sanitizeValue(item));
  }
  
  if (typeof value === 'object' && value !== null) {
    const sanitized = {};
    for (let key in value) {
      if (value.hasOwnProperty(key)) {
        // Sanitize both key and value
        const sanitizedKey = sanitizeValue(key);
        sanitized[sanitizedKey] = sanitizeValue(value[key]);
      }
    }
    return sanitized;
  }
  
  return value;
}

function sanitizeRequestObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = {};
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      sanitized[key] = sanitizeValue(obj[key]);
    }
  }
  return sanitized;
}

export function combinedSanitizer(options = {}) {
  // Default excluded routes
  const defaultExcluded = [
    '/health',
    '/api/v1/csrf-token',
    '/api/v1/cdn/video/upload/callback',
    '/api/v1/users/auth/oauth/google/callback',
    '/api/v1/users/auth/oauth/github/callback',
    '/api/v1/users/auth/oauth/spotify/callback',
    '/api/v1/users/auth/oauth/facebook/callback',
    '/api/v1/users/auth/oauth/microsoft/callback',
    '/api/v1/users/auth/oauth/callback',
    '/api/v1/users/auth/oauth',
  ];
  
  const excludedRoutes = options.excludedRoutes || defaultExcluded;
  const excludedMethods = options.excludedMethods || [];
  
  return function(req, res, next) {
    try {
      // Check if current route should be excluded
      const shouldExclude = excludedRoutes.some(route => {
        if (typeof route === 'string') {
          return req.path === route || req.path.startsWith(route);
        }
        if (route instanceof RegExp) {
          return route.test(req.path);
        }
        return false;
      });
      
      // Check if current method should be excluded
      const methodExcluded = excludedMethods.includes(req.method);
      
      if (shouldExclude || methodExcluded) {
        return next(); // Skip sanitization
      }
      
      // Sanitize req.body (writable)
      if (req.body) {
        req.body = sanitizeRequestObject(req.body);
      }
      
      // Handle req.query (read-only) - modify properties individually
      if (req.query && Object.keys(req.query).length > 0) {
        const sanitizedQuery = sanitizeRequestObject(req.query);
        
        // Clear existing properties
        for (let key in req.query) {
          delete req.query[key];
        }
        
        // Set sanitized properties
        Object.assign(req.query, sanitizedQuery);
      }
      
      // Handle req.params (read-only) - modify properties individually  
      if (req.params && Object.keys(req.params).length > 0) {
        const sanitizedParams = sanitizeRequestObject(req.params);
        
        // Clear existing properties
        for (let key in req.params) {
          delete req.params[key];
        }
        
        // Set sanitized properties
        Object.assign(req.params, sanitizedParams);
      }
      
      next();
    } catch (error) {
      console.error('Sanitization error:', error);
      next(error);
    }
  };
}

