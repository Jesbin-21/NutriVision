// models/FoodLog.js - Schema to save analyzed food nutrition history
const mongoose = require('mongoose');

const foodLogSchema = new mongoose.Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    foodName: {
      type: String,
      required: true,
      trim: true,
    },
    servingSize: {
      type: String,
      default: '1 standard serving',
    },
    calories: {
      type: Number,
      required: true,
    },
    macros: {
      protein: { type: Number, default: 0 }, // in grams
      carbs: { type: Number, default: 0 },   // in grams
      fats: { type: Number, default: 0 },    // in grams
      fiber: { type: Number, default: 0 },   // in grams
      sugar: { type: Number, default: 0 },   // in grams
    },
    vitaminsAndMinerals: [
      {
        name: String,
        amount: String,
      },
    ],
    ingredients: [
      {
        name: String,
        amount: String,
      },
    ],
    dietaryTags: [String], // e.g. ["High Protein", "Keto Friendly", "Vegetarian"]
    healthScore: {
      type: Number, // 1 - 100
      default: 75,
    },
    healthSummary: {
      type: String,
      default: '',
    },
    recommendation: {
      type: String,
      default: '',
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('FoodLog', foodLogSchema);
