# Gemini 2.5 Pro Video Analysis Setup Guide

This guide will help you set up the enhanced video analysis system powered by Google's Gemini 2.5 Pro AI model.

## 🚀 Features

- **Real AI Analysis**: Powered by Gemini 2.5 Pro instead of mock data
- **Multi-Sport Support**: Football, Basketball, Volleyball, Tennis, Rugby, Baseball, Soccer
- **Video Types**: Match analysis, Training sessions, Highlight reels, Interview analysis
- **Frame Extraction**: Automatic video frame extraction for AI processing
- **Player Tracking**: Tag and analyze specific players
- **Tactical Insights**: Formation analysis, pressing patterns, team shape
- **Performance Metrics**: Technical, physical, and tactical skill assessment
- **Database Storage**: Secure storage of analysis results with Supabase

## 📋 Prerequisites

1. **Google Cloud Project** with Gemini API enabled
2. **Gemini API Key** (Gemini 2.0 Flash Exp or Gemini 1.5 Pro)
3. **Supabase Project** for database storage
4. **Node.js 18+** and npm/yarn
5. **Modern browser** with video support

## 🔑 Setup Steps

### 1. Get Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Navigate to "Get API key" in the left sidebar
4. Create a new API key or use an existing one
5. Copy the API key (starts with `AIza...`)

### 2. Environment Configuration

Create a `.env.local` file in your project root:

```bash
# Gemini API Configuration for Vite
VITE_GEMINI_API_KEY=AIzaSyA2cd1hCSDn4TvWYiEBOcnxGb4g7Q3Dpns

# Supabase Configuration (if not already set)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Install Dependencies

```bash
npm install @google/generative-ai
# or
yarn add @google/generative-ai
```

### 4. Database Setup

Run the database migration to create the video analysis table:

```bash
# Apply the migration
supabase db push

# Or manually run the SQL in your Supabase dashboard
# Copy the contents of: supabase/migrations/20241201000000_create_video_analyses_table.sql
```

### 5. Verify Installation

Check that all components are properly imported:

```typescript
// These imports should work without errors
import { GeminiVideoAnalysisService } from '@/services/geminiVideoAnalysisService';
import { VideoFrameExtractor } from '@/utils/videoFrameExtractor';
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';
```

## 🎯 Usage

### Basic Video Analysis

```typescript
import { useVideoAnalysis } from '@/hooks/useVideoAnalysis';

const MyComponent = () => {
  const {
    handleVideoUpload,
    extractFrames,
    performAnalysis,
    analysisState,
    analysisResult
  } = useVideoAnalysis();

  const handleAnalysis = async () => {
    // 1. Upload video
    const file = event.target.files[0];
    await handleVideoUpload(file);
    
    // 2. Extract frames
    await extractFrames();
    
    // 3. Perform AI analysis
    const result = await performAnalysis('match', 'football', [
      { playerId: '1', playerName: 'John Doe', jerseyNumber: 10, position: 'Forward' }
    ]);
  };

  return (
    <div>
      {/* Your UI components */}
    </div>
  );
};
```

### Advanced Configuration

```typescript
import { GeminiVideoAnalysisService } from '@/services/geminiVideoAnalysisService';

const geminiService = new GeminiVideoAnalysisService({
  apiKey: import.meta.env.VITE_GEMINI_API_KEY,
  model: 'gemini-2.0-flash-exp', // Best for match analysis
  temperature: 0.1, // Low temperature for consistent results
  maxTokens: 8192
});

// Custom frame extraction
const frameExtractor = new VideoFrameExtractor();
const frames = await frameExtractor.extractFrames(videoUrl, {
  frameRate: 2, // 2 frames per second
  maxFrames: 60, // Maximum 60 frames
  quality: 0.9, // High quality
  maxWidth: 1024, // Max width 1024px
  maxHeight: 768  // Max height 768px
});
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Video Upload  │───▶│ Frame Extraction │───▶│ Gemini AI API   │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Video Frames   │    │ Analysis Result │
                       └──────────────────┘    └─────────────────┘
                                │                        │
                                ▼                        ▼
                       ┌──────────────────┐    ┌─────────────────┐
                       │  Supabase DB    │    │  UI Display     │
                       └──────────────────┘    └─────────────────┘
