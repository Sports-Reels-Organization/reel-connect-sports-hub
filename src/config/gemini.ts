export const GEMINI_CONFIG = {
  // API Configuration
  API_KEY: import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyA2cd1hCSDn4TvWYiEBOcnxGb4g7Q3Dpns',
  BASE_URL: 'https://generativelanguage.googleapis.com',

  // Model Configuration
  MODELS: {
    PRO: 'gemini-1.5-pro'
  },

  // Default Settings
  DEFAULT_MODEL: 'gemini-1.5-pro',
  DEFAULT_TEMPERATURE: 0.1,
  DEFAULT_MAX_TOKENS: 8192,

  // Video Analysis Settings
  VIDEO_ANALYSIS: {
    MAX_FRAMES: 30,
    FRAME_RATE: 1,
    QUALITY: 0.8,
    MAX_WIDTH: 800,
    MAX_HEIGHT: 600
  },

  // Sports-specific prompts
  SPORTS_PROMPTS: {
    football: {
      match: 'Analyze this football match focusing on formations, pressing patterns, player movements, and key events like goals, assists, and tactical transitions.',
      training: 'Evaluate training session effectiveness, player technique, work rate, and provide coaching recommendations for improvement.',
      highlight: 'Identify key moments, assess skill quality, and create engaging highlight content with performance metrics.'
    },
    basketball: {
      match: 'Analyze basketball game focusing on offensive/defensive strategies, player positioning, shot selection, and team coordination.',
      training: 'Assess shooting technique, dribbling skills, defensive positioning, and overall athletic development.',
      highlight: 'Highlight exceptional plays, evaluate skill execution, and identify marketable moments for player promotion.'
    },
    volleyball: {
      match: 'Analyze volleyball match for serving accuracy, blocking effectiveness, attack patterns, and team communication.',
      training: 'Evaluate serving technique, blocking form, attack approach, and overall team coordination.',
      highlight: 'Showcase powerful serves, effective blocks, and coordinated team plays for recruitment purposes.'
    },
    tennis: {
      match: 'Analyze tennis match for serve accuracy, groundstroke consistency, net play effectiveness, and mental game.',
      training: 'Assess serve technique, footwork, stroke mechanics, and match strategy development.',
      highlight: 'Highlight powerful serves, precise shots, and strategic play for player development tracking.'
    }
  },

  // Error Messages
  ERRORS: {
    NO_API_KEY: 'Gemini API key is required. Please set VITE_GEMINI_API_KEY in your environment variables.',
    INVALID_VIDEO: 'Invalid video format. Please upload a supported video file.',
    ANALYSIS_FAILED: 'Video analysis failed. Please try again or contact support.',
    FRAME_EXTRACTION_FAILED: 'Failed to extract video frames. Please check video format and try again.',
    API_RATE_LIMIT: 'API rate limit exceeded. Please wait a moment and try again.',
    NETWORK_ERROR: 'Network error occurred. Please check your connection and try again.'
  },

  // Success Messages
  SUCCESS: {
    ANALYSIS_COMPLETED: 'Video analysis completed successfully!',
    FRAMES_EXTRACTED: 'Video frames extracted successfully',
    AI_PROCESSING: 'AI analysis in progress...',
    RESULTS_SAVED: 'Analysis results saved to database'
  }
};

// Validation functions
export const validateGeminiConfig = () => {
  if (!GEMINI_CONFIG.API_KEY) {
    throw new Error(GEMINI_CONFIG.ERRORS.NO_API_KEY);
  }
  return true;
};

export const getModelForVideoType = (videoType: string, sport: string = 'football') => {
  // Always use gemini-1.5-pro for all video types
  return GEMINI_CONFIG.MODELS.PRO;
};

export const getSportPrompt = (sport: string, videoType: string) => {
  const prompts = GEMINI_CONFIG.SPORTS_PROMPTS[sport as keyof typeof GEMINI_CONFIG.SPORTS_PROMPTS];
  if (prompts && prompts[videoType as keyof typeof prompts]) {
    return prompts[videoType as keyof typeof prompts];
  }
  // Default prompt for unknown sports
  return `Analyze this ${sport} ${videoType} video with expert sports analysis focusing on performance, technique, and strategic insights.`;
};
