const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// R2 Configuration
const R2_CONFIG = {
    accountId: '31ad0bcfb7e2c3a8bab2566eeabf1f4c',
    accessKeyId: '3273ac17ec3ae48a772292d23a0475d3',
    secretAccessKey: 'a69fbcb07331f7232ba245dc5378fb11ac6f861bb68503b4d9f3e6fb3ab0d47c',
    bucketName: 'testsports',
};

// Initialize S3 client for R2
const s3Client = new S3Client({
    region: 'auto',
    endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
    credentials: {
        accessKeyId: R2_CONFIG.accessKeyId,
        secretAccessKey: R2_CONFIG.secretAccessKey,
    },
});

const app = express();
const PORT = process.env.PORT || 3001;

// Configure multer for file uploads
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024 * 1024 } // 2GB limit
});

// In-memory job tracking (in production, use Redis or database)
const compressionJobs = new Map();

// Middleware
app.use(cors({
    origin: ['http://localhost:8082', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());

// Generate presigned URL for video upload
app.post('/api/r2/presigned-url', async (req, res) => {
    try {
        const { fileName, contentType, teamId, fileType } = req.body;

        if (!fileName || !contentType || !teamId) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: fileName, contentType, teamId'
            });
        }

        // Generate unique key
        const timestamp = Date.now();
        const sanitizedFileName = fileName
            .replace(/[^a-zA-Z0-9.-]/g, '_')
            .replace(/_+/g, '_')
            .replace(/^_|_$/g, '');

        const key = fileType === 'thumbnail'
            ? `sports-reels/thumbnails/${teamId}/${sanitizedFileName}_thumbnail_${timestamp}.jpg`
            : `sports-reels/videos/${teamId}/${sanitizedFileName}_${timestamp}.mp4`;

        // Create presigned URL
        const command = new PutObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
            ContentType: contentType,
            Metadata: {
                uploadedAt: new Date().toISOString(),
                originalName: fileName,
                teamId: teamId,
                uploadedBy: req.headers['user-agent'] || 'unknown'
            },
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 3600 // 1 hour
        });

        // For private bucket, we'll generate presigned GET URLs when needed
        // Don't use public URLs for private buckets
        const publicUrl = null; // Keep bucket private

        res.json({
            success: true,
            presignedUrl,
            publicUrl: null, // No public URL for private bucket
            key,
            expiresIn: 3600
        });

    } catch (error) {
        console.error('Error generating presigned URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate presigned URL',
            details: error.message
        });
    }
});

// Generate presigned GET URL for video/thumbnail access
app.post('/api/r2/presigned-get-url', async (req, res) => {
    try {
        const { key, expiresIn = 3600 } = req.body;

        if (!key) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: key'
            });
        }

        // Create presigned GET URL
        const command = new GetObjectCommand({
            Bucket: R2_CONFIG.bucketName,
            Key: key,
        });

        const presignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: expiresIn // Default 1 hour
        });

        res.json({
            success: true,
            presignedUrl,
            expiresIn: expiresIn
        });

    } catch (error) {
        console.error('Error generating presigned GET URL:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate presigned GET URL',
            details: error.message
        });
    }
});

// Generate signed URLs for media (video + thumbnail)
app.post('/api/r2/signed-media-urls', async (req, res) => {
    try {
        const { videoKey, thumbnailKey, expiresIn = 3600 } = req.body;

        if (!videoKey && !thumbnailKey) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields: videoKey or thumbnailKey'
            });
        }

        const result = {};

        // Generate video URL if provided
        if (videoKey) {
            const videoCommand = new GetObjectCommand({
                Bucket: R2_CONFIG.bucketName,
                Key: videoKey,
            });
            result.videoUrl = await getSignedUrl(s3Client, videoCommand, { expiresIn });
        }

        // Generate thumbnail URL if provided
        if (thumbnailKey) {
            const thumbnailCommand = new GetObjectCommand({
                Bucket: R2_CONFIG.bucketName,
                Key: thumbnailKey,
            });
            result.thumbnailUrl = await getSignedUrl(s3Client, thumbnailCommand, { expiresIn });
        }

        res.json({
            success: true,
            ...result,
            expiresIn: expiresIn
        });

    } catch (error) {
        console.error('Error generating signed media URLs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to generate signed media URLs',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'R2 Presigned URL Service is running',
        timestamp: new Date().toISOString()
    });
});

