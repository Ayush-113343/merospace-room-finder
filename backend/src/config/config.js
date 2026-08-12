const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((v) => !process.env[v]);
if (missingEnvVars.length > 0) {
    console.error('❌ Missing required environment variables:', missingEnvVars.join(', '));
    console.error('Make sure backend/.env exists with MONGO_URI and JWT_SECRET');
    process.exit(1);
}

const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT, 10) || 5000,
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    corsWhitelist: (process.env.CORS_WHITELIST || '').split(',').map(o => o.trim()).filter(Boolean),
};

module.exports = config;
