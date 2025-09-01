const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const userShema = mongoose.Schema({ // Define the schema for the User model
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

userShema.plugin(uniqueValidator); // Apply the uniqueValidator plugin to userSchema to ensure unique email addresses

module.exports = mongoose.model('User', userShema); // Export the User model based on the userSchema