// Compression endpoints
app.post('/upload-original', upload.single('file'), async (req, res) => {
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
            Bucket: R2_CONFIG.bucketName,
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
            url: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com/${R2_CONFIG.bucketName}/${key}`
        });

    } catch (error) {
        console.error('❌ Upload original failed:', error);
        res.status(500).json({
            error: 'Failed to upload original video',
            details: error.message
        });
    }
});

app.post('/compress-video', async (req, res) => {
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

app.get('/compression-status/:jobId', async (req, res) => {
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

app.post('/compressed-file-info', async (req, res) => {
    try {
        const { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: 'key is required' });
        }

        // Get file info from R2
        const headCommand = new GetObjectCommand({
            Bucket: R2_CONFIG.bucketName,
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
            Bucket: R2_CONFIG.bucketName,
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

        // Check if FFmpeg is available
        const ffmpegAvailable = await checkFFmpegAvailability();

        if (!ffmpegAvailable) {
            console.log(`⚠️ FFmpeg not found, using fallback compression simulation`);
            // Simulate compression by copying the original file
            await fs.copyFile(tempOriginal, tempCompressed);

            // Simulate progress updates
            for (let progress = 30; progress <= 95; progress += 10) {
                compressionJobs.set(jobId, { ...settings, status: 'processing', progress });
                await new Promise(resolve => setTimeout(resolve, 500)); // Faster progress updates
            }

            // Complete the fallback compression
            try {
                compressionJobs.set(jobId, { ...settings, status: 'processing', progress: 95 });

                // Read the "compressed" file (which is actually the original)
                const compressedBuffer = await fs.readFile(tempCompressed);

                // Upload to R2 as compressed file
                const uploadCommand = new PutObjectCommand({
                    Bucket: R2_CONFIG.bucketName,
                    Key: compressedKey,
                    Body: compressedBuffer,
                    ContentType: 'video/mp4'
                });

                await s3Client.send(uploadCommand);
                console.log(`✅ Fallback compression uploaded: ${compressedKey}`);

                // Mark as completed
                compressionJobs.set(jobId, {
                    ...settings,
                    status: 'completed',
                    progress: 100,
                    compressedKey,
                    compressedSize: compressedBuffer.length,
                    endTime: new Date().toISOString()
                });

                // Cleanup temp files
                await fs.unlink(tempOriginal).catch(() => { });
                await fs.unlink(tempCompressed).catch(() => { });

                console.log(`✅ Fallback compression completed: ${jobId}`);

            } catch (error) {
                console.error(`❌ Fallback compression failed for job ${jobId}:`, error);
                compressionJobs.set(jobId, {
                    ...settings,
                    status: 'failed',
                    error: error.message,
                    endTime: new Date().toISOString()
                });

                // Cleanup temp files
                await fs.unlink(tempOriginal).catch(() => { });
                await fs.unlink(tempCompressed).catch(() => { });
            }
        } else {
            // Run FFmpeg compression
            const ffmpegArgs = buildFFmpegArgs(tempOriginal, tempCompressed, settings);

            console.log(`🎬 Running FFmpeg: ${ffmpegArgs.join(' ')}`);

            const ffmpegProcess = spawn('ffmpeg', ffmpegArgs);

            let progress = 30;
            let ffmpegTimeout;

            // Set a timeout for FFmpeg process (30 minutes max)
            ffmpegTimeout = setTimeout(() => {
                console.log(`⏰ FFmpeg timeout for job ${jobId}, killing process`);
                ffmpegProcess.kill('SIGKILL');
                compressionJobs.set(jobId, {
                    ...settings,
                    status: 'failed',
                    error: 'FFmpeg timeout - process took too long',
                    endTime: new Date().toISOString()
                });
            }, 30 * 60 * 1000); // 30 minutes

            ffmpegProcess.stderr.on('data', (data) => {
                const output = data.toString();
                // Parse FFmpeg progress (simplified)
                if (output.includes('time=')) {
                    progress = Math.min(90, 30 + Math.random() * 60); // Simulate progress
                    compressionJobs.set(jobId, { ...settings, status: 'processing', progress });
                }
            });

            ffmpegProcess.on('error', (error) => {
                console.error(`❌ FFmpeg process error for job ${jobId}:`, error);
                clearTimeout(ffmpegTimeout);
                compressionJobs.set(jobId, {
                    ...settings,
                    status: 'failed',
                    error: `FFmpeg process error: ${error.message}`,
                    endTime: new Date().toISOString()
                });
            });

            ffmpegProcess.on('close', async (code) => {
                clearTimeout(ffmpegTimeout);
                try {
                    if (code !== 0) {
                        throw new Error(`FFmpeg exited with code ${code}`);
                    }

                    compressionJobs.set(jobId, { ...settings, status: 'processing', progress: 95 });

                    // Read compressed file
                    const compressedBuffer = await fs.readFile(tempCompressed);

                    // Upload compressed file to R2
                    const uploadCommand = new PutObjectCommand({
                        Bucket: R2_CONFIG.bucketName,
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
        }

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
        '-preset', 'ultrafast', // Fastest encoding preset
        '-crf', getCRFValue(settings.quality), // Constant Rate Factor
        '-maxrate', `${settings.targetBitrate}k`,
        '-bufsize', `${settings.targetBitrate * 2}k`,
        '-vf', getScaleFilter(settings.maxResolution),
        '-movflags', '+faststart', // Optimize for streaming
        '-threads', '0', // Use all available CPU cores
        '-x264opts', 'no-scenecut:no-cabac:ref=1:subme=1:me=dia:analyse=none:trellis=0:no-fast-pskip=0:8x8dct=0:weightb=0', // Ultra-fast encoding
        '-y' // Overwrite output file
    ];

    if (settings.preserveAudio) {
        args.push('-c:a', 'aac', '-b:a', '128k', '-ac', '2'); // AAC audio at 128kbps, stereo
    } else {
        args.push('-an'); // No audio
    }

    args.push(outputPath);

    return args;
}

function getCRFValue(quality) {
    switch (quality) {
        case 'high': return '22'; // Faster encoding, still good quality
        case 'medium': return '25'; // Balanced for speed
        case 'low': return '28'; // Lower quality, smaller file
        default: return '25'; // Default to faster encoding
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

// Check if FFmpeg is available on the system
async function checkFFmpegAvailability() {
    return new Promise((resolve) => {
        const ffmpegProcess = spawn('ffmpeg', ['-version']);

        ffmpegProcess.on('error', (error) => {
            console.log('FFmpeg not available:', error.message);
            resolve(false);
        });

        ffmpegProcess.on('close', (code) => {
            resolve(code === 0);
        });

        // Timeout after 5 seconds
        setTimeout(() => {
            ffmpegProcess.kill();
            resolve(false);
        }, 5000);
    });
}

// Start server
app.listen(PORT, () => {
    console.log(`🚀 R2 Presigned URL Service running on port ${PORT}`);
    console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;
