const multer = require('multer');
const MIME_TYPES = { // Define allowed MIME types and their corresponding file extensions
    'image/jpg': 'jpg',
    'image/jpeg': 'jpg',
    'image/png': 'png'
};

const storage = multer.diskStorage({
    destination: (req, file, callback) => { // Specify the destination directory for uploaded files
        callback(null, 'images'); // Save files to the 'images' directory
    },
    filename: (req, file, callback) => { // Generate a unique filename for the uploaded file
        const name = file.originalname.split(' ').join('_');  // Replace spaces with underscores in the original filename
        const extension = MIME_TYPES[file.mimetype]; // Get the file extension based on the MIME type
        callback(null, name + Date.now() + '.' + extension); // Create a unique filename using the original name, current timestamp, and file extension
    }
});

module.exports = multer({ storage: storage }).single('image'); // Export the multer middleware configured to handle single file uploads with the field name 'image'