const express = require('express');
const cors = require('cors');
const { Translate } = require('@google-cloud/translate').v2;
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Cloud Translate client
// Option 1: Using service account key file
const translate = new Translate({
  keyFilename: path.join(__dirname, '../key/fabled-emissary-472921-v0-65a0cfc84660.json'),
  projectId: 'fabled-emissary-472921' // Replace with your actual project ID
});

// Option 2: Using API key (alternative approach)
// const translate = new Translate({
//   key: process.env.GOOGLE_TRANSLATE_API_KEY
// });

// Translation endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, targetLanguage, sourceLanguage = 'en' } = req.body;

    if (!text || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required parameters: text and targetLanguage'
      });
    }

    // Skip translation if target is the same as source
    if (targetLanguage === sourceLanguage) {
      return res.json({
        translatedText: text,
        sourceLanguage,
        targetLanguage
      });
    }

    console.log(`Translating "${text}" from ${sourceLanguage} to ${targetLanguage}`);

    // Perform translation
    const [translation] = await translate.translate(text, {
      from: sourceLanguage,
      to: targetLanguage
    });

    res.json({
      translatedText: translation,
      sourceLanguage,
      targetLanguage,
      originalText: text
    });

  } catch (error) {
    console.error('Translation error:', error);
    res.status(500).json({
      error: 'Translation failed',
      message: error.message
    });
  }
});

// Batch translation endpoint
app.post('/api/translate/batch', async (req, res) => {
  try {
    const { texts, targetLanguage, sourceLanguage = 'en' } = req.body;

    if (!texts || !Array.isArray(texts) || !targetLanguage) {
      return res.status(400).json({
        error: 'Missing required parameters: texts (array) and targetLanguage'
      });
    }

    // Skip translation if target is the same as source
    if (targetLanguage === sourceLanguage) {
      return res.json({
        translations: texts.map(text => ({
          originalText: text,
          translatedText: text,
          sourceLanguage,
          targetLanguage
        }))
      });
    }

    console.log(`Batch translating ${texts.length} texts from ${sourceLanguage} to ${targetLanguage}`);

    // Perform batch translation
    const [translations] = await translate.translate(texts, {
      from: sourceLanguage,
      to: targetLanguage
    });

    const results = texts.map((originalText, index) => ({
      originalText,
      translatedText: translations[index],
      sourceLanguage,
      targetLanguage
    }));

    res.json({
      translations: results
    });

  } catch (error) {
    console.error('Batch translation error:', error);
    res.status(500).json({
      error: 'Batch translation failed',
      message: error.message
    });
  }
});

// Get supported languages
app.get('/api/languages', async (req, res) => {
  try {
    const [languages] = await translate.getLanguages();
    
    const formattedLanguages = languages.map(lang => ({
      code: lang.code,
      name: lang.name
    }));

    res.json({
      languages: formattedLanguages
    });

  } catch (error) {
    console.error('Error fetching languages:', error);
    res.status(500).json({
      error: 'Failed to fetch supported languages',
      message: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Google Cloud Translation API'
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Translation server running on port ${PORT}`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Translation endpoint: http://localhost:${PORT}/api/translate`);
});

module.exports = app;
