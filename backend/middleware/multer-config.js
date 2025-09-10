const path = require('node:path');
const fs = require('node:fs');
const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpg',
  'image/png': 'png',
};

// Dossier d'upload : env en prod (Render) ou dossier local par défaut
// Si vous avez un Persistent Disk Render, mettez IMAGES_DIR=/data/images
const UPLOAD_DIR = process.env.IMAGES_DIR || path.join(__dirname, '..', 'images');

// S'assurer que le dossier existe
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR); // chemin ABSOLU
  },
  filename: (req, file, cb) => {
    // on enlève l'extension de l'original pour éviter ".jpg<ts>.jpg"
    const parsed = path.parse(file.originalname);
    const base = parsed.name
      .replace(/\s+/g, '_')         // espaces -> underscores
      .replace(/[^a-zA-Z0-9_\-]/g, ''); // petites hygiènes
    const ext = MIME_TYPES[file.mimetype] || parsed.ext.replace('.', '') || 'jpg';
    const finalName = `${base}-${Date.now()}.${ext}`; // <— timestamp AVANT l’extension
    cb(null, finalName);
  },
});

function fileFilter(req, file, cb) {
  if (MIME_TYPES[file.mimetype]) return cb(null, true);
  cb(new Error('Type de fichier non autorisé'), false);
}

module.exports = multer({
  storage,
  fileFilter
}).single('image'); // <-- le champ du formulaire doit s’appeler "image"
