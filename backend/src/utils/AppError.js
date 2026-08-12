/**
 * Custom Error class for operational API errors.
 * Inherits from standard JavaScript Error to retainstack trace.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    
    // Distinguish operational errors (errors we anticipate, like validation, auth, etc.)
    // from programming/system bugs (e.g. ReferenceError, database down, etc.)
    this.isOperational = true;

    // Capture the stack trace, excluding the constructor call from the trace
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
