const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');

const exoplanetRoutes = require('./routes/exoplanetRoutes');
const nasaRoutes = require('./routes/nasaRoutes');
const mlRoutes = require('./routes/mlRoutes');
const errorHandler = require('./middleware/errorHandler');
const { API_VERSION, ALLOWED_ORIGIN } = require('./config/env');

const app = express();

// ─── Security & Middleware ────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'] }));
app.use(express.json());
app.use(morgan('dev'));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use(limiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: API_VERSION, timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use(`/api/${API_VERSION}/exoplanets`, exoplanetRoutes);
app.use(`/api/${API_VERSION}/nasa`, nasaRoutes);
app.use(`/api/${API_VERSION}/ml`, mlRoutes);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
