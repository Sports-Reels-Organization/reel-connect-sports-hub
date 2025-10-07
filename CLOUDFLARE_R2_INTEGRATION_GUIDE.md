# Cloudflare R2 Integration Guide

## Overview

This guide explains the complete Cloudflare R2 integration for video storage in the Reel Connect Sports Hub application. The integration replaces Supabase storage with Cloudflare R2 for better scalability and cost-effectiveness.

## What Was Implemented

### 1. Core R2 Service (`src/services/cloudflareR2Service.ts`)

**Features:**
- Video and thumbnail upload with progress tracking
- File existence checking
- Signed URL generation for private access
- File deletion capabilities
- Organized file structure: `sports-reels/videos/{teamId}/` and `sports-reels/thumbnails/{teamId}/`

**Key Methods:**
```typescript
// Upload video with progress tracking
await cloudflareR2Service.uploadVideo(file, title, teamId, onProgress)

// Upload thumbnail
await cloudflareR2Service.uploadThumbnail(thumbnailBlob, title, teamId, onProgress)

// Generate signed URLs
await cloudflareR2Service.getSignedUrl(key, expiresIn)

// Check file existence
await cloudflareR2Service.fileExists(key)
```

### 2. Video Retrieval Service (`src/services/r2VideoRetrievalService.ts`)

**Features:**
- Seamless video retrieval for AI analysis
- Support for both R2 and legacy Supabase URLs
- Signed URL generation for private videos
- Batch video retrieval
- Video deletion capabilities

**Key Methods:**
```typescript
// Get video for AI analysis
await r2VideoRetrievalService.getVideoForAnalysis(videoUrl, options)

// Get thumbnail for display
await r2VideoRetrievalService.getThumbnailForDisplay(thumbnailUrl, options)

// Check if video exists
await r2VideoRetrievalService.videoExists(videoUrl)
```

### 3. Configuration (`src/config/cloudflare.ts`)

**Environment Variables:**
```bash
VITE_CLOUDFLARE_ACCOUNT_ID=your-account-id
VITE_CLOUDFLARE_ACCESS_KEY_ID=your-access-key
VITE_CLOUDFLARE_SECRET_ACCESS_KEY=your-secret-key
VITE_CLOUDFLARE_BUCKET_NAME=your-bucket-name
VITE_CLOUDFLARE_PUBLIC_URL=your-custom-domain (optional)
```

### 4. Updated Upload Forms

**Enhanced Video Upload Form (`src/components/EnhancedVideoUploadForm.tsx`)**
- Replaced Supabase storage upload with R2 upload
- Added progress tracking for R2 uploads
- Maintains thumbnail upload functionality
- Preserves all existing metadata and validation

**Multi Video Upload Form (`src/components/MultiVideoUploadForm.tsx`)**
- Same R2 integration as enhanced form
- Supports batch uploads to R2
- Progress tracking for multiple uploads

### 5. AI Analysis Integration

**Video Analysis Interface (`src/components/VideoAnalysisInterface.tsx`)**
- Retrieves videos from R2 for analysis
- Falls back to legacy URLs for existing videos
- Supports both public and signed URL access

**AI Analysis Service (`src/services/aiVideoAnalysisService.ts`)**
- Integrated R2 video retrieval
- Maintains compatibility with existing analysis workflows

### 6. Test Component (`src/components/R2TestComponent.tsx`)

**Features:**
- Connection testing
- File upload testing
- Video upload testing
- Video retrieval testing
- Progress tracking visualization
- Comprehensive error reporting

## Complete Flow

### Video Upload Flow
1. **Compression**: Video is compressed using existing compression services
2. **R2 Upload**: Compressed video is uploaded to Cloudflare R2
3. **Thumbnail Upload**: Thumbnail is uploaded to R2 (if available)
4. **Database Save**: Video metadata is saved to Supabase with R2 URLs
5. **Completion**: User receives confirmation

### AI Analysis Flow
1. **Video Retrieval**: AI analysis retrieves video from R2
2. **URL Processing**: R2 URLs are processed (public or signed)
3. **Analysis**: Video is analyzed using existing AI services
4. **Results**: Analysis results are saved to database

## File Structure in R2

```
sports-reels/
├── videos/
│   └── {teamId}/
│       ├── video_title_1234567890.mp4
│       ├── another_video_1234567891.mp4
│       └── ...
└── thumbnails/
    └── {teamId}/
        ├── video_title_thumbnail_1234567890.jpg
        ├── another_video_thumbnail_1234567891.jpg
        └── ...
```

## Benefits

### 1. **Scalability**
- No storage limits like Supabase
- Global CDN for fast video delivery
- Automatic scaling

### 2. **Cost Efficiency**
- Pay-per-use pricing
- No bandwidth charges for R2-to-R2 transfers
- Competitive storage costs

### 3. **Performance**
- Global edge locations
- Fast video streaming
- Optimized for large files

### 4. **Reliability**
- 99.999999999% (11 9's) durability
- Built-in redundancy
- Enterprise-grade infrastructure

## Migration Strategy

### Phase 1: New Videos (Implemented)
- All new video uploads go to R2
- Existing videos remain in Supabase
- Gradual migration over time

### Phase 2: Legacy Migration (Future)
- Migrate existing Supabase videos to R2
- Update database URLs
- Remove Supabase storage dependency

## Security Features

### 1. **Access Control**
- Signed URLs for private access
- Configurable expiration times
- Team-based organization

### 2. **Data Protection**
- Encrypted in transit and at rest
- Access key management
- Audit logging capabilities

## Monitoring and Maintenance

### 1. **Usage Tracking**
- Monitor storage usage
- Track bandwidth consumption
- Cost optimization

### 2. **Error Handling**
- Comprehensive error reporting
- Fallback mechanisms
- User-friendly error messages

## Testing

Use the `R2TestComponent` to verify:
1. R2 service initialization
2. File upload functionality
3. Video upload with progress tracking
4. Video retrieval for analysis
5. Error handling

## Configuration Required

Before using the R2 integration, ensure:

1. **Cloudflare Account Setup**
   - Create R2 bucket
   - Generate API tokens
   - Configure CORS if needed

2. **Environment Variables**
   - Set all required environment variables
   - Test configuration with test component

3. **Bucket Configuration**
   - Set appropriate bucket policies
   - Configure public access if needed
   - Set up custom domain (optional)

## Troubleshooting

### Common Issues

1. **Upload Failures**
   - Check API credentials
   - Verify bucket permissions
   - Check network connectivity

2. **Video Retrieval Issues**
   - Verify URL format
   - Check signed URL expiration
   - Ensure file exists in bucket

3. **Progress Tracking**
   - Progress simulation for large files
   - Real progress for chunked uploads
   - Error state handling

## Future Enhancements

1. **Advanced Features**
   - Automatic video transcoding
   - Multiple resolution support
   - Advanced compression options

2. **Analytics**
   - Usage analytics
   - Performance monitoring
   - Cost tracking

3. **Integration**
   - CDN optimization
   - Edge caching
   - Global distribution

## Support

For issues or questions:
1. Check the test component results
2. Review error logs
3. Verify configuration
4. Test with small files first

The R2 integration provides a robust, scalable foundation for video storage that will support the application's growth and performance requirements.
