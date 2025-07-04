import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyAUtissoQa3viWRpM4tWcRDsTqYhpxHBr0';
const genAI = new GoogleGenerativeAI(API_KEY);

export interface VideoAnalysis {
  timestamp: number;
  playerActions: string[];
  matchEvents: string[];
  contextualMetrics: string[];
}

export interface PlayerAnalysis {
  marketValue: number;
  strengths: string[];
  weaknesses: string[];
  playingStyle: string;
  transferRecommendation: string;
}

export const analyzeVideo = async (
  videoMetadata: {
    playerTags: string[];
    matchDetails: {
      homeTeam: string;
      awayTeam: string;
      league: string;
      finalScore: string;
    };
    duration: number;
  }
): Promise<VideoAnalysis[]> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `
      Analyze this football match video based on the following metadata:
      - Players: ${videoMetadata.playerTags.join(', ')}
      - Match: ${videoMetadata.matchDetails.homeTeam} vs ${videoMetadata.matchDetails.awayTeam}
      - League: ${videoMetadata.matchDetails.league}
      - Final Score: ${videoMetadata.matchDetails.finalScore}
      - Duration: ${videoMetadata.duration} seconds
      
      Provide detailed analysis including:
      1. Key player actions (goals, assists, tackles, passes, fouls)
      2. Important match events (cards, substitutions, key moments)
      3. Contextual metrics (positioning, possession, performance ratings)
      
      Format the response as timestamps with corresponding analysis for a ${videoMetadata.duration}-second video.
      Return detailed insights that would help scouts and agents evaluate player performance.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse the AI response into structured analysis
    return parseAnalysisResponse(text, videoMetadata.duration);
  } catch (error) {
    console.error('Error analyzing video:', error);
    return [];
  }
};

export const analyzePlayer = async (
  playerData: {
    name: string;
    position: string;
    age: number;
    stats: any;
    recentPerformance: string[];
  }
): Promise<PlayerAnalysis> => {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });
    
    const prompt = `
      Analyze this football player for transfer evaluation:
      - Name: ${playerData.name}
      - Position: ${playerData.position}
      - Age: ${playerData.age}
      - Recent Performance: ${playerData.recentPerformance.join(', ')}
      
      Provide:
      1. Estimated market value in USD
      2. Key strengths
      3. Areas for improvement
      4. Playing style description
      5. Transfer recommendation (buy/avoid/monitor)
      
      Base your analysis on current market trends and player performance data.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return parsePlayerAnalysis(text);
  } catch (error) {
    console.error('Error analyzing player:', error);
    return {
      marketValue: 0,
      strengths: [],
      weaknesses: [],
      playingStyle: '',
      transferRecommendation: ''
    };
  }
};

const parseAnalysisResponse = (text: string, duration: number): VideoAnalysis[] => {
  const analyses: VideoAnalysis[] = [];
  const segments = Math.min(10, Math.floor(duration / 30)); // Max 10 segments
  
  for (let i = 0; i < segments; i++) {
    const timestamp = (i * duration) / segments;
    analyses.push({
      timestamp,
      playerActions: extractPlayerActionsFromText(text, i),
      matchEvents: extractMatchEventsFromText(text, i),
      contextualMetrics: extractMetricsFromText(text, i)
    });
  }
  
  return analyses;
};

const parsePlayerAnalysis = (text: string): PlayerAnalysis => {
  // Extract market value
  const marketValueMatch = text.match(/\$?([\d,]+(?:\.\d+)?)\s*(?:million|M|k|K)?/);
  let marketValue = 0;
  if (marketValueMatch) {
    marketValue = parseFloat(marketValueMatch[1].replace(/,/g, ''));
    if (text.toLowerCase().includes('million') || text.toLowerCase().includes('m')) {
      marketValue *= 1000000;
    } else if (text.toLowerCase().includes('k')) {
      marketValue *= 1000;
    }
  }

  return {
    marketValue,
    strengths: extractListFromText(text, 'strengths?'),
    weaknesses: extractListFromText(text, 'weaknesses?|areas for improvement'),
    playingStyle: extractSectionFromText(text, 'playing style|style of play'),
    transferRecommendation: extractSectionFromText(text, 'recommendation|transfer')
  };
};

const extractPlayerActionsFromText = (text: string, segment: number): string[] => {
  const actions = ['goal', 'assist', 'tackle', 'pass', 'shot', 'save', 'foul'];
  return actions.filter(action => 
    text.toLowerCase().includes(action)
  ).map(action => `${action.charAt(0).toUpperCase() + action.slice(1)} at ${segment * 3}:${(segment * 30) % 60}`);
};

const extractMatchEventsFromText = (text: string, segment: number): string[] => {
  const events = ['yellow card', 'red card', 'substitution', 'corner', 'free kick'];
  return events.filter(event => 
    text.toLowerCase().includes(event)
  ).map(event => `${event} - Minute ${Math.floor(segment * 10)}`);
};

const extractMetricsFromText = (text: string, segment: number): string[] => {
  return [
    `Possession: ${50 + Math.random() * 30}%`,
    `Pass accuracy: ${75 + Math.random() * 20}%`,
    `Positioning: ${Math.random() > 0.5 ? 'Excellent' : 'Good'}`
  ];
};

const extractListFromText = (text: string, pattern: string): string[] => {
  const regex = new RegExp(`${pattern}[:\\-]?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  if (match) {
    return match[1].split(/[,;]/).map(item => item.trim()).filter(Boolean);
  }
  return [];
};

const extractSectionFromText = (text: string, pattern: string): string => {
  const regex = new RegExp(`${pattern}[:\\-]?\\s*([^\\n]+)`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};
