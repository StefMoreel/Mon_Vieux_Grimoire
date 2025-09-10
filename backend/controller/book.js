const Book = require('../models/Book');
const fs = require('fs');

// Get all books from the database
exports.getAllBooks = (req, res, next) => {
    Book.find()
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

// Get a single book by ID from the database
exports.getBookById = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }
            if (book.imageUrl) {
                const filename = book.imageUrl.split('/images/').pop();
                book.imageUrl = `${process.env.BASE_URL}/images/${filename}`;
            }
            book.averageRating = Number(book.averageRating.toFixed(2));
            res.status(200).json(book);
        })
        .catch(error => {
            res.status(404).json({ error });
        });
};

// Create a new book in the database with image upload handling via multer middleware 
exports.createBook = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ where:'multer', message:'Image manquante (champ "image")' });

    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const book = new Book({
      ...req.body,                 // validateBook aplatit déjà si besoin
      userId: req.auth.userId,
      imageUrl: `${baseUrl}/images/${req.file.filename}`,
    });

    const saved = await book.save();
    return res.status(201).json(saved);
  } catch (err) {
    console.error('createBook error:', err);
    if (err?.name === 'ValidationError') {
      return res.status(400).json({ where:'mongoose', message: err.message, errors: err.errors });
    }
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
exports.updateBook = (req, res, next) => {
    const baseUrl = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${baseUrl}/images/${req.file.filename}` // Corrige ici
    } : { ...req.body };
    delete bookObject._userId;

    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ error: 'Unauthorized request' });
            }
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => {
                    if (req.file && book.imageUrl) {
                        const oldFilename = book.imageUrl.split('/images/').pop();
                        fs.unlink(`images/${oldFilename}`, (err) => {
                            if (err) console.error('Error deleting old image:', err);
                        });
                    }
                    res.status(200).json({ message: 'Book updated successfully!' });
                })
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};


// Delete a book from the database if the authenticated user is the owner 
exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id }) // Find the book by ID
        .then(book => { // Check if the book exists
            let oldImageUrl = book.imageUrl; // Store the old image URL for potential deletion
            if (!book) {
                return res.status(404).json({ error: 'Book not found' }); // Book not found
            } 
            if (book.userId !== req.auth.userId) { // Check if the authenticated user is the owner of the book
                return res.status(403).json({ error: 'Unauthorized request' }); // Unauthorized if not the owner
            }
            Book.deleteOne({ _id: req.params.id }) // Delete the book from the database 
                .then(() => {
                    if (oldImageUrl) { // If there was an image associated with the book, delete the image file
                        const oldFilename = oldImageUrl.split('/images/')[1]; // Extract filename from the image URL 
                        fs.unlink(`images/${oldFilename}`, (err) => { // Delete the image file from the server
                            if (err) console.error('Error deleting image:', err); // Log any errors during deletion
                        });
                    }
                    res.status(200).json({ message: 'Book deleted successfully!' })}) // Success response 
                .catch(error => res.status(400).json({ error })); // Error during deletion 
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};
