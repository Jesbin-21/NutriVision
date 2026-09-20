// middleware/authMiddleware.js - Beginner-friendly JWT Verification Middleware
const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // 1. Get the Authorization header from the incoming HTTP request
  const authHeader = req.headers.authorization;

  // 2. Check if the header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. No authentication token provided.',
    });
  }

  // 3. Extract the token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET || 'super_secret_food_analyzer_jwt_key_2025';
    // 4. Verify the token using our secret key
    const decoded = jwt.verify(token, secret);

    // 5. Attach the user data to the request object so subsequent routes can use it
    req.user = decoded;
    next(); // Continue to the next middleware or route handler
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
    });
  }
};

module.exports = authMiddleware;
