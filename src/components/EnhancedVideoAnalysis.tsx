
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, Pause, RotateCcw, FastForward, 
  Brain, TrendingUp, Target, Activity,
  ArrowLeft, Download, Share, Zap,
  Clock, User, MapPin, Trophy
} from 'lucide-react';
import { analyzeVideoWithGemini } from '@/services/videoAnalysisService';

interface VideoAnalysis {
  timestamp: number;
  event: string;
  player: string;
  description: string;
  confidence: number;
  category: 'skill' | 'tactical' | 'physical' | 'mental';
  playerActions?: string[];
  matchEvents?: string[];
  contextualMetrics?: Record<string, any>;
  technicalAnalysis?: Record<string, any>;
  overallAssessment?: string;
  keyMoments?: Array<{ time: number; description: string; }>;
}

interface VideoMetadata {
  playerTags: string[];
  matchDetails: {
    homeTeam?: string;
    awayTeam?: string;
    opposingTeam?: string;
    matchDate?: string;
    league?: string;
    finalScore?: string;
  };
  duration: number;
  videoDescription?: string;
}

interface EnhancedVideoAnalysisProps {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  videoMetadata: VideoMetadata;
  onClose: () => void;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoId,
  videoUrl,
  videoTitle,
  videoMetadata,
  onClose
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [videoAnalysis, setVideoAnalysis] = useState<VideoAnalysis[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<VideoAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  const togglePlay = useCallback(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const startAIAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    
    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);

      const analysis = await analyzeVideoWithGemini(videoUrl, {
        duration: videoMetadata.duration,
        playerTags: videoMetadata.playerTags,
        matchContext: videoMetadata.matchDetails
      });

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      // Transform the analysis result to match our VideoAnalysis interface
      const processedAnalysis: VideoAnalysis[] = analysis.events?.map(event => ({
        timestamp: event.timestamp,
        event: event.event,
        player: event.player || 'Unknown',
        description: event.description,
        confidence: event.confidence,
        category: event.category as 'skill' | 'tactical' | 'physical' | 'mental',
        playerActions: analysis.playerActions || [],
        matchEvents: analysis.matchEvents || [],
        contextualMetrics: analysis.contextualMetrics || {},
        technicalAnalysis: analysis.technicalAnalysis || {},
        overallAssessment: analysis.overallAssessment,
        keyMoments: analysis.keyMoments || []
      })) || [];

      setVideoAnalysis(processedAnalysis);

      toast({
        title: "Analysis Complete",
        description: `Found ${processedAnalysis.length} key moments in the video`,
      });

    } catch (error) {
      console.error('Analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to analyze video. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => setAnalysisProgress(0), 2000);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'skill': return <Target className="w-4 h-4" />;
      case 'tactical': return <Brain className="w-4 h-4" />;
      case 'physical': return <Activity className="w-4 h-4" />;
      case 'mental': return <Zap className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'skill': return 'bg-blue-500';
      case 'tactical': return 'bg-purple-500';
      case 'physical': return 'bg-green-500';
      case 'mental': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-700 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold font-polysans">{videoTitle}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(videoMetadata.duration)}
                </span>
                {videoMetadata.matchDetails.opposingTeam && (
                  <span className="flex items-center gap-1">
                    <Trophy className="w-3 h-3" />
                    vs {videoMetadata.matchDetails.opposingTeam}
                  </span>
                )}
                {videoMetadata.playerTags.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {videoMetadata.playerTags.length} player{videoMetadata.playerTags.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Video Player */}
        <div className="flex-1 p-6">
          <div className="relative bg-black rounded-lg overflow-hidden mb-4">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full h-[400px] object-contain"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="mb-2">
                <Progress
                  value={(currentTime / duration) * 100}
                  className="w-full cursor-pointer"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const percent = (e.clientX - rect.left) / rect.width;
                    seekTo(duration * percent);
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekTo(Math.max(0, currentTime - 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => seekTo(Math.min(duration, currentTime + 10))}
                    className="text-white hover:bg-white/20"
                  >
                    <FastForward className="w-4 h-4" />
                  </Button>
                </div>
                
                <span className="text-sm text-white">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
            </div>
          </div>

          {/* AI Analysis Button */}
          <div className="text-center mb-6">
            {!isAnalyzing && videoAnalysis.length === 0 && (
              <Button
                onClick={startAIAnalysis}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white px-8 py-3"
                size="lg"
              >
                <Brain className="w-5 h-5 mr-2" />
                Start AI Analysis
              </Button>
            )}

            {isAnalyzing && (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-2 text-bright-pink">
                  <Brain className="w-5 h-5 animate-pulse" />
                  <span>Analyzing video...</span>
                </div>
                <Progress value={analysisProgress} className="w-full max-w-md mx-auto" />
                <p className="text-sm text-gray-400">
                  Processing video content and identifying key moments
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Analysis Panel */}
        <div className="w-96 border-l border-gray-700 bg-gray-800">
          {videoAnalysis.length > 0 ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <TabsList className="grid w-full grid-cols-3 bg-gray-700 m-4 mb-0">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="moments">Moments</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="flex-1 p-4 m-0">
                <div className="space-y-4">
                  <Card className="bg-gray-700 border-gray-600">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        Analysis Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="text-center p-3 bg-gray-600 rounded">
                          <div className="text-2xl font-bold text-bright-pink">
                            {videoAnalysis.length}
                          </div>
                          <div className="text-xs text-gray-300">Key Moments</div>
                        </div>
                        <div className="text-center p-3 bg-gray-600 rounded">
                          <div className="text-2xl font-bold text-green-400">
                            {Math.round(videoAnalysis.reduce((acc, item) => acc + item.confidence, 0) / videoAnalysis.length)}%
                          </div>
                          <div className="text-xs text-gray-300">Avg Confidence</div>
                        </div>
                      </div>

                      {/* Category Distribution */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Categories</h4>
                        {['skill', 'tactical', 'physical', 'mental'].map(category => {
                          const count = videoAnalysis.filter(item => item.category === category).length;
                          const percentage = (count / videoAnalysis.length) * 100;
                          
                          return (
                            <div key={category} className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${getCategoryColor(category)}`}></div>
                              <span className="text-xs capitalize flex-1">{category}</span>
                              <span className="text-xs text-gray-400">{count}</span>
                              <div className="w-16 bg-gray-600 rounded-full h-1.5">
                                <div 
                                  className={`h-full rounded-full ${getCategoryColor(category)}`}
                                  style={{ width: `${percentage}%` }}
                                ></div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Overall Assessment */}
                  {videoAnalysis[0]?.overallAssessment && (
                    <Card className="bg-gray-700 border-gray-600">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm">Overall Assessment</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-300 leading-relaxed">
                          {videoAnalysis[0].overallAssessment}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="moments" className="flex-1 p-4 m-0">
                <ScrollArea className="h-full">
                  <div className="space-y-3">
                    {videoAnalysis.map((analysis, index) => (
                      <Card 
                        key={index}
                        className={`cursor-pointer transition-colors ${
                          selectedAnalysis === analysis 
                            ? 'bg-bright-pink/20 border-bright-pink' 
                            : 'bg-gray-700 border-gray-600 hover:border-gray-500'
                        }`}
                        onClick={() => {
                          setSelectedAnalysis(analysis);
                          seekTo(analysis.timestamp);
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between mb-2">
                            <Badge className={`${getCategoryColor(analysis.category)} text-white text-xs`}>
                              {getCategoryIcon(analysis.category)}
                              <span className="ml-1 capitalize">{analysis.category}</span>
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {formatTime(analysis.timestamp)}
                            </span>
                          </div>
                          
                          <h4 className="text-sm font-medium text-white mb-1">
                            {analysis.event}
                          </h4>
                          
                          <p className="text-xs text-gray-300 line-clamp-2 mb-2">
                            {analysis.description}
                          </p>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">
                              {analysis.player}
                            </span>
                            <div className="flex items-center gap-1">
                              <div className="w-12 bg-gray-600 rounded-full h-1">
                                <div 
                                  className="h-full bg-green-400 rounded-full"
                                  style={{ width: `${analysis.confidence}%` }}
                                ></div>
                              </div>
                              <span className="text-xs text-gray-400">
                                {analysis.confidence}%
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="insights" className="flex-1 p-4 m-0">
                <ScrollArea className="h-full">
                  <div className="space-y-4">
                    {/* Key Moments */}
                    {videoAnalysis[0]?.keyMoments && videoAnalysis[0].keyMoments.length > 0 && (
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Key Moments</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {videoAnalysis[0].keyMoments.map((moment, index) => (
                            <div 
                              key={index}
                              className="flex items-center gap-3 p-2 bg-gray-600 rounded cursor-pointer hover:bg-gray-500"
                              onClick={() => seekTo(moment.time)}
                            >
                              <span className="text-xs text-bright-pink font-mono">
                                {formatTime(moment.time)}
                              </span>
                              <span className="text-xs text-gray-300 flex-1">
                                {moment.description}
                              </span>
                            </div>
                          ))}
                        </CardContent>
                      </Card>
                    )}

                    {/* Technical Analysis */}
                    {videoAnalysis[0]?.technicalAnalysis && (
                      <Card className="bg-gray-700 border-gray-600">
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Technical Analysis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {Object.entries(videoAnalysis[0].technicalAnalysis).map(([key, value]) => (
                              <div key={key} className="flex justify-between">
                                <span className="text-xs text-gray-400 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                                <span className="text-xs text-white">
                                  {typeof value === 'number' ? value.toFixed(1) : String(value)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="h-full flex items-center justify-center p-6">
              <div className="text-center">
                <Brain className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <h3 className="text-lg font-semibold text-white mb-2">
                  AI Analysis Ready
                </h3>
                <p className="text-sm text-gray-400">
                  Click "Start AI Analysis" to analyze this video and identify key moments, player actions, and tactical insights.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoAnalysis;
