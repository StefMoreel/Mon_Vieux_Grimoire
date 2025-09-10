const multer = require('multer');
const cloudinary = require('../services/cloudinary');

const storage = multer.memoryStorage(); // pas d'écriture disque
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
  fileFilter: (req, file, cb) => {
    const ok = ['image/jpeg', 'image/jpg', 'image/png'].includes(file.mimetype);
    cb(ok ? null : new Error('Type de fichier non autorisé'), ok);
  }
}).single('image');

async function uploadToCloudinary(req, res, next) {
  if (!req.file) return next(); // pas d'image => laisse la route décider

  try {
    // Upload direct depuis le buffer
    const folder = process.env.CLD_FOLDER || 'uploads';
    const r = await cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image' },
      (err, result) => {
        if (err) return next(err);
        // Injecte l’URL + l’identifiant public Cloudinary dans la requête
        req.cloudinary = {
          url: result.secure_url,
          public_id: result.public_id, // utile pour delete
          format: result.format,
          width: result.width,
          height: result.height,
        };
        return next();
      }
    );

    // Écrit le buffer dans le stream Cloudinary
    r.end(req.file.buffer);
  } catch (e) {
    return next(e);
  }
}

module.exports = { upload, uploadToCloudinary };
