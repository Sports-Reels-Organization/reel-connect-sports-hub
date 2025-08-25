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
  Sparkles
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PDFReportService } from '@/services/pdfReportService';

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

  const pdfService = new PDFReportService();

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

      if (analysisError) throw analysisError;

      // Load video data
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError) throw videoError;

      setAnalysisData(analysis);
      setVideoData(video);
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
        videoType: videoData.video_type,
        analysisDate: new Date(analysisData.created_at).toLocaleDateString(),
        overview: analysisData.overview,
        keyEvents: analysisData.key_events,
        recommendations: analysisData.recommendations || [],
        taggedPlayerAnalysis: analysisData.tagged_player_analysis,
        eventTimeline: analysisData.event_timeline,
        visualSummary: analysisData.visual_summary,
        snapshotUrls
      };

      const pdfUrl = await pdfService.generateComprehensiveReport(
        reportData,
        videoId,
        teamId
      );

      // Download the PDF
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `${videoData.title}-analysis-report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Report Generated",
        description: "PDF report downloaded successfully!",
      });

    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate PDF report",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const navigateToPlayerVideos = (playerId: string) => {
    // This would navigate to a filtered view of videos for this player
    toast({
      title: "Navigation Feature",
      description: `Would navigate to videos for Player ${playerId}`,
    });
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

  if (!analysisData) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Analysis Available</h3>
          <p className="text-gray-400">Analysis data not found for this video.</p>
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
                AI Analysis Results
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Comprehensive {videoType} analysis with detailed insights
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
                  Download PDF Report
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 p-1">
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

        <TabsContent value="overview" className="space-y-4">
          {/* Analysis Status */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-white font-semibold text-lg">Analysis Complete</span>
                <Badge className="bg-bright-pink text-white">
                  {analysisData.tagged_player_present ? 'Tagged Players Found' : 'Standard Analysis'}
                </Badge>
              </div>
              
              <div className="text-gray-300 leading-relaxed">
                {analysisData.overview}
              </div>
            </CardContent>
          </Card>

          {/* Visual Summary */}
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

              {analysisData.visual_summary?.momentumShifts && (
                <div>
                  <h4 className="text-white font-medium mb-2">Key Momentum Shifts</h4>
                  <div className="space-y-2">
                    {analysisData.visual_summary.momentumShifts.slice(0, 3).map((shift: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 text-sm">
                        <Badge variant="outline" className="text-bright-pink border-bright-pink">
                          {formatTimestamp(shift.timestamp)}
                        </Badge>
                        <span className="text-gray-300">{shift.shift}</span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">{shift.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
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
                  {analysisData.key_events?.map((event: any, index: number) => (
                    <div key={index} className="flex items-start gap-4 p-4 bg-gray-700 rounded-lg">
                      <div className="text-center min-w-[60px]">
                        <Badge variant="outline" className="text-bright-pink border-bright-pink">
                          {formatTimestamp(event.timestamp)}
                        </Badge>
                        <div className={`mt-2 w-2 h-2 rounded-full mx-auto ${
                          event.importance === 'high' ? 'bg-red-500' :
                          event.importance === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-medium mb-1">{event.event}</h4>
                        <p className="text-gray-300 text-sm">{event.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="players" className="space-y-4">
          {Object.entries(analysisData.tagged_player_analysis || {}).map(([playerId, analysis]: [string, any]) => (
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
                          {analysis.performanceRating}
                        </div>
                        <div className="text-xs text-gray-400">Rating</div>
                      </div>
                      <div className="flex-1">
                        <Progress 
                          value={analysis.performanceRating} 
                          className="h-3"
                        />
                      </div>
                    </div>

                    <div>
                      <h4 className="text-white font-medium mb-2">Performance Analysis</h4>
                      <p className="text-gray-300 text-sm">{analysis.involvement}</p>
                    </div>

                    {analysis.keyMoments && analysis.keyMoments.length > 0 && (
                      <div>
                        <h4 className="text-white font-medium mb-2">Key Moments</h4>
                        <div className="space-y-2">
                          {analysis.keyMoments.map((moment: any, index: number) => (
                            <div key={index} className="flex items-center gap-3 text-sm">
                              <Badge variant="outline" className="text-bright-pink border-bright-pink">
                                {formatTimestamp(moment.timestamp)}
                              </Badge>
                              <span className="text-gray-300">{moment.action}</span>
                              <span className="text-gray-500">•</span>
                              <span className="text-gray-400">{moment.impact}</span>
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
                      onClick={() => navigateToPlayerVideos(playerId)}
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
          ))}

          {(!analysisData.tagged_player_analysis || Object.keys(analysisData.tagged_player_analysis).length === 0) && (
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
                {analysisData.context_reasoning}
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
                {analysisData.explanations}
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
                {analysisData.recommendations?.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg">
                    <div className="w-6 h-6 bg-bright-pink rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </div>
                    <p className="text-gray-300">{recommendation}</p>
                  </div>
                ))}
              </div>

              {(!analysisData.recommendations || analysisData.recommendations.length === 0) && (
                <div className="text-center py-8">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">No specific recommendations generated for this video.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoAnalysisResults;
