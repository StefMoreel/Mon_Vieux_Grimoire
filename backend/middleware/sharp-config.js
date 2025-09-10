// middleware/sharp-config.js
const sharp = require('sharp');
const path = require('node:path');
const fs = require('node:fs/promises');

// Même dossier que Multer et express.static
const IMAGES_DIR = process.env.IMAGES_DIR || path.join(__dirname, '..', 'images');

module.exports = async (req, res, next) => {
  try {
    if (!req.file) return next();

    // Chemin réel du fichier uploadé par Multer
    const inPath = req.file.path || path.join(IMAGES_DIR, req.file.filename);

    // Construit un nom final propre : garde l’extension d’origine
    const parsed = path.parse(req.file.filename);
    const finalName = `${parsed.name}-resized${parsed.ext}`;
    const outPath = path.join(IMAGES_DIR, finalName);

    // Resize (206x260) — Sharp déduit le format depuis l’extension du nom de sortie
    await sharp(inPath).resize(206, 260).toFile(outPath);

    // Supprime l’original (ignore si déjà supprimé)
    await fs.rm(inPath, { force: true });

    // IMPORTANT : refléter le nouveau fichier pour les étapes suivantes / DB
    req.file.filename = finalName;
    req.file.path = outPath;

    return next();
  } catch (err) {
    console.error('Sharp error:', err);
    // Laisse l’error handler global renvoyer 400/500
    return next(err);
  }
};
