
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Play,
  Download,
  Share,
  BarChart3,
  Clock,
  Users,
  Target,
  TrendingUp,
  Activity,
  Eye,
  Star,
  AlertCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import PDFReportService from '@/services/pdfReportService';

interface VideoAnalysisResultsProps {
  videoId: string;
  videoType: 'match' | 'training' | 'highlight' | 'interview';
  teamId: string;
}

interface AnalysisData {
  playerActions: any[];
  keyMoments: any[];
  summary: string;
  insights: string[];
  performanceRating: number;
}

const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoId,
  videoType,
  teamId
}) => {
  const { toast } = useToast();
  const [videoData, setVideoData] = useState<any>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    fetchVideoData();
    fetchAnalysisData();
  }, [videoId]);

  const fetchVideoData = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (error) throw error;
      setVideoData(data);
    } catch (error) {
      console.error('Error fetching video data:', error);
      toast({
        title: "Error",
        description: "Failed to load video data",
        variant: "destructive"
      });
    }
  };

  const fetchAnalysisData = async () => {
    try {
      setLoading(true);
      
      // Fetch AI analysis data
      const { data: analysisResults, error } = await supabase
        .from('ai_analysis')
        .select('*')
        .eq('video_id', videoId);

      if (error) throw error;

      // Process and structure the analysis data
      if (analysisResults && analysisResults.length > 0) {
        const processedData: AnalysisData = {
          playerActions: analysisResults.map(result => ({
            timestamp: result.analysis_timestamp,
            action: result.event_type,
            description: result.description,
            confidence: result.confidence_score,
            players: result.tagged_players || []
          })),
          keyMoments: analysisResults
            .filter(result => result.confidence_score > 0.8)
            .map(result => ({
              timestamp: result.analysis_timestamp,
              type: result.event_type,
              description: result.description,
              importance: 'high'
            })),
          summary: `Analysis complete for ${videoType} video. Found ${analysisResults.length} events.`,
          insights: [
            `${analysisResults.length} events detected`,
            `${analysisResults.filter(r => r.confidence_score > 0.8).length} high-confidence events`,
            'AI analysis completed successfully'
          ],
          performanceRating: analysisResults.length > 0 ? 
            Math.round(analysisResults.reduce((sum, r) => sum + r.confidence_score, 0) / analysisResults.length * 10) : 
            0
        };

        setAnalysisData(processedData);
      } else {
        // No analysis data available
        setAnalysisData({
          playerActions: [],
          keyMoments: [],
          summary: 'No analysis data available for this video.',
          insights: ['Analysis pending or not started'],
          performanceRating: 0
        });
      }
    } catch (error) {
      console.error('Error fetching analysis data:', error);
      toast({
        title: "Error",
        description: "Failed to load analysis data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      if (!videoData || !analysisData) return;
      
      const reportBlob = PDFReportService.generateComprehensiveReport(videoData, analysisData);
      const url = URL.createObjectURL(reportBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `video-analysis-${videoData.title || 'report'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Downloaded",
        description: "Analysis report has been downloaded successfully"
      });
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Download Failed",
        description: "Failed to generate report",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const jumpToTimestamp = (timestamp: number) => {
    setCurrentTime(timestamp);
    // Here you would implement actual video seeking functionality
    toast({
      title: "Jumped to timestamp",
      description: `Moved to ${formatTime(timestamp)}`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Video Player Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="aspect-video bg-black rounded-lg mb-4 flex items-center justify-center">
            {videoData?.video_url ? (
              <video 
                src={videoData.video_url} 
                controls 
                className="w-full h-full rounded-lg"
                onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
              />
            ) : (
              <div className="text-gray-400 flex flex-col items-center">
                <Play className="w-16 h-16 mb-2" />
                <span>Video not available</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg">{videoData?.title || 'Untitled Video'}</h3>
              <p className="text-gray-400">{videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video</p>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleDownloadReport}
                variant="outline"
                className="border-bright-pink text-bright-pink hover:bg-bright-pink hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Report
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="actions">Player Actions</TabsTrigger>
          <TabsTrigger value="moments">Key Moments</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Total Events</p>
                    <p className="text-white text-2xl font-bold">
                      {analysisData?.playerActions.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-500/20 rounded-lg">
                    <Target className="w-5 h-5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Key Moments</p>
                    <p className="text-white text-2xl font-bold">
                      {analysisData?.keyMoments.length || 0}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Star className="w-5 h-5 text-green-400" />
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm">Performance</p>
                    <p className="text-white text-2xl font-bold">
                      {analysisData?.performanceRating || 0}/10
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analysis Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {analysisData?.summary || 'No summary available'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Player Actions Detected</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {analysisData?.playerActions.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No player actions detected</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisData?.playerActions.map((action, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                        onClick={() => jumpToTimestamp(action.timestamp)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs">
                              {action.action}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatTime(action.timestamp)}
                            </span>
                          </div>
                          <p className="text-white text-sm">{action.description}</p>
                        </div>
                        
                        <div className="text-right">
                          <p className="text-xs text-gray-400">Confidence</p>
                          <p className="text-white font-semibold">
                            {Math.round(action.confidence * 100)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moments" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Key Moments</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                {analysisData?.keyMoments.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No key moments identified</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analysisData?.keyMoments.map((moment, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer transition-colors"
                        onClick={() => jumpToTimestamp(moment.timestamp)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Badge className="bg-bright-pink text-white">
                            {moment.type}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {formatTime(moment.timestamp)}
                          </span>
                        </div>
                        <p className="text-white">{moment.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Performance Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData?.insights.length === 0 ? (
                  <div className="text-center py-8">
                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No insights available</p>
                  </div>
                ) : (
                  analysisData?.insights.map((insight, index) => (
                    <div key={index} className="p-4 bg-gray-700 rounded-lg">
                      <p className="text-white">{insight}</p>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoAnalysisResults;
