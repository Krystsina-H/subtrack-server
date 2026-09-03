const rateLimit = require('express-rate-limit');

// Limiter for auth endpoints: 20 attempts per 15 minutes per IP
exports.authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many attempts, please try again later' },
});
