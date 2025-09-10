require('dotenv').config(); // Charge les variables d'environnement dès le début

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('node:path');
const mongoose = require('mongoose');
const multer = require('multer');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.MONGO_DBNAME || 'test',

})
  .then(() => console.log('✅ Connexion à MongoDB réussie !'))
  .catch((err) => console.error('❌ Connexion à MongoDB échouée :', err.message));

const app = express();

// 0) Confiance proxy (Render/Cloudflare) -> IP correcte pour le rate-limit
app.set('trust proxy', 1);

// 1) Helmet (CSP) — filtre les valeurs falsy pour éviter 'undefined'
const IMG_ALLOW = [
  "'self'",
  "data:",
  process.env.CLIENT_URL,
  "https://mon-vieux-grimoire-5a88.onrender.com",
  "blob:",
  "https://res.cloudinary.com",
].filter(Boolean);

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    imgSrc: IMG_ALLOW,
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    fontSrc: ["'self'"],
    baseUri: ["'self'"],
    formAction: ["'self'"],
    frameAncestors: ["'self'"],
    objectSrc: ["'none'"],
    scriptSrcAttr: ["'none'"],
    upgradeInsecureRequests: [],
  },
}));

// 2) CORS — filtre pour éviter undefined
const ALLOWED_ORIGINS = [process.env.CLIENT_URL, 'http://localhost:3000'].filter(Boolean);
app.use(cors({
  origin: ALLOWED_ORIGINS.length ? ALLOWED_ORIGINS : true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'],
  credentials: true,
}));

// 3) Sanitize / XSS
app.use(mongoSanitize());
app.use(xss());

// 4) Static images (avant le limiter si tu ne veux pas les compter)
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, 'images');
app.use('/images', express.static(IMAGES_DIR));

// 5) Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 6) Rate-limit — seulement pour /api, en-têtes standard + Retry-After
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  statusCode: 429,
  message: { error: 'Trop de requêtes, réessayez plus tard.' },
  skip: (req) => req.method === 'OPTIONS',
  handler: (req, res /* , next, options */) => {
    const reset = res.getHeader('RateLimit-Reset');
    if (reset) res.setHeader('Retry-After', reset);
    return res.status(429).json({
      error: 'Trop de requêtes, réessayez plus tard.',
      limit: res.getHeader('RateLimit-Limit'),
      remaining: res.getHeader('RateLimit-Remaining'),
      reset: res.getHeader('RateLimit-Reset'),
    });
  },
});
app.use('/api', apiLimiter);

// 7) Routes
const bookRoutes = require('./Routes/book');
const userRoutes = require('./Routes/user');
app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);

app.use('/debug', require('./Routes/debug'));

// 8) 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ressource introuvable' });
});

// 9) Un SEUL handler d’erreurs global (fusion Multer/Mongoose)

app.use((err, req, res, next) => {
  console.error('[ERROR]', err);
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ where: 'multer', code: err.code, message: err.message });
  }
  if (err?.name === 'ValidationError') {
    return res.status(400).json({ where: 'mongoose', message: err.message, errors: err.errors });
  }
  return res.status(500).json({ where: 'unknown', message: err?.message || 'Erreur interne du serveur' });
});

module.exports = app;
