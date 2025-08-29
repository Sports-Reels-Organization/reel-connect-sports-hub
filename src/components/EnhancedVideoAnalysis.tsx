
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Play, Pause, Upload, Brain, Eye, BarChart3,
  Target, Users, TrendingUp, Clock, Zap, AlertCircle,
  CheckCircle, XCircle, Loader2, Download, Share2
} from 'lucide-react';
import { GeminiVideoAnalysisService, GeminiAnalysisRequest } from '@/services/geminiVideoAnalysisService';
import { VideoFrameExtractor, VideoFrame } from '@/utils/videoFrameExtractor';
import { supabase } from '@/integrations/supabase/client';

interface VideoAnalysisState {
  isAnalyzing: boolean;
  progress: number;
  status: string;
  currentStep: string;
  error: string | null;
}

interface AnalysisResult {
  playerAnalysis: any[];
  tacticalInsights: any;
  skillAssessment: any;
  matchEvents: any[];
  recommendations: string[];
  confidence: number;
}

interface EnhancedVideoAnalysisProps {
  videoId: string;
  teamId: string;
  onAnalysisComplete: () => void;
}

const EnhancedVideoAnalysis: React.FC<EnhancedVideoAnalysisProps> = ({
  videoId,
  teamId,
  onAnalysisComplete
}) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [videoType, setVideoType] = useState<'match' | 'interview' | 'training' | 'highlight'>('match');
  const [sport, setSport] = useState<'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby' | 'baseball' | 'soccer'>('football');
  const [analysisState, setAnalysisState] = useState<VideoAnalysisState>({
    isAnalyzing: false,
    progress: 0,
    status: 'Ready to analyze',
    currentStep: '',
    error: null
  });
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [playerTags, setPlayerTags] = useState<Array<{
    playerId: string;
    playerName: string;
    jerseyNumber: number;
    position: string;
  }>>([]);
  const [teamInfo, setTeamInfo] = useState({
    homeTeam: '',
    awayTeam: '',
    competition: '',
    date: ''
  });
  const [context, setContext] = useState('');

  // Initialize Gemini service (you'll need to add your API key)
  const geminiService = new GeminiVideoAnalysisService({
    apiKey: process.env.REACT_APP_GEMINI_API_KEY || '',
    model: 'gemini-2.5-flash'
  });

  // Load video data when videoId changes
  useEffect(() => {
    if (videoId) {
      // You can fetch video data from the database here using videoId and teamId
      console.log('Loading video analysis for:', { videoId, teamId });
      // For now, we'll keep the existing file upload functionality
    }
  }, [videoId, teamId]);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      toast({
        title: 'Video uploaded successfully',
        description: `Analyzing ${file.name}...`,
      });
    } else {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a valid video file.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleAnalyze = async () => {
    if (!videoFile || !videoUrl) {
      toast({
        title: 'No video selected',
        description: 'Please upload a video first.',
        variant: 'destructive',
      });
      return;
    }

    setAnalysisState({
      isAnalyzing: true,
      progress: 0,
      status: 'Starting analysis...',
      currentStep: 'Initializing',
      error: null
    });

    try {
      // Step 1: Extract video frames
      setAnalysisState(prev => ({ ...prev, progress: 10, currentStep: 'Extracting video frames' }));
      const frameExtractor = new VideoFrameExtractor();
      const frames = await frameExtractor.extractFrames(videoUrl, {
        frameRate: 1,
        maxFrames: 30,
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 600
      });

      setAnalysisState(prev => ({ ...prev, progress: 30, currentStep: 'Frames extracted, preparing for AI analysis' }));

      // Convert frames to match the expected interface for Gemini service
      const geminiFrames = frames.map(frame => ({
        ...frame,
        frameData: frame.frameData || frame.canvas.toDataURL('image/jpeg', 0.8),
        frameNumber: frame.frameNumber || 0
      }));

      // Step 2: Prepare analysis request
      const analysisRequest: GeminiAnalysisRequest = {
        videoUrl,
        videoType,
        sport,
        metadata: {
          playerTags: playerTags.length > 0 ? playerTags : undefined,
          teamInfo: teamInfo.homeTeam ? teamInfo : undefined,
          context: context || undefined
        },
        frames: geminiFrames
      };

      setAnalysisState(prev => ({ ...prev, progress: 50, currentStep: 'Sending to Gemini AI for analysis' }));

      // Step 3: Perform AI analysis
      const result = await geminiService.analyzeVideo(analysisRequest);

      if (result.success) {
        setAnalysisState(prev => ({ ...prev, progress: 90, currentStep: 'Processing results' }));
        setAnalysisResult(result.analysis);

        // Save to database
        await saveAnalysisToDatabase(result.analysis);

        setAnalysisState(prev => ({
          ...prev,
          progress: 100,
          currentStep: 'Analysis completed successfully!',
          isAnalyzing: false
        }));

        toast({
          title: 'Analysis completed!',
          description: 'AI analysis results are ready.',
        });

        // Call the onAnalysisComplete callback
        onAnalysisComplete();
      } else {
        throw new Error(result.error || 'Analysis failed');
      }

    } catch (error) {
      console.error('Analysis failed:', error);
      setAnalysisState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        progress: 0
      }));

      toast({
        title: 'Analysis failed',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const saveAnalysisToDatabase = async (analysis: AnalysisResult) => {
    try {
      const { error } = await supabase
        .from('videos')
        .insert({
          title: `Analysis - ${videoType}`,
          video_url: videoUrl,
          video_type: videoType,
          ai_analysis: analysis as any,
          tagged_players: playerTags,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving analysis:', error);
      }
    } catch (error) {
      console.error('Failed to save analysis:', error);
    }
  };

  const addPlayerTag = () => {
    const newPlayer = {
      playerId: `player_${Date.now()}`,
      playerName: '',
      jerseyNumber: 0,
      position: ''
    };
    setPlayerTags([...playerTags, newPlayer]);
  };

  const updatePlayerTag = (index: number, field: string, value: string | number) => {
    const updated = [...playerTags];
    updated[index] = { ...updated[index], [field]: value };
    setPlayerTags(updated);
  };

  const removePlayerTag = (index: number) => {
    setPlayerTags(playerTags.filter((_, i) => i !== index));
  };

  const resetAnalysis = () => {
    setAnalysisState({
      isAnalyzing: false,
      progress: 0,
      status: 'Ready to analyze',
      currentStep: '',
      error: null
    });
    setAnalysisResult(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Video Analysis</h1>
          <p className="text-gray-600 mt-2">Powered by Gemini 1.5 Pro AI</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => onAnalysisComplete()}>
            <Eye className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Brain className="w-4 h-4" />
            AI-Powered
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Video Upload and Configuration */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Video Upload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Video File</label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="cursor-pointer"
                />
              </div>

              {videoUrl && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Video Preview</label>
                  <video
                    ref={videoRef}
                    src={videoUrl}
                    controls
                    className="w-full rounded-lg"
                    preload="metadata"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Analysis Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Video Type</label>
                <Select value={videoType} onValueChange={(value: any) => setVideoType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match Analysis</SelectItem>
                    <SelectItem value="training">Training Analysis</SelectItem>
                    <SelectItem value="highlight">Highlight Analysis</SelectItem>
                    <SelectItem value="interview">Interview Analysis</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sport</label>
                <Select value={sport} onValueChange={(value: any) => setSport(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="volleyball">Volleyball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="rugby">Rugby</SelectItem>
                    <SelectItem value="baseball">Baseball</SelectItem>
                    <SelectItem value="soccer">Soccer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Context (Optional)</label>
                <Textarea
                  placeholder="Additional context about the video..."
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Player Tags
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {playerTags.map((player, index) => (
                <div key={player.playerId} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Player {index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removePlayerTag(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Name"
                      value={player.playerName}
                      onChange={(e) => updatePlayerTag(index, 'playerName', e.target.value)}
                    />
                    <Input
                      placeholder="Jersey #"
                      type="number"
                      value={player.jerseyNumber || ''}
                      onChange={(e) => updatePlayerTag(index, 'jerseyNumber', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <Input
                    placeholder="Position"
                    value={player.position}
                    onChange={(e) => updatePlayerTag(index, 'position', e.target.value)}
                  />
                </div>
              ))}

              <Button
                variant="outline"
                onClick={addPlayerTag}
                className="w-full"
              >
                <Users className="w-4 h-4 mr-2" />
                Add Player
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Team Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Home Team"
                  value={teamInfo.homeTeam}
                  onChange={(e) => setTeamInfo(prev => ({ ...prev, homeTeam: e.target.value }))}
                />
                <Input
                  placeholder="Away Team"
                  value={teamInfo.awayTeam}
                  onChange={(e) => setTeamInfo(prev => ({ ...prev, awayTeam: e.target.value }))}
                />
              </div>
              <Input
                placeholder="Competition"
                value={teamInfo.competition}
                onChange={(e) => setTeamInfo(prev => ({ ...prev, competition: e.target.value }))}
              />
              <Input
                placeholder="Date"
                type="date"
                value={teamInfo.date}
                onChange={(e) => setTeamInfo(prev => ({ ...prev, date: e.target.value }))}
              />
            </CardContent>
          </Card>
        </div>

        {/* Analysis Results and Progress */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysisState.isAnalyzing ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span className="font-medium">{analysisState.currentStep}</span>
                  </div>
                  <Progress value={analysisState.progress} className="w-full" />
                  <p className="text-sm text-gray-600">{analysisState.status}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!videoFile || analysisState.isAnalyzing}
                    className="w-full"
                    size="lg"
                  >
                    <Brain className="w-5 h-5 mr-2" />
                    Start AI Analysis
                  </Button>

                  {analysisState.error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-medium">Error:</span>
                        <span>{analysisState.error}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Analysis Results */}
          {analysisResult && (
            <div className="space-y-6">
              {/* Player Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Player Performance Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysisResult.playerAnalysis.map((player, index) => (
                      <div key={index} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold">{player.playerName} #{player.jerseyNumber}</h4>
                          <Badge variant="outline">{player.position}</Badge>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Overall:</span>
                            <span className="font-medium">{player.performance.overall}/100</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Technical:</span>
                            <span className="font-medium">{player.performance.technical}/100</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Physical:</span>
                            <span className="font-medium">{player.performance.physical}/100</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Tactical:</span>
                            <span className="font-medium">{player.performance.tactical}/100</span>
                          </div>
                        </div>

                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Strengths:</h5>
                          <div className="flex flex-wrap gap-1">
                            {player.strengths.map((strength, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3">
                          <h5 className="text-sm font-medium mb-2">Areas for Improvement:</h5>
                          <div className="flex flex-wrap gap-1">
                            {player.weaknesses.map((weakness, i) => (
                              <Badge key={i} variant="outline" className="text-xs text-orange-600">
                                {weakness}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Tactical Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    Tactical Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold mb-3">Formation & Shape</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Formation:</span>
                          <span className="font-medium">{analysisResult.tacticalInsights.formation}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Compactness:</span>
                          <span className="font-medium">{analysisResult.tacticalInsights.teamShape.compactness}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Width:</span>
                          <span className="font-medium">{analysisResult.tacticalInsights.teamShape.width}/10</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Depth:</span>
                          <span className="font-medium">{analysisResult.tacticalInsights.teamShape.depth}/10</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3">Pressing Patterns</h4>
                      <div className="space-y-2">
                        {analysisResult.tacticalInsights.pressingPatterns.map((pattern, index) => (
                          <div key={index} className="p-2 bg-gray-50 rounded">
                            <div className="flex justify-between text-sm">
                              <span>{pattern.type}</span>
                              <span className="font-medium">{pattern.effectiveness}/10</span>
                            </div>
                            <div className="text-xs text-gray-600">{pattern.timing}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {analysisResult.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                        <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-blue-800">{recommendation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-gray-600" />
                      <span className="text-sm font-medium">Analysis Confidence:</span>
                      <span className="text-sm text-gray-600">{Math.round(analysisResult.confidence * 100)}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Analysis
                </Button>
                <Button variant="outline" onClick={resetAnalysis}>
                  <Eye className="w-4 h-4 mr-2" />
                  New Analysis
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EnhancedVideoAnalysis;