```

## 🔧 Configuration Options

### Gemini Models

- **`gemini-2.0-flash-exp`**: Best for complex match analysis
- **`gemini-1.5-pro`**: Good for detailed training and interview analysis
- **`gemini-1.5-flash`**: Fast for highlight processing

### Video Analysis Settings

```typescript
// Default settings in config/gemini.ts
VIDEO_ANALYSIS: {
  MAX_FRAMES: 30,        // Maximum frames to extract
  FRAME_RATE: 1,         // Frames per second
  QUALITY: 0.8,          // JPEG quality (0-1)
  MAX_WIDTH: 800,        // Maximum frame width
  MAX_HEIGHT: 600        // Maximum frame height
}
```

### Sports-Specific Prompts

Each sport has optimized prompts for different video types:

- **Football**: Focus on formations, pressing, transitions
- **Basketball**: Offensive/defensive strategies, positioning
- **Volleyball**: Serving, blocking, attack patterns
- **Tennis**: Serve accuracy, groundstrokes, net play

## 📊 Analysis Results

The AI provides comprehensive analysis including:

- **Player Performance**: Technical, physical, tactical scores
- **Tactical Insights**: Formations, pressing patterns, team shape
- **Skill Assessment**: Detailed skill breakdowns
- **Match Events**: Goals, assists, key moments with timestamps
- **Recommendations**: Actionable improvement suggestions
- **Confidence Scores**: AI confidence in analysis accuracy

## 🚨 Troubleshooting

### Common Issues

1. **API Key Error**
   ```
   Error: Gemini API key is required
   ```
   - Check your `.env.local` file
   - Ensure `VITE_GEMINI_API_KEY` is set
   - Restart your development server

2. **Video Processing Error**
   ```
   Error: Failed to extract video frames
   ```
   - Check video format (MP4, WebM, MOV supported)
   - Ensure video file is not corrupted
   - Check browser console for CORS issues

3. **Gemini API Rate Limits**
   ```
   Error: API rate limit exceeded
   ```
   - Wait a few minutes before retrying
   - Check your Gemini API quota
   - Consider upgrading your API plan

4. **Database Connection Error**
   ```
   Error: Failed to save analysis results
   ```
   - Verify Supabase connection
   - Check database migration was applied
   - Ensure RLS policies are correct

### Performance Optimization

- **Frame Extraction**: Reduce `maxFrames` for faster processing
- **Image Quality**: Lower `quality` setting for smaller file sizes
- **Resolution**: Use `maxWidth` and `maxHeight` to limit frame size
- **Batch Processing**: Process multiple videos sequentially

## 🔒 Security Considerations

- **API Key Protection**: Never expose API keys in client-side code
- **Row Level Security**: Database tables use RLS for data isolation
- **User Authentication**: Analysis results are tied to authenticated users
- **Team Access Control**: Team members can only access team analyses

## 📈 Monitoring and Analytics

Track analysis performance with built-in functions:

```sql
-- Get analysis statistics
SELECT * FROM get_video_analysis_stats(
  p_user_id := 'user-uuid',
  p_date_from := '2024-01-01',
  p_date_to := '2024-12-31'
);

-- View recent analyses
SELECT * FROM recent_video_analyses LIMIT 10;
```

## 🆘 Support

For issues or questions:

1. Check the troubleshooting section above
2. Review browser console for error messages
3. Verify all dependencies are installed
4. Ensure environment variables are set correctly
5. Check Supabase dashboard for database issues

## 🔄 Updates and Maintenance

- **Regular Updates**: Keep `@google/generative-ai` package updated
- **API Changes**: Monitor Gemini API changelog for breaking changes
- **Performance**: Monitor analysis times and optimize frame extraction
- **Storage**: Clean up old analysis data periodically

---

**Note**: This system requires an active Gemini API key and internet connection for AI analysis. Offline mode is not supported.
