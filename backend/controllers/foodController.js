
// controllers/foodController.js
// Analyzes food images with Gemini Vision and manages scan history

const { GoogleGenerativeAI } = require('@google/generative-ai');
const FoodLog = require('../models/FoodLog');
const { getIsMongoConnected } = require('../config/db');

// In-memory fallback history if MongoDB is not active
const inMemoryFoodLogs = [];

// ---------------------------------------------------------
// Helper: wait
// ---------------------------------------------------------
const sleep = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// ---------------------------------------------------------
// Helper: clean Gemini JSON response
// ---------------------------------------------------------
const parseGeminiJson = (text) => {
  try {
    if (!text) {
      return null;
    }

    let cleaned = text.trim();

    // Remove markdown code blocks if Gemini adds them
    cleaned = cleaned
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    // Find JSON object if Gemini added extra text
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1) {
      cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    }

    return JSON.parse(cleaned);
  } catch (err) {
    console.error(
      '❌ Error parsing JSON from Gemini:',
      err.message
    );

    return null;
  }
};

// ---------------------------------------------------------
// Helper: determine whether Gemini error is temporary
// ---------------------------------------------------------
const isTemporaryGeminiError = (error) => {
  const message = error?.message || '';

  return (
    message.includes('503') ||
    message.includes('429') ||
    message.includes('Service Unavailable') ||
    message.includes('high demand') ||
    message.includes('overloaded') ||
    message.includes('temporarily unavailable') ||
    message.includes('RESOURCE_EXHAUSTED')
  );
};

