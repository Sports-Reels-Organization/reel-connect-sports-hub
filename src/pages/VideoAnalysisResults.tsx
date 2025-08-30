import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
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
  AlertCircle,
  Zap,
  Award,
  MapPin,
  Filter,
  Search,
  MoreVertical,
  Calendar,
  Timer,
  Maximize2,
  Volume2,
  Settings,
  ChevronRight,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Pause,
  SkipForward,
  SkipBack,
  ArrowLeft,
  Quote
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ComprehensiveAIAnalysisService } from '@/services/comprehensiveAIAnalysisService';
import { VideoFrameExtractor } from '@/utils/videoFrameExtractor';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  duration: number;
  video_type: 'match' | 'training' | 'interview' | 'highlight';
  description?: string;
  tags: string[];
  ai_analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  created_at: string;
  opposing_team?: string;
  match_date?: string;
  score?: string;
  league_competition?: string;
  file_size?: number;
  compressed_url?: string;
}

interface AnalysisData {
  playerActions: any[];
  keyMoments: any[];
  summary: string;
  insights: string[];
  performanceRating: number;
  heatmapData?: any[];
  playerStats?: any[];
  timeline?: any[];
}

const VideoAnalysisResults = () => {
  const { videoTitle } = useParams<{ videoTitle: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [video, setVideo] = useState<Video | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [hasAnalysis, setHasAnalysis] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTeamId, setCurrentTeamId] = useState<string>('');
  const [currentTime, setCurrentTime] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // AI analysis data - starts empty, populated only by AI analysis
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    playerActions: [],
    keyMoments: [],
    summary: "",
    insights: [],
    performanceRating: 0,
    playerStats: [],
    timeline: []
  });

  useEffect(() => {
    fetchCurrentTeam();
  }, []);

  useEffect(() => {
    if (videoTitle && currentTeamId) {
      fetchVideoData();
    }
  }, [videoTitle, currentTeamId]);

  const fetchCurrentTeam = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamData) {
        setCurrentTeamId(teamData.id);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchVideoData = async () => {
    if (!videoTitle || !currentTeamId) return;

    try {
      setIsLoading(true);
      const decodedTitle = decodeURIComponent(videoTitle);

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('title', decodedTitle)
        .eq('team_id', currentTeamId)
        .single();

      if (error) throw error;

      if (data) {
        const mappedVideo: Video = {
          id: data.id,
          title: data.title,
          video_url: data.video_url,
          thumbnail_url: data.thumbnail_url,
          duration: data.duration,
          video_type: data.video_type as 'match' | 'training' | 'interview' | 'highlight',
          description: data.description,
          tags: Array.isArray(data.tagged_players)
            ? data.tagged_players.map((tag: any) => String(tag))
            : [],
          ai_analysis_status: (data.ai_analysis_status === 'pending' ||
            data.ai_analysis_status === 'analyzing' ||
            data.ai_analysis_status === 'completed' ||
            data.ai_analysis_status === 'failed')
            ? data.ai_analysis_status
            : 'pending',
          created_at: data.created_at,
          opposing_team: data.opposing_team,
          match_date: data.match_date,
          score: data.score_display || undefined,
          league_competition: data.league || undefined,
          file_size: data.file_size,
          compressed_url: data.compressed_url
        };
        setVideo(mappedVideo);
      }
    } catch (error) {
      console.error('Error fetching video:', error);
      toast({
        title: "Error",
        description: "Failed to load video data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeVideo = async () => {
    if (!video) return;
    
    try {
      setIsAnalyzing(true);
      setAnalysisProgress(0);
      setAnalysisStatus('Initializing AI analysis...');
      
      // Initialize comprehensive AI analysis service
      const aiService = new ComprehensiveAIAnalysisService();

      // Extract video frames
      setAnalysisProgress(20);
      setAnalysisStatus('Extracting video frames...');
      const frameExtractor = new VideoFrameExtractor();
      const frames = await frameExtractor.extractFrames(video.video_url, {
        frameRate: 1,
        maxFrames: 30,
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 600
      });
      
      setAnalysisProgress(40);
      setAnalysisStatus('Frames extracted, preparing for AI analysis...');

      // Prepare comprehensive analysis request
      const analysisRequest = {
        videoUrl: video.video_url,
        videoType: video.video_type,
        sport: determineSportFromVideo(video),
        metadata: {
          playerTags: video.tags.map((tag, index) => ({
            playerId: `player_${index}`,
            playerName: tag,
            jerseyNumber: index + 1,
            position: 'Unknown'
          })),
          teamInfo: {
            homeTeam: video.opposing_team ? 'Your Team' : 'Home Team',
            awayTeam: video.opposing_team || 'Away Team',
            competition: video.league_competition || 'Unknown Competition',
            date: video.created_at
          },
          context: video.description || '',
          duration: video.duration
        },
        frames: frames
      };

      // Perform AI analysis
      setAnalysisProgress(60);
      setAnalysisStatus('Sending to AI for comprehensive analysis...');
      const result = await aiService.analyzeVideo(analysisRequest);
      
      if (result.success) {
        setAnalysisProgress(80);
        setAnalysisStatus('Processing AI results...');
        
        // Map AI results to AnalysisData format and update local state
        const mappedResults = mapAIResultsToAnalysisData(result.analysis);
        setAnalysisData(mappedResults);
        setHasAnalysis(true);
        
        setAnalysisProgress(100);
        setAnalysisStatus('Analysis completed successfully!');
        
        toast({
          title: "Analysis Complete",
          description: "AI video analysis completed successfully!",
        });
      } else {
        throw new Error(result.analysis.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        title: "Analysis Failed",
        description: "Failed to complete AI analysis. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
      setAnalysisStatus('');
    }
  };

  const determineSportFromVideo = (video: Video): 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby' | 'baseball' | 'soccer' => {
    // Determine sport based on video content, tags, or description
    const videoContent = `${video.title} ${video.description || ''} ${video.tags.join(' ')}`.toLowerCase();
    
    if (videoContent.includes('football') || videoContent.includes('soccer')) return 'football';
    if (videoContent.includes('basketball')) return 'basketball';
    if (videoContent.includes('rugby')) return 'rugby';
    if (videoContent.includes('tennis')) return 'tennis';
    if (videoContent.includes('volleyball')) return 'volleyball';
    if (videoContent.includes('baseball')) return 'baseball';
    
    return 'football'; // Default to football
  };

  const mapAIResultsToAnalysisData = (aiResults: any): AnalysisData => {
    // Map comprehensive AI analysis results to the expected AnalysisData format
    const videoType = video?.video_type;
    
    switch (videoType) {
      case 'match':
        return {
          playerActions: aiResults.matchAnalysis?.playerActions?.map((action: any) => ({
            timestamp: action.timestamp || 0,
            action: action.action || 'Unknown',
            description: action.description || '',
            confidence: action.confidence || aiResults.confidence || 0.8,
            players: action.players || ['Unknown Player'],
            zone: action.zone || 'Unknown Zone'
          })) || [],
          keyMoments: aiResults.matchAnalysis?.keyMoments?.map((moment: any) => ({
            timestamp: moment.timestamp || 0,
            type: moment.type || 'Unknown',
            description: moment.description || '',
            importance: moment.importance || 'medium'
          })) || [],
          summary: aiResults.summary || 'AI analysis completed successfully.',
          insights: aiResults.recommendations || ['Analysis insights will appear here.'],
          performanceRating: aiResults.matchAnalysis?.performanceMetrics?.overallRating || 7.5,
          playerStats: aiResults.matchAnalysis?.playerStats?.map((player: any) => ({
            name: player.name || 'Unknown Player',
            position: player.position || 'Unknown',
            rating: player.rating || 7.0,
            actions: player.actions || 0,
            keyPasses: player.keyPasses || 0,
            goals: player.goals || 0
          })) || [],
          timeline: aiResults.matchAnalysis?.timeline?.map((item: any) => ({
            minute: item.minute || 0,
            events: item.events || ['Event']
          })) || []
        };
        
      case 'training':
        return {
          playerActions: aiResults.trainingAnalysis?.skillAssessment?.map((player: any) => ({
            timestamp: 0,
            action: 'Training Assessment',
            description: `${player.playerName} - Technical: ${player.technicalRating}/10, Physical: ${player.physicalRating}/10, Tactical: ${player.tacticalRating}/10`,
            confidence: aiResults.confidence || 0.8,
            players: [player.playerName],
            zone: 'Training Ground'
          })) || [],
          keyMoments: aiResults.trainingAnalysis?.coachingInsights?.keyLearnings?.map((learning: any, index: number) => ({
            timestamp: index * 60,
            type: 'Key Learning',
            description: learning,
            importance: 'high'
          })) || [],
          summary: aiResults.summary || 'Training session analysis completed.',
          insights: aiResults.recommendations || ['Training insights will appear here.'],
          performanceRating: aiResults.trainingAnalysis?.coachingInsights?.sessionEffectiveness || 7.5,
          playerStats: aiResults.trainingAnalysis?.skillAssessment?.map((player: any) => ({
            name: player.playerName || 'Unknown Player',
            position: player.position || 'Unknown',
            rating: (player.technicalRating + player.physicalRating + player.tacticalRating) / 3,
            actions: 0,
            keyPasses: 0,
            goals: 0
          })) || [],
          timeline: aiResults.trainingAnalysis?.sessionStructure?.mainDrills?.map((drill: any, index: number) => ({
            minute: index * 15,
            events: [drill]
          })) || []
        };
        
      case 'highlight':
        return {
          playerActions: aiResults.highlightAnalysis?.keyMoments?.map((moment: any) => ({
            timestamp: moment.timestamp || 0,
            action: moment.type || 'Highlight',
            description: moment.description || '',
            confidence: moment.skillLevel / 10 || aiResults.confidence || 0.8,
            players: [moment.playerInvolved || 'Unknown Player'],
            zone: 'Highlight Zone'
          })) || [],
          keyMoments: aiResults.highlightAnalysis?.keyMoments?.map((moment: any) => ({
            timestamp: moment.timestamp || 0,
            type: moment.type || 'Highlight',
            description: moment.description || '',
            importance: moment.skillLevel >= 8 ? 'high' : 'medium'
          })) || [],
          summary: aiResults.summary || 'Highlight analysis completed.',
          insights: aiResults.recommendations || ['Highlight insights will appear here.'],
          performanceRating: aiResults.highlightAnalysis?.performanceInsights?.overallQuality || 7.5,
          playerStats: aiResults.highlightAnalysis?.playerHighlights?.map((player: any) => ({
            name: player.playerName || 'Unknown Player',
            position: player.position || 'Unknown',
            rating: player.skillRating || 7.0,
            actions: player.highlightMoments?.length || 0,
            keyPasses: 0,
            goals: 0
          })) || [],
          timeline: aiResults.highlightAnalysis?.keyMoments?.map((moment: any, index: number) => ({
            minute: Math.floor((moment.timestamp || 0) / 60),
            events: [moment.type || 'Highlight', moment.description || '']
          })) || []
        };
        
      case 'interview':
        return {
          playerActions: aiResults.interviewAnalysis?.keyQuotes?.map((quote: any) => ({
            timestamp: quote.timestamp || 0,
            action: 'Quote',
            description: quote.quote || '',
            confidence: quote.importance === 'high' ? 0.9 : quote.importance === 'medium' ? 0.7 : 0.5,
            players: [quote.speaker || 'Unknown Speaker'],
            zone: 'Interview'
          })) || [],
          keyMoments: aiResults.interviewAnalysis?.keyQuotes?.map((quote: any) => ({
            timestamp: quote.timestamp || 0,
            type: 'Key Quote',
            description: quote.quote || '',
            importance: quote.importance || 'medium'
          })) || [],
          summary: aiResults.summary || 'Interview analysis completed.',
          insights: aiResults.recommendations || ['Interview insights will appear here.'],
          performanceRating: aiResults.interviewAnalysis?.communicationAnalysis?.overallEffectiveness || 7.5,
          playerStats: [{
            name: 'Interview Performance',
            position: 'Communication',
            rating: aiResults.interviewAnalysis?.communicationAnalysis?.overallEffectiveness || 7.0,
            actions: aiResults.interviewAnalysis?.keyQuotes?.length || 0,
            keyPasses: 0,
            goals: 0
          }],
          timeline: aiResults.interviewAnalysis?.keyQuotes?.map((quote: any, index: number) => ({
            minute: Math.floor((quote.timestamp || 0) / 60),
            events: [quote.speaker || 'Speaker', quote.quote?.substring(0, 50) + '...' || '']
          })) || []
        };
        
      default:
        return {
          playerActions: [],
          keyMoments: [],
          summary: aiResults.summary || 'Analysis completed.',
          insights: aiResults.recommendations || ['Analysis insights will appear here.'],
          performanceRating: 7.5,
          playerStats: [],
          timeline: []
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const jumpToTimestamp = (timestamp: number) => {
    setCurrentTime(timestamp);
  };

  const getActionColor = (action: string) => {
    const colors = {
      'Goal': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
      'Save': 'bg-blue-500/20 text-blue-400 border-blue-500/50',
      'Tackle': 'bg-orange-500/20 text-orange-400 border-orange-500/50',
      'Pass': 'bg-purple-500/20 text-purple-400 border-purple-500/50',
      'Shot': 'bg-red-500/20 text-red-400 border-red-500/50'
    };
    return colors[action] || 'bg-gray-500/20 text-gray-400 border-gray-500/50';
  };

  const filteredActions = analysisData?.playerActions.filter(action => {
    const matchesFilter = selectedFilter === 'all' || action.action.toLowerCase() === selectedFilter;
    const matchesSearch = searchTerm === '' ||
      action.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.action.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bright-pink mx-auto mb-4"></div>
            <p className="text-gray-400">Loading video analysis...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!video) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Video Not Found</h2>
            <p className="text-gray-400 mb-6">The video you're looking for doesn't exist or has been removed.</p>
            <Button
              onClick={() => navigate('/videos')}
              className="bg-bright-pink hover:bg-bright-pink/90"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Videos
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-900">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/videos')}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Videos
              </Button>
              <div>
                <h1 className="text-3xl font-polysans text-white">
                  {video.title}
                </h1>

              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-bright-pink/20 text-bright-pink border-bright-pink/30 capitalize">
                {video.video_type}
              </Badge>
              <Button
                variant="outline"
                className="border-bright-pink/30 text-bright-pink hover:bg-bright-pink/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>

          {/* Video Player Section */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-0">
              <div className="relative">
                <div className="aspect-video bg-black rounded-t-lg flex items-center justify-center relative overflow-hidden">
                  {video.video_url ? (
                    <video
                      src={video.compressed_url || video.video_url}
                      poster={video.thumbnail_url}
                      controls
                      className="w-full h-full object-contain"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={(e) => setCurrentTime((e.target as HTMLVideoElement).currentTime)}
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="text-gray-400 flex flex-col items-center">
                      <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <Play className="w-12 h-12 text-bright-pink" />
                      </div>
                      <span className="text-lg">Video Preview</span>
                      <span className="text-sm text-gray-500 mt-1">Video content will load here</span>
                    </div>
                  )}
                </div>

                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-white font-semibold text-xl mb-1">{video.title}</h3>
                      <div className="flex items-center gap-4 text-gray-400 text-sm">
                        <span className="flex items-center gap-1">
                          <Timer className="w-4 h-4" />
                          {formatDuration(video.duration)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(video.created_at)}
                        </span>
                        {video.file_size && (
                          <>
                            <span>•</span>
                            <span>{formatFileSize(video.file_size)}</span>
                          </>
                        )}
                        <Badge className={`
                          ${video.ai_analysis_status === 'completed' ? 'bg-green-900/20 text-green-400' :
                            video.ai_analysis_status === 'analyzing' ? 'bg-blue-900/20 text-blue-400' :
                              video.ai_analysis_status === 'failed' ? 'bg-red-900/20 text-red-400' :
                                'bg-gray-900/20 text-gray-400'} border-0 text-xs
                        `}>
                          {video.ai_analysis_status}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="border-bright-pink/30 text-bright-pink hover:bg-bright-pink/10"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Export
                      </Button>
                      <Button
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Share className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button variant="ghost" size="sm">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Analysis Button */}
                  <Button
                    onClick={handleAnalyzeVideo}
                    disabled={isAnalyzing}
                    className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white disabled:opacity-50"
                    size="lg"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {analysisStatus}
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        Analyze Video with AI
                      </>
                    )}
                  </Button>
                  
                  {/* Analysis Progress Bar */}
                  {isAnalyzing && (
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm text-gray-400">
                        <span>Progress</span>
                        <span>{analysisProgress}%</span>
                      </div>
                      <Progress value={analysisProgress} className="h-2" />
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-200 text-sm font-medium">Total Events</p>
                    <p className="text-white text-3xl font-bold mt-1">
                      {analysisData?.playerActions.length || 0}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-blue-300">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      +12% vs last match
                    </div>
                  </div>
                  <div className="p-3 bg-blue-500/20 rounded-xl">
                    <Activity className="w-6 h-6 text-blue-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border-emerald-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-200 text-sm font-medium">Key Moments</p>
                    <p className="text-white text-3xl font-bold mt-1">
                      {analysisData?.keyMoments.length || 0}
                    </p>
                    <div className="flex items-center mt-2 text-xs text-emerald-300">
                      <ArrowUp className="w-3 h-3 mr-1" />
                      High impact events
                    </div>
                  </div>
                  <div className="p-3 bg-emerald-500/20 rounded-xl">
                    <Target className="w-6 h-6 text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 border-purple-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-200 text-sm font-medium">Performance</p>
                    <div className="flex items-center mt-1">
                      <p className="text-white text-3xl font-bold">
                        {analysisData?.performanceRating || 0}
                      </p>
                      <span className="text-gray-400 text-lg ml-1">/10</span>
                    </div>
                    <div className="flex items-center mt-2 text-xs text-purple-300">
                      <Star className="w-3 h-3 mr-1" />
                      Excellent rating
                    </div>
                  </div>
                  <div className="p-3 bg-purple-500/20 rounded-xl">
                    <Award className="w-6 h-6 text-purple-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-500/30 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-200 text-sm font-medium">AI Confidence</p>
                    <p className="text-white text-3xl font-bold mt-1">92%</p>
                    <div className="flex items-center mt-2 text-xs text-orange-300">
                      <Zap className="w-3 h-3 mr-1" />
                      High accuracy
                    </div>
                  </div>
                  <div className="p-3 bg-orange-500/20 rounded-xl">
                    <Eye className="w-6 h-6 text-orange-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Analysis Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className={`grid w-full ${video?.video_type === 'interview' ? 'grid-cols-4' : 'grid-cols-5'} bg-gray-800/50 backdrop-blur-sm border-0 p-1`}>
              <TabsTrigger value="overview" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              {video?.video_type === 'interview' ? (
                <TabsTrigger value="quotes" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
                  Key Quotes
                </TabsTrigger>
              ) : (
                <TabsTrigger value="actions" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
                  Actions
                </TabsTrigger>
              )}
              <TabsTrigger value="moments" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
                {video?.video_type === 'interview' ? 'Communication' : 'Key Moments'}
              </TabsTrigger>
              {video?.video_type !== 'interview' && (
                <TabsTrigger value="players" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
                  Players
                </TabsTrigger>
              )}
              <TabsTrigger value="insights" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Performance Timeline */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-bright-pink" />
                    {video?.video_type === 'interview' ? 'Interview Timeline' : 'Match Timeline'}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 mb-2">No analysis data available</p>
                      <p className="text-gray-500 text-sm">Click "Analyze Video with AI" to get started</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analysisData?.timeline?.map((item, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors">
                          <div className="w-12 h-12 bg-bright-pink/20 rounded-full flex items-center justify-center text-bright-pink font-semibold">
                            {item.minute}'
                          </div>
                          <div className="flex-1">
                            <div className="flex gap-2 mb-1">
                              {item.events.map((event, eventIndex) => (
                                <Badge key={eventIndex} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                  {event}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Analysis Summary */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-bright-pink" />
                    Analysis Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 mb-2">No analysis summary available</p>
                      <p className="text-gray-500 text-sm">Run AI analysis to get detailed insights</p>
                    </div>
                  ) : (
                    <>
                      <p className="text-gray-300 leading-relaxed text-lg mb-6">
                        {analysisData?.summary || 'Analysis summary will appear here after AI processing.'}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <h4 className="text-white font-semibold flex items-center gap-2">
                            <ArrowUp className="w-4 h-4 text-green-400" />
                            Key Insights
                          </h4>
                          <div className="space-y-2">
                            {analysisData?.insights?.slice(0, 3).map((insight, index) => (
                              <div key={index} className="flex items-center gap-2 text-green-400 text-sm">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                {insight}
                              </div>
                            )) || (
                              <p className="text-gray-500 text-sm">No insights available yet</p>
                            )}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <h4 className="text-white font-semibold flex items-center gap-2">
                            <ArrowDown className="w-4 h-4 text-orange-400" />
                            Recommendations
                          </h4>
                          <div className="space-y-2">
                            {analysisData?.insights?.slice(3, 6).map((insight, index) => (
                              <div key={index} className="flex items-center gap-2 text-orange-400 text-sm">
                                <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
                                {insight}
                              </div>
                            )) || (
                              <p className="text-gray-500 text-sm">No recommendations available yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="actions" className="space-y-6">
              {/* Filters */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-300 text-sm">Filter:</span>
                    </div>
                    <div className="flex gap-2">
                      {['all', 'goal', 'save', 'tackle', 'pass', 'shot'].map((filter) => (
                        <Button
                          key={filter}
                          variant={selectedFilter === filter ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedFilter(filter)}
                          className={selectedFilter === filter ? "bg-bright-pink hover:bg-bright-pink/80" : "border-gray-600 text-gray-300"}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </Button>
                      ))}
                    </div>
                    <div className="flex-1 max-w-xs relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search actions..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-700 border-0 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bright-pink focus:border-transparent"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions List */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white">
                    {video?.video_type === 'interview' ? 'Key Quotes' : 'Player Actions'} ({filteredActions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Activity className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 mb-2">No analysis data available</p>
                      <p className="text-gray-500 text-sm">Run AI analysis to see detailed actions and insights</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-3">
                        {filteredActions.map((action, index) => (
                        <div
                          key={index}
                          className="group p-4 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 cursor-pointer transition-all duration-200 border border-transparent hover:border-bright-pink/30"
                          onClick={() => jumpToTimestamp(action.timestamp)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <Badge className={getActionColor(action.action)}>
                                  {action.action}
                                </Badge>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatTime(action.timestamp)}
                                </span>
                                <span className="text-xs text-gray-400 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {action.zone}
                                </span>
                              </div>
                              <p className="text-white text-sm mb-2">{action.description}</p>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                  <Users className="w-3 h-3 text-gray-400" />
                                  <span className="text-xs text-gray-400">
                                    {action.players?.join(', ')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right space-y-1">
                              <p className="text-xs text-gray-400">Confidence</p>
                              <div className="flex items-center gap-2">
                                <Progress
                                  value={action.confidence * 100}
                                  className="w-16 h-2"
                                />
                                <span className="text-white font-semibold text-sm">
                                  {Math.round(action.confidence * 100)}%
                                </span>
                              </div>
                            </div>

                            <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-bright-pink transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Key Quotes Tab for Interviews */}
            <TabsContent value="quotes" className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Quote className="w-5 h-5 text-bright-pink" />
                    Key Quotes Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Quote className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 mb-2">No quotes available</p>
                      <p className="text-gray-500 text-sm">Run AI analysis to extract key quotes from the interview</p>
                    </div>
                  ) : (
                    <ScrollArea className="h-96">
                      <div className="space-y-4">
                        {analysisData?.playerActions?.map((quote, index) => (
                        <div
                          key={index}
                          className="group p-6 bg-gradient-to-r from-gray-700/30 to-gray-700/10 rounded-xl hover:from-bright-pink/10 hover:to-bright-pink/5 cursor-pointer transition-all duration-300 border border-transparent hover:border-bright-pink/30"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-bright-pink/20 rounded-full flex items-center justify-center">
                                  <span className="text-bright-pink font-semibold text-sm">
                                    {Math.floor(quote.timestamp / 60)}'
                                  </span>
                                </div>
                                <Badge className="bg-bright-pink text-white px-3 py-1">
                                  Quote
                                </Badge>
                                <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                                  {quote.players?.[0] || 'Speaker'}
                                </Badge>
                              </div>
                              <blockquote className="text-white text-lg font-medium mb-3 italic">
                                "{quote.description}"
                              </blockquote>
                              <div className="flex items-center gap-4 text-sm text-gray-400">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {formatTime(quote.timestamp)}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="w-4 h-4" />
                                  {Math.round(quote.confidence * 100)}% confidence
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="moments" className="space-y-6">
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    {video?.video_type === 'interview' ? (
                      <>
                        <Users className="w-5 h-5 text-bright-pink" />
                        Communication Analysis
                      </>
                    ) : (
                      <>
                        <Target className="w-5 h-5 text-bright-pink" />
                        Key Moments Analysis
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        {video?.video_type === 'interview' ? (
                          <Users className="w-8 h-8 text-gray-400" />
                        ) : (
                          <Target className="w-8 h-8 text-gray-400" />
                        )}
                      </div>
                      <p className="text-gray-400 mb-2">No analysis data available</p>
                      <p className="text-gray-500 text-sm">Run AI analysis to get detailed insights</p>
                    </div>
                  ) : video?.video_type === 'interview' ? (
                    <div className="space-y-6">
                      {/* Communication Analysis for Interviews */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                          <h4 className="text-white font-semibold mb-3">Communication Effectiveness</h4>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Clarity</span>
                              <span className="text-white font-semibold">
                                {analysisData?.playerStats?.[0]?.rating || 0}/10
                              </span>
                            </div>
                            <Progress value={(analysisData?.playerStats?.[0]?.rating || 0) * 10} className="h-2" />
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Confidence</span>
                              <span className="text-white font-semibold">
                                {analysisData?.performanceRating || 0}/10
                              </span>
                            </div>
                            <Progress value={(analysisData?.performanceRating || 0) * 10} className="h-2" />
                            <div className="flex justify-between">
                              <span className="text-gray-300 text-sm">Engagement</span>
                              <span className="text-white font-semibold">
                                {Math.max(0, (analysisData?.performanceRating || 0) - 1)}/10
                              </span>
                            </div>
                            <Progress value={Math.max(0, (analysisData?.performanceRating || 0) - 1) * 10} className="h-2" />
                          </div>
                        </div>
                        <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                          <h4 className="text-white font-semibold mb-3">Key Communication Insights</h4>
                          <div className="space-y-2 text-sm">
                            {analysisData?.insights?.slice(0, 3).map((insight, index) => (
                              <div key={index} className="flex items-center gap-2 text-green-400">
                                <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                                {insight}
                              </div>
                            )) || (
                              <p className="text-gray-500 text-sm">No insights available yet</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {analysisData?.keyMoments.map((moment, index) => (
                        <div
                          key={index}
                          className="group p-6 bg-gradient-to-r from-gray-700/30 to-gray-700/10 rounded-xl hover:from-bright-pink/10 hover:to-bright-pink/5 cursor-pointer transition-all duration-300 border border-transparent hover:border-bright-pink/30"
                          onClick={() => jumpToTimestamp(moment.timestamp)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-bright-pink/20 rounded-full flex items-center justify-center">
                                  <span className="text-bright-pink font-semibold text-sm">
                                    {Math.floor(moment.timestamp / 60)}'
                                  </span>
                                </div>
                                <Badge className="bg-bright-pink text-white px-3 py-1">
                                  {moment.type}
                                </Badge>
                                <Badge variant="outline" className={
                                  moment.importance === 'high'
                                    ? 'border-red-500/50 text-red-400'
                                    : 'border-yellow-500/50 text-yellow-400'
                                }>
                                  {moment.importance.toUpperCase()} IMPACT
                                </Badge>
                              </div>
                              <p className="text-white text-lg font-medium mb-2">{moment.description}</p>
                              <p className="text-gray-400 text-sm">
                                Click to jump to {formatTime(moment.timestamp)} in the video
                              </p>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-bright-pink transition-colors" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="players" className="space-y-6">
              {!hasAnalysis ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-400 mb-2">No player data available</p>
                  <p className="text-gray-500 text-sm">Run AI analysis to see individual player statistics</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {analysisData?.playerStats?.map((player, index) => (
                  <Card key={index} className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-white font-semibold text-lg">{player.name}</h3>
                          <p className="text-gray-400 text-sm">{player.position}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-bright-pink">{player.rating}</div>
                          <div className="text-xs text-gray-400">Rating</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                          <div className="text-xl font-semibold text-white">{player.actions}</div>
                          <div className="text-xs text-gray-400">Actions</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                          <div className="text-xl font-semibold text-white">{player.keyPasses}</div>
                          <div className="text-xs text-gray-400">Key Passes</div>
                        </div>
                        <div className="text-center p-3 bg-gray-700/30 rounded-lg">
                          <div className="text-xl font-semibold text-white">{player.goals}</div>
                          <div className="text-xs text-gray-400">Goals</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">Performance</span>
                          <span className="text-white">{player.rating}/10</span>
                        </div>
                        <Progress value={player.rating * 10} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              )}
            </TabsContent>

            <TabsContent value="insights" className="space-y-6">
              {/* AI Insights */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-bright-pink" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <TrendingUp className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 mb-2">No insights available</p>
                      <p className="text-gray-500 text-sm">Run AI analysis to get detailed insights and recommendations</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {analysisData?.insights?.map((insight, index) => (
                        <div key={index} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-bright-pink/20 rounded-full flex items-center justify-center flex-shrink-0">
                              <Zap className="w-4 h-4 text-bright-pink" />
                            </div>
                            <div>
                              <p className="text-white font-medium mb-1">Insight #{index + 1}</p>
                              <p className="text-gray-300 text-sm leading-relaxed">{insight}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Performance Trends */}
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-bright-pink" />
                    Performance Trends
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!hasAnalysis ? (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-gray-700/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-400 mb-2">No performance data available</p>
                      <p className="text-gray-500 text-sm">Run AI analysis to see detailed performance metrics</p>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-bright-pink/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <BarChart3 className="w-8 h-8 text-bright-pink" />
                      </div>
                      <p className="text-white mb-2">Performance analysis completed</p>
                      <p className="text-gray-400 text-sm">Check individual tabs for detailed metrics and insights</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-bright-pink" />
                    AI Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-700/30 rounded-lg border-l-4 border-green-500">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <ArrowUp className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <h4 className="text-green-400 font-semibold mb-1">Tactical Strength</h4>
                          <p className="text-gray-300 text-sm">
                            Continue utilizing high defensive line coordination. The 89% success rate indicates strong team chemistry in defensive transitions.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-700/30 rounded-lg border-l-4 border-orange-500">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <AlertCircle className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <h4 className="text-orange-400 font-semibold mb-1">Area for Improvement</h4>
                          <p className="text-gray-300 text-sm">
                            Focus on set piece delivery and positioning. Current 40% conversion rate suggests need for specialized training in dead ball situations.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-700/30 rounded-lg border-l-4 border-blue-500">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <Users className="w-3 h-3 text-white" />
                        </div>
                        <div>
                          <h4 className="text-blue-400 font-semibold mb-1">Player Development</h4>
                          <p className="text-gray-300 text-sm">
                            Player #10's midfield coverage (11.2km) is exceptional. Consider building more plays through central areas to maximize this asset.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Bar */}
          <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge className="bg-bright-pink/20 text-bright-pink border-bright-pink/30">
                    Analysis Complete
                  </Badge>
                  <span className="text-gray-400 text-sm">
                    Generated on {new Date().toLocaleDateString()} • Processing time: 2.3 seconds
                  </span>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Preview
                  </Button>
                  <Button
                    className="bg-bright-pink hover:bg-bright-pink/80 text-white"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export Full Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default VideoAnalysisResults;