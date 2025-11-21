# Translation Development Setup Guide

This guide will help you set up translation functionality for **development mode** so you can test before deploying to production.

## 📋 Prerequisites

1. **Google Translate API Key**: Get it from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - Your API Key: `AIzaSyDocd69JIkr23WuAxtrnr7fW_ncaAGXJ-4`

## 🚀 Quick Setup

### Step 1: Create Frontend Environment File

Create a file named `.env` in the frontend root directory (`reel-connect-sports-hub/.env`):

```env
# Google Cloud Translation API Configuration
VITE_GOOGLE_TRANSLATE_API_KEY=AIzaSyDocd69JIkr23WuAxtrnr7fW_ncaAGXJ-4
VITE_BACKEND_URL=http://localhost:3001
```

### Step 2: Create Backend Environment File

Create a file named `.env` in the backend directory (`sportsreelstranslationserver/.env`):

```env
# Google Cloud Translation Server Configuration
PORT=3001
GOOGLE_TRANSLATE_API_KEY=AIzaSyDocd69JIkr23WuAxtrnr7fW_ncaAGXJ-4
NODE_ENV=development
```

### Step 3: Start the Backend Server

Open a terminal in the `sportsreelstranslationserver` folder and run:

```bash
npm install  # If you haven't already
npm start    # Or npm run dev for auto-reload
```

The server should start on `http://localhost:3001`

### Step 4: Start the Frontend Development Server

Open a terminal in the `reel-connect-sports-hub` folder and run:

```bash
npm install  # If you haven't already
npm run dev  # Vite dev server
```

The frontend should start on `http://localhost:8080` (or the port shown)

## ✅ Testing Translation

1. Open your app in the browser
2. Change the language using your language selector
3. The page should translate automatically
4. Check the browser console for any errors

## 🔍 Troubleshooting

### Backend not starting
- Check if port 3001 is already in use
- Verify `.env` file exists and has `GOOGLE_TRANSLATE_API_KEY` set
- Check console for error messages

### Frontend translation not working
- Verify `.env` file exists in frontend root with `VITE_GOOGLE_TRANSLATE_API_KEY`
- Check browser console for warnings about missing API key
- Make sure backend server is running on `http://localhost:3001`
- Try restarting the dev server after creating `.env` file

### API Key errors (400/403)
- Verify your API key is correct
- Check that Google Translate API is enabled in Google Cloud Console
- Verify API key restrictions (if any) allow your domain/IP

## 🌐 Production Deployment

When deploying to production:

### Frontend (Vercel/Netlify/etc.)
Add these environment variables in your hosting platform:
- `VITE_GOOGLE_TRANSLATE_API_KEY` = Your API key
- `VITE_BACKEND_URL` = `https://sportsreelstranslationserver.onrender.com`

### Backend (Render.com)
Add these environment variables in Render.com dashboard:
- `GOOGLE_TRANSLATE_API_KEY` = Your API key
- `PORT` = (usually set automatically)
- `NODE_ENV` = `production`

## 📝 Notes

- `.env` files are gitignored and won't be committed to your repository
- The backend will try to use the backend server first, then fall back to frontend translation
- Translation results are cached in browser localStorage for better performance

