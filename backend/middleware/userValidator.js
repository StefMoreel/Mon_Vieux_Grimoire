const { body, validationResult } = require('express-validator');

exports.validateSignup = [
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
