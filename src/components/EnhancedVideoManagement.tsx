// Enhanced Video Management with improved UI and player filtering
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Video,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Play,
  Eye,
  Calendar,
  Clock,
  Star,
  TrendingUp,
  BarChart3,
  Upload,
  Tag,
  Download,
  Settings,
  Users,
  FilterX,
  Grid3X3,
  List,
  SortAsc,
  Trophy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import VideoAnalysisResults from './VideoAnalysisResults';
import EnhancedVideoUploadForm from './EnhancedVideoUploadForm';
import { Separator } from '@/components/ui/separator';

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  video_type: string;
  duration?: number;
  file_size?: number;
  tags: string[];
  ai_analysis_status: string;
  created_at: string;
  opposing_team?: string;
  match_date?: string;
  score_display?: string;
  description?: string;
}

interface TeamPlayer {
  id: string;
  full_name: string;
  position: string;
  jersey_number?: number;
}

const EnhancedVideoManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();

  const [videos, setVideos] = useState<VideoData[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    type: 'all',
    analysisStatus: 'all',
    player: 'all',
    dateFrom: '',
    dateTo: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [isAnalysisDialogOpen, setIsAnalysisDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [teamId, setTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      fetchTeamId();
    }
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchVideos();
      fetchTeamPlayers();
    }
  }, [teamId, sortBy, filters]);

  const fetchTeamId = async () => {
    if (!profile) return;

    try {
      const { data: teamData, error } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return;
      }

      setTeamId(teamData?.id || null);
    } catch (error) {
      console.error('Error fetching team ID:', error);
    }
  };

  const fetchTeamPlayers = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, position, jersey_number')
        .eq('team_id', teamId)
        .order('full_name');

      if (error) throw error;
      setTeamPlayers(data || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const fetchVideos = async () => {
    if (!teamId) return;

    try {
      setLoading(true);

      let query = supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamId);

      // Apply filters conditionally
      if (filters.type && filters.type !== 'all') {
        query = query.eq('video_type', filters.type);
      }
      if (filters.analysisStatus && filters.analysisStatus !== 'all') {
        query = query.eq('ai_analysis_status', filters.analysisStatus);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'duration_long':
          query = query.order('duration', { ascending: false });
          break;
        case 'duration_short':
          query = query.order('duration', { ascending: true });
          break;
        case 'title_az':
          query = query.order('title', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to ensure all required fields are present
      const mappedVideos: VideoData[] = (data || []).map(video => ({
        id: video.id,
        title: video.title,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        video_type: video.video_type,
        duration: video.duration,
        file_size: video.file_size,
        tags: Array.isArray(video.tagged_players) ?
          video.tagged_players.map((tag: any) => typeof tag === 'string' ? tag : String(tag)) :
          [],
        ai_analysis_status: video.ai_analysis_status,
        created_at: video.created_at,
        opposing_team: video.opposing_team,
        match_date: video.match_date,
        score_display: video.score_display,
        description: video.description
      }));

      setVideos(mappedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVideo = async (videoData: Partial<VideoData>) => {
    if (!selectedVideo) return;

    try {
      const { error } = await supabase
        .from('videos')
        .update({
          title: videoData.title,
          description: videoData.description
        })
        .eq('id', selectedVideo.id);

      if (error) throw error;

      toast({
        title: "Video Updated",
        description: "Video details have been updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchVideos();
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update video",
        variant: "destructive"
      });
    }
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast({
        title: "Video Deleted",
        description: "Video has been deleted successfully"
      });

      fetchVideos();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const handleUploadComplete = (videoId: string) => {
    setIsUploadDialogOpen(false);
    fetchVideos();
    toast({
      title: "Upload Complete",
      description: "Video uploaded and is being analyzed",
    });
  };

  const clearAllFilters = () => {
    setFilters({
      type: 'all',
      analysisStatus: 'all',
      player: 'all',
      dateFrom: '',
      dateTo: ''
    });
    setSearchTerm('');
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 hover:bg-green-600';
      case 'processing': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'failed': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  const getVideoTypeIcon = (type: string) => {
    switch (type) {
      case 'match': return <Trophy className="w-3 h-3" />;
      case 'training': return <Users className="w-3 h-3" />;
      case 'highlight': return <Star className="w-3 h-3" />;
      case 'interview': return <Video className="w-3 h-3" />;
      default: return <Video className="w-3 h-3" />;
    }
  };

  const filteredVideos = videos.filter(video => {
    // Text search
    const matchesSearch = !searchTerm || (
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      video.video_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (video.opposing_team && video.opposing_team.toLowerCase().includes(searchTerm.toLowerCase())) ||
      video.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Player filter
    const matchesPlayer = filters.player === 'all' ||
      video.tags.includes(teamPlayers.find(p => p.id === filters.player)?.full_name || '');

    return matchesSearch && matchesPlayer;
  });

  // Check if user has team access
  if (!profile || profile.user_type !== 'team') {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-12 text-center">
          <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Team Access Only</h3>
          <p className="text-gray-400">This feature is only available for team accounts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden">
        <Card className="border-0 shadow-2xl">
          <CardHeader className="pb-8">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-bright-pink/20 rounded-xl backdrop-blur-sm border border-bright-pink/30">
                    <Video className="w-8 h-8 text-bright-pink" />
                  </div>
                  <div>
                    <CardTitle className="text-white pb-2 text-3xl font-bold font-[Polysans Median]">
                      Video Management
                    </CardTitle>
                    <p className="text-gray-300 text-lg">
                      Manage, analyze, and organize your video content
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm text-gray-400 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{videos.filter(v => v.ai_analysis_status === 'completed').length} Analyzed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>{videos.filter(v => v.ai_analysis_status === 'processing').length} Processing</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                    <span>{videos.filter(v => v.ai_analysis_status === 'pending').length} Pending</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => setIsUploadDialogOpen(true)}
                  className="bg-bright-pink hover:bg-bright-pink/90 text-white shadow-lg px-6 py-3 text-base font-medium"
                  size="lg"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Video
                </Button>
                <div className="flex items-center border border-gray-600 rounded-lg bg-gray-800/50">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={`${viewMode === 'grid' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'} rounded-r-none`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={`${viewMode === 'list' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'} rounded-l-none`}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="videos" className="space-y-8">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800 p-1 h-14">
          <TabsTrigger value="videos" className="flex items-center gap-2 text-base font-medium">
            <Video className="w-4 h-4" />
            Videos ({videos.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2 text-base font-medium">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tags" className="flex items-center gap-2 text-base font-medium">
            <Tag className="w-4 h-4" />
            Tags & Labels
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2 text-base font-medium">
            <Settings className="w-4 h-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          {/* Enhanced Search and Filters */}
          <Card className="bg-gray-800 border-gray-700 shadow-lg">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-bright-pink" />
                Search & Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  placeholder="Search by title, type, opponent, or player tags..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-11 pr-4 py-3 text-white text-base h-12"
                />
              </div>

              {/* Filter Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger className=" text-white h-12">
                    <SelectValue placeholder="Video Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="highlight">Highlight</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.analysisStatus} onValueChange={(value) => setFilters({ ...filters, analysisStatus: value })}>
                  <SelectTrigger className=" text-white h-12">
                    <SelectValue placeholder="Analysis Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.player} onValueChange={(value) => setFilters({ ...filters, player: value })}>
                  <SelectTrigger className=" text-white h-12">
                    <SelectValue placeholder="Filter by Player" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Players</SelectItem>
                    {teamPlayers.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.full_name} {player.jersey_number && `(#${player.jersey_number})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className=" text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="duration_long">Longest Duration</SelectItem>
                    <SelectItem value="duration_short">Shortest Duration</SelectItem>
                    <SelectItem value="title_az">Title A-Z</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  onClick={clearAllFilters}
                  variant="outline"
                  className=" text-gray-300 bg-destructive h-12"
                >
                  <FilterX className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              </div>

              {/* Date Range Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">From Date</label>
                  <Input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className=" text-white h-12 "
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">To Date</label>
                  <Input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className=" text-white h-12"
                  />
                </div>
              </div>

              {/* Active Filters Display */}
              {(searchTerm || filters.type !== 'all' || filters.analysisStatus !== 'all' || filters.player !== 'all' || filters.dateFrom || filters.dateTo) && (
                <div className="flex flex-wrap items-center gap-2 p-4  rounded-lg border">
                  <span className="text-sm text-gray-400">Active filters:</span>
                  {searchTerm && (
                    <Badge variant="outline" className="border-bright-pink/50 text-bright-pink">
                      Search: "{searchTerm}"
                    </Badge>
                  )}
                  {filters.type !== 'all' && (
                    <Badge variant="outline" className="border-blue-500/50 text-blue-400">
                      Type: {filters.type}
                    </Badge>
                  )}
                  {filters.analysisStatus !== 'all' && (
                    <Badge variant="outline" className="border-green-500/50 text-green-400">
                      Status: {filters.analysisStatus}
                    </Badge>
                  )}
                  {filters.player !== 'all' && (
                    <Badge variant="outline" className="border-purple-500/50 text-purple-400">
                      Player: {teamPlayers.find(p => p.id === filters.player)?.full_name}
                    </Badge>
                  )}
                  {(filters.dateFrom || filters.dateTo) && (
                    <Badge variant="outline" className="border-yellow-500/50 text-yellow-400">
                      Date Range
                    </Badge>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Video Grid/List */}
          {viewMode === 'list' ? (
            /* Table View */
            <Card className="bg-gray-800 border-gray-700">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-900/50 border-b border-gray-700">
                    <tr>
                      <th className="text-left p-4 text-gray-300 font-medium">Video</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Type</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Status</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Duration</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Tagged Players</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Date</th>
                      <th className="text-left p-4 text-gray-300 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <tr key={index} className="border-b border-gray-700 animate-pulse">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="w-16 h-12 bg-gray-700 rounded"></div>
                              <div className="h-4 bg-gray-700 rounded w-32"></div>
                            </div>
                          </td>
                          <td className="p-4"><div className="h-4 bg-gray-700 rounded w-16"></div></td>
                          <td className="p-4"><div className="h-6 bg-gray-700 rounded w-20"></div></td>
                          <td className="p-4"><div className="h-4 bg-gray-700 rounded w-12"></div></td>
                          <td className="p-4"><div className="h-6 bg-gray-700 rounded w-24"></div></td>
                          <td className="p-4"><div className="h-4 bg-gray-700 rounded w-20"></div></td>
                          <td className="p-4"><div className="h-8 bg-gray-700 rounded w-24"></div></td>
                        </tr>
                      ))
                    ) : filteredVideos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-white mb-2">
                            {videos.length === 0 ? 'No Videos Yet' : 'No Matching Videos'}
                          </h3>
                          <p className="text-gray-400 mb-4">
                            {videos.length === 0
                              ? 'Upload your first video to get started'
                              : 'Try adjusting your search terms or filters'
                            }
                          </p>
                          {videos.length === 0 && (
                            <Button
                              onClick={() => setIsUploadDialogOpen(true)}
                              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Video
                            </Button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      filteredVideos.map((video) => (
                        <tr key={video.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="relative flex-shrink-0">
                                {video.thumbnail_url ? (
                                  <img
                                    src={video.thumbnail_url}
                                    alt={video.title}
                                    className="w-16 h-12 object-cover rounded border border-gray-600"
                                  />
                                ) : (
                                  <div className="w-16 h-12 bg-gray-700 rounded border border-gray-600 flex items-center justify-center">
                                    <Video className="w-6 h-6 text-gray-500" />
                                  </div>
                                )}

                              </div>
                              <div className="min-w-0">
                                <h3 className="text-white font-medium text-sm truncate max-w-xs">
                                  {video.title}
                                </h3>
                                {video.opposing_team && (
                                  <p className="text-gray-400 text-xs">
                                    vs {video.opposing_team}
                                    {video.score_display && (
                                      <span className="ml-1 text-bright-pink">({video.score_display})</span>
                                    )}
                                  </p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                              <span className="flex items-center gap-1">
                                {getVideoTypeIcon(video.video_type)}
                                {video.video_type}
                              </span>
                            </Badge>
                          </td>
                          <td className="p-4">
                            <Badge className={`${getAnalysisStatusColor(video.ai_analysis_status)} text-white text-xs`}>
                              {video.ai_analysis_status}
                            </Badge>
                          </td>
                          <td className="p-4 text-gray-300 text-sm text-center">
                            {video.duration && (
                              <div className="absolute -bottom-1 -right-1 bg-black/80 text-white text-xs px-1 py-0.5 rounded">
                                {formatDuration(video.duration)}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            {video.tags.length > 0 ? (
                              <Select>
                                <SelectTrigger className="w-32 h-8 bg-gray-700 border-gray-600 text-gray-300 text-xs">
                                  <SelectValue placeholder={`${video.tags.length} players`} />
                                </SelectTrigger>
                                <SelectContent>
                                  {video.tags.map((tag, index) => (
                                    <SelectItem key={index} value={tag} className="text-sm">
                                      {tag}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <span className="text-gray-500 text-xs">No tags</span>
                            )}
                          </td>
                          <td className="p-4 text-gray-300 text-sm">
                            {new Date(video.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-1">
                              {video.ai_analysis_status === 'completed' ? (
                                <Button
                                  size="sm"
                                  className="h-8 px-3 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                                  onClick={() => {
                                    setSelectedVideo(video);
                                    setIsAnalysisDialogOpen(true);
                                  }}
                                >
                                  <Eye className="w-3 h-3 mr-1" />
                                  Analyze
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="h-8 px-3 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                                  onClick={() => window.open(video.video_url, '_blank')}
                                >
                                  <Play className="w-3 h-3 mr-1" />
                                  View
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                onClick={() => {
                                  setSelectedVideo(video);
                                  setIsEditDialogOpen(true);
                                }}
                              >
                                <Edit2 className="w-3 h-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                onClick={() => handleDeleteVideo(video.id)}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            /* Grid View */
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {loading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <Card key={index} className="bg-gray-800 border-gray-700 animate-pulse">
                    <div className="aspect-video bg-gray-700 rounded-t-lg" />
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-700 rounded w-3/4" />
                        <div className="h-3 bg-gray-700 rounded w-1/2" />
                        <div className="flex gap-1">
                          <div className="h-6 bg-gray-700 rounded w-16" />
                          <div className="h-6 bg-gray-700 rounded w-12" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : filteredVideos.length === 0 ? (
                <Card className="col-span-full bg-gray-800 border-gray-700">
                  <CardContent className="p-12 text-center">
                    <Video className="w-16 h-16 text-gray-400 mx-auto mb-6" />
                    <h3 className="text-xl font-semibold text-white mb-3">
                      {videos.length === 0 ? 'No Videos Yet' : 'No Matching Videos'}
                    </h3>
                    <p className="text-gray-400 mb-6 max-w-md mx-auto">
                      {videos.length === 0
                        ? 'Upload your first video to get started with AI-powered analysis and insights'
                        : 'Try adjusting your search terms or filters to find the videos you\'re looking for'
                      }
                    </p>
                    {videos.length === 0 && (
                      <Button
                        onClick={() => setIsUploadDialogOpen(true)}
                        className="bg-bright-pink hover:bg-bright-pink/90 text-white px-8 py-3"
                        size="lg"
                      >
                        <Upload className="w-5 h-5 mr-2" />
                        Upload Your First Video
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredVideos.map((video) => (
                  <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-all duration-300 hover:shadow-md hover:shadow-bright-pink/10 group overflow-hidden">
                    <div className="relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-32 bg-gray-700 flex items-center justify-center">
                          <Video className="w-8 h-8 text-gray-500" />
                        </div>
                      )}

                      <div className="absolute top-2 left-2">
                        <Badge className={`${getAnalysisStatusColor(video.ai_analysis_status)} text-white text-xs px-2 py-0.5`}>
                          {video.ai_analysis_status}
                        </Badge>
                      </div>

                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="bg-black/70 text-white text-xs px-2 py-0.5 flex items-center gap-1">
                          {getVideoTypeIcon(video.video_type)}
                          {video.video_type}
                        </Badge>
                      </div>

                      {video.duration && (
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-0.5 rounded">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-white font-medium text-sm mb-1 line-clamp-2 group-hover:text-bright-pink transition-colors leading-tight">
                            {video.title}
                          </h3>

                          {video.opposing_team && (
                            <div className="text-xs text-gray-300 mb-1">
                              vs {video.opposing_team}
                              {video.score_display && (
                                <span className="ml-1 text-bright-pink font-medium">
                                  ({video.score_display})
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-3 text-xs text-gray-400">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(video.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                              })}
                            </div>
                            {video.file_size && (
                              <div className="text-xs">{formatFileSize(video.file_size)}</div>
                            )}
                          </div>
                        </div>

                        {video.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {video.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-400 px-2 py-0.5">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-400 px-2 py-0.5">
                                +{video.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}

                        <div className="flex gap-1 pt-1">
                          {video.ai_analysis_status === 'completed' ? (
                            <Button
                              size="sm"
                              className="flex-1 h-8 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                              onClick={() => {
                                setSelectedVideo(video);
                                setIsAnalysisDialogOpen(true);
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Analyze
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 h-8 border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                              onClick={() => window.open(video.video_url, '_blank')}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              View
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => {
                              setSelectedVideo(video);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-3 h-3" />
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            onClick={() => handleDeleteVideo(video.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Video Analytics</h3>
              <p className="text-gray-400">Detailed analytics and insights about your video content</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Tags & Labels</h3>
              <p className="text-gray-400">Manage video tags and categorization</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Video Settings</h3>
              <p className="text-gray-400">Configure video management preferences</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Upload Video Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Upload New Video</DialogTitle>
          </DialogHeader>
          {teamId && (
            <EnhancedVideoUploadForm
              teamId={teamId}
              onUploadComplete={handleUploadComplete}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Video Analysis Dialog */}
      {selectedVideo && (
        <Dialog open={isAnalysisDialogOpen} onOpenChange={setIsAnalysisDialogOpen}>
          <DialogContent className="border-0 max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedVideo.title}</DialogTitle>
            </DialogHeader>
            {teamId && (
              <VideoAnalysisResults
                analysisResult={null} // This should be the actual analysis result
                videoMetadata={{
                  title: selectedVideo.title,
                  videoType: selectedVideo.video_type || 'match',
                  sport: 'football' // Default sport, should be configurable
                }}
              />
            )}
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Video Dialog */}
      {selectedVideo && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Video Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Video Title"
                defaultValue={selectedVideo.title}
                className="bg-gray-700 border-gray-600 text-white"
                onChange={(e) => setSelectedVideo(prev => prev ? { ...prev, title: e.target.value } : null)}
              />

              <Textarea
                placeholder="Description"
                defaultValue={selectedVideo.description || ''}
                className="bg-gray-700 border-gray-600 text-white"
                onChange={(e) => setSelectedVideo(prev => prev ? { ...prev, description: e.target.value } : null)}
              />

              <div className="flex gap-2">
                <Button
                  onClick={() => selectedVideo && handleUpdateVideo(selectedVideo)}
                  className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                >
                  Save Changes
                </Button>
                <Button
                  onClick={() => setIsEditDialogOpen(false)}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedVideoManagement;