import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, 
  BarChart3, Brain, Target, Users, Clock, Star,
  TrendingUp, Eye, Zap, CheckCircle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { analyzeVideo, VideoAnalysis } from '@/services/geminiService';
import { VideoAnalysisService, AIAnalysisEvent } from '@/services/videoAnalysisService';

interface EnhancedVideoAnalysisProps {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  videoMetadata?: {
    playerTags: string[];
    matchDetails: any;
    duration: number;
    videoDescription?: string;
  };
  onClose?: () => void;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoId,
  videoUrl,
  videoTitle,
  videoMetadata,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [analysisData, setAnalysisData] = useState<(VideoAnalysis | AIAnalysisEvent)[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VideoAnalysis | AIAnalysisEvent | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisService, setAnalysisService] = useState<VideoAnalysisService | null>(null);

  useEffect(() => {
    if (videoId) {
      const service = new VideoAnalysisService(videoId);
      setAnalysisService(service);
      loadExistingAnalysis();
    }
  }, [videoId]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
    };
  }, []);

  const loadExistingAnalysis = async () => {
    if (!analysisService) return;

    try {
      const existingAnalysis = await analysisService.getAnalysisForVideo();
      if (existingAnalysis.length > 0) {
        setAnalysisData(existingAnalysis);
      }
    } catch (error) {
      console.error('Error loading existing analysis:', error);
    }
  };

  const startAIAnalysis = async () => {
    if (!videoMetadata || !analysisService) return;

    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      // Start real-time analysis service
      if (videoRef.current) {
        analysisService.startRealTimeAnalysis(videoRef.current, videoMetadata);
      }

      // Use Gemini for comprehensive analysis
      const geminiAnalysis = await analyzeVideo(videoMetadata);
      
      // Update progress
      setAnalysisProgress(50);

      // Combine with real-time analysis
      const existingAnalysis = await analysisService.getAnalysisForVideo();
      const combinedAnalysis = [...geminiAnalysis, ...existingAnalysis]
        .sort((a, b) => a.timestamp - b.timestamp);

      setAnalysisData(combinedAnalysis);
      setAnalysisProgress(100);

      // Update video status
      await supabase
        .from('videos')
        .update({ ai_analysis_status: 'completed' })
        .eq('id', videoId);

    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAnalysisAtTime = (time: number) => {
    return analysisData.find(analysis => 
      Math.abs(analysis.timestamp - time) < 10
    );
  };

  const getCurrentAnalysis = () => {
    return getAnalysisAtTime(currentTime);
  };

  const getPerformanceStats = () => {
    if (!analysisData.length) return null;

    // Handle both VideoAnalysis and AIAnalysisEvent types
    const ratings = analysisData.map(item => {
      if ('performanceRating' in item) {
        return item.performanceRating;
      } else if ('confidenceScore' in item) {
        return item.confidenceScore * 10; // Convert confidence to rating scale
      }
      return 7; // Default rating
    });

    const avgRating = ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length;
    
    const totalEvents = analysisData.reduce((sum, item) => {
      if ('playerActions' in item && 'matchEvents' in item) {
        return sum + item.playerActions.length + item.matchEvents.length;
      }
      return sum + 1; // Count each AIAnalysisEvent as one event
    }, 0);
    
    const keyMoments = analysisData.filter(item => {
      if ('performanceRating' in item) {
        return item.performanceRating > 8;
      } else if ('confidenceScore' in item) {
        return item.confidenceScore > 0.9;
      }
      return false;
    }).length;

    return { avgRating, totalEvents, keyMoments };
  };

  const stats = getPerformanceStats();
  const currentAnalysis = getCurrentAnalysis();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white font-polysans">Enhanced Video Analysis</h2>
          <p className="text-gray-400 mt-1">{videoTitle}</p>
        </div>
        
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close Analysis
          </Button>
        )}
      </div>

      {/* Video Player and Controls - keep existing code */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="p-0">
              <div className="relative">
                <video
                  ref={videoRef}
                  src={videoUrl}
                  className="w-full h-auto max-h-96 bg-black"
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />
                
                {/* Video Controls - keep existing implementation */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                  <div className="space-y-2">
                    {/* Progress Bar */}
                    <div className="relative">
                      <Progress 
                        value={duration ? (currentTime / duration) * 100 : 0} 
                        className="h-1 cursor-pointer"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();
                          const clickX = e.clientX - rect.left;
                          const clickPercentage = clickX / rect.width;
                          seekTo(duration * clickPercentage);
                        }}
                      />
                      
                      {/* Analysis Markers */}
                      {analysisData.map((analysis, index) => (
                        <div
                          key={index}
                          className="absolute top-0 w-1 h-1 bg-rosegold transform -translate-x-1/2 cursor-pointer"
                          style={{ left: `${(analysis.timestamp / duration) * 100}%` }}
                          onClick={() => seekTo(analysis.timestamp)}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => seekTo(Math.max(0, currentTime - 10))}
                          className="text-white hover:bg-white/20"
                        >
                          <SkipBack className="w-4 h-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlayPause}
                          className="text-white hover:bg-white/20"
                        >
                          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                          className="text-white hover:bg-white/20"
                        >
                          <SkipForward className="w-4 h-4" />
                        </Button>
                        
                        <div className="flex items-center gap-2">
                          <Volume2 className="w-4 h-4 text-white" />
                          <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.1"
                            value={volume}
                            onChange={(e) => {
                              const newVolume = parseFloat(e.target.value);
                              setVolume(newVolume);
                              if (videoRef.current) {
                                videoRef.current.volume = newVolume;
                              }
                            }}
                            className="w-16"
                          />
                        </div>
                      </div>

                      <div className="text-white text-sm">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Controls */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    onClick={startAIAnalysis}
                    disabled={isAnalyzing}
                    className="bg-rosegold hover:bg-rosegold/90 text-black"
                  >
                    {isAnalyzing ? (
                      <>
                        <Brain className="w-4 h-4 mr-2 animate-pulse" />
                        Analyzing with Gemini...
                      </>
                    ) : (
                      <>
                        <Brain className="w-4 h-4 mr-2" />
                        Start AI Analysis
                      </>
                    )}
                  </Button>

                  {stats && (
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        {stats.avgRating.toFixed(1)}/10
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-blue-500" />
                        {stats.totalEvents} events
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4 text-green-500" />
                        {stats.keyMoments} key moments
                      </div>
                    </div>
                  )}
                </div>

                {analysisData.length > 0 && (
                  <Badge variant="secondary" className="bg-green-900 text-green-300">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Analysis Complete
                  </Badge>
                )}
              </div>

              {isAnalyzing && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-400">Analyzing with Gemini 2.0 Pro...</span>
                    <span className="text-gray-400">{analysisProgress}%</span>
                  </div>
                  <Progress value={analysisProgress} className="h-2" />
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Analysis Panel - keep existing structure but handle mixed types */}
        <div className="space-y-4">
          {currentAnalysis && (
            <Card className="bg-gray-800 border-rosegold/20">
              <CardHeader>
                <CardTitle className="text-rosegold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Current Analysis ({formatTime(currentAnalysis.timestamp)})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Performance Rating</span>
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-white font-bold">
                      {'performanceRating' in currentAnalysis 
                        ? currentAnalysis.performanceRating.toFixed(1)
                        : (currentAnalysis.confidenceScore * 10).toFixed(1)
                      }/10
                    </span>
                  </div>
                </div>

                <div>
                  <h4 className="text-white font-semibold mb-2">Analysis</h4>
                  <div className="space-y-1">
                    {'playerActions' in currentAnalysis ? (
                      currentAnalysis.playerActions.map((action, index) => (
                        <p key={index} className="text-gray-300 text-sm">• {action}</p>
                      ))
                    ) : (
                      <p className="text-gray-300 text-sm">• {currentAnalysis.description}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analysis Timeline */}
          {analysisData.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Analysis Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-96 overflow-y-auto">
                <div className="space-y-3">
                  {analysisData.map((analysis, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedAnalysis === analysis
                          ? 'border-rosegold bg-rosegold/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                      onClick={() => {
                        setSelectedAnalysis(analysis);
                        seekTo(analysis.timestamp);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-rosegold font-medium">
                          {formatTime(analysis.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500" />
                          <span className="text-white text-sm">
                            {'performanceRating' in analysis 
                              ? analysis.performanceRating.toFixed(1)
                              : (analysis.confidenceScore * 10).toFixed(1)
                            }
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {'playerActions' in analysis && analysis.playerActions[0]
                          ? analysis.playerActions[0]
                          : 'description' in analysis 
                          ? analysis.description
                          : 'Analysis point'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Detailed Analysis Tabs */}
      {analysisData.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4 bg-gray-700">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="performance">Performance</TabsTrigger>
                <TabsTrigger value="tactical">Tactical</TabsTrigger>
                <TabsTrigger value="events">Match Events</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="mt-6 space-y-4">
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Average Rating</p>
                          <p className="text-2xl font-bold text-white">
                            {stats.avgRating.toFixed(1)}/10
                          </p>
                        </div>
                        <Star className="w-8 h-8 text-yellow-500" />
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Total Events</p>
                          <p className="text-2xl font-bold text-white">{stats.totalEvents}</p>
                        </div>
                        <Eye className="w-8 h-8 text-blue-500" />
                      </div>
                    </div>
                    
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-gray-400 text-sm">Key Moments</p>
                          <p className="text-2xl font-bold text-white">{stats.keyMoments}</p>
                        </div>
                        <Target className="w-8 h-8 text-green-500" />
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="performance" className="mt-6">
                <div className="space-y-4">
                  {analysisData.map((analysis, index) => (
                    <div key={index} className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-rosegold font-medium">
                          {formatTime(analysis.timestamp)}
                        </span>
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500" />
                          <span className="text-white">{analysis.performanceRating.toFixed(1)}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        {analysis.technicalAnalysis.map((tech, i) => (
                          <p key={i} className="text-gray-300 text-sm">• {tech}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="tactical" className="mt-6">
                <div className="space-y-4">
                  {analysisData.map((analysis, index) => (
                    <div key={index} className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="w-4 h-4 text-blue-500" />
                        <span className="text-blue-400 font-medium">
                          {formatTime(analysis.timestamp)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {analysis.tacticalInsights.map((insight, i) => (
                          <p key={i} className="text-gray-300 text-sm">• {insight}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="events" className="mt-6">
                <div className="space-y-4">
                  {analysisData.map((analysis, index) => (
                    <div key={index} className="bg-gray-900 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-green-500" />
                        <span className="text-green-400 font-medium">
                          {formatTime(analysis.timestamp)}
                        </span>
                      </div>
                      
                      <div className="space-y-2">
                        {analysis.matchEvents.map((event, i) => (
                          <p key={i} className="text-gray-300 text-sm">• {event}</p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVideoAnalysis;
