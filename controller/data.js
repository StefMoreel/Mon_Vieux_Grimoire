const Book = require('../models/Book');

exports.getAllBooks = (req, res, next) => {
    Book.find()
        .then(books => {
            res.status(200).json(books);
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

exports.getBookById = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            res.status(200).json(book);
        })
        .catch(error => {
            res.status(404).json({ error });
        });
};

exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id; // Remove _id if it exists in the request body
    delete bookObject._userId; // Remove _userId if it exists in the request body

    const book = new Book({
        ...bookObject,
        userId: req.auth.userId, // Assuming req.auth.userId is set by authentication middleware
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    });
    book.save()
        .then(() => res.status(201).json({ message: 'Book created successfully!' }))
        .catch(error => res.status(400).json({ error }));
}

exports.getBestRatedBooks = (req, res, next) => {
    Book.find().sort({ averageRating: -1 }).limit(5)
        .then(books => {
            res.status(200).json(books);
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

exports.addRating = (req, res, next) => {
    const rating = {
        userId: req.auth.userId, // Assuming req.auth.userId is set by authentication middleware
        grade: req.body.grade
    };
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }
            book.ratings.push(rating);
            book.averageRating = book.ratings.reduce((sum, r) => sum + r.grade, 0) / book.ratings.length;
            book.save()
                .then(() => res.status(200).json({ message: 'Rating added successfully!' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

exports.updateBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
    } : { ...req.body };
    delete bookObject._userId; // Remove _userId if it exists in the request body

    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ error: 'Unauthorized request' });
            }
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Book updated successfully!' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};

exports.deleteBook = (req, res, next) => {
    Book.findOne({ _id: req.params.id })
        .then(book => {
            if (!book) {
                return res.status(404).json({ error: 'Book not found' });
            }
            if (book.userId !== req.auth.userId) {
                return res.status(403).json({ error: 'Unauthorized request' });
            }
            Book.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Book deleted successfully!' }))
                .catch(error => res.status(400).json({ error }));
        })
        .catch(error => {
            res.status(400).json({ error });
        });
};
