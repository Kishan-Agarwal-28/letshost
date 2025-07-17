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

export function combinedSanitizer(req, res, next) {
  try {
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
}
