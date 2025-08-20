const express = require('express');
const router = express.Router();
const dataController = require('../controller/data');

router.get('/', dataController.getAllBooks);
router.get('/:id', dataController.getBookById);
router.post('/', dataController.createBook);
router.get('/bestrating', dataController.getBestRatedBooks);
router.post('/:id/rating', dataController.addRating);
router.put('/:id', dataController.updateBook);
router.delete('/:id', dataController.deleteBook);

module.exports = router;

