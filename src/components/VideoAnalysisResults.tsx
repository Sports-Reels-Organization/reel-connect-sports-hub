
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Play, Pause, Volume2, VolumeX, Maximize, RotateCcw,
  Brain, Eye, Target, Users, TrendingUp, Clock,
  BarChart3, Zap, AlertCircle, CheckCircle, Download, Share2
} from 'lucide-react';
import { VideoAnalysisService, AIAnalysisEvent } from '@/services/videoAnalysisService';
import { supabase } from '@/integrations/supabase/client';

interface VideoAnalysisResultsProps {
  videoId: string;
  videoType?: string;
  teamId?: string;
}

const VideoAnalysisResults: React.FC<VideoAnalysisResultsProps> = ({ 
  videoId, 
  videoType, 
  teamId 
}) => {
  const { toast } = useToast();
  const [analysisData, setAnalysisData] = useState<AIAnalysisEvent[]>([]);
  const [videoData, setVideoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalAnalysisPoints: 0,
    averageConfidence: 0,
    analysisPhases: [] as string[],
    keyInsights: 0
  });

  // Video player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);

  useEffect(() => {
    loadVideoAndAnalysis();
  }, [videoId]);

  const loadVideoAndAnalysis = async () => {
    try {
      setLoading(true);

      // Load video data
      const { data: video, error: videoError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', videoId)
        .single();

      if (videoError) throw videoError;
      setVideoData(video);

      // Load analysis data
      const analysisService = new VideoAnalysisService(videoId);
      const analysis = await analysisService.getAnalysisForVideo();
      setAnalysisData(analysis);

      // Load analysis statistics
      const statistics = await analysisService.getAnalysisStats();
      setStats(statistics);

    } catch (error) {
      console.error('Error loading video analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load video analysis results',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoRef = (video: HTMLVideoElement | null) => {
    if (video) {
      setVideoElement(video);
      video.addEventListener('timeupdate', () => {
        setCurrentTime(video.currentTime);
      });
      video.addEventListener('loadedmetadata', () => {
        setDuration(video.duration);
      });
    }
  };

  const togglePlayPause = () => {
    if (videoElement) {
      if (isPlaying) {
        videoElement.pause();
      } else {
        videoElement.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoElement) {
      videoElement.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (videoElement) {
      const time = parseFloat(event.target.value);
      videoElement.currentTime = time;
      setCurrentTime(time);
    }
  };

  const jumpToAnalysisPoint = (timestamp: number) => {
    if (videoElement) {
      videoElement.currentTime = timestamp;
      setCurrentTime(timestamp);
      if (!isPlaying) {
        videoElement.play();
        setIsPlaying(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalyzeWithAI = () => {
    toast({
      title: 'AI Analysis',
      description: 'This feature will be available soon!',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bright-pink"></div>
      </div>
    );
  }

  if (!videoData) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-gray-500">Video not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">{videoData.title || 'Video Analysis Results'}</h1>
          <p className="text-gray-400 mt-2">AI-powered analysis and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            {stats.totalAnalysisPoints} Analysis Points
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Player Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="w-5 h-5" />
                Video Player
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {videoData.video_url && (
                <div className="space-y-3">
                  <video
                    ref={handleVideoRef}
                    src={videoData.video_url}
                    className="w-full rounded-lg bg-black"
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    preload="metadata"
                  />
                  
                  {/* Video Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePlayPause}
                        className="flex items-center gap-2"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        {isPlaying ? 'Pause' : 'Play'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={toggleMute}
                        className="flex items-center gap-2"
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </Button>
                      
                      <span className="text-sm text-gray-500">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <input
                      type="range"
                      min="0"
                      max={duration || 0}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              )}

              {/* AI Analysis Button */}
              <div className="pt-4 border-t">
                <Button
                  onClick={handleAnalyzeWithAI}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  <Brain className="w-5 h-5 mr-2" />
                  Analyze Video with AI
                </Button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Advanced AI analysis powered by machine learning
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Analysis Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {analysisData.length > 0 ? (
                  analysisData.map((analysis, index) => (
                    <div
                      key={index}
                      className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => jumpToAnalysisPoint(analysis.timestamp)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-blue-600">
                          {formatTime(analysis.timestamp)}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(analysis.confidenceScore * 100)}% confidence
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700">{analysis.description}</p>
                      {analysis.taggedPlayers && analysis.taggedPlayers.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {analysis.taggedPlayers.map((player, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {player}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No analysis data available</p>
                    <p className="text-xs">Upload and analyze a video to see insights here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Analysis Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Analysis Points:</span>
                  <span className="font-medium">{stats.totalAnalysisPoints}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Average Confidence:</span>
                  <span className="font-medium">{Math.round(stats.averageConfidence * 100)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Key Insights:</span>
                  <span className="font-medium">{stats.keyInsights}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Analysis Phases:</span>
                  <span className="font-medium">{stats.analysisPhases.length}</span>
                </div>
              </div>

              {stats.averageConfidence > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Overall Quality</span>
                    <span>{Math.round(stats.averageConfidence * 100)}%</span>
                  </div>
                  <Progress value={stats.averageConfidence * 100} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Video Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={videoData.ai_analysis_status === 'completed' ? 'default' : 'secondary'}>
                    {videoData.ai_analysis_status || 'pending'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Video Type:</span>
                  <span className="capitalize">{videoData.video_type || videoType || 'unknown'}</span>
                </div>
                {videoData.tagged_players && videoData.tagged_players.length > 0 && (
                  <div>
                    <span className="text-sm text-gray-600">Tagged Players:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {videoData.tagged_players.map((player: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {player}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start">
                <Download className="w-4 h-4 mr-2" />
                Export Analysis Report
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Share2 className="w-4 h-4 mr-2" />
                Share Analysis
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <RotateCcw className="w-4 h-4 mr-2" />
                Re-analyze Video
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VideoAnalysisResults;
