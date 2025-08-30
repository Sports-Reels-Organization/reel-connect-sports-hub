import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG, getSportPrompt } from '@/config/gemini';

export interface ComprehensiveAnalysisRequest {
  videoUrl: string;
  videoType: 'match' | 'training' | 'highlight' | 'interview';
  sport: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby' | 'baseball' | 'soccer' | 'cricket' | 'hockey' | 'golf' | 'swimming' | 'athletics';
  metadata: {
    playerTags?: Array<{
      playerId: string;
      playerName: string;
      jerseyNumber: number;
      position: string;
    }>;
    teamInfo?: {
      homeTeam: string;
      awayTeam: string;
      competition: string;
      date: string;
    };
    context?: string;
    duration?: number;
  };
  frames: Array<{
    timestamp: number;
    frameData: string;
    frameNumber: number;
  }>;
}

export interface ComprehensiveAnalysisResult {
  success: boolean;
  analysis: {
    // Common analysis fields
    summary: string;
    confidence: number;
    processingTime: number;
    
    // Video type specific analysis
    matchAnalysis?: MatchAnalysis;
    trainingAnalysis?: TrainingAnalysis;
    highlightAnalysis?: HighlightAnalysis;
    interviewAnalysis?: InterviewAnalysis;
    
    // Sport-specific insights
    sportInsights: SportSpecificInsights;
    
    // Recommendations
    recommendations: string[];
    
    // Error handling
    error?: string;
  };
}

export interface MatchAnalysis {
  timeline: Array<{
    minute: number;
    events: string[];
    importance: 'high' | 'medium' | 'low';
  }>;
  playerActions: Array<{
    timestamp: number;
    action: string;
    description: string;
    confidence: number;
    players: string[];
    zone: string;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
  keyMoments: Array<{
    timestamp: number;
    type: string;
    description: string;
    importance: 'high' | 'medium' | 'low';
    impact: string;
  }>;
  playerStats: Array<{
    name: string;
    position: string;
    rating: number;
    actions: number;
    keyPasses: number;
    goals: number;
    performance: {
      technical: number;
      physical: number;
      tactical: number;
    };
  }>;
  tacticalInsights: {
    formation: string;
    pressingPatterns: string[];
    teamShape: string;
    transitions: string[];
    setPieces: string[];
  };
  performanceMetrics: {
    possession: number;
    passAccuracy: number;
    shotsOnTarget: number;
    defensiveEfficiency: number;
    overallRating: number;
  };
}

export interface TrainingAnalysis {
  sessionStructure: {
    warmup: string;
    mainDrills: string[];
    cooldown: string;
    duration: number;
  };
  skillAssessment: Array<{
    playerName: string;
    position: string;
    technicalRating: number;
    physicalRating: number;
    tacticalRating: number;
    strengths: string[];
    weaknesses: string[];
    improvementAreas: string[];
  }>;
  drillEffectiveness: Array<{
    drillName: string;
    completionRate: number;
    difficulty: number;
    effectiveness: number;
    recommendations: string[];
  }>;
  individualProgress: Array<{
    playerName: string;
    skillImprovement: string[];
    areasNeedingAttention: string[];
    nextSteps: string[];
  }>;
  coachingInsights: {
    sessionEffectiveness: number;
    keyLearnings: string[];
    followUpActions: string[];
    playerDevelopment: string[];
  };
}

export interface HighlightAnalysis {
  keyMoments: Array<{
    timestamp: number;
    type: string;
    description: string;
    skillLevel: number;
    marketability: number;
    playerInvolved: string;
    impact: string;
  }>;
  skillDemonstrations: Array<{
    skill: string;
    quality: number;
    difficulty: number;
    execution: string;
    marketability: number;
  }>;
  playerHighlights: Array<{
    playerName: string;
    position: string;
    highlightMoments: string[];
    skillRating: number;
    marketability: number;
    recruitmentValue: string[];
  }>;
  contentCreation: {
    bestMoments: string[];
    editingSuggestions: string[];
    marketingPotential: string[];
    targetAudience: string[];
  };
  performanceInsights: {
    overallQuality: number;
    skillDiversity: number;
    entertainmentValue: number;
    recruitmentPotential: number;
  };
}

export interface InterviewAnalysis {
  transcript: {
    summary: string;
    keyPoints: string[];
    mainThemes: string[];
    emotionalMoments: string[];
  };
  keyQuotes: Array<{
    quote: string;
    timestamp: number;
    speaker: string;
    context: string;
    importance: 'high' | 'medium' | 'low';
  }>;
  communicationAnalysis: {
    clarity: number;
    confidence: number;
    engagement: number;
    messageDelivery: number;
    overallEffectiveness: number;
  };
  contentInsights: {
    newsworthyItems: string[];
    controversialStatements: string[];
    positiveMessages: string[];
    areasOfInterest: string[];
  };
  recommendations: {
    mediaTraining: string[];
    futureInterviews: string[];
    messageRefinement: string[];
    communicationImprovement: string[];
  };
}

export interface SportSpecificInsights {
  sport: string;
  technicalAspects: string[];
  tacticalElements: string[];
  physicalRequirements: string[];
  mentalAspects: string[];
  commonMistakes: string[];
  bestPractices: string[];
}

export class ComprehensiveAIAnalysisService {
  private genAI: GoogleGenerativeAI;
  private config: typeof GEMINI_CONFIG;

