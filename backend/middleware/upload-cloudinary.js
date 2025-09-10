// middleware/upload-cloudinary.js
const multer = require('multer');
const streamifier = require('streamifier');
const cloudinary = require('../services/cloudinary');

const upload = multer({ storage: multer.memoryStorage() }).single('image');

function uploadToCloudinary(req, res, next) {
  if (!req.file) return next();

  const folder = process.env.CLD_FOLDER || 'uploads';
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder, resource_type: 'image' },
    (err, result) => {
      if (err) {
        console.error('[cloudinary] upload error:', err);
        return next(err);
      }
      console.log('[cloudinary] upload ok:', result.public_id, result.secure_url);
      req.cloudinary = {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
        format: result.format,
      };
      return next();
    }
  );

  // 🔑 ICI : on pipe le buffer vers le stream
  streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
}

module.exports = { upload, uploadToCloudinary };
