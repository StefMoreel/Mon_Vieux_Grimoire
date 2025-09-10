// middleware/userValidator.js
const { body, validationResult } = require('express-validator');

// --- util: aplatit req.body.book si présent (string JSON) ---
function parseBookIfNeeded(req, res, next) {
  if (req.body && typeof req.body.book === 'string') {
    try {
      const parsed = JSON.parse(req.body.book);
      // expose les champs plats pour les validators
      req.body = { ...req.body, ...parsed };
    } catch (e) {
      return res.status(400).json({ errors: [{ msg: 'book doit être une chaîne JSON valide', path: 'book', location: 'body' }] });
    }
  }
  next();
}

// Validation pour l'inscription utilisateur (inchangé)
const validateSignup = [
  body('email').isEmail().withMessage("Format d'email invalide"),
  body('password')
    .isLength({ min: 8 }).withMessage("8 caractères minimum")
    .matches(/[A-Z]/).withMessage("Doit contenir une majuscule")
    .matches(/[a-z]/).withMessage("Doit contenir une minuscule")
    .matches(/\d/).withMessage("Doit contenir un chiffre")
    .matches(/[@$!%*?&]/).withMessage("Doit contenir un caractère spécial"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Validation pour la création d’un livre (gère book JSON ou champs plats)
const validateBook = [
  parseBookIfNeeded,                                  // <-- important : avant les règles
  body('title').trim().notEmpty().withMessage("Le titre est requis"),
  body('author').trim().notEmpty().withMessage("L'auteur est requis"),
  body('year')
    .toInt()                                          // convertit "2024" -> 2024
    .isInt({ min: 1 }).withMessage("L'année doit être un nombre positif"),
  body('genre').trim().notEmpty().withMessage("Le genre est requis"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// Validation pour la mise à jour d’un livre (champs optionnels)
  const validateBookUpdate = [
  parseBookIfNeeded,
  body('title').optional().trim().notEmpty().withMessage('title ne doit pas être vide'),
  body('author').optional().trim().notEmpty().withMessage('author ne doit pas être vide'),
  body('year').optional().toInt().isInt({ min: 1 }).withMessage("year doit être un entier positif"),
  body('genre').optional().trim().notEmpty().withMessage('genre ne doit pas être vide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

module.exports = { validateSignup, validateBook, validateBookUpdate };
