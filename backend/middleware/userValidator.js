const { body, validationResult } = require('express-validator');

// Validation pour l'inscription utilisateur
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
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Validation pour la création d’un livre
const validateBook = [
  body('title').notEmpty().withMessage("Le titre est requis"),
  body('author').notEmpty().withMessage("L'auteur est requis"),
  body('year').isInt({ min: 0 }).withMessage("L'année doit être un nombre positif"),
  body('genre').notEmpty().withMessage("Le genre est requis"),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateSignup,
  validateBook
};
