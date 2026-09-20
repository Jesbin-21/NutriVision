// controllers/foodController.js - Analyzes food image with Gemini Vision and manages scan history
const { GoogleGenerativeAI } = require('@google/generative-ai');
const FoodLog = require('../models/FoodLog');
const { getIsMongoConnected } = require('../config/db');

// In-memory fallback history if MongoDB is not active
const inMemoryFoodLogs = [];

// Helper to sanitize Gemini's response into clean JSON
const parseGeminiJson = (text) => {
  try {
    // Remove code block markdown like ```json ... ``` if present
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Error parsing JSON from Gemini response:', err.message);
    return null;
  }
};

// @desc    Analyze uploaded food image with Gemini Vision
// @route   POST /api/food/analyze
exports.analyzeFoodImage = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'anonymous';
    let imageBuffer = null;
    let mimeType = 'image/jpeg';
    let base64Preview = '';

    // 1. Parse image input from multipart file or base64/URL
    if (req.file) {
      imageBuffer = req.file.buffer;
      mimeType = req.file.mimetype || 'image/jpeg';
      base64Preview = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
    } else if (req.body.imageBase64) {
      const inputStr = req.body.imageBase64.trim();

      if (inputStr.startsWith('http://') || inputStr.startsWith('https://')) {
        // Fetch remote preset image
        const imgRes = await fetch(inputStr);
        const arrayBuf = await imgRes.arrayBuffer();
        imageBuffer = Buffer.from(arrayBuf);
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';
        base64Preview = `data:${mimeType};base64,${imageBuffer.toString('base64')}`;
      } else {
        const matches = inputStr.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          mimeType = matches[1];
          imageBuffer = Buffer.from(matches[2], 'base64');
          base64Preview = inputStr;
        } else {
          imageBuffer = Buffer.from(inputStr, 'base64');
          base64Preview = `data:image/jpeg;base64,${inputStr}`;
        }
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'No image provided. Please upload a food image file.',
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.trim().length < 10) {
      return res.status(500).json({
        success: false,
        message: 'Google Gemini API key is missing or invalid in backend/.env.',
      });
    }

    console.log('🤖 Sending image to Google Gemini Vision (gemini-2.0-flash)...');
    const genAI = new GoogleGenerativeAI(apiKey);

    const prompt = `You are an elite clinical nutritionist and food scientist.
Analyze the food in this image with maximum accuracy.
Examine all visual cues (textures, components, colors, cooking style) to identify the exact dish and provide real, scientifically grounded nutrition details and ingredients.

Extract and calculate:
1. foodName: The authentic, specific name of the food or dish.
2. servingSize: The estimated realistic serving portion (e.g., "1 bowl (~350g)", "2 slices (~180g)").
3. calories: Total calories in kcal for this serving (integer).
4. macros: Macronutrients in grams:
   - protein (grams)
   - carbs (grams)
   - fats (grams)
   - fiber (grams)
   - sugar (grams)
5. vitaminsAndMinerals: Array of key vitamins and minerals detected with realistic amounts and % Daily Value (e.g. [{"name": "Iron", "amount": "3.5mg (19% DV)"}]).
6. ingredients: Array of all identifiable ingredients used in this dish with estimated portion/amount (e.g. [{"name": "Ingredient name", "amount": "estimated quantity"}]).
7. dietaryTags: Array of accurate dietary tags (e.g. ["High Protein", "Vegetarian", "Gluten-Free", "Rich in Fiber"]).
8. healthScore: An integer between 1 and 100 assessing overall nutritional quality.
9. healthSummary: 2-3 sentences explaining the meal's key nutritional benefits, glycemic impact, and satiety.
10. recommendation: Practical, evidence-based advice for optimizing this meal.

CRITICAL: Return ONLY valid, raw JSON with strictly NO markdown code blocks (no \`\`\`json or \`\`\`), no preface, and no trailing notes.
JSON format:
{
  "foodName": "Identified Food Name",
  "servingSize": "1 plate (~320g)",
  "calories": 480,
  "macros": {
    "protein": 28,
    "carbs": 52,
    "fats": 16,
    "fiber": 6,
    "sugar": 5
  },
  "vitaminsAndMinerals": [
    {"name": "Vitamin C", "amount": "45mg (50% DV)"},
    {"name": "Iron", "amount": "3.8mg (21% DV)"},
    {"name": "Calcium", "amount": "160mg (16% DV)"},
    {"name": "Potassium", "amount": "580mg (12% DV)"}
  ],
  "ingredients": [
    {"name": "Primary Ingredient", "amount": "150g"},
    {"name": "Secondary Ingredient", "amount": "80g"}
  ],
  "dietaryTags": ["High Protein", "Whole Food"],
  "healthScore": 88,
  "healthSummary": "Nutrient-rich meal providing balanced sustained energy and muscle synthesis support.",
  "recommendation": "Pair with adequate water and consider fresh leafy greens for added micronutrients."
}`;

    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    // Valid model names for @google/generative-ai SDK v0.x
    // gemini-1.5-flash-latest is the most widely available vision model
    const candidateModels = [
      'gemini-1.5-flash-latest',
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
    ];
    let parsedData = null;
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        console.log(`🔄 Trying model: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt, imagePart]);
        const responseText = result.response.text();
        const parsed = parseGeminiJson(responseText);

        if (parsed && parsed.foodName && parsed.calories !== undefined) {
          parsedData = parsed;
          console.log(`✅ Successfully analyzed with ${modelName}:`, parsedData.foodName);
          break;
        } else {
          console.warn(`⚠️ ${modelName} returned invalid JSON structure, trying next...`);
        }
      } catch (err) {
        console.warn(`❌ Model ${modelName} failed: [${err.status || err.code || 'ERR'}] ${err.message}`);
        lastError = err;
      }
    }

    if (!parsedData) {
      throw new Error(
        lastError
          ? `Gemini Vision failed to analyze the image: ${lastError.message}`
          : 'Could not extract valid nutritional details from the image.'
      );
    }

    // Normalize ingredients array (handles strings or objects)
    let normalizedIngredients = [];
    if (Array.isArray(parsedData.ingredients)) {
      normalizedIngredients = parsedData.ingredients.map((item) => {
        if (typeof item === 'string') {
          return { name: item, amount: '' };
        }
        return {
          name: item.name || 'Ingredient',
          amount: item.amount || '',
        };
      });
    }

    const nutritionData = {
      foodName: parsedData.foodName || 'Analyzed Food',
      servingSize: parsedData.servingSize || '1 serving',
      calories: Number(parsedData.calories) || 0,
      macros: {
        protein: Number(parsedData.macros?.protein) || 0,
        carbs: Number(parsedData.macros?.carbs) || 0,
        fats: Number(parsedData.macros?.fats) || 0,
        fiber: Number(parsedData.macros?.fiber) || 0,
        sugar: Number(parsedData.macros?.sugar) || 0,
      },
      vitaminsAndMinerals: Array.isArray(parsedData.vitaminsAndMinerals)
        ? parsedData.vitaminsAndMinerals
        : [],
      ingredients: normalizedIngredients,
      dietaryTags: Array.isArray(parsedData.dietaryTags) ? parsedData.dietaryTags : [],
      healthScore: Number(parsedData.healthScore) || 80,
      healthSummary: parsedData.healthSummary || '',
      recommendation: parsedData.recommendation || '',
    };

    // Save scan to database or in-memory history
    const savedLog = {
      id: 'log_' + Date.now(),
      userId: userId,
      ...nutritionData,
      imageUrl: base64Preview.length < 300000 ? base64Preview : '',
      createdAt: new Date(),
    };

    if (getIsMongoConnected()) {
      try {
        const dbLog = await FoodLog.create({
          userId: userId,
          ...nutritionData,
          imageUrl: savedLog.imageUrl,
        });
        savedLog._id = dbLog._id;
      } catch (dbErr) {
        console.warn('Could not save to MongoDB, saving in memory:', dbErr.message);
        inMemoryFoodLogs.unshift(savedLog);
      }
    } else {
      inMemoryFoodLogs.unshift(savedLog);
    }

    res.status(200).json({
      success: true,
      usedAi: true,
      aiNotice: 'Real-time analysis generated with Google Gemini Vision AI.',
      data: savedLog,
    });
  } catch (error) {
    console.error('Food analysis error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze food image.',
    });
  }
};

// @desc    Get user's past food scans history
// @route   GET /api/food/history
exports.getFoodHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    if (getIsMongoConnected()) {
      const history = await FoodLog.find({ userId }).sort({ createdAt: -1 }).limit(20);
      return res.status(200).json({
        success: true,
        count: history.length,
        history,
      });
    } else {
      const userHistory = inMemoryFoodLogs.filter((log) => log.userId === userId || log.userId === 'anonymous');
      return res.status(200).json({
        success: true,
        count: userHistory.length,
        history: userHistory,
      });
    }
  } catch (error) {
    console.error('Get food history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve food history.',
    });
  }
};

// @desc    Delete a food scan from history
// @route   DELETE /api/food/history/:id
exports.deleteFoodHistory = async (req, res) => {
  try {
    const logId = req.params.id;

    if (getIsMongoConnected()) {
      await FoodLog.findByIdAndDelete(logId);
    } else {
      const index = inMemoryFoodLogs.findIndex((log) => log.id === logId || log._id === logId);
      if (index !== -1) {
        inMemoryFoodLogs.splice(index, 1);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Food log deleted successfully.',
    });
  } catch (error) {
    console.error('Delete food history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete food log.',
    });
  }
};
