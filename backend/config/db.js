// config/db.js - Beginner-friendly MongoDB connection setup
const mongoose = require('mongoose');

// Flag to track whether MongoDB is successfully connected
let isMongoConnected = false;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/food_nutrition_db';
    
    // Connect to MongoDB
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 3000, // Timeout after 3 seconds if local Mongo isn't active
    });

    isMongoConnected = true;
    console.log('✅ MongoDB connected successfully!');
  } catch (error) {
    isMongoConnected = false;
    console.warn('⚠️ MongoDB connection note: Could not connect to MongoDB server.');
    console.warn('   Details:', error.message);
    console.warn('   👉 The app will run in fallback demo-memory mode so you can test features without setup errors.');
  }
};

const getIsMongoConnected = () => isMongoConnected;

module.exports = { connectDB, getIsMongoConnected };
