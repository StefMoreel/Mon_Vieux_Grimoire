const express = require('express');
const router = express.Router();
const dataCtrl = require('../controller/book');
const auth = require('../middleware/auth');
const upload = require('../middleware/multer-config');
const sharp = require('../middleware/sharp-config');
const { validateBook, validateBookUpdate } = require('../middleware/userValidator');
const { upload, uploadToCloudinary } = require('../middleware/upload-cloudinary');

router.get('/', dataCtrl.getAllBooks); // Public route to get all books
router.get('/bestrating', dataCtrl.getBestRatedBooks); // Public route to get top 3 best-rated books
router.get('/:id', dataCtrl.getBookById); // Public route to get a single book by ID
router.post('/:id/rating', auth, dataCtrl.addRating); // Protected route to add a rating to a book
router.put('/:id', auth, upload, sharp, validateBookUpdate, uploadToCloudinary, dataCtrl.updateBook); // Protected route to update a book
router.post('/', auth, upload, validateBook, sharp, uploadToCloudinary, (req, res, next) => {
  console.log('[POST /books] BODY =', req.body);
  console.log('[POST /books] FILE =', req.file);
  next();
}, dataCtrl.createBook);
 // Protected route to create a new book with image upload
router.delete('/:id', auth, dataCtrl.deleteBook);  // Protected route to delete a book

const cloudinary = require('../services/cloudinary');
router.get('/cloudinary/ping', async (req, res) => {
  try {
    const r = await cloudinary.api.ping();
    res.json(r);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post('/cloudinary/test', upload, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'image manquante' });
    const r = await new Promise((resolve, reject) => {
      const up = cloudinary.uploader.upload_stream(
        { folder: process.env.CLD_FOLDER || 'uploads' },
        (err, result) => (err ? reject(err) : resolve(result))
      );
      require('streamifier').createReadStream(req.file.buffer).pipe(up);
    });
    res.json({ ok: true, public_id: r.public_id, url: r.secure_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router; // Export the router to be used in the main application    

