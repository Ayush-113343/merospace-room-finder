const config = require('./config/config');
const logger = require('./utils/logger');

/**
 * Capture uncaught synchronous exceptions.
 * Prevents process from keeping state in corrupted flows.
 */
process.on('uncaughtException', (err) => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    process.exit(1);
});

const app = require('./app');

const server = app.listen(config.port, () => {
    logger.info(`🚀 Server running in ${config.env} mode on port ${config.port}`);
});

/**
 * Capture unhandled asynchronous promise rejections.
 * Closes server connections prior to exiting process.
 */
process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
    server.close(() => {
        process.exit(1);
    });
});

/**
 * Graceful process termination handler (SIGTERM / SIGINT).
 * Permits the node server to finalize pending HTTP actions before exiting.
 */
const handleGracefulShutdown = (signal) => {
    logger.info(`Received ${signal}. Shutting down server gracefully...`);
    server.close(() => {
        logger.info('HTTP server closed. Process terminated safely.');
        process.exit(0);
    });
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));