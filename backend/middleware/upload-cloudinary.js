// backend/middleware/upload-cloudinary.js
const multer = require('multer');
const cloudinary = require('../services/cloudinary');

const upload = multer({
  storage: multer.memoryStorage(),                // pas d'écriture disque Render
  limits: { fileSize: 5 * 1024 * 1024 },         // 5 Mo max (ajuste si besoin)
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg','image/jpg','image/png','image/webp'].includes(file.mimetype);
    cb(ok ? null : new Error('Type de fichier non autorisé'), ok);
  }
}).single('image');                               // ⚠️ le champ DOIT s’appeler "image"

const withTimeout = (p, ms = 10000) =>           // timeout 10s pour éviter les hangs -> 502
  Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('cloudinary timeout')), ms))]);

async function uploadToCloudinary(req, res, next) {
  try {
    if (!req.file) return next();                // pas d’image -> laisser la route décider
    if (!req.file.buffer) {
      return next(new Error('Buffer du fichier manquant'));
    }

    const folder = process.env.CLD_FOLDER || 'uploads';
    // Upload via data URI (robuste, évite les soucis de stream)
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

    const result = await withTimeout(
      cloudinary.uploader.upload(dataUri, { folder, resource_type: 'image' }),
      15000
    );

    // Log minimal utile
    console.log('[cloudinary] upload ok:', result.public_id);

    // Expose au contrôleur
    req.cloudinary = {
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
    return next();
  } catch (err) {
    console.error('[cloudinary] upload error:', err.message);
    // Passe dans le handler d’erreurs global -> réponse JSON 500 (pas un 502 proxy)
    return next(err);
  }
}

module.exports = { upload, uploadToCloudinary };
