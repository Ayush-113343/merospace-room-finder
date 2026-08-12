const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');

// Load .env FIRST before anything else
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./config/db');
const config = require('./config/config');
const logger = require('./utils/logger');
const sendResponse = require('./utils/sendResponse');
const AppError = require('./utils/AppError');
const apiLimiter = require('./middleware/rateLimiter');
const errorHandler = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const roomRoutes = require('./routes/rooms');
const adminRoutes = require('./routes/admin');
const favouriteRoutes = require('./routes/favourites');

// Connect to MongoDB
connectDB();

const app = express();

// ─── 1) SECURITY & LOGGING ───────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

const corsOptions = {
    origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (config.corsWhitelist.length === 0 || config.corsWhitelist.includes(origin)) {
            return callback(null, true);
        }
        return callback(new AppError('Blocked by CORS.', 403));
    },
    credentials: true,
};
app.use(cors(corsOptions));

const morganStream = { write: (msg) => logger.info(msg.trim()) };
app.use(morgan('dev', { stream: morganStream }));

// ─── 2) BODY PARSERS ─────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// ─── 3) API ROUTES (mount BEFORE static files) ───────────────────────────────
app.use('/api', apiLimiter);

app.get('/api/health', (req, res) => {
    sendResponse(res, 200, 'Server is healthy', { uptime: process.uptime() });
});

app.use('/api/auth',     authRoutes);
app.use('/api/rooms',    roomRoutes);
app.use('/api/admin',    adminRoutes);
app.use('/api/favorites', favouriteRoutes);

// ─── 4) STATIC FILES ─────────────────────────────────────────────────────────
const frontend = path.join(__dirname, '../../frontend');
const adminDir  = path.join(__dirname, '../admin');

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use(express.static(frontend));
app.use('/admin', express.static(adminDir));

// ─── 5) CLEAN PAGE URLS (no .html) ───────────────────────────────────────────
// Frontend pages
app.get('/rooms',        (req, res) => res.sendFile(path.join(frontend, 'rooms.html')));
app.get('/login',        (req, res) => res.sendFile(path.join(frontend, 'login.html')));
app.get('/register',     (req, res) => res.sendFile(path.join(frontend, 'register.html')));
app.get('/add-room',     (req, res) => res.sendFile(path.join(frontend, 'add-room.html')));
app.get('/my-rooms',     (req, res) => res.sendFile(path.join(frontend, 'my-rooms.html')));
app.get('/favorites',    (req, res) => res.sendFile(path.join(frontend, 'favorites.html')));
app.get('/room-details', (req, res) => res.sendFile(path.join(frontend, 'room-details.html')));
app.get('/contact',      (req, res) => res.sendFile(path.join(frontend, 'contact.html')));
app.get('/about',        (req, res) => res.sendFile(path.join(frontend, 'about.html')));

// Admin pages — use exact paths, must come after static middleware
app.get('/admin',           (req, res) => res.sendFile(path.join(adminDir, 'index.html')));
app.get('/admin/login',     (req, res) => res.sendFile(path.join(adminDir, 'login.html')));
app.get('/admin/dashboard', (req, res) => res.sendFile(path.join(adminDir, 'index.html')));
app.get('/admin/rooms',     (req, res) => res.sendFile(path.join(adminDir, 'rooms.html')));
app.get('/admin/users',     (req, res) => res.sendFile(path.join(adminDir, 'users.html')));
app.get('/admin/settings',  (req, res) => res.sendFile(path.join(adminDir, 'settings.html')));
app.get('/admin/pending',   (req, res) => res.sendFile(path.join(adminDir, 'pending.html')));
app.get('/admin/analytics', (req, res) => res.sendFile(path.join(adminDir, 'analytics.html')));

// ─── 6) 404 FALLBACK ─────────────────────────────────────────────────────────
app.all(/(.*)/, (req, res, next) => {
    // For API routes return JSON 404
    if (req.originalUrl.startsWith('/api')) {
        return next(new AppError(`API route not found: ${req.originalUrl}`, 404));
    }
    // For page routes send home
    res.sendFile(path.join(frontend, 'index.html'));
});

// ─── 7) ERROR HANDLER ────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
