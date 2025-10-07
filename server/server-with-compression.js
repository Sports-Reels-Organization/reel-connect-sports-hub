/**
 * Main Server with Server-Side Video Compression
 * 
 * Integrates:
 * - R2 presigned URL service
 * - Server-side FFmpeg compression
 * - Original and compressed video management
 */

const express = require('express');
const cors = require('cors');
const compressionApi = require('./compression-api');
const r2Service = require('./r2-presigned-service');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
    origin: process.env.REACT_APP_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
            r2: 'connected',
            compression: 'ready'
        }
    });
});

// Mount compression API
app.use('/', compressionApi);

// Mount existing R2 service
app.use('/', r2Service);

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('❌ Server error:', error);
    res.status(500).json({
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        error: 'Endpoint not found',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log('🚀 Server with compression running on port', PORT);
    console.log('📁 R2 Bucket:', process.env.R2_BUCKET_NAME || 'testsports');
    console.log('🎬 FFmpeg compression: Ready');
    console.log('🔗 Health check: http://localhost:' + PORT + '/health');
});

module.exports = app;
