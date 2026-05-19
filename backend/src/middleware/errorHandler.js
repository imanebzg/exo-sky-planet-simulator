const { NODE_ENV } = require('../config/env');

/**
 * Centralised Express error handler.
 * Catches both expected (with .status) and unexpected errors.
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';

  // Log stack trace in development
  if (NODE_ENV === 'development') {
    console.error(`[${new Date().toISOString()}] ${status} — ${message}`);
    console.error(err.stack);
  }

  res.status(status).json({
    error: message,
    ...(NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;
