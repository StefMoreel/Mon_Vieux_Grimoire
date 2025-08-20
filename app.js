const express = require('express');
const Book = require('./models/Book');
const dataRoutes = require('./Routes/data');


const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://stefksp:f9_j7Pr$CmT63aT@cluster0.artvton.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
    .then(() => console.log('Connexion à MongoDB réussie !'))
    .catch(() => console.log('Connexion à MongoDB échouée !'));

const app = express();
app.use(express.json());

app.use((req, res, next) => {
    res.json({ message: "Requête reçue!"})
    
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, content-type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);

});

app.use('/api/books', dataRoutes);

module.exports = app;
