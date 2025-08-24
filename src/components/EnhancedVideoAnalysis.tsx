
import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  Brain, 
  ArrowLeft, 
  Clock, 
  Users, 
  BarChart3,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { AIVideoAnalysisService } from '@/services/aiVideoAnalysisService';
import VideoAnalysisResults from './VideoAnalysisResults';

interface EnhancedVideoAnalysisProps {
  videoId: string;
  videoUrl: string;
  videoTitle: string;
  videoMetadata: {
    playerTags: string[];
    matchDetails?: {
      opposingTeam: string;
      matchDate: string;
      finalScore: string;
    };
    duration: number;
    videoDescription?: string;
    videoType?: 'match' | 'interview' | 'training' | 'highlight';
  };
  onClose: () => void;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoId,
  videoUrl,
  videoTitle,
  videoMetadata,
  onClose
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState<'idle' | 'analyzing' | 'completed' | 'failed'>('idle');
  const [analysisStatusText, setAnalysisStatusText] = useState('');
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('video');
  
  const videoType = videoMetadata.videoType || 'match';

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('play', () => setIsPlaying(true));
    video.addEventListener('pause', () => setIsPlaying(false));

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('play', () => setIsPlaying(true));
      video.removeEventListener('pause', () => setIsPlaying(false));
    };
  }, []);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
  };

  const formatTime = (timeInSeconds: number) => {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const newTime = (clickX / rect.width) * duration;
    
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const startAIAnalysis = async () => {
    try {
      setAnalysisStatus('analyzing');
      setAnalysisProgress(0);
      setAnalysisStatusText('Initializing AI analysis...');

      const analysisService = new AIVideoAnalysisService(videoId, videoType);
      
      // Set up progress callback
      analysisService.onProgress((progress, status) => {
        setAnalysisProgress(progress);
        setAnalysisStatusText(status);
      });

      // Start analysis
      const result = await analysisService.analyzeVideo(videoUrl, {
        videoTitle,
        videoDescription: videoMetadata.videoDescription,
        playerTags: videoMetadata.playerTags,
        matchDetails: videoMetadata.matchDetails,
        duration: videoMetadata.duration,
        videoType
      });

      setAnalysisResults(result.analysisData);
      setAnalysisStatus('completed');
      setActiveTab('analysis');
      
      toast({
        title: "Analysis Complete",
        description: `${videoType.charAt(0).toUpperCase() + videoType.slice(1)} analysis completed successfully!`,
      });

    } catch (error) {
      console.error('AI analysis failed:', error);
      setAnalysisStatus('failed');
      setAnalysisStatusText('Analysis failed. Please try again.');
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "An error occurred during analysis",
        variant: "destructive",
      });
    }
  };

  const retryAnalysis = () => {
    setAnalysisStatus('idle');
    setAnalysisProgress(0);
    setAnalysisStatusText('');
    setAnalysisResults(null);
  };

  return (
    <div className="min-h-screen bg-[#111111] text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={onClose}
              className="text-white hover:text-bright-pink"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Videos
            </Button>
            
            <div>
              <h1 className="text-2xl font-bold text-white font-polysans">{videoTitle}</h1>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline">
                  {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video
                </Badge>
                {videoMetadata.matchDetails && (
                  <Badge variant="secondary">
                    vs {videoMetadata.matchDetails.opposingTeam}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {analysisStatus === 'idle' && (
            <Button
              onClick={startAIAnalysis}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              <Brain className="w-4 h-4 mr-2" />
              Start AI Analysis
            </Button>
          )}

          {analysisStatus === 'failed' && (
            <Button
              onClick={retryAnalysis}
              variant="outline"
              className="border-red-500 text-red-500 hover:bg-red-500/10"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Analysis
            </Button>
          )}
        </div>

        {/* Analysis Progress */}
        {analysisStatus === 'analyzing' && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Loader2 className="w-5 h-5 text-bright-pink animate-spin" />
                <span className="font-medium text-white">AI Analysis in Progress</span>
              </div>
              
              <Progress value={analysisProgress} className="h-3 mb-2" />
              
              <div className="text-sm text-gray-400">
                {analysisStatusText} ({analysisProgress.toFixed(0)}%)
              </div>
            </CardContent>
          </Card>
        )}

        {/* Analysis Status */}
        {analysisStatus === 'completed' && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span className="font-medium text-white">
                  AI Analysis Complete - {videoType.charAt(0).toUpperCase() + videoType.slice(1)} insights generated
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {analysisStatus === 'failed' && (
          <Card className="bg-gray-800 border-gray-700 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="font-medium text-white">Analysis Failed</span>
                <span className="text-sm text-gray-400">{analysisStatusText}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 bg-gray-800 mb-6">
            <TabsTrigger value="video" className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              Video Player
            </TabsTrigger>
            <TabsTrigger 
              value="analysis" 
              className="flex items-center gap-2"
              disabled={!analysisResults}
            >
              <Brain className="w-4 h-4" />
              AI Analysis Results
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="space-y-6">
            {/* Video Player */}
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-0">
                <div className="relative bg-black rounded-t-lg overflow-hidden">
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    className="w-full h-auto max-h-[70vh] object-contain"
                    poster={`${videoUrl}?thumbnail=true`}
                  />
                  
                  {/* Video Controls Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    {/* Progress Bar */}
                    <div 
                      className="w-full h-2 bg-gray-600 rounded-full cursor-pointer mb-3"
                      onClick={handleProgressClick}
                    >
                      <div 
                        className="h-full bg-bright-pink rounded-full transition-all duration-200"
                        style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                      />
                    </div>
                    
                    {/* Control Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={togglePlayPause}
                          className="text-white hover:text-bright-pink"
                        >
                          {isPlaying ? (
                            <Pause className="w-5 h-5" />
                          ) : (
                            <Play className="w-5 h-5" />
                          )}
                        </Button>
                        
                        <div className="text-white text-sm flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatTime(currentTime)} / {formatTime(duration)}
                        </div>
                      </div>
                      
                      {videoMetadata.playerTags.length > 0 && (
                        <div className="flex items-center gap-1 text-white text-sm">
                          <Users className="w-4 h-4" />
                          {videoMetadata.playerTags.length} tagged
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Video Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Video Type</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Badge variant="default" className="bg-bright-pink">
                    {videoType.charAt(0).toUpperCase() + videoType.slice(1)}
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Duration</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl font-bold text-white">
                    {formatTime(videoMetadata.duration)}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-gray-400">Tagged Players</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="text-xl font-bold text-white">
                    {videoMetadata.playerTags.length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Video Description */}
            {videoMetadata.videoDescription && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle>Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{videoMetadata.videoDescription}</p>
                </CardContent>
              </Card>
            )}

            {/* Tagged Players Info */}
            {videoMetadata.playerTags.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-bright-pink" />
                    Tagged Players
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {videoMetadata.playerTags.map((playerId, index) => (
                      <Badge key={index} variant="secondary">
                        Player {index + 1}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analysis">
            {analysisResults ? (
              <VideoAnalysisResults
                videoType={videoType}
                analysisData={analysisResults}
                videoTitle={videoTitle}
              />
            ) : (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="pt-6 text-center">
                  <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    No Analysis Results Yet
                  </h3>
                  <p className="text-gray-400 mb-4">
                    Click "Start AI Analysis" to generate {videoType} insights for this video.
                  </p>
                  {analysisStatus === 'idle' && (
                    <Button
                      onClick={startAIAnalysis}
                      className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                    >
                      <Brain className="w-4 h-4 mr-2" />
                      Start AI Analysis
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedVideoAnalysis;
