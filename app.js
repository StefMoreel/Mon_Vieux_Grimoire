const express = require('express');
const bookRoutes = require('./Routes/book');
const userRoutes = require('./Routes/user');
const path = require('path');


const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://stefksp:f9_j7Pr$CmT63aT@cluster0.artvton.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
  dbName: 'test'}) // Connect to MongoDB using Mongoose with specified options 
    .then(() => console.log('Connexion à MongoDB réussie !')) 
    .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express(); // Create an Express application instance
app.use(express.json()); // Middleware to parse JSON request bodies



app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Allow requests from any origin
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS'); // Allow specific HTTP methods
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Authorization'); // Allow specific headers
  res.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials such as cookies in requests 

  // Répondre tout de suite aux pré-requêtes CORS
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  // Sinon passer la main aux routes
  return next();
});


app.use('/api/books', bookRoutes); // Use book routes for /api/books endpoint 
app.use('/api/auth', userRoutes); // Use user routes for /api/auth endpoint
app.use('/images', express.static(path.join(__dirname, 'images'))); // Serve static files from the 'images' directory

module.exports = app; // Export the Express application instance for use in other files
