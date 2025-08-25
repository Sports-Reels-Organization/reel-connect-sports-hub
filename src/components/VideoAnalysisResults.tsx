
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Brain,
  Users,
  TrendingUp,
  Clock,
  Target,
  AlertCircle,
  CheckCircle,
  Eye,
  BarChart3,
  FileText,
  Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface VideoAnalysisResultsProps {
  videoId: string;
  videoType: 'match' | 'training' | 'interview' | 'highlight';
  teamId: string;
  analysisData?: any;
}

const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({
  videoId,
  videoType,
  teamId,
  analysisData: initialAnalysisData
}) => {
  const [analysisData, setAnalysisData] = useState(initialAnalysisData);
  const [loading, setLoading] = useState(!initialAnalysisData);

  useEffect(() => {
    if (!initialAnalysisData) {
      fetchAnalysisData();
    }
  }, [videoId, initialAnalysisData]);

  const fetchAnalysisData = async () => {
    try {
      const { data, error } = await supabase
        .from('enhanced_video_analysis')
        .select('*')
        .eq('video_id', videoId)
        .single();

      if (error) throw error;
      setAnalysisData(data);
    } catch (error) {
      console.error('Error fetching analysis data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'goal': return '⚽';
      case 'card': return '🟨';
      case 'substitution': return '🔄';
      case 'tactical': return '📋';
      default: return '⭐';
    }
  };

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case 'high': return 'text-red-400 border-red-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'low': return 'text-blue-400 border-blue-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  if (loading) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6 text-center">
          <div className="animate-spin w-6 h-6 border-2 border-bright-pink border-t-transparent rounded-full mx-auto mb-4" />
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
          <p className="text-gray-400">No analysis data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <Brain className="w-8 h-8 text-bright-pink" />
            AI Analysis Results
          </CardTitle>
          <div className="flex items-center gap-4 mt-2">
            <Badge className="bg-green-500/20 text-green-400 border-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Analysis Complete
            </Badge>
            <Badge variant="outline" className="text-bright-pink border-bright-pink">
              {videoType.charAt(0).toUpperCase() + videoType.slice(1)}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-bright-pink">
            Overview
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-bright-pink">
            Key Events
          </TabsTrigger>
          <TabsTrigger value="players" className="data-[state=active]:bg-bright-pink">
            Players
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-bright-pink">
            Insights
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-bright-pink">
            Recommendations
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Overview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5 text-bright-pink" />
                  Analysis Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 leading-relaxed">
                  {analysisData.overview}
                </p>
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
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Game Flow</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {analysisData.visual_summary?.gameFlow || 'No game flow data available'}
                  </p>
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-300">Pressure Analysis</span>
                  </div>
                  <p className="text-sm text-gray-400">
                    {analysisData.visual_summary?.pressureMap || 'No pressure analysis available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Context & Reasoning */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-bright-pink" />
                Context & Reasoning
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 leading-relaxed mb-4">
                {analysisData.context_reasoning}
              </p>
              
              <div className="bg-gray-700 p-4 rounded-lg">
                <h4 className="text-white font-medium mb-2">Detailed Explanations</h4>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {analysisData.explanations}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Key Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Key Events Timeline */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-bright-pink" />
                  Key Events Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-4">
                    {analysisData.key_events?.map((event: any, index: number) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-700 rounded-lg">
                        <div className="text-sm font-mono text-bright-pink bg-gray-800 px-2 py-1 rounded">
                          {formatTimestamp(event.timestamp)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-white font-medium">{event.event}</h4>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getImportanceColor(event.importance)}`}
                            >
                              {event.importance}
                            </Badge>
                          </div>
                          <p className="text-gray-300 text-sm">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Event Timeline */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-bright-pink" />
                  Event Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {analysisData.event_timeline?.map((event: any, index: number) => (
                      <div key={index} className="flex items-center gap-3 p-2 bg-gray-700 rounded">
                        <span className="text-lg">{getEventTypeIcon(event.type)}</span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-white text-sm font-medium">{event.event}</span>
                            <span className="text-bright-pink text-xs font-mono">
                              {formatTimestamp(event.timestamp)}
                            </span>
                          </div>
                          <p className="text-gray-400 text-xs">{event.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Momentum Shifts */}
          {analysisData.visual_summary?.momentumShifts && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-bright-pink" />
                  Momentum Shifts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {analysisData.visual_summary.momentumShifts.map((shift: any, index: number) => (
                    <div key={index} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white font-medium">{shift.shift}</span>
                        <span className="text-bright-pink text-sm font-mono">
                          {formatTimestamp(shift.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm">{shift.reason}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Players Tab */}
        <TabsContent value="players" className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {/* Tagged Players Analysis */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-bright-pink" />
                  Tagged Players Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {Object.entries(analysisData.tagged_player_analysis || {}).map(([playerId, analysis]: [string, any]) => (
                    <div key={playerId} className="p-4 bg-gray-700 rounded-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">Player {playerId}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            {analysis.present ? (
                              <Badge className="bg-green-500/20 text-green-400 border-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Present in Video
                              </Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-red-500">
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Not Found
                              </Badge>
                            )}
                          </div>
                        </div>
                        
                        {analysis.present && (
                          <div className="text-right">
                            <div className="text-2xl font-bold text-bright-pink">
                              {analysis.performanceRating}/100
                            </div>
                            <div className="text-xs text-gray-400">Performance</div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <div>
                          <h4 className="text-white font-medium mb-2">Involvement</h4>
                          <p className="text-gray-300 text-sm">{analysis.involvement}</p>
                        </div>

                        {analysis.present && analysis.keyMoments?.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-3">Key Moments</h4>
                            <div className="space-y-2">
                              {analysis.keyMoments.map((moment: any, index: number) => (
                                <div key={index} className="flex items-start gap-3 p-2 bg-gray-600 rounded">
                                  <span className="text-bright-pink text-xs font-mono bg-gray-800 px-2 py-1 rounded">
                                    {formatTimestamp(moment.timestamp)}
                                  </span>
                                  <div className="flex-1">
                                    <div className="text-white text-sm font-medium">{moment.action}</div>
                                    <div className="text-gray-300 text-xs">{moment.impact}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {analysis.recommendations?.length > 0 && (
                          <div>
                            <h4 className="text-white font-medium mb-2">Recommendations</h4>
                            <ul className="space-y-1">
                              {analysis.recommendations.map((rec: string, index: number) => (
                                <li key={index} className="text-gray-300 text-sm flex items-start gap-2">
                                  <span className="text-bright-pink">•</span>
                                  {rec}
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

            {/* Missing Players */}
            {analysisData.missing_players?.length > 0 && (
              <Card className="bg-gray-800 border-gray-700 border-yellow-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    Missing Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisData.missing_players.map((player: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <div>
                          <div className="text-white font-medium">{player.playerName}</div>
                          <div className="text-gray-400 text-sm">{player.suggestion}</div>
                        </div>
                        <Button variant="outline" size="sm" className="border-yellow-500 text-yellow-500">
                          <Eye className="w-3 h-3 mr-1" />
                          View Other Videos
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {/* Player Performance Radar */}
          {analysisData.player_performance_radar && Object.keys(analysisData.player_performance_radar).length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-bright-pink" />
                  Player Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(analysisData.player_performance_radar).map(([playerId, metrics]: [string, any]) => (
                    <div key={playerId} className="p-4 bg-gray-700 rounded-lg">
                      <h3 className="text-white font-semibold mb-4">Player {playerId}</h3>
                      <div className="space-y-3">
                        {Object.entries(metrics).map(([skill, value]: [string, any]) => (
                          <div key={skill}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-300 capitalize">{skill}</span>
                              <span className="text-bright-pink font-medium">{Math.round(value)}%</span>
                            </div>
                            <Progress value={value} className="h-2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-bright-pink" />
                Strategic Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analysisData.recommendations?.map((recommendation: string, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-4 bg-gray-700 rounded-lg">
                    <div className="w-6 h-6 bg-bright-pink rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <p className="text-gray-300 leading-relaxed">{recommendation}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoAnalysisResults;