// @desc    Analyze uploaded food image with Gemini Vision
// @route   POST /api/food/analyze
exports.analyzeFoodImage = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : 'anonymous';

    let imageBuffer = null;
    let mimeType = 'image/jpeg';
    let base64Preview = '';

    // =====================================================
    // 1. GET IMAGE
    // =====================================================

    // Multipart upload
    if (req.file) {
      imageBuffer = req.file.buffer;

      mimeType =
        req.file.mimetype || 'image/jpeg';

      base64Preview =
        `data:${mimeType};base64,` +
        imageBuffer.toString('base64');
    }

    // Base64 / URL image
    else if (req.body.imageBase64) {
      const inputStr =
        req.body.imageBase64.trim();

      // Remote URL
      if (
        inputStr.startsWith('http://') ||
        inputStr.startsWith('https://')
      ) {
        const imgRes = await fetch(inputStr);

        if (!imgRes.ok) {
          return res.status(400).json({
            success: false,
            message:
              'Could not download the provided image.',
          });
        }

        const arrayBuf =
          await imgRes.arrayBuffer();

        imageBuffer = Buffer.from(arrayBuf);

        mimeType =
          imgRes.headers.get('content-type') ||
          'image/jpeg';

        base64Preview =
          `data:${mimeType};base64,` +
          imageBuffer.toString('base64');
      }

      // Data URL
      else {
        const matches =
          inputStr.match(
            /^data:([A-Za-z-+\/]+);base64,(.+)$/
          );

        if (
          matches &&
          matches.length === 3
        ) {
          mimeType = matches[1];

          imageBuffer =
            Buffer.from(
              matches[2],
              'base64'
            );

          base64Preview = inputStr;
        }

        // Raw base64
        else {
          imageBuffer =
            Buffer.from(
              inputStr,
              'base64'
            );

          base64Preview =
            `data:image/jpeg;base64,${inputStr}`;
        }
      }
    }

    // No image
    else {
      return res.status(400).json({
        success: false,
        message:
          'No image provided. Please upload a food image file.',
      });
    }

    // =====================================================
    // 2. VALIDATE IMAGE
    // =====================================================

    if (
      !imageBuffer ||
      imageBuffer.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'The uploaded image is empty or invalid.',
      });
    }

    console.log(
      `📷 Image received: ${(imageBuffer.length / 1024 / 1024).toFixed(2)} MB`
    );

    // =====================================================
    // 3. GEMINI API KEY
    // =====================================================

    const apiKey =
      process.env.GEMINI_API_KEY;

    if (
      !apiKey ||
      apiKey ===
        'YOUR_GEMINI_API_KEY_HERE' ||
      apiKey.trim().length < 10
    ) {
      return res.status(500).json({
        success: false,
        message:
          'Google Gemini API key is missing or invalid in backend/.env.',
      });
    }

    // =====================================================
    // 4. INITIALIZE GEMINI
    // =====================================================

    const genAI =
      new GoogleGenerativeAI(apiKey);

    /*
      Using one fast model instead of trying
      multiple models.

      This prevents the previous situation where
      several models could each retry and make the
      request take 40-60+ seconds.
    */

    const model =
      genAI.getGenerativeModel({
        model: 'gemini-2.5-flash-lite',
      });

    console.log(
      '🤖 Sending image to Gemini Vision...'
    );

    // =====================================================
    // 5. PROMPT
    // =====================================================

    const prompt = `
Analyze this food image and estimate its nutritional information.

Identify the most likely food or dish using:
- visible ingredients
- texture
- color
- cooking method
- presentation
- estimated portion size

Important:
Nutrition values from an image are estimates.
Do not claim exact values when they cannot be determined visually.

Return ONLY valid JSON.
Do not return markdown.
Do not return \`\`\`json.
Do not include any explanation outside the JSON.

Use exactly this structure:

{
  "foodName": "Specific food or dish name",
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
  "healthSummary": "2-3 sentences explaining nutritional benefits, glycemic impact and satiety.",
  "recommendation": "Practical evidence-based advice for improving or balancing this meal."
}

Rules:
- calories must be a number.
- All macro values must be numbers in grams.
- healthScore must be an integer from 1 to 100.
- ingredients must be an array.
- dietaryTags must be an array.
- vitaminsAndMinerals must be an array.
- Use realistic estimates.
- Do not invent ingredients that cannot reasonably be identified.
- Return ONLY the JSON object.
`;

    // =====================================================
    // 6. IMAGE PART
    // =====================================================

    const imagePart = {
      inlineData: {
        data:
          imageBuffer.toString('base64'),

        mimeType: mimeType,
      },
    };

    // =====================================================
    // 7. GEMINI REQUEST
    // =====================================================

    let result;

    try {
      const startTime = Date.now();

      result =
        await model.generateContent([
          prompt,
          imagePart,
        ]);

      console.log(
        `⚡ Gemini response received in ${
          Date.now() - startTime
        }ms`
      );
    } catch (error) {
      console.warn(
        '⚠️ First Gemini request failed:',
        error.message
      );

      // Only retry temporary errors
      if (
        isTemporaryGeminiError(error)
      ) {
        console.log(
          '🔄 Gemini temporarily unavailable. Retrying once in 1.5 seconds...'
        );

        await sleep(1500);

        try {
          const retryStart =
            Date.now();

          result =
            await model.generateContent([
              prompt,
              imagePart,
            ]);

          console.log(
            `✅ Gemini retry succeeded in ${
              Date.now() - retryStart
            }ms`
          );
        } catch (retryError) {
          console.error(
            '❌ Gemini retry failed:',
            retryError.message
          );

          const retryMessage =
            retryError?.message || '';

          if (
            retryMessage.includes('429') ||
            retryMessage.includes(
              'RESOURCE_EXHAUSTED'
            )
          ) {
            return res.status(429).json({
              success: false,
              message:
                'Gemini API usage limit has been reached. Please try again later.',
            });
          }

          if (
            retryMessage.includes('503') ||
            retryMessage.includes(
              'Service Unavailable'
            ) ||
            retryMessage.includes(
              'high demand'
            ) ||
            retryMessage.includes(
              'overloaded'
            )
          ) {
            return res.status(503).json({
              success: false,
              message:
                'Gemini is temporarily busy. Please try again in a few seconds.',
            });
          }

          throw retryError;
        }
      } else {
        throw error;
      }
    }

    // =====================================================
    // 8. READ GEMINI RESPONSE
    // =====================================================

    const responseText =
      result.response.text();

    console.log(
      '📥 Gemini response received.'
    );

    const parsedData =
      parseGeminiJson(responseText);

    if (
      !parsedData ||
      !parsedData.foodName
    ) {
      console.error(
        '❌ Invalid Gemini JSON:',
        responseText
      );

      throw new Error(
        'Gemini returned invalid food analysis data.'
      );
    }

    console.log(
      '✅ Food identified:',
      parsedData.foodName
    );

    // =====================================================
    // 9. NORMALIZE INGREDIENTS
    // =====================================================

    let normalizedIngredients = [];

    if (
      Array.isArray(
        parsedData.ingredients
      )
    ) {
      normalizedIngredients =
        parsedData.ingredients.map(
          (item) => {
            if (
              typeof item === 'string'
            ) {
              return {
                name: item,
                amount: '',
              };
            }

            return {
              name:
                item.name ||
                'Ingredient',

              amount:
                item.amount || '',
            };
          }
        );
    }

    // =====================================================
    // 10. NORMALIZE NUTRITION DATA
    // =====================================================

    const nutritionData = {
      foodName:
        parsedData.foodName ||
        'Analyzed Food',

      servingSize:
        parsedData.servingSize ||
        '1 serving',

      calories:
        Number(
          parsedData.calories
        ) || 0,

      macros: {
        protein:
          Number(
            parsedData.macros?.protein
          ) || 0,

        carbs:
          Number(
            parsedData.macros?.carbs
          ) || 0,

        fats:
          Number(
            parsedData.macros?.fats
          ) || 0,

        fiber:
          Number(
            parsedData.macros?.fiber
          ) || 0,

        sugar:
          Number(
            parsedData.macros?.sugar
          ) || 0,
      },

      vitaminsAndMinerals:
        Array.isArray(
          parsedData.vitaminsAndMinerals
        )
          ? parsedData.vitaminsAndMinerals
          : [],

      ingredients:
        normalizedIngredients,

      dietaryTags:
        Array.isArray(
          parsedData.dietaryTags
        )
          ? parsedData.dietaryTags
          : [],

      healthScore:
        Number(
          parsedData.healthScore
        ) || 80,

      healthSummary:
        parsedData.healthSummary ||
        '',

      recommendation:
        parsedData.recommendation ||
        '',
    };

    // =====================================================
    // 11. CREATE LOG
    // =====================================================

    const savedLog = {
      id:
        'log_' +
        Date.now(),

      userId: userId,

      ...nutritionData,

      // Don't store huge images in MongoDB
      imageUrl:
        base64Preview.length <
        300000
          ? base64Preview
          : '',

      createdAt:
        new Date(),
    };

    // =====================================================
    // 12. SAVE TO MONGODB
    // =====================================================

    if (
      getIsMongoConnected()
    ) {
      try {
        const dbLog =
          await FoodLog.create({
            userId: userId,

            ...nutritionData,

            imageUrl:
              savedLog.imageUrl,
          });

        savedLog._id =
          dbLog._id;
      } catch (dbErr) {
        console.warn(
          '⚠️ Could not save to MongoDB. Saving in memory:',
          dbErr.message
        );

        inMemoryFoodLogs.unshift(
          savedLog
        );
      }
    } else {
      inMemoryFoodLogs.unshift(
        savedLog
      );
    }

    // =====================================================
    // 13. SEND RESULT
    // =====================================================

    return res.status(200).json({
      success: true,

      usedAi: true,

      aiNotice:
        'Real-time analysis generated with Google Gemini Vision AI.',

      data: savedLog,
    });
  } catch (error) {
    console.error(
      '❌ Food analysis error:',
      error
    );

    const message =
      error?.message || '';

    // API quota
    if (
      message.includes('429') ||
      message.includes(
        'RESOURCE_EXHAUSTED'
      ) ||
      message.includes('quota')
    ) {
      return res.status(429).json({
        success: false,
        message:
          'Gemini API usage limit has been reached. Please try again later.',
      });
    }

    // Temporary Google server problem
    if (
      message.includes('503') ||
      message.includes(
        'Service Unavailable'
      ) ||
      message.includes(
        'high demand'
      ) ||
      message.includes(
        'overloaded'
      )
    ) {
      return res.status(503).json({
        success: false,
        message:
          'Gemini is temporarily busy. Please try again in a few seconds.',
      });
    }

    return res.status(500).json({
      success: false,
      message:
        message ||
        'Failed to analyze food image.',
    });
  }
};

