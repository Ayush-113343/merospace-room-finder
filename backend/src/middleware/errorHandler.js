const sendResponse = require('../utils/sendResponse');
const logger = require('../utils/logger');

/**
 * Handle errors in Development Environment.
 * Detailed log of the error and stack trace sent to client.
 */
const sendErrorDev = (err, res) => {
    return res.status(err.statusCode).json({
        success: false,
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack,
    });
};

/**
 * Handle errors in Production Environment.
 * Hide internal system details from clients.
 */
const sendErrorProd = (err, res) => {
    // Operational, trusted error: send message to clean client
    if (err.isOperational) {
        return sendResponse(res, err.statusCode, err.message);
    }

    // Programming or other unknown error (e.g. database down, reference error): log it and hide details
    logger.error('💥 UNEXPECTED SYSTEM ERROR: %o', err);

    return sendResponse(res, 500, 'Something went very wrong!');
};

/**
 * Global Express Error Handling Middleware.
 */
const errorHandler = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log all errors through winston
    if (err.statusCode >= 500) {
        logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    } else {
        logger.warn(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else {
        // Make a copy of err for safe mutation
        let error = { ...err };
        error.message = err.message;
        error.isOperational = err.isOperational;
        error.statusCode = err.statusCode;
        error.status = err.status;

        sendErrorProd(error, res);
    }
};

module.exports = errorHandler;
