const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const baseOptions = {
  windowMs: env.rateLimit.windowMs,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again later.',
    accessibilityFeedback: {
      announce: true,
      type: 'error',
      announcement: 'Too many attempts. Please wait before trying again.'
    }
  }
};

const loginLimiter = rateLimit({ ...baseOptions, limit: env.rateLimit.loginMax });
const registerLimiter = rateLimit({ ...baseOptions, limit: env.rateLimit.registerMax });

module.exports = { loginLimiter, registerLimiter };
