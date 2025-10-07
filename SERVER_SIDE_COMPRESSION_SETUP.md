# Server-Side Video Compression Setup

## 🚀 Professional FFmpeg Video Compression

This setup provides professional-grade video compression using FFmpeg on the server-side, eliminating client-side compression issues.

## 📋 Prerequisites

### 1. Install FFmpeg

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**macOS:**
```bash
brew install ffmpeg
```

**Windows:**
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract to a folder (e.g., `C:\ffmpeg`)
3. Add `C:\ffmpeg\bin` to your PATH environment variable

### 2. Install Node.js Dependencies

```bash
npm install express multer @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## 🎬 How It Works

### 1. Upload Flow
```
User selects video → Upload to R2 originals/ → Trigger FFmpeg job → Poll status → Get compressed file
```

### 2. Server Architecture
```
Frontend (React) → API Server (Node.js) → FFmpeg Worker → R2 Storage
```

### 3. Storage Structure
```
R2 Bucket:
├── originals/
│   └── videos/{timestamp}_{randomId}.mp4
└── compressed/
    └── videos/{timestamp}_{randomId}_compressed.mp4
```

## 🔧 Configuration

### Environment Variables
The server uses these default values (can be overridden with environment variables):

```bash
R2_ENDPOINT=https://31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=3273ac17ec3ae48a772292d23a0475d3
R2_SECRET_ACCESS_KEY=a69fbcb07331f7232ba245dc5378fb11ac6f861bb68503b4d9f3e6fb3ab0d47c
R2_BUCKET_NAME=testsports
```

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/upload-original` | POST | Upload original video to R2 |
| `/compress-video` | POST | Trigger FFmpeg compression |
| `/compression-status/:jobId` | GET | Check compression progress |
| `/compressed-file-info` | POST | Get compressed file details |

## 🚀 Quick Start

### Option 1: Use Startup Scripts

**Linux/macOS:**
```bash
chmod +x start-compression-server.sh
./start-compression-server.sh
```

**Windows:**
```cmd
start-compression-server.bat
```

### Option 2: Manual Start

1. **Set environment variables:**
```bash
export R2_ENDPOINT="https://31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com"
export R2_ACCESS_KEY_ID="3273ac17ec3ae48a772292d23a0475d3"
export R2_SECRET_ACCESS_KEY="a69fbcb07331f7232ba245dc5378fb11ac6f861bb68503b4d9f3e6fb3ab0d47c"
export R2_BUCKET_NAME="testsports"
```

2. **Start the server:**
```bash
node server/server-with-compression.js
```

3. **Verify it's running:**
```bash
curl http://localhost:8082/health
```

## 🎯 FFmpeg Compression Settings

### Quality Levels

| Quality | CRF | Bitrate | Resolution | Audio |
|---------|-----|---------|------------|-------|
| **High** | 18 | 2.5 Mbps | 1080p | AAC 128k |
| **Medium** | 23 | 1.5 Mbps | 720p | AAC 128k |
| **Low** | 28 | 800 kbps | 480p | AAC 128k |

### Automatic Quality Selection

The system automatically selects quality based on file size:

- **< 50MB**: High quality (1080p, 2.5 Mbps)
- **50-100MB**: High quality (1080p, 2.0 Mbps)  
- **> 100MB**: Medium quality (720p, 1.5 Mbps)

## 📊 Benefits

### ✅ Professional Quality
- **Real video encoding** - FFmpeg, not browser hacks
- **Consistent output** - Always MP4 (H.264 + AAC)
- **Proper audio** - AAC at 128kbps
- **Streaming optimized** - faststart enabled

### ✅ Better Performance
- **Faster uploads** - starts immediately, no waiting
- **Better compression** - same quality at smaller size
- **Scalable** - works on any device
- **Background processing** - non-blocking

### ✅ Storage Benefits
- **Archive originals** - keep uncompressed versions
- **Serve compressed** - faster delivery
- **Presigned URLs** - secure access
- **Metadata tracking** - full audit trail

## 🔍 Troubleshooting

### FFmpeg Not Found
```bash
# Check if FFmpeg is installed
ffmpeg -version

# If not found, install it (see Prerequisites)
```

### Server Won't Start
```bash
# Check if port 8082 is available
netstat -an | grep 8082

# Try a different port
export PORT=8083
node server/server-with-compression.js
```

### Compression Jobs Failing
```bash
# Check server logs for FFmpeg errors
# Common issues:
# - Insufficient disk space in /tmp
# - FFmpeg codec not available
# - File permissions
```

### R2 Connection Issues
```bash
# Test R2 connectivity
curl -I https://31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com

# Check credentials in server logs
```

## 📈 Monitoring

### Job Status Tracking
- **queued**: Job created, waiting to start
- **processing**: FFmpeg running, progress updates
- **completed**: Successfully compressed and uploaded
- **failed**: Error occurred, check logs

### Progress Updates
The frontend receives real-time progress updates:
```javascript
{
  "status": "processing",
  "progress": 45,
  "message": "Compressing video with FFmpeg... 45%"
}
```

## 🎉 Success!

Once running, your video uploads will use professional server-side compression:

1. **Upload starts immediately** - no client-side processing
2. **FFmpeg compresses in background** - professional quality
3. **Real-time progress** - users see status updates
4. **Consistent results** - MP4 files that work everywhere
5. **Better performance** - faster, more reliable compression

The compression is now **PROFESSIONAL and RELIABLE**! 🎬⚡
