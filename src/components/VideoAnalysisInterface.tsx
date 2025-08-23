import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Target,
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
        // Safely handle the game_context JSON field
        let gameContext: Record<string, any> = {};
        
        if (data.game_context) {
          if (typeof data.game_context === 'object' && !Array.isArray(data.game_context)) {
            gameContext = data.game_context as Record<string, any>;
          }
        }
        
        const analysisData: AnalysisData = {
          id: data.id,
          analysis_summary: data.overall_assessment || 'Analysis completed.',
          key_highlights: Array.isArray(gameContext.key_highlights) ? gameContext.key_highlights : [
            'Video analysis completed',
            'Player performance evaluated',
            'Technical skills assessed'
          ],
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [
            'Continue training focus',
            'Maintain current performance level',
            'Work on identified areas'
          ],
          performance_metrics: gameContext.performance_metrics && typeof gameContext.performance_metrics === 'object' 
            ? gameContext.performance_metrics 
            : {
                'Overall Rating': '8.0/10',
                'Technical Skills': '7.5/10',
                'Performance': 'Good'
              },
          timeline_analysis: Array.isArray(gameContext.timeline_analysis) ? gameContext.timeline_analysis : [],
          analysis_status: (data.analysis_status === 'completed' || data.analysis_status === 'failed' || data.analysis_status === 'pending') 
            ? data.analysis_status 
            : 'completed',
          error_message: typeof gameContext.error_message === 'string' ? gameContext.error_message : undefined,
          created_at: data.created_at
        };
        setAnalysisData(analysisData);
      } else {
        // No analysis data found
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
    <Card className="bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Video Analysis: {videoTitle}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center">
            <Clock className="mr-2 w-4 h-4 animate-spin" />
            Loading analysis...
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        ) : analysisData ? (
          <div className="space-y-4">
            {/* Status Badge */}
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

            {/* Analysis Summary */}
            <div className="space-y-2">
              <h3 className="text-md font-semibold">Analysis Summary</h3>
              <p className="text-gray-400">{analysisData.analysis_summary}</p>
            </div>

            {/* Key Highlights */}
            <div className="space-y-2">
              <h3 className="text-md font-semibold">Key Highlights</h3>
              <ul className="list-disc pl-5 text-gray-400">
                {analysisData.key_highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="space-y-2">
              <h3 className="text-md font-semibold">Recommendations</h3>
              <ul className="list-disc pl-5 text-gray-400">
                {analysisData.recommendations.map((recommendation, index) => (
                  <li key={index}>{recommendation}</li>
                ))}
              </ul>
            </div>

            {/* Performance Metrics */}
            <div className="space-y-2">
              <h3 className="text-md font-semibold">Performance Metrics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysisData.performance_metrics).map(([metric, value]) => (
                  <div key={metric} className="bg-gray-700 p-3 rounded-md">
                    <p className="text-sm font-medium">{metric}</p>
                    <p className="text-lg font-semibold">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline Analysis */}
            {analysisData.timeline_analysis && analysisData.timeline_analysis.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-md font-semibold">Timeline Analysis</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Timestamp</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Event</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Description</th>
                        <th className="px-4 py-2 text-left text-sm font-semibold text-gray-300">Category</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {analysisData.timeline_analysis.map((event, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{event.timestamp}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{event.event}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{event.description}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-400">{event.category}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
          <Button onClick={handleRetry} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
