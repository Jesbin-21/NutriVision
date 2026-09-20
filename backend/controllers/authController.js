// controllers/authController.js - Handles User Registration & Login with JWT
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { getIsMongoConnected } = require('../config/db');

// In-memory fallback storage if MongoDB is not active locally
const inMemoryUsers = [];

// Helper function to generate a JWT token
const generateToken = (user) => {
  const secret = process.env.JWT_SECRET || 'super_secret_food_analyzer_jwt_key_2025';
  return jwt.sign(
    { id: user._id || user.id, email: user.email, name: user.name },
    secret,
    { expiresIn: '7d' } // Token lasts for 7 days
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validate inputs
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    // 2. Hash password with bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Save to MongoDB if connected, else fallback to memory
    if (getIsMongoConnected()) {
      const existingUser = await User.findOne({ email: cleanEmail });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const newUser = await User.create({
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
      });

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Registration successful!',
        token,
        user: { id: newUser._id, name: newUser.name, email: newUser.email },
      });
    } else {
      // Demo / Fallback mode
      const existingUser = inMemoryUsers.find((u) => u.email === cleanEmail);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }

      const newUser = {
        id: 'user_' + Date.now(),
        name: name.trim(),
        email: cleanEmail,
        password: hashedPassword,
      };
      inMemoryUsers.push(newUser);

      const token = generateToken(newUser);

      return res.status(201).json({
        success: true,
        message: 'Registration successful! (Demo mode)',
        token,
        user: { id: newUser.id, name: newUser.name, email: newUser.email },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration.',
      error: error.message,
    });
  }
};

// @desc    Authenticate user & get JWT token
// @route   POST /api/auth/login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
    }

    const cleanEmail = email.toLowerCase().trim();

    let user;
    if (getIsMongoConnected()) {
      user = await User.findOne({ email: cleanEmail });
    } else {
      user = inMemoryUsers.find((u) => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 2. Check if password matches hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // 3. Generate token
    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login.',
      error: error.message,
    });
  }
};

// @desc    Get currently logged-in user profile
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    const userId = req.user.id;

    let user;
    if (getIsMongoConnected()) {
      user = await User.findById(userId).select('-password');
    } else {
      user = inMemoryUsers.find((u) => u.id === userId);
      if (user) {
        const { password, ...safeUser } = user;
        user = safeUser;
      }
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.',
      });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error fetching user profile.',
    });
  }
};
