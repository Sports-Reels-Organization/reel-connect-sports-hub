import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  Play,
  Upload,
  Search,
  Filter,
  MoreVertical,
  Eye,
  Download,
  Share2,
  Trash2,
  Edit,
  Calendar,
  Clock,
  Users,
  Tag,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Loader2,
  Plus,
  Settings,
  FileVideo,
  Target,
  Activity,
  TrendingUp,
  Star,
  Award,
  MapPin,
  Zap,
  ArrowUp
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VideoUploadForm from './VideoUploadForm';
import VideoAnalysisResults from './VideoAnalysisResults';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  created_at: string;
  video_type: 'match' | 'training' | 'highlight' | 'interview';
  team_id: string | null;
  ai_analysis_status: 'pending' | 'analyzing' | 'completed' | 'failed';
  tagged_players: string[];
}

interface Team {
  id: string;
  team_name: string;
}

const EnhancedVideoManagement = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [videos, setVideos] = useState<Video[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVideoType, setSelectedVideoType] = useState<string>('all');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedVideoForAnalysis, setSelectedVideoForAnalysis] = useState<Video | null>(null);
  const [selectedVideoForActions, setSelectedVideoForActions] = useState<Video | null>(null);
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false);

  useEffect(() => {
    fetchVideos();
    fetchTeams();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map the database response to match our Video interface
      const mappedVideos = (data || []).map(video => ({
        ...video,
        video_type: video.video_type as 'match' | 'training' | 'highlight' | 'interview',
        ai_analysis_status: video.ai_analysis_status as 'pending' | 'analyzing' | 'completed' | 'failed',
        tagged_players: Array.isArray(video.tagged_players) 
          ? video.tagged_players.map(player => String(player))
          : []
      }));

      setVideos(mappedVideos);
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch videos');
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('team_name');

      if (error) throw error;

      setTeams(data || []);
    } catch (err) {
      console.error('Error fetching teams:', err);
      toast({
        title: 'Error',
        description: 'Failed to fetch teams',
        variant: 'destructive',
      });
    }
  };

  const handleVideoUploaded = useCallback(() => {
    fetchVideos();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleVideoTypeChange = (type: string) => {
    setSelectedVideoType(type);
  };

  const filteredVideos = videos.filter((video) => {
    const matchesSearch =
      searchTerm === '' || video.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedVideoType === 'all' || video.video_type === selectedVideoType;
    return matchesSearch && matchesType;
  });

  const handlePlayVideo = (video: Video) => {
    window.open(video.video_url, '_blank');
  };

  const handleDownloadVideo = (video: Video) => {
    window.open(video.video_url, '_blank');
  };

  const handleShareVideo = (video: Video) => {
    navigator.clipboard.writeText(video.video_url);
    toast({
      title: 'Video URL Copied',
      description: 'The video URL has been copied to your clipboard.',
    });
  };

  const handleDeleteVideo = async () => {
    if (!selectedVideoForActions) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', selectedVideoForActions.id);

      if (error) throw error;

      toast({
        title: 'Video Deleted',
        description: 'The video has been successfully deleted.',
      });
      fetchVideos();
    } catch (err) {
      console.error('Error deleting video:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete the video',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setIsDeleteConfirmationOpen(false);
      setIsActionsMenuOpen(false);
    }
  };

  const handleEditVideo = (video: Video) => {
    alert(`Edit video ${video.title} - Functionality coming soon!`);
  };

  const handleMoreActions = (video: Video) => {
    setSelectedVideoForActions(video);
    setIsActionsMenuOpen(true);
  };

  const handleCloseActionsMenu = () => {
    setIsActionsMenuOpen(false);
  };

  const handleOpenDeleteConfirmation = () => {
    setIsDeleteConfirmationOpen(true);
    setIsActionsMenuOpen(false);
  };

  const handleCloseDeleteConfirmation = () => {
    setIsDeleteConfirmationOpen(false);
  };

  const handleViewAnalysis = (video: Video) => {
    // Navigate to the video analysis page instead of opening video externally
    navigate(`/video-analysis/${video.id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto p-6 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-rosegold to-bright-pink bg-clip-text text-transparent">
              Video Management Hub
            </h1>
            <p className="text-gray-400 mt-2 text-lg">AI-powered video analysis and management platform</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setShowUploadForm(true)}
              className="bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/80 hover:to-rosegold/80 text-white shadow-lg"
            >
              <Plus className="w-4 h-4 mr-2" />
              Upload Video
            </Button>
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 border-blue-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-sm font-medium">Total Videos</p>
                  <p className="text-white text-3xl font-bold mt-1">{videos.length}</p>
                  <div className="flex items-center mt-2 text-xs text-blue-300">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    +5% vs last month
                  </div>
                </div>
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <FileVideo className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/20 border-emerald-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-emerald-200 text-sm font-medium">Match Videos</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {videos.filter((video) => video.video_type === 'match').length}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-emerald-300">
                    <ArrowUp className="w-3 h-3 mr-1" />
                    High engagement
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
                  <p className="text-purple-200 text-sm font-medium">Training Sessions</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {videos.filter((video) => video.video_type === 'training').length}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-purple-300">
                    <Star className="w-3 h-3 mr-1" />
                    Consistent uploads
                  </div>
                </div>
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <Activity className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 border-orange-500/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-200 text-sm font-medium">Highlights</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {videos.filter((video) => video.video_type === 'highlight').length}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-orange-300">
                    <Zap className="w-3 h-3 mr-1" />
                    High performance
                  </div>
                </div>
                <div className="p-3 bg-orange-500/20 rounded-xl">
                  <Award className="w-6 h-6 text-orange-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rosegold/10 to-bright-pink/20 border-rosegold/30 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-rosegold text-sm font-medium">Interviews</p>
                  <p className="text-white text-3xl font-bold mt-1">
                    {videos.filter((video) => video.video_type === 'interview').length}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-rosegold/80">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    Valuable insights
                  </div>
                </div>
                <div className="p-3 bg-rosegold/20 rounded-xl">
                  <Users className="w-6 h-6 text-rosegold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 backdrop-blur-sm bg-gray-800/30 border-gray-700/50 p-1">
            <TabsTrigger value="all" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
              All Videos
            </TabsTrigger>
            <TabsTrigger value="match" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
              Match
            </TabsTrigger>
            <TabsTrigger value="training" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
              Training
            </TabsTrigger>
            <TabsTrigger value="highlight" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
              Highlight
            </TabsTrigger>
            <TabsTrigger value="analysis" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
              Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300 text-sm">Filter:</span>
                </div>
                <div className="flex gap-2">
                  {['all', 'match', 'training', 'highlight', 'interview'].map((type) => (
                    <Button
                      key={type}
                      variant={selectedVideoType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleVideoTypeChange(type)}
                      className={selectedVideoType === type ? "bg-bright-pink hover:bg-bright-pink/80" : "border-gray-600 text-gray-300"}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="relative max-w-xs">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search videos..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="pl-10 pr-4 py-2 border-0 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-bright-pink focus:border-transparent bg-gray-800/30"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="group bg-gray-800/50 border-gray-700/50 backdrop-blur-sm hover:bg-gray-800/70 transition-all duration-300 overflow-hidden">
                  <div className="relative">
                    <div className="aspect-video rounded-t-lg flex items-center justify-center relative overflow-hidden">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-400 flex flex-col items-center">
                          <div className="w-20 h-20 bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Play className="w-10 h-10 text-bright-pink" />
                          </div>
                          <span className="text-lg">Video Preview</span>
                          <span className="text-sm text-gray-500 mt-1">No thumbnail available</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-bright-pink/20 text-bright-pink border-bright-pink/30">
                        {video.video_type.toUpperCase()}
                      </Badge>
                    </div>
                    {video.ai_analysis_status !== 'completed' && (
                      <div className="absolute bottom-2 left-2">
                        {video.ai_analysis_status === 'analyzing' ? (
                          <Badge variant="secondary" className="flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Analyzing...
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-300">
                            {video.ai_analysis_status.toUpperCase()}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-2">{video.title}</h3>
                    <div className="flex items-center gap-4 text-gray-400 text-sm mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(video.created_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(video.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    {video.tagged_players && video.tagged_players.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <Tag className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {video.tagged_players.slice(0, 3).join(', ')}
                          {video.tagged_players.length > 3 ? ',...' : ''}
                        </span>
                      </div>
                    )}
                    
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleViewAnalysis(video)}
                        className="bg-bright-pink/20 hover:bg-bright-pink/30 text-bright-pink border-bright-pink/50 flex-1"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View Analysis
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePlayVideo(video)}
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                      >
                        <Play className="w-3 h-3" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleMoreActions(video)}
                    >
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {loading && (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-bright-pink" />
              </div>
            )}

            {!loading && filteredVideos.length === 0 && (
              <div className="flex items-center justify-center p-8">
                <AlertCircle className="w-6 h-6 text-gray-500 mr-2" />
                <p className="text-gray-500">No videos found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="match" className="space-y-6">
            <div className="text-white">Match Videos Content</div>
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <div className="text-white">Training Videos Content</div>
          </TabsContent>

          <TabsContent value="highlight" className="space-y-6">
            <div className="text-white">Highlight Videos Content</div>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            {selectedVideoForAnalysis ? (
              <VideoAnalysisResults
                videoId={selectedVideoForAnalysis.id}
              />
            ) : (
              <Card className="bg-gray-800/50 border-gray-700/50 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="w-20 h-20 bg-bright-pink/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="w-10 h-10 text-bright-pink" />
                  </div>
                  <h3 className="text-white text-xl font-semibold mb-2">Select a Video for Analysis</h3>
                  <p className="text-gray-400 mb-6">Choose a video from your library to view detailed AI analysis results</p>
                  <Button
                    onClick={() => setActiveTab('all')}
                    className="bg-bright-pink hover:bg-bright-pink/80 text-white"
                  >
                    Browse Videos
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {showUploadForm && (
          <VideoUploadForm
            onSuccess={() => {
              setShowUploadForm(false);
              handleVideoUploaded();
            }}
            onCancel={() => setShowUploadForm(false)}
          />
        )}

        {isActionsMenuOpen && selectedVideoForActions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-gray-800/70 border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-white">
                  More Actions for {selectedVideoForActions.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={handleCloseActionsMenu}
                  className="hover:bg-gray-700 text-gray-300"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                  onClick={() => handleDownloadVideo(selectedVideoForActions!)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Video
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                  onClick={() => handleShareVideo(selectedVideoForActions!)}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Video
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-gray-600 text-gray-300 hover:bg-gray-700 justify-start"
                  onClick={() => handleEditVideo(selectedVideoForActions!)}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Video
                </Button>
                <Button
                  variant="destructive"
                  className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 justify-start"
                  onClick={handleOpenDeleteConfirmation}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Video
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {isDeleteConfirmationOpen && selectedVideoForActions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Card className="w-full max-w-md bg-gray-800/70 border-gray-700/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold text-white">
                  Confirm Delete
                </CardTitle>
                <Button
                  variant="ghost"
                  onClick={handleCloseDeleteConfirmation}
                  className="hover:bg-gray-700 text-gray-300"
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-300">
                  Are you sure you want to delete "{selectedVideoForActions.title}"? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="secondary"
                    onClick={handleCloseDeleteConfirmation}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteVideo}
                    className="bg-red-500/20 hover:bg-red-500/30 text-red-400"
                  >
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedVideoManagement;
