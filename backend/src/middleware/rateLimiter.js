const rateLimit = require('express-rate-limit');
const AppError = require('../utils/AppError');

/**
 * Standard API Rate Limiter middleware.
 * Restricts requests from the same IP address.
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res, next) => {
        next(new AppError('Too many requests from this IP. Please try again after 15 minutes.', 429));
    },
});

module.exports = apiLimiter;