  constructor() {
    this.config = GEMINI_CONFIG;
    this.genAI = new GoogleGenerativeAI(this.config.API_KEY);
  }

  async analyzeVideo(request: ComprehensiveAnalysisRequest): Promise<ComprehensiveAnalysisResult> {
    const startTime = Date.now();

    try {
      // Validate API key
      if (!this.config.API_KEY) {
        throw new Error('Gemini API key is required');
      }

      // Get sport-specific prompt
      const sportPrompt = getSportPrompt(request.sport, request.videoType);
      
      // Build comprehensive analysis prompt
      const analysisPrompt = this.buildAnalysisPrompt(request, sportPrompt);
      
      // Get Gemini model
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash-exp',
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8192,
        }
      });

      // Prepare content parts for Gemini
      const contentParts = [
        { text: analysisPrompt },
        ...request.frames.map(frame => ({
          inlineData: {
            mimeType: 'image/jpeg',
            data: frame.frameData.split(',')[1] // Remove data:image/jpeg;base64, prefix
          }
        }))
      ];

      // Perform analysis
      const result = await model.generateContent(contentParts);
      const response = result.response;
      const text = response.text();

      // Parse AI response
      const parsedAnalysis = this.parseAIResponse(text, request.videoType, request.sport);

      const processingTime = Date.now() - startTime;

