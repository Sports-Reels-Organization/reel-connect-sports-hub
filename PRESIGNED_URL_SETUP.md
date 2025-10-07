# Presigned URL Upload Setup Guide

## 🚀 **Complete Solution for R2 Uploads**

This setup eliminates CORS issues by using presigned URLs - the recommended approach for secure, scalable file uploads.

## **Architecture**

```
Frontend (React) → Backend (Node.js) → Cloudflare R2
     ↓                    ↓                    ↓
1. Request presigned URL 2. Generate signed URL  3. Direct upload
4. Upload file directly to R2 using presigned URL
```

## **Setup Steps**

### **1. Install Backend Dependencies**

```bash
cd server
npm install
```

### **2. Start Backend Service**

```bash
# Development mode with auto-reload
npm run dev

# Or production mode
npm start
```

The backend will start on `http://localhost:3001`

### **3. Test Backend Health**

Visit: `http://localhost:3001/api/health`

You should see:
```json
{
  "success": true,
  "message": "R2 Presigned URL Service is running",
  "timestamp": "2024-01-XX..."
}
```

### **4. Update Frontend Configuration**

The frontend is already configured to use the presigned URL service. If you need to change the backend URL, update:

```typescript
// In src/services/presignedUploadService.ts
constructor(baseUrl: string = 'http://localhost:3001') {
  this.baseUrl = baseUrl;
}
```

## **How It Works**

### **1. Upload Flow**

1. **Frontend**: User selects video file
2. **Frontend**: Compress video using existing compression services
3. **Frontend**: Request presigned URL from backend
4. **Backend**: Generate presigned URL with R2 credentials
5. **Frontend**: Upload directly to R2 using presigned URL
6. **Frontend**: Save metadata to Supabase with R2 URL

### **2. Security Benefits**

- ✅ **No CORS Issues**: Direct browser → R2 upload
- ✅ **Credential Security**: R2 credentials stay on backend
- ✅ **Temporary Access**: Presigned URLs expire in 1 hour
- ✅ **File Validation**: Backend validates upload parameters

### **3. Performance Benefits**

- ✅ **Direct Upload**: No proxy through your server
- ✅ **Real Progress**: Actual upload progress tracking
- ✅ **Scalable**: Handles large files efficiently
- ✅ **Reliable**: Industry-standard approach

## **API Endpoints**

### **POST /api/r2/presigned-url**

Generate presigned URL for file upload.

**Request:**
```json
{
  "fileName": "my-video.mp4",
  "contentType": "video/mp4",
  "teamId": "team-123",
  "fileType": "video" // or "thumbnail"
}
```

**Response:**
```json
{
  "success": true,
  "presignedUrl": "https://testsports.31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com/...",
  "publicUrl": "https://pub-31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.dev/...",
  "key": "sports-reels/videos/team-123/my-video_1234567890.mp4",
  "expiresIn": 3600
}
```

### **GET /api/health**

Check backend service status.

**Response:**
```json
{
  "success": true,
  "message": "R2 Presigned URL Service is running",
  "timestamp": "2024-01-XX..."
}
```

## **File Structure in R2**

```
sports-reels/
├── videos/
│   └── {teamId}/
│       ├── video_title_1234567890.mp4
│       └── another_video_1234567891.mp4
└── thumbnails/
    └── {teamId}/
        ├── video_title_thumbnail_1234567890.jpg
        └── another_video_thumbnail_1234567891.jpg
```

## **Environment Variables**

The backend uses hardcoded R2 credentials for now. For production, move these to environment variables:

```bash
# .env file for backend
R2_ACCOUNT_ID=31ad0bcfb7e2c3a8bab2566eeabf1f4c
R2_ACCESS_KEY_ID=3273ac17ec3ae48a772292d23a0475d3
R2_SECRET_ACCESS_KEY=a69fbcb07331f7232ba245dc5378fb11ac6f861bb68503b4d9f3e6fb3ab0d47c
R2_BUCKET_NAME=testsports
PORT=3001
```

## **Testing**

1. **Start Backend**: `cd server && npm run dev`
2. **Start Frontend**: `npm run dev`
3. **Upload Video**: Try uploading a video file
4. **Check Progress**: Monitor upload progress
5. **Verify Upload**: Check R2 bucket for uploaded files

## **Troubleshooting**

### **Backend Not Starting**
- Check if port 3001 is available
- Verify Node.js and npm are installed
- Check for missing dependencies

### **Frontend Can't Connect**
- Ensure backend is running on port 3001
- Check browser console for connection errors
- Verify CORS settings in backend

### **Upload Failing**
- Check R2 credentials in backend
- Verify bucket name and permissions
- Check browser network tab for detailed errors

## **Production Deployment**

### **Backend Deployment**
- Deploy to Vercel, Netlify, or your preferred platform
- Update frontend `baseUrl` to production backend URL
- Use environment variables for R2 credentials

### **Security Considerations**
- Use environment variables for credentials
- Implement rate limiting
- Add authentication/authorization
- Use HTTPS in production

## **Benefits Over Direct Upload**

| Direct Upload | Presigned URLs |
|---------------|----------------|
| ❌ CORS issues | ✅ No CORS issues |
| ❌ Exposed credentials | ✅ Secure credentials |
| ❌ Complex setup | ✅ Simple setup |
| ❌ Limited control | ✅ Full control |
| ❌ Server bandwidth | ✅ Direct upload |

This solution provides enterprise-grade security and performance for your video uploads!
