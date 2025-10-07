/**
 * Server-Side Video Compression API
 * 
 * Endpoints:
 * - POST /upload-original - Upload original video to R2 originals/ bucket
 * - POST /compress-video - Trigger FFmpeg compression job
 * - GET /compression-status/:jobId - Check compression job status
 * - POST /compressed-file-info - Get compressed file information
 */

const express = require('express');
const multer = require('multer');
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const router = express.Router();

// Configure AWS S3 (R2)
const s3Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT || 'https://31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com',
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '3273ac17ec3ae48a772292d23a0475d3',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || 'a69fbcb07331f7232ba245dc5378fb11ac6f861bb68503b4d9f3e6fb3ab0d47c',
    },
});

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

// In-memory job tracking (in production, use Redis or database)
const compressionJobs = new Map();

// Upload original video to R2 originals/ bucket
router.post('/upload-original', upload.single('file'), async (req, res) => {
    try {
        const { file } = req;
        const { bucket = 'originals', path: filePath } = req.body;

        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        // Generate unique key for original file
        const timestamp = Date.now();
        const randomId = crypto.randomBytes(8).toString('hex');
        const extension = path.extname(file.originalname);
        const key = `originals/${filePath || `videos/${timestamp}_${randomId}${extension}`}`;

        console.log(`📤 Uploading original video: ${key} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

        // Upload to R2
        const uploadCommand = new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'testsports',
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
            Metadata: {
                originalName: file.originalname,
                uploadTime: new Date().toISOString(),
                fileSize: file.size.toString()
            }
        });

        await s3Client.send(uploadCommand);

        console.log(`✅ Original uploaded successfully: ${key}`);

        res.json({
            success: true,
            key,
            size: file.size,
            url: `${process.env.R2_ENDPOINT || 'https://31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com'}/${process.env.R2_BUCKET_NAME || 'testsports'}/${key}`
        });

    } catch (error) {
        console.error('❌ Upload original failed:', error);
        res.status(500).json({
            error: 'Failed to upload original video',
            details: error.message
        });
    }
});

// Trigger FFmpeg compression job
router.post('/compress-video', async (req, res) => {
    try {
        const {
            originalKey,
            quality = 'medium',
            targetBitrate = 1500,
            maxResolution = '720p',
            preserveAudio = true,
            outputFormat = 'mp4'
        } = req.body;

        if (!originalKey) {
            return res.status(400).json({ error: 'originalKey is required' });
        }

        // Generate job ID
        const jobId = crypto.randomUUID();

        // Create compression settings
        const compressionSettings = {
            jobId,
            originalKey,
            quality,
            targetBitrate,
            maxResolution,
            preserveAudio,
            outputFormat,
            status: 'queued',
            progress: 0,
            startTime: new Date().toISOString(),
            compressedKey: null,
            error: null
        };

        // Store job info
        compressionJobs.set(jobId, compressionSettings);

        console.log(`🎬 Starting compression job: ${jobId}`);
        console.log(`📁 Original: ${originalKey}`);
        console.log(`⚙️ Settings: ${quality} quality, ${targetBitrate}kbps, ${maxResolution}`);

        // Start compression in background
        startCompressionJob(jobId, compressionSettings);

        res.json({
            success: true,
            jobId,
            message: 'Compression job started'
        });

    } catch (error) {
        console.error('❌ Trigger compression failed:', error);
        res.status(500).json({
            error: 'Failed to start compression job',
            details: error.message
        });
    }
});

// Check compression job status
router.get('/compression-status/:jobId', async (req, res) => {
    try {
        const { jobId } = req.params;

        const job = compressionJobs.get(jobId);
        if (!job) {
            return res.status(404).json({ error: 'Job not found' });
        }

        res.json({
            jobId,
            status: job.status,
            progress: job.progress,
            compressedKey: job.compressedKey,
            error: job.error,
            startTime: job.startTime,
            endTime: job.endTime
        });

    } catch (error) {
        console.error('❌ Get compression status failed:', error);
        res.status(500).json({
            error: 'Failed to get compression status',
            details: error.message
        });
    }
});

// Get compressed file information
router.post('/compressed-file-info', async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'key is required' });
        }

        // Get file info from R2
        const headCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'testsports',
            Key: key
        });

        const response = await s3Client.send(headCommand);

        // Generate presigned URL for compressed file
        const presignedUrl = await getSignedUrl(s3Client, headCommand, { expiresIn: 3600 });

        res.json({
            success: true,
            key,
            size: response.ContentLength,
            url: presignedUrl,
            contentType: response.ContentType,
            lastModified: response.LastModified
        });

    } catch (error) {
        console.error('❌ Get compressed file info failed:', error);
        res.status(500).json({
            error: 'Failed to get compressed file info',
            details: error.message
        });
    }
});

// Background compression job processor
async function startCompressionJob(jobId, settings) {
    try {
        // Update job status
        compressionJobs.set(jobId, { ...settings, status: 'processing', progress: 10 });

        console.log(`🔄 Processing compression job: ${jobId}`);

        // Download original from R2
        const originalKey = settings.originalKey;
        const downloadCommand = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || 'testsports',
            Key: originalKey
        });

        const originalResponse = await s3Client.send(downloadCommand);
        const originalBuffer = await streamToBuffer(originalResponse.Body);

        // Generate compressed file key
        const compressedKey = originalKey.replace('originals/', 'compressed/').replace(/\.[^/.]+$/, '_compressed.mp4');

        // Create temporary files
        const tempDir = '/tmp/compression';
        await fs.mkdir(tempDir, { recursive: true });

        const tempOriginal = path.join(tempDir, `original_${jobId}${path.extname(originalKey)}`);
        const tempCompressed = path.join(tempDir, `compressed_${jobId}.mp4`);

        // Write original to temp file
        await fs.writeFile(tempOriginal, originalBuffer);

        compressionJobs.set(jobId, { ...settings, status: 'processing', progress: 30 });

        // Run FFmpeg compression
        const ffmpegArgs = buildFFmpegArgs(tempOriginal, tempCompressed, settings);

        console.log(`🎬 Running FFmpeg: ${ffmpegArgs.join(' ')}`);

        const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

        let progress = 30;

        ffmpegProcess.stderr.on('data', (data) => {
            const output = data.toString();
            // Parse FFmpeg progress (simplified)
            if (output.includes('time=')) {
                progress = Math.min(90, 30 + Math.random() * 60); // Simulate progress
                compressionJobs.set(jobId, { ...settings, status: 'processing', progress });
            }
        });

        ffmpegProcess.on('close', async (code) => {
            try {
                if (code !== 0) {
                    throw new Error(`FFmpeg exited with code ${code}`);
                }

                compressionJobs.set(jobId, { ...settings, status: 'processing', progress: 95 });

                // Read compressed file
                const compressedBuffer = await fs.readFile(tempCompressed);

                // Upload compressed file to R2
                const uploadCommand = new PutObjectCommand({
                    Bucket: process.env.R2_BUCKET_NAME || 'testsports',
                    Key: compressedKey,
                    Body: compressedBuffer,
                    ContentType: 'video/mp4',
                    Metadata: {
                        originalKey,
                        compressionSettings: JSON.stringify(settings),
                        compressedTime: new Date().toISOString(),
                        fileSize: compressedBuffer.length.toString()
                    }
                });

                await s3Client.send(uploadCommand);

                // Clean up temp files
                await fs.unlink(tempOriginal).catch(() => { });
                await fs.unlink(tempCompressed).catch(() => { });

                // Update job as completed
                compressionJobs.set(jobId, {
                    ...settings,
                    status: 'completed',
                    progress: 100,
                    compressedKey,
                    endTime: new Date().toISOString()
                });

                console.log(`✅ Compression completed: ${jobId} -> ${compressedKey}`);

            } catch (error) {
                console.error(`❌ Compression job ${jobId} failed:`, error);
                compressionJobs.set(jobId, {
                    ...settings,
                    status: 'failed',
                    error: error.message,
                    endTime: new Date().toISOString()
                });
            }
        });

        ffmpegProcess.on('error', (error) => {
            console.error(`❌ FFmpeg process error for job ${jobId}:`, error);
            compressionJobs.set(jobId, {
                ...settings,
                status: 'failed',
                error: error.message,
                endTime: new Date().toISOString()
            });
        });

    } catch (error) {
        console.error(`❌ Compression job ${jobId} setup failed:`, error);
        compressionJobs.set(jobId, {
            ...settings,
            status: 'failed',
            error: error.message,
            endTime: new Date().toISOString()
        });
    }
}

// Build FFmpeg arguments based on compression settings
function buildFFmpegArgs(inputPath, outputPath, settings) {
    const args = [
        '-i', inputPath,
        '-c:v', 'libx264', // H.264 video codec
        '-preset', 'medium', // Encoding speed vs compression efficiency
        '-crf', getCRFValue(settings.quality), // Constant Rate Factor
        '-maxrate', `${settings.targetBitrate}k`,
        '-bufsize', `${settings.targetBitrate * 2}k`,
        '-vf', getScaleFilter(settings.maxResolution),
        '-movflags', '+faststart', // Optimize for streaming
        '-y' // Overwrite output file
    ];

    if (settings.preserveAudio) {
        args.push('-c:a', 'aac', '-b:a', '128k'); // AAC audio at 128kbps
    } else {
        args.push('-an'); // No audio
    }

    args.push(outputPath);

    return args;
}

function getCRFValue(quality) {
    switch (quality) {
        case 'high': return '18'; // Higher quality
        case 'medium': return '23'; // Balanced
        case 'low': return '28'; // Lower quality, smaller file
        default: return '23';
    }
}

function getScaleFilter(resolution) {
    switch (resolution) {
        case '1080p': return 'scale=1920:1080';
        case '720p': return 'scale=1280:720';
        case '480p': return 'scale=854:480';
        case '360p': return 'scale=640:360';
        default: return 'scale=1280:720';
    }
}

// Helper function to convert stream to buffer
async function streamToBuffer(stream) {
    const chunks = [];
    for await (const chunk of stream) {
        chunks.push(chunk);
    }
    return Buffer.concat(chunks);
}

module.exports = router;
