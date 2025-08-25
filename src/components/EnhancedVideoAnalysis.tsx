
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
  RotateCcw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { EnhancedAIAnalysisService } from '@/services/enhancedAIAnalysisService';
import VideoAnalysisResults from './VideoAnalysisResults';

interface EnhancedVideoAnalysisProps {
  videoFile: File;
  videoType: 'match' | 'training' | 'interview' | 'highlight';
  taggedPlayers?: string[];
  videoTitle: string;
  onAnalysisComplete: (analysisData: any) => void;
  teamId: string;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoFile,
  videoType,
  taggedPlayers = [],
  videoTitle,
  onAnalysisComplete,
  teamId
}) => {
  const { toast } = useToast();
  const [analysisStage, setAnalysisStage] = useState<'initializing' | 'processing' | 'generating' | 'completed' | 'error'>('initializing');
  const [progress, setProgress] = useState(0);
  const [currentStage, setCurrentStage] = useState('');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [detailedProgress, setDetailedProgress] = useState({
    frameExtraction: 0,
    aiProcessing: 0,
    reportGeneration: 0
  });

  const aiService = new EnhancedAIAnalysisService();

  useEffect(() => {
    startAnalysis();
  }, []);

  const startAnalysis = async () => {
    try {
      setAnalysisStage('initializing');
      setProgress(10);
      setCurrentStage('Initializing analysis...');

      // Create video URL for analysis
      const videoUrl = URL.createObjectURL(videoFile);
      
      setAnalysisStage('processing');
      setProgress(30);
      setCurrentStage('Processing video frames...');
      
      // Simulate frame extraction progress
      for (let i = 0; i <= 100; i += 10) {
        setDetailedProgress(prev => ({ ...prev, frameExtraction: i }));
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      setProgress(60);
      setCurrentStage('Running AI analysis...');
      
      // Run AI analysis
      const analysis = await aiService.analyzeVideo(
        videoUrl,
        videoType,
        taggedPlayers,
        (progressUpdate) => {
          setDetailedProgress(prev => ({ ...prev, aiProcessing: progressUpdate }));
        }
      );

      setProgress(90);
      setCurrentStage('Generating comprehensive report...');
      
      // Simulate report generation
      for (let i = 0; i <= 100; i += 20) {
        setDetailedProgress(prev => ({ ...prev, reportGeneration: i }));
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      setProgress(100);
      setAnalysisStage('completed');
      setCurrentStage('Analysis completed successfully!');
      setAnalysisData(analysis);
      
      // Store analysis in database (simulate videoId for now)
      const mockVideoId = `video_${Date.now()}`;
      setVideoId(mockVideoId);
      
      onAnalysisComplete(analysis);

      toast({
        title: "Analysis Complete!",
        description: "Your video has been successfully analyzed with AI insights.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      setAnalysisStage('error');
      setCurrentStage('Analysis failed. Please try again.');
      
      toast({
        title: "Analysis Failed",
        description: "There was an error analyzing your video. Please try again.",
        variant: "destructive"
      });
    }
  };

  const retryAnalysis = async () => {
    setIsRetrying(true);
    setProgress(0);
    setDetailedProgress({ frameExtraction: 0, aiProcessing: 0, reportGeneration: 0 });
    await startAnalysis();
    setIsRetrying(false);
  };

  const getStageIcon = () => {
    switch (analysisStage) {
      case 'initializing':
      case 'processing':
        return <div className="animate-spin w-6 h-6 border-2 border-bright-pink border-t-transparent rounded-full" />;
      case 'generating':
        return <Sparkles className="w-6 h-6 text-bright-pink animate-pulse" />;
      case 'completed':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Brain className="w-6 h-6 text-bright-pink" />;
    }
  };

  const getStageColor = () => {
    switch (analysisStage) {
      case 'completed':
        return 'text-green-400';
      case 'error':
        return 'text-red-400';
      default:
        return 'text-bright-pink';
    }
  };

  if (analysisStage === 'completed' && analysisData && videoId) {
    return (
      <VideoAnalysisResults
        videoId={videoId}
        videoType={videoType}
        teamId={teamId}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Analysis Header */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center gap-4">
            {getStageIcon()}
            <div className="flex-1">
              <CardTitle className="text-white text-xl font-bold">
                AI Video Analysis
              </CardTitle>
              <p className="text-gray-300 mt-1">
                Analyzing "{videoTitle}" • {videoType.charAt(0).toUpperCase() + videoType.slice(1)} Video
              </p>
            </div>
            
            {taggedPlayers.length > 0 && (
              <Badge className="bg-bright-pink/20 text-bright-pink border-bright-pink">
                <Users className="w-3 h-3 mr-1" />
                {taggedPlayers.length} Players Tagged
              </Badge>
            )}
          </div>
        </CardHeader>
      </Card>

      {/* Progress Section */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Main Progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className={`font-medium ${getStageColor()}`}>
                  {currentStage}
                </span>
                <span className="text-gray-400 text-sm">
                  {progress}%
                </span>
              </div>
              <Progress 
                value={progress} 
                className="h-3 bg-gray-700"
              />
            </div>

            {/* Detailed Progress */}
            {analysisStage !== 'error' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-300">Frame Extraction</span>
                  </div>
                  <Progress 
                    value={detailedProgress.frameExtraction} 
                    className="h-2 bg-gray-700"
                  />
                  <div className="text-xs text-gray-500">
                    {detailedProgress.frameExtraction}% complete
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-bright-pink" />
                    <span className="text-sm text-gray-300">AI Processing</span>
                  </div>
                  <Progress 
                    value={detailedProgress.aiProcessing} 
                    className="h-2 bg-gray-700"
                  />
                  <div className="text-xs text-gray-500">
                    {detailedProgress.aiProcessing}% complete
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-green-400" />
                    <span className="text-sm text-gray-300">Report Generation</span>
                  </div>
                  <Progress 
                    value={detailedProgress.reportGeneration} 
                    className="h-2 bg-gray-700"
                  />
                  <div className="text-xs text-gray-500">
                    {detailedProgress.reportGeneration}% complete
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Error State */}
          {analysisStage === 'error' && (
            <div className="text-center py-6">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                Analysis Failed
              </h3>
              <p className="text-gray-400 mb-6">
                We encountered an error while analyzing your video. This might be due to:
              </p>
              <ul className="text-sm text-gray-400 text-left max-w-md mx-auto mb-6">
                <li>• Video format compatibility issues</li>
                <li>• Network connectivity problems</li>
                <li>• Temporary service unavailability</li>
              </ul>
              <Button
                onClick={retryAnalysis}
                disabled={isRetrying}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
              >
                {isRetrying ? (
                  <>
                    <div className="animate-spin w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Analysis
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Stages Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Brain className="w-5 h-5 text-bright-pink" />
            What We're Analyzing
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h4 className="font-medium text-white">Technical Analysis</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bright-pink rounded-full" />
                  Game flow and momentum shifts
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bright-pink rounded-full" />
                  Key events and timestamps
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bright-pink rounded-full" />
                  Performance patterns
                </li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium text-white">Player Insights</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bright-pink rounded-full" />
                  Individual player analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bright-pink rounded-full" />
                  Team coordination metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-bright-pink rounded-full" />
                  Strategic recommendations
                </li>
              </ul>
            </div>
          </div>

          {taggedPlayers.length > 0 && (
            <div className="mt-6 p-4 bg-gray-700 rounded-lg">
              <h4 className="font-medium text-white mb-2">Tagged Players Analysis</h4>
              <div className="flex flex-wrap gap-2">
                {taggedPlayers.map((player, index) => (
                  <Badge key={index} variant="outline" className="text-bright-pink border-bright-pink">
                    Player {player}
                  </Badge>
                ))}
              </div>
              <p className="text-sm text-gray-400 mt-2">
                We'll provide detailed analysis for each tagged player including performance metrics, 
                key moments, and improvement recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedVideoAnalysis;
