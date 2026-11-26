const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return next();

  const details = errors.array().map((error) => ({
    field: error.path || error.param,
    message: error.msg,
    value: error.value
  }));

  return next(ApiError.badRequest('Request validation failed', 'VALIDATION_ERROR', details));
};

module.exports = { validate };
