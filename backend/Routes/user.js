const express = require('express');
const router = express.Router();
const userCtrl = require('../controller/user');
const { validateSignup } = require('../middleware/userValidator');

router.post('/signup', validateSignup, userCtrl.signup); // Route for user signup
router.post('/login', userCtrl.login);  // Route for user login

module.exports = router; // Export the router to be used in the main application