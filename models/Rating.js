const mongoose = require('mongoose');

const ratingSchema = mongoose.Schema({ // Define the schema for the Rating model
    userId: { type: String, required: true },
    grade: { type: Number, required: true, min: 1, max: 5 }
});

module.exports = mongoose.model('Rating', ratingSchema); // Export the Rating model based on the ratingSchema