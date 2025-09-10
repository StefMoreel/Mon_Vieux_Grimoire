const mongoose = require('mongoose');


const bookSchema = mongoose.Schema({ // Define the schema for the Book model
    userId: { type: String, required: true },
    title: { type: String, required: true },
    author: { type: String, required: true },
    imageUrl: { type: String, required: true },
    imagePublicId: { type: String }, // ⬅️ stocke l’id Cloudinary pour delete
    year: { type: Number, required: true },
    genre: { type: String, required: true },
    ratings: [
        {
            userId: { type: String, required: true },
            grade: { type: Number, required: true, min: 1, max: 5 }
        }
    ],
    averageRating: {
    type: Number,
    min: 0,
    max: 5,
    set: v => Math.round((Number(v) + Number.EPSILON) * 100) / 100 // ⬅️ arrondi à 2 décimales
  }
});



module.exports = mongoose.model('Book', bookSchema, 'books'); // Export the Book model based on the bookSchema and link it to the 'books' collection in MongoDB
