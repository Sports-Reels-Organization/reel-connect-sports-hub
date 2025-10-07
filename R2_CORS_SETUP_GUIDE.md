# R2 CORS Configuration Guide

## 🚨 **CORS Error Fix Required**

Your presigned URL uploads are failing due to CORS policy restrictions. Even with presigned URLs, R2 buckets need CORS configuration to allow browser uploads.

## **Current Error:**
```
Access to XMLHttpRequest at 'https://testsports.31ad0bcfb7e2c3a8bab2566eeabf1f4c.r2.cloudflarestorage.com/...' 
from origin 'http://localhost:8082' has been blocked by CORS policy
```

## **Solution: Configure CORS Policy**

### **Option 1: Cloudflare Dashboard (Recommended)**

1. **Go to Cloudflare Dashboard**
   - Visit: [dash.cloudflare.com](https://dash.cloudflare.com)
   - Navigate to **R2 Object Storage**

2. **Select Your Bucket**
   - Click on **`testsports`** bucket

3. **Configure CORS**
   - Go to **Settings** tab
   - Find **"CORS policy"** section
   - Click **"Edit CORS policy"**
   - **Replace existing policy** with the configuration below:

```json
[
  {
    "AllowedOrigins": [
      "http://localhost:8082",
      "http://localhost:8101",
      "http://localhost:3000",
      "http://localhost:5173",
      "https://yourdomain.com"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE",
      "HEAD",
      "OPTIONS"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag",
      "x-amz-meta-*",
      "x-amz-*"
    ],
    "MaxAgeSeconds": 3000
  }
]
```

4. **Save Changes**
   - Click **"Save"** to apply the CORS policy

### **Option 2: Wrangler CLI**

If you have Wrangler CLI installed:

```bash
npx wrangler r2 bucket cors set testsports --file cors-config.json
```

## **CORS Configuration Explained**

| Setting | Purpose |
|---------|---------|
| `AllowedOrigins` | Domains that can upload files |
| `AllowedMethods` | HTTP methods allowed (PUT for uploads) |
| `AllowedHeaders` | Headers the browser can send |
| `ExposeHeaders` | Headers the browser can read |
| `MaxAgeSeconds` | How long browser caches preflight response |

## **Testing After CORS Setup**

1. **Refresh your browser** (important!)
2. **Try uploading a video** again
3. **Check browser console** for any remaining errors

## **Troubleshooting**

### **Still Getting CORS Errors?**
- ✅ **Clear browser cache** completely
- ✅ **Hard refresh** (Ctrl+Shift+R)
- ✅ **Check bucket name** matches exactly: `testsports`
- ✅ **Verify origins** include your current port (8082, 8101, etc.)

### **Upload Still Fails?**
- ✅ **Check R2 credentials** in backend service
- ✅ **Verify bucket exists** and is accessible
- ✅ **Test presigned URL generation** via backend health check

### **Backend Service Issues?**
- ✅ **Start backend**: `cd server && npm start`
- ✅ **Test health**: `http://localhost:3001/api/health`
- ✅ **Check console** for backend errors

## **Production Considerations**

For production deployment, update `AllowedOrigins` to include:
- Your production domain (e.g., `https://yourdomain.com`)
- Remove localhost origins
- Consider using environment-specific CORS policies

## **Security Notes**

- ✅ **Presigned URLs** provide secure, temporary access
- ✅ **CORS** only allows browser uploads from specified origins
- ✅ **Credentials** remain secure on backend
- ✅ **Uploads expire** after 1 hour

## **Next Steps**

1. **Configure CORS** using one of the methods above
2. **Test upload** with a small video file
3. **Verify progress tracking** works correctly
4. **Check R2 bucket** for uploaded files

The presigned URL approach is working correctly - we just need to configure CORS to allow the browser uploads! 🚀