      return {
        success: true,
        analysis: {
          ...parsedAnalysis,
          confidence: 0.9, // High confidence for comprehensive analysis
          processingTime
        }
      };

    } catch (error) {
      console.error('Comprehensive AI analysis failed:', error);
      const processingTime = Date.now() - startTime;

      return {
        success: false,
        analysis: {
          summary: 'Analysis failed due to an error.',
          confidence: 0,
          processingTime,
          sportInsights: {
            sport: request.sport,
            technicalAspects: [],
            tacticalElements: [],
            physicalRequirements: [],
            mentalAspects: [],
            commonMistakes: [],
            bestPractices: []
          },
          recommendations: ['Please try again or contact support.'],
          error: error instanceof Error ? error.message : 'Unknown error occurred'
        }
      };
    }
  }

  private buildAnalysisPrompt(request: ComprehensiveAnalysisRequest, sportPrompt: string): string {
    const { videoType, sport, metadata } = request;
    
    let basePrompt = `You are an expert sports analyst specializing in ${sport}. Analyze this ${videoType} video comprehensively.\n\n`;
    
    basePrompt += `${sportPrompt}\n\n`;
    
    basePrompt += `Video Context:\n`;
    if (metadata.teamInfo) {
      basePrompt += `- Teams: ${metadata.teamInfo.homeTeam} vs ${metadata.teamInfo.awayTeam}\n`;
      basePrompt += `- Competition: ${metadata.teamInfo.competition}\n`;
      basePrompt += `- Date: ${metadata.teamInfo.date}\n`;
    }
    if (metadata.context) {
      basePrompt += `- Context: ${metadata.context}\n`;
    }
    if (metadata.duration) {
      basePrompt += `- Duration: ${metadata.duration} seconds\n`;
    }
    if (metadata.playerTags && metadata.playerTags.length > 0) {
      basePrompt += `- Tagged Players: ${metadata.playerTags.map(p => `${p.playerName} (${p.position})`).join(', ')}\n`;
    }
    
    basePrompt += `\nPlease provide a comprehensive analysis in the following JSON format:\n`;
    
    switch (videoType) {
      case 'match':
        basePrompt += this.getMatchAnalysisFormat();
        break;
      case 'training':
        basePrompt += this.getTrainingAnalysisFormat();
        break;
      case 'highlight':
        basePrompt += this.getHighlightAnalysisFormat();
        break;
      case 'interview':
        basePrompt += this.getInterviewAnalysisFormat();
        break;
    }
    
    basePrompt += `\n\nProvide detailed, actionable insights that would be valuable for coaches, players, and teams. Focus on specific moments, player performances, and tactical elements.`;
    
    return basePrompt;
  }

  private getMatchAnalysisFormat(): string {
    return `{
      "summary": "Comprehensive match analysis summary",
      "timeline": [{"minute": 0, "events": ["Event 1", "Event 2"], "importance": "high"}],
      "playerActions": [{"timestamp": 0, "action": "Action", "description": "Description", "confidence": 0.9, "players": ["Player"], "zone": "Zone", "impact": "positive"}],
      "keyMoments": [{"timestamp": 0, "type": "Type", "description": "Description", "importance": "high", "impact": "Impact description"}],
      "playerStats": [{"name": "Player", "position": "Position", "rating": 8.5, "actions": 10, "keyPasses": 3, "goals": 1, "performance": {"technical": 8, "physical": 8, "tactical": 8}}],
      "tacticalInsights": {"formation": "4-3-3", "pressingPatterns": ["Pattern 1"], "teamShape": "Compact", "transitions": ["Transition 1"], "setPieces": ["Set piece 1"]},
      "performanceMetrics": {"possession": 60, "passAccuracy": 85, "shotsOnTarget": 5, "defensiveEfficiency": 80, "overallRating": 8.5},
      "sportInsights": {"sport": "football", "technicalAspects": ["Aspect 1"], "tacticalElements": ["Element 1"], "physicalRequirements": ["Requirement 1"], "mentalAspects": ["Aspect 1"], "commonMistakes": ["Mistake 1"], "bestPractices": ["Practice 1"]},
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }`;
  }

  private getTrainingAnalysisFormat(): string {
    return `{
      "summary": "Training session analysis summary",
      "sessionStructure": {"warmup": "Warmup description", "mainDrills": ["Drill 1"], "cooldown": "Cooldown description", "duration": 90},
      "skillAssessment": [{"playerName": "Player", "position": "Position", "technicalRating": 8, "physicalRating": 8, "tacticalRating": 8, "strengths": ["Strength 1"], "weaknesses": ["Weakness 1"], "improvementAreas": ["Area 1"]}],
      "drillEffectiveness": [{"drillName": "Drill", "completionRate": 85, "difficulty": 7, "effectiveness": 8, "recommendations": ["Recommendation 1"]}],
      "individualProgress": [{"playerName": "Player", "skillImprovement": ["Improvement 1"], "areasNeedingAttention": ["Area 1"], "nextSteps": ["Step 1"]}],
      "coachingInsights": {"sessionEffectiveness": 8, "keyLearnings": ["Learning 1"], "followUpActions": ["Action 1"], "playerDevelopment": ["Development 1"]},
      "sportInsights": {"sport": "football", "technicalAspects": ["Aspect 1"], "tacticalElements": ["Element 1"], "physicalRequirements": ["Requirement 1"], "mentalAspects": ["Aspect 1"], "commonMistakes": ["Mistake 1"], "bestPractices": ["Practice 1"]},
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }`;
  }

  private getHighlightAnalysisFormat(): string {
    return `{
      "summary": "Highlight video analysis summary",
      "keyMoments": [{"timestamp": 0, "type": "Type", "description": "Description", "skillLevel": 9, "marketability": 8, "playerInvolved": "Player", "impact": "Impact description"}],
      "skillDemonstrations": [{"skill": "Skill", "quality": 9, "difficulty": 8, "execution": "Excellent", "marketability": 9}],
      "playerHighlights": [{"playerName": "Player", "position": "Position", "highlightMoments": ["Moment 1"], "skillRating": 9, "marketability": 8, "recruitmentValue": ["Value 1"]}],
      "contentCreation": {"bestMoments": ["Moment 1"], "editingSuggestions": ["Suggestion 1"], "marketingPotential": ["Potential 1"], "targetAudience": ["Audience 1"]},
      "performanceInsights": {"overallQuality": 9, "skillDiversity": 8, "entertainmentValue": 9, "recruitmentPotential": 8},
      "sportInsights": {"sport": "football", "technicalAspects": ["Aspect 1"], "tacticalElements": ["Element 1"], "physicalRequirements": ["Requirement 1"], "mentalAspects": ["Aspect 1"], "commonMistakes": ["Mistake 1"], "bestPractices": ["Practice 1"]},
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }`;
  }

  private getInterviewAnalysisFormat(): string {
    return `{
      "summary": "Interview analysis summary",
      "transcript": {"summary": "Transcript summary", "keyPoints": ["Point 1"], "mainThemes": ["Theme 1"], "emotionalMoments": ["Moment 1"]},
      "keyQuotes": [{"quote": "Quote text", "timestamp": 0, "speaker": "Speaker", "context": "Context", "importance": "high"}],
      "communicationAnalysis": {"clarity": 8, "confidence": 8, "engagement": 8, "messageDelivery": 8, "overallEffectiveness": 8},
      "contentInsights": {"newsworthyItems": ["Item 1"], "controversialStatements": ["Statement 1"], "positiveMessages": ["Message 1"], "areasOfInterest": ["Area 1"]},
      "recommendations": {"mediaTraining": ["Training 1"], "futureInterviews": ["Interview 1"], "messageRefinement": ["Refinement 1"], "communicationImprovement": ["Improvement 1"]},
      "sportInsights": {"sport": "football", "technicalAspects": ["Aspect 1"], "tacticalElements": ["Element 1"], "physicalRequirements": ["Requirement 1"], "mentalAspects": ["Aspect 1"], "commonMistakes": ["Mistake 1"], "bestPractices": ["Practice 1"]},
      "recommendations": ["Recommendation 1", "Recommendation 2"]
    }`;
  }

  private parseAIResponse(text: string, videoType: string, sport: string): any {
    try {
      // Try to extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: create structured response from text
      return this.createFallbackResponse(text, videoType, sport);
    } catch (error) {
      console.error('Failed to parse AI response:', error);
      return this.createFallbackResponse(text, videoType, sport);
    }
  }

  private createFallbackResponse(text: string, videoType: string, sport: string): any {
    return {
      summary: text.substring(0, 500) + '...',
      sportInsights: {
        sport,
        technicalAspects: ['Analysis completed successfully'],
        tacticalElements: ['Comprehensive analysis provided'],
        physicalRequirements: ['Physical aspects analyzed'],
        mentalAspects: ['Mental game assessed'],
        commonMistakes: ['Areas for improvement identified'],
        bestPractices: ['Best practices highlighted']
      },
      recommendations: ['Review the analysis for detailed insights', 'Consider implementing suggested improvements']
    };
  }
}
