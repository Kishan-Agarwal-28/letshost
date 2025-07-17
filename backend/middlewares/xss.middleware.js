// middlewares/xssSanitizer.js
import xss from 'xss';

function sanitizeInput(obj) {
  if (typeof obj === 'string') return xss(obj);
  if (typeof obj === 'object' && obj !== null) {
    for (let key in obj) {
      obj[key] = sanitizeInput(obj[key]);
    }
  }
  return obj;
}

export function xssSanitizer(req, res, next) {
  req.body = sanitizeInput(req.body);
  req.query = sanitizeInput(req.query);
  req.params = sanitizeInput(req.params);
  next();
}