// =========================================================
// GET FOOD HISTORY
// =========================================================

// @desc    Get user's past food scans history
// @route   GET /api/food/history
exports.getFoodHistory = async (
  req,
  res
) => {
  try {
    const userId =
      req.user.id;

    if (
      getIsMongoConnected()
    ) {
      const history =
        await FoodLog.find({
          userId,
        })
          .sort({
            createdAt: -1,
          })
          .limit(20);

      return res.status(200).json({
        success: true,
        count:
          history.length,
        history,
      });
    }

    const userHistory =
      inMemoryFoodLogs.filter(
        (log) =>
          log.userId === userId ||
          log.userId ===
            'anonymous'
      );

    return res.status(200).json({
      success: true,
      count:
        userHistory.length,
      history:
        userHistory,
    });
  } catch (error) {
    console.error(
      '❌ Get food history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to retrieve food history.',
    });
  }
};

// =========================================================
// DELETE FOOD HISTORY
// =========================================================

// @desc    Delete a food scan from history
// @route   DELETE /api/food/history/:id
exports.deleteFoodHistory = async (
  req,
  res
) => {
  try {
    const logId =
      req.params.id;

    if (
      getIsMongoConnected()
    ) {
      await FoodLog.findByIdAndDelete(
        logId
      );
    } else {
      const index =
        inMemoryFoodLogs.findIndex(
          (log) =>
            log.id === logId ||
            log._id === logId
        );

      if (index !== -1) {
        inMemoryFoodLogs.splice(
          index,
          1
        );
      }
    }

    return res.status(200).json({
      success: true,
      message:
        'Food log deleted successfully.',
    });
  } catch (error) {
    console.error(
      '❌ Delete food history error:',
      error
    );

    return res.status(500).json({
      success: false,
      message:
        'Failed to delete food log.',
    });
  }
};
````
