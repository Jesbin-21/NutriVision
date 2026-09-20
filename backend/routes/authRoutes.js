// routes/authRoutes.js - Authentication Routes (Register, Login, Me)
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// 1. User Registration Route
// POST /api/auth/register
router.post('/register', authController.register);

// 2. User Login Route
// POST /api/auth/login
router.post('/login', authController.login);

// 3. Current User Profile Route (Protected by JWT middleware)
// GET /api/auth/me
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
