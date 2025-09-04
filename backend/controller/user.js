const User = require('../models/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

exports.signup = (req, res, next) => {
    
    if (!req.body.email || !req.body.password) { 
        return res .status(400) .json({ error: 'Merci de renseigner votre e-mail et mot de passe' }); 
    } // Validate email and password presence
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email format validation
    if (!emailRegex.test(req.body.email)) { // Validate email format
        return res.status(400).json({ error: "Format d'e-mail invalide" });
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/; // Password complexity validation
    if (!passwordRegex.test(req.body.password)) { // Validate password complexity
        return res.status(400).json({ error: 'Le mot de passe doit contenir au moins 8 caractères incluant une majuscule, une minuscule, un nombre et un caractère spécial'});
    }
    bcrypt.hash(req.body.password, 10) // Hash the password with a salt round of 10
        .then(hash => {
            const user = new User({ // Create new user instance 
                email: req.body.email,
                password: hash
                
            });
            user.save() // Save the user to the database 
                .then(() => res.status(201).json({ message: 'User created successfully!' })) // Success response
                .catch(error => res.status(400).json({ error })); // Handle errors during save (e.g., duplicate email) 
        })
        .catch(error => res.status(500).json({ error })); // Handle errors during hashing process 
};


exports.login = (req, res, next) => {
    User.findOne({ email: req.body.email }) // Find the user by email 
        .then(user => {
            if (!user) { // If user not found, return error
                return res.status(401).json({ error: 'User not found!' }); // Unauthorized
            }
            bcrypt.compare(req.body.password, user.password) // Compare provided password with stored hashed password
                .then(valid => { // If password is incorrect, return error
                    if (!valid) { // Password does not match
                        return res.status(401).json({ error: 'Incorrect password!' }); // Unauthorized
                    }
                    res.status(200).json({ // Password is correct, generate JWT token
                        userId: user._id,
                        token: jwt.sign(
                            { userId: user._id },
                            process.env.JWT_SECRET, // Use secret from environment variables
                            { expiresIn: '24h' }
                        )
                    });
                })
                .catch(error => res.status(500).json({ error })); // Handle errors during password comparison
        })
        .catch(error => res.status(500).json({ error })); // Handle errors during user lookup
    }
