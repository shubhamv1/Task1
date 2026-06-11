const AppError = require('../utils/AppError');

const handleMongooseDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field} already exists`, 400);
};

const handleMongooseValidation = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(messages.join('. '), 400);
};

const handleJWT = () => new AppError('Invalid token', 401);
const handleJWTExpired = () => new AppError('Token expired', 401);

const errorHandler = (err, req, res, next) => {
  let error = { ...err, message: err.message };

  if (err.code === 11000) error = handleMongooseDuplicateKey(err);
  if (err.name === 'ValidationError') error = handleMongooseValidation(err);
  if (err.name === 'JsonWebTokenError') error = handleJWT();
  if (err.name === 'TokenExpiredError') error = handleJWTExpired();

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
