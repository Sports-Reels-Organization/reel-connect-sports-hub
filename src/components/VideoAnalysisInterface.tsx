
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock,
  TrendingUp,
  Target,
  Award,
  MessageSquare
} from 'lucide-react';

interface VideoAnalysisInterfaceProps {
  videoId: string;
  videoType: 'match' | 'interview' | 'training' | 'highlight';
  onRetry?: () => void;
  onDelete?: () => void;
}

interface AnalysisData {
  id: string;
  analysis_summary: string;
  key_highlights: string[];
  recommendations: string[];
  performance_metrics: Record<string, string | number>;
  timeline_analysis: any[];
  analysis_status: 'pending' | 'completed' | 'failed';
  error_message?: string;
  created_at: string;
}

export const VideoAnalysisInterface: React.FC<VideoAnalysisInterfaceProps> = ({
  videoId,
  videoType,
  onRetry,
  onDelete
}) => {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimestamp, setSelectedTimestamp] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAnalysisData();
  }, [videoId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('enhanced_video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Ensure the data matches our AnalysisData interface
        const analysisData: AnalysisData = {
          id: data.id,
          analysis_summary: data.analysis_summary || 'Analysis completed.',
          key_highlights: Array.isArray(data.key_highlights) ? data.key_highlights : [],
          recommendations: Array.isArray(data.recommendations) ? data.recommendations : [],
          performance_metrics: data.performance_metrics || {},
          timeline_analysis: Array.isArray(data.timeline_analysis) ? data.timeline_analysis : [],
          analysis_status: data.analysis_status || 'completed',
          error_message: data.error_message,
          created_at: data.created_at
        };
        setAnalysisData(analysisData);
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast({
        title: "Error Loading Analysis",
        description: "Could not load video analysis data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAnalysis = async () => {
    if (onRetry) {
      onRetry();
      toast({
        title: "Retrying Analysis",
        description: "Video analysis is being retried...",
      });
    }
  };

  const handleDeleteVideo = async () => {
    if (onDelete) {
      onDelete();
      toast({
        title: "Video Deleted",
        description: "Video and analysis data have been removed",
      });
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bright-pink"></div>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Clock className="w-5 h-5 text-yellow-500" />
            Analysis Pending
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            Video analysis is in progress. This may take a few minutes depending on video length and complexity.
          </p>
          <Progress value={33} className="w-full" />
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryAnalysis}
              className="border-gray-600 text-gray-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteVideo}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (analysisData.analysis_status === 'failed') {
    return (
      <Card className="bg-gray-800 border-gray-700 border-red-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <XCircle className="w-5 h-5 text-red-500" />
            Analysis Failed
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-gray-300">
            Video analysis failed due to: {analysisData.error_message || 'Unknown error'}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetryAnalysis}
              className="border-gray-600 text-gray-300"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteVideo}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Video
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Status */}
      <Card className="bg-gray-800 border-gray-700 border-green-500/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <CheckCircle className="w-5 h-5 text-green-500" />
            Analysis Complete
            <Badge variant="secondary" className="ml-2">
              {videoType.charAt(0).toUpperCase() + videoType.slice(1)}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-300 leading-relaxed">
            {analysisData.analysis_summary}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Analysis completed on {new Date(analysisData.created_at).toLocaleString()}
          </p>
        </CardContent>
      </Card>

      {/* Key Highlights */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Award className="w-5 h-5 text-bright-pink" />
            Key Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {analysisData.key_highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <div className="w-6 h-6 bg-bright-pink/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-bright-pink text-sm font-medium">{index + 1}</span>
                </div>
                <p className="text-gray-300 text-sm leading-relaxed">{highlight}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      {Object.keys(analysisData.performance_metrics).length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5 text-blue-500" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analysisData.performance_metrics).map(([key, value]) => (
                <div key={key} className="p-3 bg-gray-700/50 rounded-lg text-center">
                  <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">{key}</p>
                  <p className="text-white font-semibold text-lg">{value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Target className="w-5 h-5 text-orange-500" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analysisData.recommendations.map((recommendation, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-700/50 rounded-lg">
                <Target className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-300 text-sm leading-relaxed">{recommendation}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Timeline Analysis */}
      {analysisData.timeline_analysis && analysisData.timeline_analysis.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Play className="w-5 h-5 text-purple-500" />
              Timeline Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analysisData.timeline_analysis.map((analysis, index) => (
                <div key={index} className="border-l-2 border-purple-500/30 pl-4 pb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="border-purple-500/50 text-purple-300">
                      {Math.floor(analysis.timestamp / 60)}:{(analysis.timestamp % 60).toString().padStart(2, '0')}
                    </Badge>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <div
                          key={i}
                          className={`w-2 h-2 rounded-full ${
                            i < Math.floor(analysis.performanceRating / 2) 
                              ? 'bg-bright-pink' 
                              : 'bg-gray-600'
                          }`}
                        />
                      ))}
                      <span className="text-sm text-gray-400 ml-1">
                        {analysis.performanceRating}/10
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid gap-3 text-sm">
                    {analysis.playerActions && analysis.playerActions.length > 0 && (
                      <div>
                        <h5 className="text-white font-medium mb-1">Player Actions:</h5>
                        <ul className="text-gray-300 space-y-1">
                          {analysis.playerActions.map((action: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-bright-pink">•</span>
                              {action}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {analysis.technicalAnalysis && analysis.technicalAnalysis.length > 0 && (
                      <div>
                        <h5 className="text-white font-medium mb-1">Technical Analysis:</h5>
                        <ul className="text-gray-300 space-y-1">
                          {analysis.technicalAnalysis.map((tech: string, i: number) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-blue-400">•</span>
                              {tech}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
