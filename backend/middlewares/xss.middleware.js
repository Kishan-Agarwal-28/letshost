// middlewares/xssSanitizer.js
import xss from 'xss';

function sanitizeInput(obj) {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeInput(item));
  }
  if (typeof obj === 'object' && obj !== null) {
    const sanitized = {};
    for (let key in obj) {
      if (obj.hasOwnProperty(key)) {
        sanitized[key] = sanitizeInput(obj[key]);
      }
    }
    return sanitized;
  }
  return obj;
}

export function xssSanitizer(req, res, next) {
  // Sanitize req.body (this can be reassigned)
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  
  // For req.query and req.params, we need to modify properties individually
  // since they are getter-only properties
  if (req.query) {
    const sanitizedQuery = sanitizeInput(req.query);
    // Clear existing query properties and set sanitized ones
    Object.keys(req.query).forEach(key => {
      delete req.query[key];
    });
    Object.assign(req.query, sanitizedQuery);
  }
  
  if (req.params) {
    const sanitizedParams = sanitizeInput(req.params);
    // Clear existing params properties and set sanitized ones
    Object.keys(req.params).forEach(key => {
      delete req.params[key];
    });
    Object.assign(req.params, sanitizedParams);
  }
  
  next();
}