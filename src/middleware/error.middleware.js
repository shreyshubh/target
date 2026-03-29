const handleDuplicateFieldsDB = err => {
  const value = err.errmsg ? err.errmsg.match(/(["'])(\\?.)*?\1/)[0] : 'Duplicate field';
  const message = `Duplicate field value: ${value}. Please use another value!`;
  return { error: message, statusCode: 400 };
};

const handleValidationErrorDB = err => {
  const errors = Object.values(err.errors).map(el => el.message);
  const message = `Invalid input data. ${errors.join('. ')}`;
  return { error: message, statusCode: 400 };
};

const handleJWTError = () => {
  return { error: 'Invalid token. Please log in again!', statusCode: 401 };
};

const handleJWTExpiredError = () => {
  return { error: 'Your token has expired! Please log in again.', statusCode: 401 };
};

const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      error: err.message
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error('ERROR 💥', err);
    res.status(500).json({
      error: 'Something went very wrong!'
    });
  }
};

const errorHandler = (err, req, res, next) => {
  let errorStatus = err.statusCode || 500;
  let errorMessage = err.message || 'Internal Server Error';

  let customError = { ...err, message: errorMessage, statusCode: errorStatus, isOperational: true };

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    customError.message = `Invalid ${err.path}: ${err.value}.`;
    customError.statusCode = 400;
  }
  
  // Mongoose duplicate key
  if (err.code === 11000) {
    const errorData = handleDuplicateFieldsDB(err);
    customError.message = errorData.error;
    customError.statusCode = errorData.statusCode;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errorData = handleValidationErrorDB(err);
    customError.message = errorData.error;
    customError.statusCode = errorData.statusCode;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const errorData = handleJWTError();
    customError.message = errorData.error;
    customError.statusCode = errorData.statusCode;
  }
  if (err.name === 'TokenExpiredError') {
    const errorData = handleJWTExpiredError();
    customError.message = errorData.error;
    customError.statusCode = errorData.statusCode;
  }

  // Zod Validation Error
  if (err.name === 'ZodError') {
    customError.message = err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
    customError.statusCode = 400;
  }

  sendErrorProd(customError, res);
};

module.exports = errorHandler;
