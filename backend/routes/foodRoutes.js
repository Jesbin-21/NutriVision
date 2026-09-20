// routes/foodRoutes.js - Food Image Analysis & Nutrient History Routes
const express = require('express');
const router = express.Router();
const multer = require('multer');
const foodController = require('../controllers/foodController');
const authMiddleware = require('../middleware/authMiddleware');

// Configure Multer to keep the uploaded image in memory as a buffer
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP, etc.) are allowed!'), false);
    }
  },
});

// 1. Analyze Food Image Route (Multer handles 'image' field)
// POST /api/food/analyze
// Uses authMiddleware so each scan can be attributed to the user
router.post('/analyze', authMiddleware, upload.single('image'), foodController.analyzeFoodImage);

// 2. Get User's Past Food Scans
// GET /api/food/history
router.get('/history', authMiddleware, foodController.getFoodHistory);

// 3. Delete a Past Scan
// DELETE /api/food/history/:id
router.delete('/history/:id', authMiddleware, foodController.deleteFoodHistory);

module.exports = router;
