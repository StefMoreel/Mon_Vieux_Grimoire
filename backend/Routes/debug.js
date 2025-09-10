// routes/debug.js (temporaire)
const express = require('express');
const router = express.Router();
const cloudinary = require('../services/cloudinary');
const { upload } = require('../middleware/upload-cloudinary');

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

module.exports = router;
