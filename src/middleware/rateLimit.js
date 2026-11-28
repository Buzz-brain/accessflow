const rateLimit = require('express-rate-limit');
const env = require('../config/env');

const baseOptions = {
  windowMs: env.rateLimit.windowMs,
  standardHeaders: true,
  legacyHeaders: false
};

const authLimitMessage = {
  success: false,
  code: 'RATE_LIMITED',
  message: 'Too many authentication attempts. Please try again later.',
  accessibilityFeedback: {
    announce: true,
    type: 'error',
    announcement: 'Too many attempts. Please wait before trying again.'
  }
};

const lookupLimitMessage = {
  success: false,
  code: 'RATE_LIMITED',
  message: 'Too many account searches. Please try again later.',
  accessibilityFeedback: {
    announce: true,
    type: 'error',
    announcement: 'Too many account searches. Please wait before trying again.'
  }
};

const loginLimiter = rateLimit({ ...baseOptions, limit: env.rateLimit.loginMax, message: authLimitMessage });
const registerLimiter = rateLimit({ ...baseOptions, limit: env.rateLimit.registerMax, message: authLimitMessage });
const accountLookupLimiter = rateLimit({ ...baseOptions, limit: env.rateLimit.lookupMax, message: lookupLimitMessage });

module.exports = { loginLimiter, registerLimiter, accountLookupLimiter };
