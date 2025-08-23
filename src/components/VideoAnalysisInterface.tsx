
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
  RefreshCw,
  FileText
} from 'lucide-react';

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
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalysisData();
  }, [videoId]);

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to fetch from videos table first
      const { data: videoData, error: videoError } = await supabase
        .from('videos')
        .select('ai_analysis, ai_analysis_status')
        .eq('id', videoId)
        .maybeSingle();

      if (videoError && videoError.code !== 'PGRST116') {
        // If not found in videos table, try match_videos table
        const { data: matchVideoData, error: matchVideoError } = await supabase
          .from('match_videos')
          .select('ai_analysis, ai_analysis_status')
          .eq('id', videoId)
          .maybeSingle();

        if (matchVideoError && matchVideoError.code !== 'PGRST116') {
          throw matchVideoError;
        }

        if (matchVideoData?.ai_analysis) {
          setAnalysisData({
            analysis: matchVideoData.ai_analysis.analysis || 'Analysis completed.',
            analysis_status: matchVideoData.ai_analysis_status || 'completed',
            video_type: matchVideoData.ai_analysis.video_type || 'match',
            analyzed_at: matchVideoData.ai_analysis.analyzed_at,
            model_used: matchVideoData.ai_analysis.model_used || 'gemini-2.0-flash-exp'
          });
        } else {
          setAnalysisData(null);
        }
      } else if (videoData?.ai_analysis) {
        setAnalysisData({
          analysis: videoData.ai_analysis.analysis || 'Analysis completed.',
          analysis_status: videoData.ai_analysis_status || 'completed',
          video_type: videoData.ai_analysis.video_type || 'unknown',
          analyzed_at: videoData.ai_analysis.analyzed_at,
          model_used: videoData.ai_analysis.model_used || 'gemini-2.0-flash-exp'
        });
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

  const formatAnalysisText = (text: string) => {
    // Split by sections and format with proper styling
    const sections = text.split(/\*\*([^*]+)\*\*/g);
    const formattedSections = [];
    
    for (let i = 0; i < sections.length; i++) {
      if (i % 2 === 1) {
        // This is a header
        formattedSections.push(
          <h3 key={i} className="text-lg font-semibold text-white mt-6 mb-3 border-b border-gray-600 pb-2">
            {sections[i]}
          </h3>
        );
      } else if (sections[i].trim()) {
        // This is content
        const content = sections[i].trim();
        const lines = content.split('\n').filter(line => line.trim());
        
        formattedSections.push(
          <div key={i} className="space-y-2 mb-4">
            {lines.map((line, lineIndex) => {
              if (line.startsWith('- ')) {
                return (
                  <div key={lineIndex} className="flex items-start gap-2 text-gray-300">
                    <span className="text-bright-pink mt-1">•</span>
                    <span className="flex-1">{line.substring(2)}</span>
                  </div>
                );
              } else if (line.trim()) {
                return (
                  <p key={lineIndex} className="text-gray-300 leading-relaxed">
                    {line}
                  </p>
                );
              }
              return null;
            })}
          </div>
        );
      }
    }
    
    return formattedSections;
  };

  return (
    <Card className="bg-gray-800 border-gray-700 text-white w-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold flex items-center gap-2 break-words">
          <FileText className="w-5 h-5 text-bright-pink flex-shrink-0" />
          <span className="break-words">AI Analysis: {videoTitle}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Clock className="mr-2 w-4 h-4 animate-spin" />
            <span>Loading analysis...</span>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : analysisData ? (
          <div className="space-y-4">
            {/* Status Badge */}
            <div className="flex items-center justify-between flex-wrap gap-2">
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
              
              {analysisData.model_used && (
                <Badge variant="outline" className="text-xs">
                  {analysisData.model_used}
                </Badge>
              )}
            </div>

            {/* Analysis Content */}
            <div className="bg-gray-900/50 rounded-lg p-4 max-w-full overflow-hidden">
              <div className="prose prose-invert max-w-none break-words">
                {formatAnalysisText(analysisData.analysis)}
              </div>
            </div>

            {/* Analysis Metadata */}
            {analysisData.analyzed_at && (
              <div className="text-xs text-gray-400 border-t border-gray-700 pt-3">
                <span>Analyzed on: {new Date(analysisData.analyzed_at).toLocaleString()}</span>
                {analysisData.video_type && (
                  <span className="ml-4">Type: {analysisData.video_type}</span>
                )}
              </div>
            )}
          </div>
        ) : (
          <Alert variant="default">
            <AlertDescription>
              No AI analysis available for this video yet.
            </AlertDescription>
          </Alert>
        )}
        
        {analysisData?.analysis_status === 'failed' && onRetryAnalysis && (
          <Button 
            onClick={handleRetry} 
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Analysis
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
