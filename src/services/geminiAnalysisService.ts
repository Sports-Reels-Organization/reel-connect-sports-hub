
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI('AIzaSyA2cd1hCSDn4TvWYiEBOcnxGb4g7Q3Dpns');

export interface VideoAnalysisParams {
  playerTags: string[];
  videoType: 'match' | 'interview' | 'training' | 'highlight';
  videoTitle: string;
  videoDescription: string;
  duration: number;
  opposingTeam?: string;
  playerStats?: Record<string, any>;
  matchDetails?: {
    homeTeam: string;
    awayTeam: string;
    league: string;
    finalScore: string;
  };
}

export interface VideoAnalysisResult {
  summary: string;
  keyHighlights: string[];
  recommendations: string[];
  performanceMetrics: Record<string, string | number>;
  analysisStatus: 'completed' | 'failed';
  errorMessage?: string;
}

export const analyzeVideoWithGemini = async (params: VideoAnalysisParams): Promise<VideoAnalysisResult> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

    let analysisPrompt = '';
    const playerNames = params.playerTags.join(', ');
    
    switch (params.videoType) {
      case 'match':
        analysisPrompt = `As a professional football scout and analyst, provide a comprehensive analysis of this match video titled "${params.videoTitle}".

VIDEO DETAILS:
- Title: ${params.videoTitle}
- Description: ${params.videoDescription}
- Duration: ${params.duration} seconds
- Tagged Players: ${playerNames}
${params.opposingTeam ? `- Opposition: ${params.opposingTeam}` : ''}
${params.matchDetails ? `- Match: ${params.matchDetails.homeTeam} vs ${params.matchDetails.awayTeam}
- League: ${params.matchDetails.league}
- Final Score: ${params.matchDetails.finalScore}` : ''}
${params.playerStats ? `- Player Statistics: ${JSON.stringify(params.playerStats)}` : ''}

Please provide a detailed professional analysis including:

**1. MATCH OVERVIEW & TACTICAL ANALYSIS**
- Overall match flow and key phases of play
- Tactical formations and systems observed
- Team shape and defensive/attacking transitions
- Set piece effectiveness and organization

**2. INDIVIDUAL PLAYER PERFORMANCE ANALYSIS**
For each tagged player (${playerNames}):
- Technical execution (first touch, passing accuracy, ball control under pressure)
- Tactical awareness (positioning, decision-making, game reading ability)
- Physical attributes displayed (pace, strength, endurance, agility)
- Mental aspects (composure under pressure, leadership qualities, communication)
- Key moments and decisive actions that influenced the game
- Areas of excellence and specific improvement opportunities

**3. TECHNICAL SKILL ASSESSMENT**
- Ball mastery and close control in tight spaces
- Passing range and distribution accuracy
- Shooting technique and finishing ability
- Defensive actions and work rate
- Aerial dueling and physical challenges

**4. PERFORMANCE METRICS EVALUATION**
${params.playerStats ? `Based on the match statistics: ${JSON.stringify(params.playerStats)}` : 'Based on visual observation:'}
- Goals/assists and their context within the game
- Key passes and chance creation
- Defensive actions and recoveries
- Work rate and distance covered
- Success rates in duels and challenges

**5. SCOUTING ASSESSMENT & MARKET EVALUATION**
- Current ability level and playing standard
- Potential for development and improvement
- Suitable playing level and league recommendations
- Transfer market value estimation
- Comparison to players of similar profile

**6. DEVELOPMENT RECOMMENDATIONS**
Specific areas for improvement:
- Technical skills requiring attention
- Tactical understanding enhancement
- Physical conditioning needs
- Mental/psychological development areas
- Training focus recommendations

Provide specific examples, detailed reasoning for all assessments, and actionable insights for player development and transfer decisions.`;
        break;

      case 'training':
        analysisPrompt = `As a professional football training analyst, provide a comprehensive analysis of this training session video titled "${params.videoTitle}".

TRAINING SESSION DETAILS:
- Title: ${params.videoTitle}
- Description: ${params.videoDescription}
- Duration: ${params.duration} seconds
- Featured Players: ${playerNames}

Please provide detailed analysis including:

**1. TRAINING SESSION EVALUATION**
- Session objectives and training focus areas
- Intensity level and training load assessment
- Drill progression and exercise variety
- Training methodology and coaching approach

**2. INDIVIDUAL PLAYER ASSESSMENT**
For each featured player (${playerNames}):
- Technical execution in training drills
- Learning adaptability and skill acquisition
- Work ethic and training attitude
- Interaction with teammates and coaching staff
- Response to instruction and feedback
- Areas of demonstrated strength in training environment

**3. SKILL DEVELOPMENT ANALYSIS**
- Technical proficiency in drill execution
- Tactical understanding in small-sided games
- Physical conditioning and fitness levels
- Mental focus and concentration throughout session
- Consistency in performance quality

**4. DEVELOPMENT RECOMMENDATIONS**
- Individual training priorities for each player
- Specific drill recommendations for skill enhancement
- Areas requiring additional focus and attention
- Long-term development pathway suggestions

**5. TRAINING EFFECTIVENESS ASSESSMENT**
- Quality of training exercises for player development
- Appropriateness of difficulty level and progression
- Transfer potential to match situations
- Overall training session effectiveness

Provide specific observations with detailed reasoning and actionable development advice for both players and training methodology.`;
        break;

      case 'highlight':
        analysisPrompt = `As a professional football scout, provide a comprehensive analysis of this highlight reel titled "${params.videoTitle}".

HIGHLIGHT REEL DETAILS:
- Title: ${params.videoTitle}
- Description: ${params.videoDescription}
- Duration: ${params.duration} seconds
- Featured Players: ${playerNames}

Please provide detailed analysis including:

**1. HIGHLIGHT SHOWCASE ANALYSIS**
- Quality and significance of moments featured
- Variety of skills and situations demonstrated
- Overall impression and standout qualities
- Consistency of performance across highlights

**2. TECHNICAL EXCELLENCE EVALUATION**
For each featured player (${playerNames}):
- Technical skills and ball mastery displayed
- Finishing ability and goal-scoring technique
- Creative play and assist quality
- Defensive actions and work rate (if applicable)
- Set piece expertise and delivery quality

**3. TACTICAL INTELLIGENCE ASSESSMENT**
- Decision-making in crucial moments
- Positional awareness and movement
- Understanding of game situations
- Adaptability to different match contexts
- Leadership and influence on teammates

**4. STANDOUT MOMENTS BREAKDOWN**
For each significant highlight:
- Context and match situation analysis
- Technical execution quality assessment
- Difficulty level and skill required
- Impact on game outcome
- Demonstration of character under pressure

**5. PLAYER PROFILE & MARKET ASSESSMENT**
- Playing style and positional versatility
- Comparison to established professional players
- Current ability level estimation
- Market value and transfer potential
- Suitable leagues and playing levels

**6. SCOUTING VERDICT & RECOMMENDATIONS**
- Overall rating and professional assessment
- Transfer readiness and adaptation potential
- Development areas despite highlight quality
- Long-term potential evaluation
- Recommended next steps for career progression

Provide specific analysis of what makes these moments highlight-worthy and deliver professional scouting insights with detailed reasoning.`;
        break;

      case 'interview':
        analysisPrompt = `As a sports psychology expert and analyst, provide a comprehensive analysis of this interview video titled "${params.videoTitle}".

INTERVIEW ANALYSIS:
- Title: ${params.videoTitle}
- Description: ${params.videoDescription}
- Duration: ${params.duration} seconds
- Interviewee: ${playerNames}

Please provide detailed analysis including:

**1. COMMUNICATION & PERSONALITY ASSESSMENT**
- Communication clarity and articulation
- Confidence level and media presence
- Emotional intelligence and self-awareness
- Authenticity and sincerity in responses
- Professional maturity and composure

**2. FOOTBALL INTELLIGENCE & KNOWLEDGE**
- Understanding of tactical concepts and game principles
- Awareness of personal strengths and development areas
- Knowledge of team dynamics and role within squad
- Strategic thinking and game analysis ability
- Coachability and willingness to learn

**3. CHARACTER & MENTALITY EVALUATION**
- Mental resilience and handling of pressure
- Leadership qualities and team player attributes
- Ambition and career motivation levels
- Professionalism and dedication to improvement
- Cultural awareness and adaptability

**4. KEY INSIGHTS & REVELATIONS**
- Important information disclosed about playing style
- Career aspirations and future goals
- Relationship with current team and coaching staff
- Personal challenges and how they've been overcome
- Values and principles that drive performance

**5. MARKETABILITY & PROFESSIONAL READINESS**
- Media handling skills and PR awareness
- Brand potential and commercial appeal
- Adaptability to different cultural environments
- Professional standards and conduct
- Readiness for higher-level football

**6. PSYCHOLOGICAL PROFILE FOR TRANSFERS**
- Suitability for different team environments
- Likely adaptation challenges and strengths
- Leadership potential and influence on team culture
- Resilience factors for career transitions
- Long-term professional development potential

Provide insights into character, mentality, and professional readiness with specific examples and reasoning from the interview content.`;
        break;

      default:
        analysisPrompt = `As a professional sports analyst, provide a comprehensive analysis of this video titled "${params.videoTitle}".

VIDEO CONTENT ANALYSIS:
- Title: ${params.videoTitle}
- Description: ${params.videoDescription}
- Duration: ${params.duration} seconds
- Featured Content: ${playerNames}

Please provide detailed professional analysis including:

**1. CONTENT OVERVIEW & CONTEXT**
- Type of content and sporting context
- Quality of footage and visibility of key elements
- Relevance for performance evaluation
- Professional value for assessment purposes

**2. PERFORMANCE EVALUATION**
For visible participants (${playerNames}):
- Observable skills and technical abilities
- Performance quality and consistency
- Standout moments and key actions
- Areas of strength demonstration

**3. TECHNICAL OBSERVATIONS**
- Skill execution quality and precision
- Movement patterns and coordination
- Decision-making under various conditions
- Adaptability to different situations

**4. PROFESSIONAL ASSESSMENT**
- Current performance level evaluation
- Development potential identification
- Suitability for competitive environments
- Comparison to standard performance benchmarks

**5. RECOMMENDATIONS & INSIGHTS**
- Key takeaways from the content
- Areas for continued development focus
- Professional development suggestions
- Future assessment recommendations

Provide specific observations with professional reasoning and actionable insights for performance development.`;
    }

    const result = await model.generateContent(analysisPrompt);
    const response = result.response;
    const analysisText = response.text();

    if (!analysisText) {
      throw new Error('No analysis received from Gemini API');
    }

    // Parse the analysis text to extract structured data
    const analysisLines = analysisText.split('\n').filter(line => line.trim());
    
    // Extract key highlights
    const highlights = analysisLines
      .filter(line => 
        line.includes('**') || 
        line.match(/^[-*•]\s/) || 
        line.match(/^\d+\.\s/) ||
        line.toLowerCase().includes('highlight') ||
        line.toLowerCase().includes('standout') ||
        line.toLowerCase().includes('excellent') ||
        line.toLowerCase().includes('impressive') ||
        line.toLowerCase().includes('strong')
      )
      .slice(0, 8)
      .map(line => line.replace(/^[-*•]\s|\d+\.\s|\*\*/g, '').trim())
      .filter(line => line.length > 10);

    // Extract recommendations
    const recommendations = analysisLines
      .filter(line => 
        line.toLowerCase().includes('recommend') ||
        line.toLowerCase().includes('should') ||
        line.toLowerCase().includes('improve') ||
        line.toLowerCase().includes('develop') ||
        line.toLowerCase().includes('focus on') ||
        line.toLowerCase().includes('work on') ||
        line.toLowerCase().includes('enhance') ||
        line.toLowerCase().includes('strengthen')
      )
      .slice(0, 6)
      .map(line => line.trim())
      .filter(line => line.length > 10);

    // Create performance metrics
    const performanceMetrics: Record<string, string | number> = {
      'Analysis Type': params.videoType.charAt(0).toUpperCase() + params.videoType.slice(1),
      'Players Analyzed': playerNames || 'General content',
      'Analysis Depth': 'Comprehensive Professional Assessment',
      'Key Focus Areas': `${highlights.length} major insights identified`,
      'Recommendations': `${recommendations.length} development areas highlighted`
    };

    if (params.opposingTeam) {
      performanceMetrics['Opposition'] = params.opposingTeam;
    }

    if (params.matchDetails) {
      performanceMetrics['Competition'] = params.matchDetails.league;
      performanceMetrics['Match Result'] = params.matchDetails.finalScore;
    }

    return {
      summary: analysisText,
      keyHighlights: highlights.length > 0 ? highlights : [
        'Comprehensive video analysis completed',
        'Performance evaluation conducted',
        'Professional assessment provided'
      ],
      recommendations: recommendations.length > 0 ? recommendations : [
        'Continue current development trajectory',
        'Focus on maintaining consistency',
        'Build on demonstrated strengths'
      ],
      performanceMetrics,
      analysisStatus: 'completed'
    };

  } catch (error: any) {
    console.error('Error analyzing video with Gemini:', error);
    return {
      summary: 'Analysis failed due to an error.',
      keyHighlights: [],
      recommendations: [],
      performanceMetrics: {},
      analysisStatus: 'failed',
      errorMessage: error.message || 'Unknown error occurred'
    };
  }
};
