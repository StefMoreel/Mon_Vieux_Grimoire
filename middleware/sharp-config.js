const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

// Middleware to process and resize uploaded images using Sharp
module.exports = (req, res, next) => {
    if (!req.file) {
        return next(); // If no file is uploaded, proceed to the next middleware
    }

    const imagePath = path.join(__dirname, '../images', req.file.filename);
    const resizedImagePath = path.join(__dirname, '../images', 'resized-' + req.file.filename);

    sharp(imagePath)
        .resize(206, 260) // Resize image to 300x500 pixels
        .toFile(resizedImagePath) // Save the resized image to a new file
        .then(() => {
            fs.unlinkSync(imagePath); // Delete the original uploaded image
            req.file.filename = 'resized-' + req.file.filename; // Update the filename in the request object
            next(); // Proceed to the next middleware
        })
        .catch(err => {
            console.error('Error processing image with Sharp:', err);
            next(err); // Pass any errors to the next middleware
        });
}