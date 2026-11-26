const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const { sendError, errorFeedback } = require('../utils/response');

const notFound = (req, res, next) => {
  next(new ApiError(404, `Endpoint ${req.method} ${req.originalUrl} was not found`, 'NOT_FOUND'));
};

const handleMongooseError = (error) => {
  if (error instanceof mongoose.Error.ValidationError) {
    const details = Object.values(error.errors).map((item) => ({ field: item.path, message: item.message }));
    return ApiError.badRequest('Data validation failed', 'VALIDATION_ERROR', details);
  }

  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`${error.path} is not a valid identifier`);
  }

  if (error.code === 11000) {
    const fields = Object.keys(error.keyPattern || {}).join(', ') || 'field';
    return ApiError.conflict(`${fields} must be unique`, 'DUPLICATE_VALUE');
  }

  return null;
};

const errorHandler = (err, req, res, next) => {
  if (err.type === 'entity.parse.failed') {
    err = ApiError.badRequest('The request body contains invalid JSON');
  }

  const error = handleMongooseError(err) || err;

  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal server error';
  let code = error.code || 'INTERNAL_ERROR';
  let details = error.details || [];

  if (error instanceof jwt.JsonWebTokenError) {
    statusCode = 401;
    message = 'The access token is invalid';
    code = 'UNAUTHORIZED';
  }

  if (statusCode >= 500) {
    console.error('[Error]', err);
    message = 'Internal server error';
    details = [];
    code = 'INTERNAL_ERROR';
  }

  return sendError(res, {
    status: statusCode,
    message,
    code,
    details,
    accessibilityFeedback: error.accessibilityFeedback || errorFeedback(`Error. ${message}`)
  });
};

module.exports = { notFound, errorHandler };
