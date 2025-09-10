const Book = require('../models/Book');
const fs = require('fs');
const cloudinary = require('../services/cloudinary.js');


// helper commun
function resolveImageUrl(imageUrl, req) {
  if (!imageUrl) return imageUrl;
  // Déjà une URL absolue ? (Cloudinary, etc.) -> on ne modifie pas
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;

  // Si tu as stocké "images/xxx.jpg", on enlève le préfixe pour éviter le double /images
  const filename = imageUrl.replace(/^\/?images\//i, '');

  const base = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  return `${base}/images/${filename}`;
}

// Get all books from the database
exports.getAllBooks = async (req, res) => {
  try {
    const books = await Book.find().lean(); // POJOs
    const updated = books.map(b => {
      return {
        ...b,
        imageUrl: resolveImageUrl(b.imageUrl, req),
        averageRating:
          typeof b.averageRating === 'number'
            ? Math.round((b.averageRating + Number.EPSILON) * 100) / 100
            : 0,
      };
    });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ error });
  }
};

exports.getBookById = async (req, res) => {
  try {
    const b = await Book.findById(req.params.id).lean();
    if (!b) return res.status(404).json({ error: 'Book not found' });
    const book = {
      ...b,
      imageUrl: resolveImageUrl(b.imageUrl, req),
      averageRating:
        typeof b.averageRating === 'number'
          ? Math.round((b.averageRating + Number.EPSILON) * 100) / 100
          : 0,
    };
    res.status(200).json(book);
  } catch (error) {
    res.status(404).json({ error });
  }
};


// Create a new book in the database with image upload handling via multer middleware 
// controller/book.js
exports.createBook = async (req, res) => {
  try {
    // Champs plats ou 'book' JSON (si tu gardes les 2 formats)
    let bookObject = {};
    if (typeof req.body.book === 'string') {
      bookObject = JSON.parse(req.body.book);
    } else {
      bookObject = { ...req.body };
    }
    delete bookObject._id;
    delete bookObject._userId;

    if (!req.cloudinary?.url) {
      return res.status(400).json({ where:'multer/cloudinary', message:'Image manquante ou upload Cloudinary échoué' });
    }

    const book = new Book({
      ...bookObject,
      userId: req.auth.userId,
      imageUrl: req.cloudinary.url,     // URL finale hébergée par Cloudinary
      imagePublicId: req.cloudinary.public_id, // garde l’id pour delete
    });

    const saved = await book.save();
    return res.status(201).json(saved);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ where:'mongoose', message: err.message, errors: err.errors });
    }
    console.error('createBook error:', err);
    return res.status(500).json({ where:'controller', message: err?.message || 'Erreur interne du serveur' });
  }
};

// Get the top 3 best-rated books from the database
exports.getBestRatedBooks = (req, res, next) => {
    Book.find().sort({ averageRating: -1 }).limit(3)
        .then(books => {
            const updatedBooks = books.map(book => {
                if (book.imageUrl) {
                    const filename = book.imageUrl.split('/images/').pop();
                    book.imageUrl = `${process.env.BASE_URL}/images/${filename}`;
                }
                return book;
            });
            res.status(200).json(updatedBooks);
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

// Add a rating to a book and update its average rating in the database
exports.addRating = async (req, res, next) => {
    try {
        const rating = { userId: req.auth.userId, grade: req.body.rating };
        const book = await Book.findById(req.params.id);
        if (!book) return res.status(404).json({ error: 'Livre non trouvé' });
        if (book.ratings.some(r => r.userId === req.auth.userId)) {
            return res.status(400).json({ error: 'Vous avez déjà noté ce livre' });
        }
        book.ratings.push(rating);
        const grades = book.ratings.map(r => r.grade);
        const sum = grades.reduce((acc, g) => acc + g, 0);
        book.averageRating = sum / grades.length;

        // Reconstruire l'URL de l'image avant de renvoyer le livre
        if (book.imageUrl) {
            const filename = book.imageUrl.split('/images/').pop();
            book.imageUrl = `${process.env.BASE_URL}/images/${filename}`;
        }

        const saved = await book.save();
        return res.status(200).json(saved);
    } catch (error) {
        return next(error);
    }
};


// Update book details in the database, including image if provided 
exports.updateBook = async (req, res) => {
  try {
    // 1) Trouver le livre de l’utilisateur
    const book = await Book.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });

    // 2) Préparer les updates à partir du body (champs plats OU book JSON déjà aplati par votre parseur)
    const updates = {};
    ['title','author','year','genre','ratings'].forEach(k => {
      if (typeof req.body[k] !== 'undefined') updates[k] = req.body[k];
    });

    // 3) Nouvelle image ? (uploadToCloudinary a rempli req.cloudinary si req.file présent)
    let oldPublicIdToDelete = null;
    if (req.cloudinary?.url && req.cloudinary?.public_id) {
      updates.imageUrl = req.cloudinary.url;
      updates.imagePublicId = req.cloudinary.public_id;
      if (book.imagePublicId) oldPublicIdToDelete = book.imagePublicId;
    }

    // 4) Appliquer les updates
    Object.assign(book, updates);
    const saved = await book.save();

    // 5) Supprimer l’ancienne image si remplacée (après save OK)
    if (oldPublicIdToDelete) {
      try { await cloudinary.uploader.destroy(oldPublicIdToDelete); } catch (e) { /* soft-fail */ }
    }

    return res.status(200).json(saved);
  } catch (err) {
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ where:'mongoose', message: err.message, errors: err.errors });
    }
    console.error('updateBook error:', err);
    return res.status(500).json({ where:'controller', message: err?.message || 'Erreur interne du serveur' });
  }
};


// Delete a book from the database if the authenticated user is the owner 

exports.deleteBook = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, userId: req.auth.userId });
    if (!book) return res.status(404).json({ message: 'Livre introuvable' });

    // Supprime l’image si on a un public_id
    if (book.imagePublicId) {
      try { await cloudinary.uploader.destroy(book.imagePublicId); } catch(e) { /* ignore soft */ }
    }

    await Book.deleteOne({ _id: req.params.id });
    return res.status(200).json({ message: 'Livre supprimé' });
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};