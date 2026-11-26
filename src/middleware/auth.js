const jwt = require('jsonwebtoken');
const User = require('../models/User');
const env = require('../config/env');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { ROLES } = require('../constants');

const protect = asyncHandler(async (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('A Bearer access token is required');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw ApiError.unauthorized('The access token is invalid or has expired');
  }

  const user = await User.findById(decoded.sub).select('+isActive');

  if (!user || !user.isActive) {
    throw ApiError.unauthorized('This account is not active');
  }

  req.user = user;
  req.token = token;
  next();
});

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!allowedRoles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};

const requireAdmin = authorize(ROLES.ADMIN);

module.exports = { protect, authorize, requireAdmin };
