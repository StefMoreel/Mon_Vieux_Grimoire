const express = require('express');
const router = express.Router();
const dataCtrl = require('../controller/book');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');
const { validateBook } = require('../middleware/userValidator');

router.get('/', dataCtrl.getAllBooks); // Public route to get all books
router.get('/bestrating', dataCtrl.getBestRatedBooks); // Public route to get top 3 best-rated books
router.get('/:id', dataCtrl.getBookById); // Public route to get a single book by ID
router.post('/:id/rating', auth, dataCtrl.addRating); // Protected route to add a rating to a book
router.put('/:id', auth, upload, sharp, dataCtrl.updateBook); // Protected route to update a book
router.post('/', auth, upload,validateBook, sharp, dataCtrl.createBook); // Protected route to create a new book with image upload
router.delete('/:id', auth, dataCtrl.deleteBook);  // Protected route to delete a book

module.exports = router; // Export the router to be used in the main application    

