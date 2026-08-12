/**
 * Unified response format helper to guarantee consistent API structures.
 * 
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Response message explaining the outcome
 * @param {Object|Array|null} [data=null] - Payload data returned to client
 */
const sendResponse = (res, statusCode, message, data = null) => {
    const success = `${statusCode}`.startsWith('2') || `${statusCode}`.startsWith('3');

    const responsePayload = {
        success,
        message,
    };

    if (data !== null && data !== undefined) {
        responsePayload.data = data;
    }

    return res.status(statusCode).json(responsePayload);
};

module.exports = sendResponse;
