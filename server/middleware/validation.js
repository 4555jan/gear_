const { validationResult } = require('express-validator');

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value
    }));
    
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors: errorMessages
    });
  }
  
  next();
};

// Error formatting for production
const formatError = (err, req, res, next) => {
  console.error('Server Error:', err);
  
  // MongoDB duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      message: `${field} already exists`,
      code: 'DUPLICATE_VALUE',
      field
    });
  }
  
  // MongoDB validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));
    
    return res.status(400).json({
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      errors
    });
  }
  
  // MongoDB CastError
  if (err.name === 'CastError') {
    return res.status(400).json({
      message: 'Invalid ID format',
      code: 'INVALID_ID',
      field: err.path
    });
  }
  
  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Not found middleware
const notFound = (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

module.exports = {
  handleValidationErrors,
  formatError,
  asyncHandler,
  notFound
};