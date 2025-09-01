const Book = require('../models/Book');
const fs = require('fs');

// Get all books from the database
exports.getAllBooks = (req, res, next) => {
    Book.find() // Fetch all books from the database 
        .then(books => {
            res.status(200).json(books); // Return the list of books in JSON format 
        })
        .catch(error => {
            res.status(400).json({ error }); // Handle any errors that occur during the fetch process 
        });
};

// Get a single book by ID from the database
exports.getBookById = (req, res, next) => {
    Book.findOne({ _id: req.params.id }) // Find the book by ID
        .then(book => {
            book.averageRating = Number(book.averageRating.toFixed(2)); // Ensure averageRating is rounded to 2 decimal places
            res.status(200).json(book); // Return the book details in JSON format
        })
        .catch(error => {
            res.status(404).json({ error }); // Handle error if book not found 
        });
};

// Create a new book in the database with image upload handling via multer middleware 
exports.createBook = (req, res, next) => {
    const bookObject = JSON.parse(req.body.book);
    delete bookObject._id; // Remove _id if it exists in the request body
    delete bookObject._userId; // Remove _userId if it exists in the request body

    const book = new Book({ // Create new book instance with image URL
        ...bookObject, // Spread the book details from the request body 
        userId: req.auth.userId, // Assuming req.auth.userId is set by authentication middleware
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // Construct image URL
    }); 
    book.save()
        .then(() => res.status(201).json({ message: 'Book created successfully!' })) // Success response 
        .catch(error => res.status(400).json({ error })); // Handle any errors during save process 
}

// Get the top 3 best-rated books from the database
exports.getBestRatedBooks = (req, res, next) => {
    Book.find().sort({ averageRating: -1 }).limit(3) // Fetch books sorted by averageRating in descending order and limit to 3 results
        .then(books => {
            res.status(200).json(books); // Return the top 3 best-rated books in JSON format 
        }) 
        .catch(error => {
            res.status(400).json({ error }); // Handle any errors that occur during the fetch process 
        });
};

// Add a rating to a book and update its average rating in the database
exports.addRating = async (req, res, next) => {
  try {
    const rating = { userId: req.auth.userId, grade: req.body.rating }; // Create new rating object
    const book = await Book.findById(req.params.id); // Find the book by ID
    if (!book) return res.status(404).json({ error: 'Livre non trouvé' }); // Book not found
    if (book.ratings.some(r => r.userId === req.auth.userId)) { // User has already rated this book
      return res.status(400).json({ error: 'Vous avez déjà noté ce livre' }); // Prevent multiple ratings by the same user
    }

    book.ratings.push(rating); // Add the new rating to the book's ratings array

    // Recalculate average rating after adding new rating 
    const grades = book.ratings.map(r => r.grade); // Extract all grades
    const sum = grades.reduce((acc, g) => acc + g, 0); // Sum all grades
    book.averageRating = sum / grades.length; // Calculate new average rating
    

    // Save the updated book with the new rating and average rating 
    const saved = await book.save();
    return res.status(200).json(saved);
  } 
  catch (error) {
    return next(error);
  }
};

// Update book details in the database, including image if provided 
exports.updateBook = (req, res, next) => {
    const bookObject = req.file ? {
        ...JSON.parse(req.body.book), // Parse book details from request body
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}` // Update image URL if a new image is uploaded
    } : { ...req.body }; // If no new image, use existing details 
    delete bookObject._userId; // Remove _userId if it exists in the request body
    
    Book.findOne({ _id: req.params.id }) // Find the book by ID
        .then(book => {
            let oldImageUrl = book.imageUrl; // Store the old image URL for potential deletion
            if (book.userId !== req.auth.userId) { // Check if the authenticated user is the owner of the book
                return res.status(403).json({ error: 'Unauthorized request' }); // Unauthorized if not the owner
            }
            Book.updateOne({ _id: req.params.id }, { ...bookObject, _id: req.params.id }) // Update the book with new details
                .then(() => {
                    if (req.file && oldImageUrl) { // If a new image was uploaded and there was an old image, delete the old image file
                        const oldFilename = oldImageUrl.split('/images/')[1]; // Extract filename from the old image URL 
                        fs.unlink(`images/${oldFilename}`, (err) => { // Delete the old image file from the server
                            if (err) console.error('Error deleting old image:', err); // Log any errors during deletion
                        });
                    }
                res.status(200).json({ message: 'Book updated successfully!' })}) // Success response
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
