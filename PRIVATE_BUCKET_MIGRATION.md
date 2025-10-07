# Private R2 Bucket Migration Guide

## 🔒 **Why Use Private Bucket?**

- ✅ **Security**: Videos are not publicly accessible
- ✅ **AI Processing**: Secure access for AI analysis
- ✅ **Access Control**: Presigned URLs with expiration
- ✅ **Cost Control**: No accidental public bandwidth usage

## 🔄 **Migration Steps**

### **1. Keep Your R2 Bucket Private**
- ✅ **Do NOT** enable public access on your R2 bucket
- ✅ **Do NOT** use `pub-...r2.dev` URLs
- ✅ **Store R2 keys** in database instead of public URLs

### **2. New Upload Flow**
```
Frontend → Backend → Generate Presigned PUT URL → Upload to R2 → Store Key in DB
```

### **3. New Playback Flow**
```
Frontend → Backend → Generate Presigned GET URL → Play Video
```

## 🛠️ **Implementation Changes**

### **Database Schema**
- `video_url`: Now stores R2 key (e.g., `sports-reels/videos/team-id/video.mp4`)
- `thumbnail_url`: Now stores R2 key (e.g., `sports-reels/thumbnails/team-id/thumb.jpg`)

### **Backend Endpoints**
- `POST /api/r2/presigned-url`: Generate presigned PUT URL for uploads
- `POST /api/r2/presigned-get-url`: Generate presigned GET URL for playback

### **Frontend Components**
- `SecureVideoPlayer`: Uses presigned GET URLs for video playback
- `SecureThumbnail`: Uses presigned GET URLs for thumbnail display
- `presignedGetUrlService`: Handles presigned URL generation

## 📋 **Testing Checklist**

### **Upload Test**
1. ✅ Upload a new video
2. ✅ Check database has R2 key (not pub- URL)
3. ✅ Verify file exists in R2 bucket

### **Playback Test**
1. ✅ Video loads in app using presigned URL
2. ✅ Thumbnail displays using presigned URL
3. ✅ URLs expire after configured time

### **Security Test**
1. ✅ Direct R2 URL access fails (403/404)
2. ✅ Presigned URLs work only for authorized users
3. ✅ URLs expire automatically

## 🔧 **Migration for Existing Videos**

### **Option 1: Manual Migration**
```sql
-- Update existing videos to use keys instead of URLs
UPDATE videos 
SET video_url = REPLACE(video_url, 'https://pub-31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.dev/', '')
WHERE video_url LIKE 'https://pub-%';

UPDATE videos 
SET thumbnail_url = REPLACE(thumbnail_url, 'https://pub-31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.dev/', '')
WHERE thumbnail_url LIKE 'https://pub-%';
```

### **Option 2: Gradual Migration**
- Keep existing videos working with fallback logic
- New uploads use private bucket approach
- Migrate existing videos over time

## 🚨 **Important Notes**

### **URL Format Change**
- **Old**: `https://pub-31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.dev/sports-reels/videos/...`
- **New**: `sports-reels/videos/team-id/video.mp4` (R2 key)

### **Access Pattern**
- **Old**: Direct public URL access
- **New**: Presigned URL → Temporary access → Expires

### **Security Benefits**
- Videos are not publicly accessible
- Access is controlled and time-limited
- Perfect for AI processing workflows

## 🔍 **Debugging**

### **Common Issues**
1. **403 Forbidden**: Bucket is private (good!) - use presigned URLs
2. **404 Not Found**: Wrong key or file doesn't exist
3. **URL Expired**: Presigned URL expired - generate new one

### **Debug Tools**
- Use `/debug-upload` page to test presigned URL generation
- Check browser network tab for URL generation requests
- Verify R2 keys in database match actual files

## 🎯 **Next Steps**

1. **Test New Upload**: Upload a video and verify it uses private bucket
2. **Test Playback**: Ensure videos play using presigned URLs
3. **Migrate Existing**: Update existing videos to use R2 keys
4. **Monitor**: Check for any remaining public URL references

This approach provides enterprise-grade security while maintaining a great user experience! 🚀
