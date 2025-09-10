require('dotenv').config(); // Charge les variables d'environnement dès le début

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const path = require('node:path');
const mongoose = require('mongoose');
const multerLib = require('multer');

// Connexion à MongoDB
mongoose.connect(process.env.MONGO_URI, {
  dbName: process.env.MONGO_DBNAME || 'test',

})
  .then(() => console.log('✅ Connexion à MongoDB réussie !'))
  .catch((err) => console.error('❌ Connexion à MongoDB échouée :', err.message));

const app = express();

// 1. Helmet : Sécurise les en-têtes HTTP
app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", "data:", process.env.CLIENT_URL, "https://mon-vieux-grimoire-5a88.onrender.com", "blob:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'"],
    },
  })
);

// 2. CORS : Autorise les requêtes cross-origin
app.use(
  cors({
    origin: [process.env.CLIENT_URL, 'http://localhost:3000'], // Autorise les deux origines
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['X-Requested-With', 'Content-Type', 'Authorization'],
    credentials: true,
  })
);

// 3. Rate Limiting : Limite le nombre de requêtes par IP (anti brute-force)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes max par fenêtre
  message: 'Trop de requêtes depuis cette IP, réessayez plus tard.',
});
app.use(limiter);

// 4. express-mongo-sanitize : Nettoie les entrées utilisateur pour éviter les injections NoSQL et XSS
app.use(mongoSanitize()); // Protège contre les injections NoSQL
app.use(xss()); // Protège contre les attaques XSS

// 5. Middleware pour les fichiers statiques (images)
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, 'images');
app.use('/images', express.static(IMAGES_DIR, {
  index: false,
  immutable: true,
  maxAge: '1y',
}));

// 6. Parsing des requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 7. Routes
const bookRoutes = require('./Routes/book');
const userRoutes = require('./Routes/user');
app.use('/api/books', bookRoutes);
app.use('/api/auth', userRoutes);

// 8. Gestion des erreurs 404
app.use((req, res) => {
  res.status(404).json({ error: 'Ressource introuvable' });
});

// 9. Gestion centralisée des erreurs
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur :', err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
});

// handler d’erreurs global
app.use((err, req, res, next) => {
  if (err instanceof multerLib.MulterError) {
    return res.status(400).json({ where: 'multer', code: err.code, message: err.message });
  }
  if (err && err.message && err.message.includes('Type de fichier non autorisé')) {
    return res.status(400).json({ where: 'fileFilter', message: err.message });
  }
  console.error('Unhandled error:', err);
  return res.status(400).json({ where: 'unknown', message: err.message || 'Bad Request' });
});

// Export de l'application
module.exports = app;
