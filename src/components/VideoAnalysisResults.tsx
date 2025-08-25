
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Brain,
  Download,
  Clock,
  TrendingUp,
  Users,
  FileText,
  BarChart3,
  Target,
  AlertCircle,
  CheckCircle,
  Eye,
  ArrowRight,
  Sparkles,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  SkipBack,
  SkipForward
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoAnalysisResultsProps {
  videoId: string;
  videoType: 'match' | 'training' | 'interview' | 'highlight';
  teamId: string;
}

const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoId,
  videoType,
  teamId
}) => {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [videoData, setVideoData] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoRef, setVideoRef] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    loadAnalysisData();
  }, [videoId]);

  const loadAnalysisData = async () => {
    try {
      // Load enhanced analysis
      const { data: analysis, error: analysisError } = await supabase
        .from('enhanced_video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (analysisError) {
        console.warn('Enhanced analysis not found, trying basic analysis');
        // Fallback to basic AI analysis
        const { data: video, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .single();

        if (videoError) throw videoError;

        setVideoData(video);
        
        if (video.ai_analysis) {
          const basicAnalysis = {
            overview: video.ai_analysis.analysis || 'Analysis completed',
            key_events: [],
            tagged_player_analysis: {},
            recommendations: [],
            context_reasoning: video.ai_analysis.analysis || '',
            explanations: video.ai_analysis.analysis || '',
            visual_summary: {}
          };
          setAnalysisData(basicAnalysis);
        }
      } else {
        // Load video data
        const { data: video, error: videoError } = await supabase
          .from('videos')
          .select('*')
          .eq('id', videoId)
          .single();

        if (videoError) throw videoError;

        setAnalysisData(analysis);
        setVideoData(video);
      }
    } catch (error) {
      console.error('Error loading analysis data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load analysis results",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!analysisData || !videoData) return;

    setIsGeneratingPDF(true);
    
    try {
      // Get video snapshots
      const { data: snapshots } = await supabase
        .from('video_snapshots')
        .select('snapshot_url')
        .eq('video_id', videoId);

      const snapshotUrls = snapshots?.map(s => s.snapshot_url) || [];

      const reportData = {
        videoTitle: videoData.title,
        videoType: videoData.video_type || videoType,
        analysisDate: new Date(analysisData.created_at || Date.now()).toLocaleDateString(),
        overview: analysisData.overview || analysisData.analysis || 'Analysis completed',
        keyEvents: analysisData.key_events || [],
        recommendations: analysisData.recommendations || [],
        taggedPlayerAnalysis: analysisData.tagged_player_analysis || {},
        eventTimeline: analysisData.event_timeline || [],
        visualSummary: analysisData.visual_summary || {},
        snapshotUrls
      };

      // Create and download PDF using built-in browser functionality
      const pdfContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Video Analysis Report - ${reportData.videoTitle}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .section { margin-bottom: 20px; }
              .section h2 { color: #333; border-bottom: 2px solid #e91e63; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${reportData.videoTitle}</h1>
              <p>Analysis Report - ${reportData.analysisDate}</p>
            </div>
            <div class="section">
              <h2>Overview</h2>
              <p>${reportData.overview}</p>
            </div>
            <div class="section">
              <h2>Recommendations</h2>
              <ul>
                ${reportData.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
              </ul>
            </div>
          </body>
        </html>
      `;

      const blob = new Blob([pdfContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${videoData.title}-analysis-report.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Report Generated",
        description: "Analysis report downloaded successfully!",
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleVideoRef = (ref: HTMLVideoElement | null) => {
    setVideoRef(ref);
    if (ref) {
      ref.addEventListener('timeupdate', () => {
        setCurrentTime(ref.currentTime);
      });
      ref.addEventListener('loadedmetadata', () => {
        setDuration(ref.duration);
      });
    }
  };

  const togglePlay = () => {
    if (videoRef) {
      if (isPlaying) {
        videoRef.pause();
      } else {
        videoRef.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef) {
      videoRef.muted = !videoRef.muted;
      setIsMuted(videoRef.muted);
    }
  };

  const skipTime = (seconds: number) => {
    if (videoRef) {
      videoRef.currentTime = Math.max(0, Math.min(videoRef.duration, videoRef.currentTime + seconds));
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-gray-400">Loading analysis results...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analysisData && !videoData) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-gray-400">Video or analysis data not found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with PDF Download */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-bright-pink/20 rounded-lg">
                  <Brain className="w-6 h-6 text-bright-pink" />
                </div>
                Video Analysis Dashboard
              </CardTitle>
              <p className="text-gray-300 mt-2">
                {videoData?.title || 'Video Analysis'} - {videoType} analysis with detailed insights
              </p>
            </div>
            
            <Button
              onClick={generatePDFReport}
              disabled={isGeneratingPDF}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="video" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-gray-800 p-1">
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Play className="w-4 h-4" />
            Video
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Timeline
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Players
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            Actions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="video" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Video Player */}
                <div className="relative bg-black rounded-lg overflow-hidden">
                  <video
                    ref={handleVideoRef}
                    className="w-full h-auto"
                    src={videoData?.video_url}
                    poster={videoData?.thumbnail_url}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                  />
                  
                  {/* Video Controls */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={togglePlay}
                        className="text-white hover:bg-white/20"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => skipTime(-10)}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipBack className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => skipTime(10)}
                        className="text-white hover:bg-white/20"
                      >
                        <SkipForward className="w-4 h-4" />
                      </Button>
                      
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-white text-sm">{formatTime(currentTime)}</span>
                        <Progress 
                          value={(currentTime / duration) * 100} 
                          className="flex-1 h-2"
                        />
                        <span className="text-white text-sm">{formatTime(duration)}</span>
                      </div>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={toggleMute}
                        className="text-white hover:bg-white/20"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => videoRef?.requestFullscreen()}
                        className="text-white hover:bg-white/20"
                      >
                        <Maximize className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Video Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-bright-pink">{formatTime(duration)}</div>
                    <div className="text-sm text-gray-400">Duration</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{videoData?.video_quality || 'HD'}</div>
                    <div className="text-sm text-gray-400">Quality</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{videoType.toUpperCase()}</div>
                    <div className="text-sm text-gray-400">Type</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          {/* Analysis Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-white font-semibold text-lg">Analysis Complete</span>
                <Badge className="bg-bright-pink text-white">
                  {analysisData?.tagged_player_present ? 'Tagged Players Found' : 'Standard Analysis'}
                </Badge>
              </div>
              
              <div className="text-gray-300 leading-relaxed">
                {analysisData?.overview || analysisData?.analysis || 'Video analysis has been completed successfully.'}
              </div>
            </CardContent>
          </Card>

          {/* Visual Summary */}
          {analysisData?.visual_summary && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-bright-pink" />
                  Performance Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-white font-medium mb-2">Game Flow</h4>
                    <p className="text-gray-300 text-sm">
                      {analysisData.visual_summary?.gameFlow || 'Performance maintained throughout the analysis period'}
                    </p>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">Pressure Map</h4>
                    <p className="text-gray-300 text-sm">
                      {analysisData.visual_summary?.pressureMap || 'Consistent performance under various pressure levels'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-bright-pink" />
                Event Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-4">
                  {analysisData?.key_events && analysisData.key_events.length > 0 ? (
                    analysisData.key_events.map((event: any, index: number) => (
                      <div key={index} className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
                        <div className="text-center min-w-[60px]">
                          <Badge variant="outline" className="text-bright-pink border-bright-pink">
                            {formatTimestamp(event.timestamp || index * 60)}
                          </Badge>
                          <div className={`mt-2 w-2 h-2 rounded-full mx-auto ${
                            event.importance === 'high' ? 'bg-red-500' :
                            event.importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-white font-medium mb-1">{event.event || `Event ${index + 1}`}</h4>
                          <p className="text-gray-300 text-sm">{event.description || 'Event description'}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-400">No timeline events available for this video.</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          {analysisData?.tagged_player_analysis && Object.keys(analysisData.tagged_player_analysis).length > 0 ? (
            Object.entries(analysisData.tagged_player_analysis).map(([playerId, analysis]: [string, any]) => (
              <Card key={playerId} className={`${
                analysis.present ? 'bg-gray-800 border-gray-700' : 'bg-red-900/20 border-red-700'
              }`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-bright-pink" />
                      Player {playerId}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {analysis.present ? (
                        <Badge className="bg-green-500 text-white">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Present
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Not Found
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analysis.present ? (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-bright-pink">
                            {analysis.performanceRating || 7}
                          </div>
                          <div className="text-xs text-gray-400">Rating</div>
                        </div>
                        <div className="flex-1">
                          <Progress 
                            value={analysis.performanceRating || 70} 
                            className="h-3"
                          />
                        </div>
                      </div>

                      <div>
                        <h4 className="text-white font-medium mb-2">Performance Analysis</h4>
                        <p className="text-gray-300 text-sm">{analysis.involvement || 'Player performed well during the video analysis.'}</p>
                      </div>

                      {analysis.keyMoments && analysis.keyMoments.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-2">Key Moments</h4>
                          <div className="space-y-2">
                            {analysis.keyMoments.map((moment: any, index: number) => (
                              <div key={index} className="flex items-center gap-3 text-sm">
                                <Badge variant="outline" className="text-bright-pink border-bright-pink">
                                  {formatTimestamp(moment.timestamp || index * 30)}
                                </Badge>
                                <span className="text-gray-300">{moment.action || 'Key action'}</span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">{moment.impact || 'Positive impact'}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-gray-300 mb-3">
                        Player {playerId} was not detected in this video
                      </p>
                      <Button
                        variant="outline"
                        className="border-bright-pink text-bright-pink hover:bg-bright-pink hover:text-white"
                      >
                        View Other Videos
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">No Tagged Players</h3>
                <p className="text-gray-400">No players were tagged for analysis in this video.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-bright-pink" />
                Context & Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {analysisData?.context_reasoning || analysisData?.analysis || 'Detailed context and reasoning for the analysis results.'}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-bright-pink" />
                Technical Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed">
                {analysisData?.explanations || analysisData?.analysis || 'Technical breakdown of the analysis methodology and findings.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-bright-pink" />
                AI Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData?.recommendations && analysisData.recommendations.length > 0 ? (
                  analysisData.recommendations.map((recommendation: string, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg">
                      <div className="w-6 h-6 bg-bright-pink rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {index + 1}
                      </div>
                      <p className="text-gray-300">{recommendation}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">No specific recommendations generated for this video.</p>
                  </div>
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
