
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Download, 
  Eye, 
  TrendingUp, 
  Users, 
  Activity,
  Clock,
  Target,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface EnhancedVideoAnalysisProps {
  videoId: string;
  onAnalysisComplete?: () => void;
}

interface AnalysisData {
  id: string;
  video_id: string;
  analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  overview?: string;
  key_events?: any;
  tagged_player_analysis?: any;
  player_performance_radar?: any;
  event_timeline?: any;
  visual_summary?: any;
  game_context?: any;
  recommendations?: string[];
  overall_assessment?: string;
  created_at: string;
  updated_at: string;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({ 
  videoId, 
  onAnalysisComplete 
}) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => {
    fetchAnalysis();
  }, [videoId]);

  const fetchAnalysis = async () => {
    if (!videoId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('enhanced_video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching analysis:', error);
        return;
      }

      if (data) {
        setAnalysis(data as AnalysisData);
      }
    } catch (error) {
      console.error('Error fetching analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  const startAnalysis = async () => {
    setAnalyzing(true);
    try {
      // Start analysis by calling the edge function
      const { error } = await supabase.functions.invoke('analyze-video', {
        body: { 
          videoId,
          analysisType: 'enhanced'
        }
      });

      if (error) throw error;

      // Create pending analysis record
      const { data, error: insertError } = await supabase
        .from('enhanced_video_analysis')
        .insert({
          video_id: videoId,
          analysis_status: 'analyzing' as const
        })
        .select()
        .single();

      if (insertError) throw insertError;

      setAnalysis(data as AnalysisData);

      toast({
        title: "Analysis Started",
        description: "Enhanced video analysis is now in progress...",
      });

      // Poll for completion
      pollAnalysisStatus();

    } catch (error) {
      console.error('Error starting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to start video analysis",
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const pollAnalysisStatus = () => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('enhanced_video_analysis')
          .select('*')
          .eq('video_id', videoId)
          .single();

        if (error) {
          clearInterval(interval);
          return;
        }

        setAnalysis(data as AnalysisData);

        if (data.analysis_status === 'completed' || data.analysis_status === 'failed') {
          clearInterval(interval);
          
          if (data.analysis_status === 'completed') {
            toast({
              title: "Analysis Complete",
              description: "Enhanced video analysis has finished successfully!",
            });
            onAnalysisComplete?.();
          } else {
            toast({
              title: "Analysis Failed",
              description: "Video analysis encountered an error",
              variant: "destructive"
            });
          }
        }
      } catch (error) {
        console.error('Error polling analysis status:', error);
        clearInterval(interval);
      }
    }, 3000);

    // Stop polling after 10 minutes
    setTimeout(() => clearInterval(interval), 600000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      case 'analyzing':
        return <Activity className="w-4 h-4 text-blue-400 animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'failed':
        return 'bg-red-500';
      case 'analyzing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-700 rounded w-3/4"></div>
            <div className="h-4 bg-gray-700 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Status Card */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white font-polysans">
            <span className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-rosegold" />
              Enhanced Video Analysis
            </span>
            {analysis && (
              <div className="flex items-center gap-2">
                {getStatusIcon(analysis.analysis_status)}
                <Badge className={getStatusColor(analysis.analysis_status)}>
                  {analysis.analysis_status.toUpperCase()}
                </Badge>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!analysis ? (
            <div className="text-center py-8">
              <Eye className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Analysis Available
              </h3>
              <p className="text-gray-400 mb-6">
                Start an enhanced analysis to get detailed insights about this video.
              </p>
              <Button
                onClick={startAnalysis}
                disabled={analyzing}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                {analyzing ? (
                  <>
                    <Activity className="w-4 h-4 mr-2 animate-spin" />
                    Starting Analysis...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Start Enhanced Analysis
                  </>
                )}
              </Button>
            </div>
          ) : analysis.analysis_status === 'analyzing' ? (
            <div className="text-center py-8">
              <Activity className="w-16 h-16 mx-auto mb-4 text-blue-400 animate-pulse" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                Analysis in Progress
              </h3>
              <p className="text-gray-400 mb-4">
                Our AI is analyzing your video. This may take a few minutes...
              </p>
              <Progress value={60} className="w-full max-w-md mx-auto" />
            </div>
          ) : analysis.analysis_status === 'failed' ? (
            <div className="text-center py-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                Analysis Failed
              </h3>
              <p className="text-gray-400 mb-6">
                There was an error analyzing your video. Please try again.
              </p>
              <Button
                onClick={startAnalysis}
                variant="outline"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Retry Analysis
              </Button>
            </div>
          ) : (
            /* Analysis Results */
            <div className="space-y-6">
              {/* Overview */}
              {analysis.overview && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Overview</h4>
                  <p className="text-gray-300">{analysis.overview}</p>
                </div>
              )}

              {/* Key Events */}
              {analysis.key_events && (
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Key Events
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.isArray(analysis.key_events) && analysis.key_events.map((event: any, index: number) => (
                      <Card key={index} className="bg-gray-800 border-gray-600">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="outline" className="text-xs">
                              {event.timestamp || `${index + 1}:00`}
                            </Badge>
                            <Badge className="bg-rosegold text-xs">
                              {event.type || 'Event'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-300">
                            {event.description || 'Key moment in the video'}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Player Performance */}
              {analysis.tagged_player_analysis && (
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Player Performance
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysis.tagged_player_analysis).map(([playerName, data]: [string, any]) => (
                      <Card key={playerName} className="bg-gray-800 border-gray-600">
                        <CardContent className="p-4">
                          <h5 className="font-medium text-white mb-2">{playerName}</h5>
                          {data.rating && (
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-sm text-gray-400">Rating:</span>
                              <Badge className="bg-bright-pink">
                                {data.rating}/10
                              </Badge>
                            </div>
                          )}
                          {data.highlights && (
                            <ul className="text-sm text-gray-300 space-y-1">
                              {data.highlights.map((highlight: string, idx: number) => (
                                <li key={idx}>• {highlight}</li>
                              ))}
                            </ul>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysis.recommendations && analysis.recommendations.length > 0 && (
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Recommendations
                  </h4>
                  <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                    <ul className="space-y-2">
                      {analysis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-blue-300">
                          <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Overall Assessment */}
              {analysis.overall_assessment && (
                <div>
                  <h4 className="font-semibold text-white mb-2">Overall Assessment</h4>
                  <div className="bg-gray-800 border border-gray-600 rounded-lg p-4">
                    <p className="text-gray-300">{analysis.overall_assessment}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-gray-700">
                <Button
                  onClick={startAnalysis}
                  variant="outline"
                  className="border-rosegold text-rosegold hover:bg-rosegold/10"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Re-analyze
                </Button>
                <Button
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedVideoAnalysis;
