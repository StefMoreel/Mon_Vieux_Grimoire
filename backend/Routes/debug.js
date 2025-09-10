// backend/Routes/debug.js
const express = require('express');
const router = express.Router();

const cloudinary = require('../services/cloudinary');
const { upload } = require('../middleware/upload-cloudinary');

// /debug/cloudinary/ping -> vérifie l'Admin API Cloudinary
router.get('/cloudinary/ping', async (req, res) => {
  try {
    const r = await cloudinary.api.ping();
    res.status(200).json(r); // { status: 'ok' }
  } catch (e) {
    res.status(502).json({ error: e.message || 'cloudinary ping failed' });
  }
});

// /debug/cloudinary/test -> upload simple
router.post('/cloudinary/test', upload, async (req, res) => {
  try {
    if (!req.file?.buffer) return res.status(400).json({ error: 'image manquante' });

    const folder = process.env.CLD_FOLDER || 'uploads';
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const result = await cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' });
    res.status(200).json({ ok: true, public_id: result.public_id, url: result.secure_url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
