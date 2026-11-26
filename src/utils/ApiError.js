class ApiError extends Error {
  constructor(statusCode, message, code = 'ERROR', details = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, ApiError);
  }

  static badRequest(message = 'Invalid request', code = 'VALIDATION_ERROR', details = []) {
    return new ApiError(400, message, code, details);
  }

  static unauthorized(message = 'Authentication is required', code = 'UNAUTHORIZED') {
    return new ApiError(401, message, code);
  }

  static forbidden(message = 'You do not have permission to perform this action', code = 'FORBIDDEN') {
    return new ApiError(403, message, code);
  }

  static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
    return new ApiError(404, message, code);
  }

  static conflict(message = 'The request conflicts with the current state', code = 'CONFLICT', details = []) {
    return new ApiError(409, message, code, details);
  }

  static serviceUnavailable(message = 'The service is temporarily unavailable', code = 'SERVICE_UNAVAILABLE') {
    return new ApiError(503, message, code);
  }
}

module.exports = ApiError;
