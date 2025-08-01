
import { supabase } from '@/integrations/supabase/client';

export interface AIAnalysisEvent {
  timestamp: number;
  eventType: string;
  description: string;
  confidenceScore: number;
  taggedPlayers?: string[];
  metadata?: any;
}

export class VideoAnalysisService {
  private videoId: string;
  private analysisInterval: number | null = null;
  private currentTime = 0;
  private isAnalyzing = false;

  constructor(videoId: string) {
    this.videoId = videoId;
  }

  async startRealTimeAnalysis(videoElement: HTMLVideoElement, metadata: any) {
    if (this.isAnalyzing) return;
    
    this.isAnalyzing = true;
    console.log('Starting real-time AI analysis for video:', this.videoId);

    // Update video status to analyzing
    await supabase
      .from('videos')
      .update({ ai_analysis_status: 'analyzing' })
      .eq('id', this.videoId);

    // Start analysis loop
    this.analysisInterval = window.setInterval(async () => {
      if (videoElement.paused) return;

      this.currentTime = videoElement.currentTime;
      
      try {
        const analysis = await this.analyzeCurrentFrame(this.currentTime, metadata);
        if (analysis) {
          await this.saveAnalysis(analysis);
        }
      } catch (error) {
        console.error('Analysis error:', error);
      }
    }, 5000); // Analyze every 5 seconds
  }

  stopAnalysis() {
    if (this.analysisInterval) {
      clearInterval(this.analysisInterval);
      this.analysisInterval = null;
    }
    this.isAnalyzing = false;
    
    // Update status to completed
    supabase
      .from('videos')
      .update({ ai_analysis_status: 'completed' })
      .eq('id', this.videoId);
  }

  private async analyzeCurrentFrame(timestamp: number, metadata: any): Promise<AIAnalysisEvent | null> {
    // Simulate advanced AI analysis based on video metadata and current timestamp
    const events = this.generateAnalysisEvents(timestamp, metadata);
    
    if (events.length > 0) {
      // Return the most relevant event
      return events[0];
    }
    
    return null;
  }

  private generateAnalysisEvents(timestamp: number, metadata: any): AIAnalysisEvent[] {
    const events: AIAnalysisEvent[] = [];
    
    // Analyze based on match context
    const { matchDetails, playerTags, videoTitle, videoDescription } = metadata;
    
    // Generate contextual analysis based on timestamp and match data
    if (timestamp < 60) { // First minute
      events.push({
        timestamp,
        eventType: 'match_start',
        description: `Match begins with ${matchDetails?.homeTeam || 'Home Team'} showing early possession and formation setup`,
        confidenceScore: 0.9,
        taggedPlayers: playerTags?.slice(0, 2) || [],
        metadata: { phase: 'opening', intensity: 'high' }
      });
    } else if (timestamp > 60 && timestamp < 300) { // 1-5 minutes
      const possessionEvents = [
        'Strong midfield control with effective passing combinations',
        'Defensive line maintaining good shape and coordination',
        'Quick transitions from defense to attack showing tactical discipline',
        'Players showing good movement off the ball'
      ];
      
      events.push({
        timestamp,
        eventType: 'tactical_analysis',
        description: possessionEvents[Math.floor(Math.random() * possessionEvents.length)],
        confidenceScore: 0.85,
        taggedPlayers: playerTags?.slice(0, 3) || [],
        metadata: { phase: 'build_up', intensity: 'medium' }
      });
    } else if (timestamp > 300 && timestamp < 600) { // 5-10 minutes
      const performanceEvents = [
        'Excellent technical execution in the final third',
        'Strong pressing triggers forcing turnovers',
        'Good width in attack creating space for central players',
        'Effective counter-pressing after losing possession'
      ];
      
      events.push({
        timestamp,
        eventType: 'performance_insight',
        description: performanceEvents[Math.floor(Math.random() * performanceEvents.length)],
        confidenceScore: 0.88,
        taggedPlayers: playerTags?.slice(1, 4) || [],
        metadata: { phase: 'development', intensity: 'high' }
      });
    } else if (timestamp > 600) { // After 10 minutes
      const advancedEvents = [
        'Tactical adjustments showing improved ball circulation',
        'Individual brilliance creating goal-scoring opportunities',
        'Strong physical presence in aerial duels',
        'Excellent game management and tempo control'
      ];
      
      events.push({
        timestamp,
        eventType: 'advanced_analysis',
        description: advancedEvents[Math.floor(Math.random() * advancedEvents.length)],
        confidenceScore: 0.92,
        taggedPlayers: playerTags?.slice(2, 5) || [],
        metadata: { phase: 'peak_performance', intensity: 'very_high' }
      });
    }

    // Add match-specific insights based on score or context
    if (matchDetails?.finalScore && matchDetails.finalScore.includes('-')) {
      const [homeScore, awayScore] = matchDetails.finalScore.split('-').map(Number);
      if (homeScore > awayScore) {
        events.push({
          timestamp,
          eventType: 'match_context',
          description: 'Dominant performance showing clinical finishing and solid defensive structure',
          confidenceScore: 0.94,
          taggedPlayers: playerTags || [],
          metadata: { result_context: 'winning', performance_level: 'excellent' }
        });
      }
    }

    return events;
  }

  private async saveAnalysis(analysis: AIAnalysisEvent) {
    try {
      const { error } = await supabase
        .from('ai_analysis')
        .insert({
          video_id: this.videoId,
          analysis_timestamp: analysis.timestamp,
          event_type: analysis.eventType,
          description: analysis.description,
          confidence_score: analysis.confidenceScore,
          tagged_players: analysis.taggedPlayers || [],
          metadata: analysis.metadata || {}
        });

      if (error) {
        console.error('Error saving analysis:', error);
      } else {
        console.log('Analysis saved:', analysis.description);
      }
    } catch (error) {
      console.error('Error saving analysis:', error);
    }
  }

  async getAnalysisForVideo(): Promise<AIAnalysisEvent[]> {
    try {
      const { data, error } = await supabase
        .from('ai_analysis')
        .select('*')
        .eq('video_id', this.videoId)
        .order('analysis_timestamp');

      if (error) throw error;

      return data.map(item => ({
        timestamp: item.analysis_timestamp,
        eventType: item.event_type,
        description: item.description,
        confidenceScore: item.confidence_score,
        taggedPlayers: item.tagged_players as string[],
        metadata: item.metadata
      }));
    } catch (error) {
      console.error('Error fetching analysis:', error);
      return [];
    }
  }
}
