
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface AnalysisData {
  id: string;
  analysis_summary: string;
  key_highlights: string[];
  recommendations: string[];
  performance_metrics: Record<string, any>;
  timeline_analysis: Array<{
    timestamp: number;
    event: string;
    description: string;
    category: string;
  }>;
  analysis_status: 'completed' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
}

interface VideoAnalysisInterfaceProps {
  videoId: string;
  videoTitle: string;
  onRetryAnalysis?: () => void;
}

export const VideoAnalysisInterface: React.FC<VideoAnalysisInterfaceProps> = ({
  videoId,
  videoTitle,
  onRetryAnalysis
}) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [videoId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch analysis data from enhanced_video_analysis table
      const { data, error } = await supabase
        .from('enhanced_video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Parse the game_context JSON field safely
        let gameContext: Record<string, any> = {};
        
        if (data.game_context && typeof data.game_context === 'object') {
          gameContext = data.game_context as Record<string, any>;
        }
        
        const analysisData: AnalysisData = {
          id: data.id,
          analysis_summary: data.overall_assessment || '',
          key_highlights: Array.isArray(gameContext.key_highlights) ? gameContext.key_highlights : [],
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
          performance_metrics: gameContext.performance_metrics || {},
          timeline_analysis: Array.isArray(gameContext.timeline_analysis) ? gameContext.timeline_analysis : [],
          analysis_status: data.analysis_status || 'pending',
          error_message: gameContext.error_message,
          created_at: data.created_at
        };
        setAnalysisData(analysisData);
      } else {
        setAnalysisData(null);
      }
    } catch (err: any) {
      console.error('Error fetching analysis data:', err);
      setError(err.message || 'Failed to load analysis data');
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    if (onRetryAnalysis) {
      onRetryAnalysis();
    }
  };

  return (
    <div className="w-full max-w-none">
      <Card className="bg-gray-800 border-gray-700 text-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold break-words">
            Video Analysis: {videoTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Clock className="mr-2 w-5 h-5 animate-spin" />
              <span>Loading analysis...</span>
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="break-words">
                {error}
              </AlertDescription>
            </Alert>
          ) : analysisData ? (
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex flex-wrap items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`gap-2 ${
                    analysisData.analysis_status === 'completed'
                      ? 'bg-green-600 text-white'
                      : analysisData.analysis_status === 'failed'
                      ? 'bg-red-600 text-white'
                      : 'bg-yellow-600 text-white'
                  }`}
                >
                  {analysisData.analysis_status === 'completed' && <CheckCircle className="w-4 h-4" />}
                  {analysisData.analysis_status === 'failed' && <XCircle className="w-4 h-4" />}
                  {analysisData.analysis_status === 'pending' && <Clock className="w-4 h-4" />}
                  {analysisData.analysis_status.toUpperCase()}
                </Badge>
              </div>

              {/* Analysis Summary */}
              {analysisData.analysis_summary && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Analysis Summary</h3>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <p className="text-gray-300 leading-relaxed break-words whitespace-pre-wrap">
                      {analysisData.analysis_summary}
                    </p>
                  </div>
                </div>
              )}

              {/* Key Highlights */}
              {analysisData.key_highlights.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Key Highlights</h3>
                  <div className="space-y-2">
                    {analysisData.key_highlights.map((highlight, index) => (
                      <div key={index} className="bg-blue-900/30 border-l-4 border-blue-500 p-3 rounded-r-lg">
                        <p className="text-gray-300 break-words">{highlight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {analysisData.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Recommendations</h3>
                  <div className="space-y-2">
                    {analysisData.recommendations.map((recommendation, index) => (
                      <div key={index} className="bg-green-900/30 border-l-4 border-green-500 p-3 rounded-r-lg">
                        <p className="text-gray-300 break-words">{recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Performance Metrics */}
              {Object.keys(analysisData.performance_metrics).length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Performance Metrics</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analysisData.performance_metrics).map(([metric, value]) => (
                      <div key={metric} className="bg-gray-700 p-4 rounded-lg">
                        <p className="text-sm font-medium text-gray-400 break-words">{metric}</p>
                        <p className="text-lg font-semibold text-white break-words">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline Analysis */}
              {analysisData.timeline_analysis && analysisData.timeline_analysis.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-white">Timeline Analysis</h3>
                  <div className="overflow-x-auto">
                    <div className="min-w-full">
                      <div className="space-y-3">
                        {analysisData.timeline_analysis.map((event, index) => (
                          <div key={index} className="bg-gray-700 p-4 rounded-lg">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                              <Badge variant="outline" className="border-rosegold text-rosegold w-fit">
                                {Math.floor(event.timestamp / 60)}:{(event.timestamp % 60).toString().padStart(2, '0')}
                              </Badge>
                              <Badge variant="secondary" className="w-fit">
                                {event.category}
                              </Badge>
                            </div>
                            <h4 className="font-medium text-white mb-1 break-words">{event.event}</h4>
                            <p className="text-sm text-gray-300 break-words">{event.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {analysisData.error_message && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="break-words">
                    {analysisData.error_message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <Alert variant="default">
              <AlertDescription>
                No analysis data found for this video.
              </AlertDescription>
            </Alert>
          )}
          
          {analysisData?.analysis_status === 'failed' && onRetryAnalysis && (
            <Button 
              onClick={handleRetry} 
              className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
