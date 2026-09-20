# 🥗 NutriVision AI - Food Nutrition Analyzer

A modern, beginner-friendly full-stack web application that lets users upload food images and get comprehensive nutritional breakdowns (calories, macronutrients, micronutrients, health score, dietary tags, and dietary advice) powered by **Google Gemini Vision**, **Express**, **MongoDB**, **JWT authentication**, and **React**.

---

## 📁 Project Architecture

```text
portfolio/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection logic (with graceful demo fallback)
│   ├── controllers/
│   │   ├── authController.js     # User registration and login with bcrypt & JWT
│   │   └── foodController.js     # Food vision analysis & nutrient history
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT token verification for protected endpoints
│   ├── models/
│   │   ├── User.js               # Mongoose schema for User
│   │   └── FoodLog.js            # Mongoose schema for Food scan records
│   ├── routes/
│   │   ├── authRoutes.js         # /api/auth/register, /api/auth/login, /api/auth/me
│   │   └── foodRoutes.js         # /api/food/analyze, /api/food/history, /api/food/history/:id
│   ├── .env                      # PORT, MONGO_URI, GEMINI_API_KEY, JWT_SECRET
│   ├── .env.example              # Environment variables template
│   ├── package.json
│   └── server.js                 # Express server entry point
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Button.jsx        # Reusable Button component with variant styles
│   │   │   ├── Navbar.jsx        # Top header with profile info & logout
│   │   │   ├── ImageUpload.jsx   # Drag & drop image picker + test presets
│   │   │   └── NutrientDisplay.jsx # Nutrition visual cards & macro meters
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx     # Login & registration authentication page
│   │   │   └── DashboardPage.jsx # Main food image scan & nutrient dashboard
│   │   ├── App.jsx               # Auth state & page switcher
│   │   ├── index.css              # Modern glassmorphism styling
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js            # Vite config with proxy to backend port 5000
│   └── package.json
└── README.md
```

---

## ⚙️ Environment Variables (`backend/.env`)

Configure the following variables in `backend/.env`:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express server port | `5000` |
| `MONGO_URI` | MongoDB connection URL | `mongodb://127.0.0.1:27017/food_nutrition_db` |
| `GEMINI_API_KEY` | Google Gemini API Key | Get from [Google AI Studio](https://aistudio.google.com/) |
| `JWT_SECRET` | Secret key used to sign JWTs | `super_secret_food_analyzer_jwt_key_2025` |

> **Note for Beginners:** If you don't have MongoDB running locally or haven't entered your Gemini API key yet, the application gracefully provides realistic demonstration mode so you can register, test scans, and explore the UI immediately!

---

## 🚀 Running the Application with `npm run`

### Option 1: Running in separate folders (Standard)

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   # or: npm start
   ```
   Server starts at `http://localhost:5000`.

2. **Start the Frontend Client**:
   ```bash
   cd client
   npm run dev
   ```
   Client starts at `http://localhost:5173`.

---

### Option 2: Running from Root Directory

From the project root (`portfolio/`):
- Start Server: `npm run server`
- Start Client: `npm run client`

---

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Register a new user (`name`, `email`, `password`)
- `POST /api/auth/login` - Authenticate user & receive JWT token (`email`, `password`)
- `GET /api/auth/me` - Get profile of authenticated user (`Authorization: Bearer <token>`)

### Food Nutrition (`/api/food`)
- `POST /api/food/analyze` - Upload image file or base64 to extract nutrients with Gemini Vision
- `GET /api/food/history` - Retrieve user's saved food scans
- `DELETE /api/food/history/:id` - Delete a scan from history
