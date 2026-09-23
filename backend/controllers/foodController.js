
// controllers/foodController.js - Analyzes food image with Gemini Vision and manages scan history
const { GoogleGenerativeAI } = require('@google/generative-ai');
const FoodLog = require('../models/FoodLog');
const { getIsMongoConnected } = require('../config/db');

// In-memory fallback history if MongoDB is not active
const inMemoryFoodLogs = [];

// Helper to wait before retrying Gemini
const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// Helper to sanitize Gemini's response into clean JSON
const parseGeminiJson = (text) => {
  try {
    // Remove code block markdown like ```json ... ``` if present
    const cleaned = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    return JSON.parse(cleaned);
  } catch (err) {
    console.error('Error parsing JSON from Gemini response:', err.message);
    return null;
  }
};

// Retry Gemini request when the API is temporarily busy
const generateWithRetry = async (model, content, retries = 3) => {
  let lastError = null;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🤖 Gemini request attempt ${attempt}/${retries}`);

      const result = await model.generateContent(content);

      return result;
    } catch (error) {
      lastError = error;

      const errorMessage = error?.message || '';

      const isRetryable =
        errorMessage.includes('503') ||
        errorMessage.includes('429') ||
        errorMessage.includes('Service Unavailable') ||
        errorMessage.includes('high demand') ||
        errorMessage.includes('overloaded') ||
        errorMessage.includes('temporarily unavailable');

      if (!isRetryable || attempt === retries) {
        throw error;
      }

      const waitTime = attempt * 2000;

      console.warn(
        `⚠️ Gemini temporarily unavailable. Retrying in ${waitTime / 1000}s...`
      );

      await sleep(waitTime);
    }
  }

  throw lastError;
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

      base64Preview = `data:${mimeType};base64,${imageBuffer.toString(
        'base64'
      )}`;
    } else if (req.body.imageBase64) {
      const inputStr = req.body.imageBase64.trim();

      if (
        inputStr.startsWith('http://') ||
        inputStr.startsWith('https://')
      ) {
        // Fetch remote preset image
        const imgRes = await fetch(inputStr);

        if (!imgRes.ok) {
          return res.status(400).json({
            success: false,
            message: 'Could not download the provided image.',
          });
        }

        const arrayBuf = await imgRes.arrayBuffer();

        imageBuffer = Buffer.from(arrayBuf);
        mimeType = imgRes.headers.get('content-type') || 'image/jpeg';

        base64Preview = `data:${mimeType};base64,${imageBuffer.toString(
          'base64'
        )}`;
      } else {
        const matches = inputStr.match(
          /^data:([A-Za-z-+\/]+);base64,(.+)$/
        );

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

    // Make sure image exists
    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'The uploaded image is empty or invalid.',
      });
    }

    // 2. Check Gemini API key
    const apiKey = process.env.GEMINI_API_KEY;

    if (
      !apiKey ||
      apiKey === 'YOUR_GEMINI_API_KEY_HERE' ||
      apiKey.trim().length < 10
    ) {
      return res.status(500).json({
        success: false,
        message: 'Google Gemini API key is missing or invalid in backend/.env.',
      });
    }

    console.log('🤖 Sending image to Google Gemini Vision...');

    const genAI = new GoogleGenerativeAI(apiKey);

    // 3. Prompt
    const prompt = `You are an expert food scientist and nutrition analyst.

Analyze the food in this image carefully.

Identify the most likely food or dish using visual clues such as:
- ingredients
- textures
- colors
- cooking method
- presentation
- portion size

Estimate nutrition for the visible serving.

IMPORTANT:
Nutrition values from an image are estimates. Do not pretend to know exact quantities when they cannot be determined visually.

Return ONLY valid raw JSON.
Do NOT return markdown.
Do NOT return \`\`\`json.
Do NOT include explanations outside the JSON.

Required JSON structure:

{
  "foodName": "Specific identified food or dish",
  "servingSize": "Estimated serving size",
  "calories": 480,
  "macros": {
    "protein": 28,
    "carbs": 52,
    "fats": 16,
    "fiber": 6,
    "sugar": 5
  },
  "vitaminsAndMinerals": [
    {
      "name": "Vitamin C",
      "amount": "45mg (50% DV)"
    },
    {
      "name": "Iron",
      "amount": "3.8mg (21% DV)"
    },
    {
      "name": "Calcium",
      "amount": "160mg (16% DV)"
    },
    {
      "name": "Potassium",
      "amount": "580mg (12% DV)"
    }
  ],
  "ingredients": [
    {
      "name": "Primary Ingredient",
      "amount": "150g"
    },
    {
      "name": "Secondary Ingredient",
      "amount": "80g"
    }
  ],
  "dietaryTags": [
    "High Protein",
    "Whole Food"
  ],
  "healthScore": 88,
  "healthSummary": "2-3 sentences explaining the nutritional benefits, glycemic impact and satiety.",
  "recommendation": "Practical evidence-based advice for improving or balancing this meal."
}

Rules:
- calories must be an integer.
- macros must contain numeric gram values.
- healthScore must be an integer from 1 to 100.
- ingredients must be an array.
- dietaryTags must be an array.
- vitaminsAndMinerals must be an array.
- Use realistic estimates.
- If an ingredient or nutrient cannot be confidently determined, make a reasonable estimate rather than inventing false precision.
- Return ONLY the JSON object.`;

    // 4. Prepare image for Gemini
    const imagePart = {
      inlineData: {
        data: imageBuffer.toString('base64'),
        mimeType: mimeType,
      },
    };

    // 5. Gemini models
    // Primary model first, then lighter/fallback models.
    const candidateModels = [
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-flash-latest',
    ];

    let parsedData = null;
    let lastError = null;

    // 6. Try each model
    for (const modelName of candidateModels) {
      try {
        console.log(`🔎 Trying Gemini model: ${modelName}`);

        const model = genAI.getGenerativeModel({
          model: modelName,
        });

        // Retry temporary 503/429 errors
        const result = await generateWithRetry(
          model,
          [prompt, imagePart],
          3
        );

        const responseText = result.response.text();

        console.log(`📥 Gemini response received from ${modelName}`);

        const parsed = parseGeminiJson(responseText);

        if (
          parsed &&
          parsed.foodName &&
          parsed.calories !== undefined
        ) {
          parsedData = parsed;

          console.log(
            `✅ Successfully analyzed with ${modelName}:`,
            parsedData.foodName
          );

          break;
        }

        console.warn(
          `⚠️ ${modelName} returned invalid nutrition JSON.`
        );
      } catch (err) {
        console.warn(
          `❌ Model ${modelName} failed:`,
          err.message
        );

        lastError = err;
      }
    }

    // 7. If all models failed
    if (!parsedData) {
      const errorMessage = lastError?.message || '';

      if (
        errorMessage.includes('503') ||
        errorMessage.includes('Service Unavailable') ||
        errorMessage.includes('high demand') ||
        errorMessage.includes('overloaded')
      ) {
        throw new Error(
          'Gemini is temporarily busy. Please try analyzing the image again in a few seconds.'
        );
      }

      if (
        errorMessage.includes('429') ||
        errorMessage.includes('quota') ||
        errorMessage.includes('RESOURCE_EXHAUSTED')
      ) {
        throw new Error(
          'Gemini API usage limit has been reached. Please try again later.'
        );
      }

      throw new Error(
        lastError
          ? `Gemini Vision failed to analyze the image: ${lastError.message}`
          : 'Could not extract valid nutritional details from the image.'
      );
    }

    // 8. Normalize ingredients array
    let normalizedIngredients = [];

    if (Array.isArray(parsedData.ingredients)) {
      normalizedIngredients = parsedData.ingredients.map((item) => {
        if (typeof item === 'string') {
          return {
            name: item,
            amount: '',
          };
        }

        return {
          name: item.name || 'Ingredient',
          amount: item.amount || '',
        };
      });
    }

    // 9. Normalize nutrition data
    const nutritionData = {
      foodName: parsedData.foodName || 'Analyzed Food',

      servingSize:
        parsedData.servingSize || '1 serving',

      calories:
        Number(parsedData.calories) || 0,

      macros: {
        protein:
          Number(parsedData.macros?.protein) || 0,

        carbs:
          Number(parsedData.macros?.carbs) || 0,

        fats:
          Number(parsedData.macros?.fats) || 0,

        fiber:
          Number(parsedData.macros?.fiber) || 0,

        sugar:
          Number(parsedData.macros?.sugar) || 0,
      },

      vitaminsAndMinerals:
        Array.isArray(parsedData.vitaminsAndMinerals)
          ? parsedData.vitaminsAndMinerals
          : [],

      ingredients:
        normalizedIngredients,

      dietaryTags:
        Array.isArray(parsedData.dietaryTags)
          ? parsedData.dietaryTags
          : [],

      healthScore:
        Number(parsedData.healthScore) || 80,

      healthSummary:
        parsedData.healthSummary || '',

      recommendation:
        parsedData.recommendation || '',
    };

    // 10. Save scan
    const savedLog = {
      id: 'log_' + Date.now(),

      userId: userId,

      ...nutritionData,

      imageUrl:
        base64Preview.length < 300000
          ? base64Preview
          : '',

      createdAt: new Date(),
    };

    // 11. Save to MongoDB or memory
    if (getIsMongoConnected()) {
      try {
        const dbLog = await FoodLog.create({
          userId: userId,
          ...nutritionData,
          imageUrl: savedLog.imageUrl,
        });

        savedLog._id = dbLog._id;
      } catch (dbErr) {
        console.warn(
          'Could not save to MongoDB, saving in memory:',
          dbErr.message
        );

        inMemoryFoodLogs.unshift(savedLog);
      }
    } else {
      inMemoryFoodLogs.unshift(savedLog);
    }

    // 12. Send response
    res.status(200).json({
      success: true,

      usedAi: true,

      aiNotice:
        'Real-time analysis generated with Google Gemini Vision AI.',

      data: savedLog,
    });
  } catch (error) {
    console.error('Food analysis error:', error);

    res.status(500).json({
      success: false,
      message:
        error.message ||
        'Failed to analyze food image.',
    });
  }
};

// @desc    Get user's past food scans history
// @route   GET /api/food/history
exports.getFoodHistory = async (req, res) => {
  try {
    const userId = req.user.id;

    if (getIsMongoConnected()) {
      const history = await FoodLog.find({ userId })
        .sort({ createdAt: -1 })
        .limit(20);

      return res.status(200).json({
        success: true,
        count: history.length,
        history,
      });
    } else {
      const userHistory = inMemoryFoodLogs.filter(
        (log) =>
          log.userId === userId ||
          log.userId === 'anonymous'
      );

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
      const index = inMemoryFoodLogs.findIndex(
        (log) =>
          log.id === logId ||
          log._id === logId
      );

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

