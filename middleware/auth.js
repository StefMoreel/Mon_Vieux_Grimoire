const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.headers.authorization.split(' ')[1]; // Extract token from Authorization header 
        const decodedToken = jwt.verify(token, 'RANDOM_TOKEN_SECRET'); // Verify the token using the secret key
        const userId = decodedToken.userId; // Extract userId from the decoded token 
        req.auth = { userId: userId }; // Attach userId to the request object for use in other routes
        next(); 
    } catch (error) {
    }
}