// server.js - Main Express Application Entry Point
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { connectDB } = require('./config/db');

// Load environment variables from .env file
dotenv.config();

// Initialize the Express app
const app = express();

// Set the port from environment variable or default to 5000
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Built-in & Third-Party Middlewares
app.use(cors()); // Allow cross-origin requests from frontend
app.use(express.json({ limit: '15mb' })); // Parse incoming JSON payloads
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check route to verify server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Food Nutrition Analyzer API',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE'),
    mongoConfigured: !!process.env.MONGO_URI,
  });
});

// Mount Routes from the routes/ folder
const authRoutes = require('./routes/authRoutes');
const foodRoutes = require('./routes/foodRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/food', foodRoutes);

// Global Error Handler for unexpected errors or multer file size limits
app.use((err, req, res, next) => {
  console.error('Server error:', err.message);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Express Server
app.listen(PORT, () => {
  console.log('====================================================');
  console.log(`🚀 Nutrition Analyzer Server is running on port: ${PORT}`);
  console.log(`📡 Health Check URL: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Auth API:          http://localhost:${PORT}/api/auth`);
  console.log(`🥗 Food Vision API:   http://localhost:${PORT}/api/food`);
  console.log('====================================================');
});
