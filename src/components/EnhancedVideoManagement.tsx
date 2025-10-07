import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Plus,
  Search,
  Filter,
  Grid3X3,
  List,
  Play,
  Clock,
  Calendar,
  Users,
  BarChart3,
  Tags,
  Eye,
  Trash2,
  Edit3,
  Download,
  Share2,
  Zap,
  TrendingUp,
  Target,
  Award
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { SmartThumbnail } from './SmartThumbnail';
import EnhancedVideoUploadForm from './EnhancedVideoUploadForm';
import { usePlayersData } from '@/hooks/usePlayersData';
import PlayerTagDisplay from './PlayerTagDisplay';

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
}

interface Team {
  id: string;
  team_name: string;
  profile_id: string;
}

interface TeamPlayer {
  id: string;
  full_name: string;
  position: string;
  jersey_number?: number;
}

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'duration_asc' | 'duration_desc';

const EnhancedVideoManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string>('');
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [deleteConfirmVideo, setDeleteConfirmVideo] = useState<Video | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    video_type: 'match' as 'match' | 'training' | 'interview' | 'highlight',
    playerTags: [] as string[],
    matchDetails: {
      opposingTeam: '',
      matchDate: '',
      league: '',
      homeOrAway: 'home' as 'home' | 'away',
      homeScore: '',
      awayScore: '',
      venue: ''
    }
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Get unique players from all video tags
  const allPlayers = Array.from(new Set(videos.flatMap(video => video.tags || [])));

  // Fetch player data for all tagged players
  const { players: allPlayersData, loading: playersLoading } = usePlayersData(allPlayers);

  // Helper function to get player data for a specific video
  const getPlayersForVideo = (videoTags: string[]) => {
    return allPlayersData.filter(player => videoTags.includes(player.id));
  };

  useEffect(() => {
    fetchUserTeams();
  }, []);

  useEffect(() => {
    if (currentTeamId) {
      fetchVideos();
      fetchTeamPlayers();
    }
  }, [currentTeamId]);

  useEffect(() => {
    applyFilters();
  }, [videos, searchTerm, selectedType, selectedPlayer, sortBy]);

  const fetchUserTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: teamsData, error } = await supabase
        .from('teams')
        .select('id, team_name, profile_id')
        .eq('profile_id', profile.id);

      if (error) throw error;

      setTeams(teamsData || []);
      if (teamsData && teamsData.length > 0) {
        setCurrentTeamId(teamsData[0].id);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error",
        description: "Failed to load teams",
        variant: "destructive"
      });
    }
  };

  const fetchVideos = async () => {
    if (!currentTeamId) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', currentTeamId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const mappedVideos: Video[] = (data || []).map(video => ({
        id: video.id,
        title: video.title,
        video_url: video.video_url,
        thumbnail_url: video.thumbnail_url,
        duration: video.duration,
        video_type: video.video_type as 'match' | 'training' | 'interview' | 'highlight',
        description: video.description,
        tags: Array.isArray(video.tagged_players)
          ? video.tagged_players.map((tag: any) => String(tag))
          : [],
        ai_analysis_status: (video.ai_analysis_status === 'pending' ||
          video.ai_analysis_status === 'analyzing' ||
          video.ai_analysis_status === 'completed' ||
          video.ai_analysis_status === 'failed')
          ? video.ai_analysis_status
          : 'pending',
        created_at: video.created_at,
        opposing_team: video.opposing_team,
        match_date: video.match_date,
        score: video.score_display || undefined,
        league_competition: video.league || undefined
      }));

      setVideos(mappedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTeamPlayers = async () => {
    if (!currentTeamId) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, position, jersey_number')
        .eq('team_id', currentTeamId)
        .order('full_name');

      if (error) throw error;
      setTeamPlayers(data || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
      toast({
        title: "Error",
        description: "Failed to load team players",
        variant: "destructive"
      });
    }
  };

  const applyFilters = () => {
    let filtered = [...videos];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.opposing_team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (selectedType !== 'all') {
      filtered = filtered.filter(video => video.video_type === selectedType);
    }


    // Player filter
    if (selectedPlayer !== 'all') {
      filtered = filtered.filter(video => video.tags.includes(selectedPlayer));
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'title_asc':
          return a.title.localeCompare(b.title);
        case 'title_desc':
          return b.title.localeCompare(a.title);
        case 'duration_asc':
          return a.duration - b.duration;
        case 'duration_desc':
          return b.duration - a.duration;
        default:
          return 0;
      }
    });

    setFilteredVideos(filtered);
  };

  const handleVideoClick = (video: Video) => {
    navigate(`/videos/${encodeURIComponent(video.title)}`);
  };

  const handleUploadComplete = () => {
    setShowUploadForm(false);
    fetchVideos();
    toast({
      title: "Success",
      description: "Video uploaded successfully!",
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };


  const isLocalhostUrl = (url: string) => {
    return url.includes('localhost') || url.includes('127.0.0.1') || url.includes('::1');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'match': return <Target className="w-4 h-4" />;
      case 'training': return <TrendingUp className="w-4 h-4" />;
      case 'interview': return <Users className="w-4 h-4" />;
      case 'highlight': return <Award className="w-4 h-4" />;
      default: return <Play className="w-4 h-4" />;
    }
  };

  const handleEditVideo = (video: Video) => {
    setEditingVideo(video);

    // Parse score if it exists (format: "homeScore-awayScore")
    const scoreParts = video.score?.split('-') || ['', ''];

    setEditForm({
      title: video.title,
      description: video.description || '',
      video_type: video.video_type,
      playerTags: [...video.tags],
      matchDetails: {
        opposingTeam: video.opposing_team || '',
        matchDate: video.match_date || '',
        league: video.league_competition || '',
        homeOrAway: 'home', // Default value, could be enhanced to detect from data
        homeScore: scoreParts[0] || '',
        awayScore: scoreParts[1] || '',
        venue: '' // Not stored in current video structure
      }
    });
  };

  const handleDeleteVideo = async (videoId: string) => {
    if (!deleteConfirmVideo) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      // Remove video from state
      setVideos(prev => prev.filter(v => v.id !== videoId));
      setDeleteConfirmVideo(null);

      toast({
        title: "Success",
        description: "Video deleted successfully!",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleUpdateVideo = async () => {
    if (!editingVideo) return;

    try {
      setIsUpdating(true);
      const { error } = await supabase
        .from('videos')
        .update({
          title: editForm.title,
          description: editForm.description,
          video_type: editForm.video_type,
          tagged_players: editForm.playerTags,
          opposing_team: editForm.matchDetails.opposingTeam || null,
          match_date: editForm.matchDetails.matchDate || null,
          score_display: editForm.matchDetails.homeScore && editForm.matchDetails.awayScore
            ? `${editForm.matchDetails.homeScore}-${editForm.matchDetails.awayScore}`
            : null,
          league: editForm.matchDetails.league || null
        })
        .eq('id', editingVideo.id);

      if (error) throw error;

      // Update video in state
      setVideos(prev => prev.map(v =>
        v.id === editingVideo.id
          ? {
            ...v,
            title: editForm.title,
            description: editForm.description,
            video_type: editForm.video_type,
            tags: editForm.playerTags,
            opposing_team: editForm.matchDetails.opposingTeam,
            match_date: editForm.matchDetails.matchDate,
            score: editForm.matchDetails.homeScore && editForm.matchDetails.awayScore
              ? `${editForm.matchDetails.homeScore}-${editForm.matchDetails.awayScore}`
              : undefined,
            league_competition: editForm.matchDetails.league
          }
          : v
      ));

      setEditingVideo(null);

      toast({
        title: "Success",
        description: "Video updated successfully!",
      });
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };


  if (showUploadForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-polysans text-white">Upload New Video</h2>
          <Button
            onClick={() => setShowUploadForm(false)}
            variant="outline"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancel
          </Button>
        </div>
        <EnhancedVideoUploadForm
          teamId={currentTeamId}
          onUploadComplete={() => handleUploadComplete()}
          onCancel={() => setShowUploadForm(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-polysans text-white">Video Management</h2>
        <Button
          onClick={() => setShowUploadForm(true)}
          className="bg-bright-pink hover:bg-bright-pink/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      <Tabs defaultValue="videos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 border-gray-700">
          <TabsTrigger value="videos" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
            <Play className="w-4 h-4 mr-2" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="tags" className="data-[state=active]:bg-bright-pink data-[state=active]:text-white">
            <Tags className="w-4 h-4 mr-2" />
            Tags & Labels
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-4 flex-1">
                  {/* Search */}
                  <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Search videos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>

                  {/* Filters */}
                  <div className="flex gap-2">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="match">Match</SelectItem>
                        <SelectItem value="training">Training</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="highlight">Highlight</SelectItem>
                      </SelectContent>
                    </Select>


                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger className="w-36 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="All Players" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        {allPlayersData.map((player) => (
                          <SelectItem key={player.id} value={player.id}>
                            <div className="flex items-center gap-2">
                              <span>{player.full_name || player.id}</span>
                              {player.jersey_number && (
                                <Badge className="bg-bright-pink text-white text-xs px-1.5 py-0.5 font-bold">
                                  #{player.jersey_number}
                                </Badge>
                              )}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                      <SelectTrigger className="w-36 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Newest First" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newest">Newest First</SelectItem>
                        <SelectItem value="oldest">Oldest First</SelectItem>
                        <SelectItem value="title_asc">Title A-Z</SelectItem>
                        <SelectItem value="title_desc">Title Z-A</SelectItem>
                        <SelectItem value="duration_asc">Shortest First</SelectItem>
                        <SelectItem value="duration_desc">Longest First</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className={viewMode === 'grid' ? 'bg-bright-pink hover:bg-bright-pink/90' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                    className={viewMode === 'list' ? 'bg-bright-pink hover:bg-bright-pink/90' : 'border-gray-600 text-gray-300 hover:bg-gray-700'}
                  >
                    <List className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-bright-pink mx-auto mb-4"></div>
                <p className="text-gray-400">Loading videos...</p>
              </div>
            </div>
          ) : filteredVideos.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-12 text-center">
                <Play className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No Videos Found</h3>
                <p className="text-gray-400 mb-4">
                  {videos.length === 0
                    ? "Upload your first video to get started"
                    : "Try adjusting your filters to see more videos"
                  }
                </p>
                {videos.length === 0 && (
                  <Button
                    onClick={() => setShowUploadForm(true)}
                    className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              : "space-y-4"
            }>
              {filteredVideos.map((video) => (
                <Card
                  key={video.id}
                  className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors cursor-pointer"
                  onClick={() => handleVideoClick(video)}
                >
                  {viewMode === 'grid' ? (
                    <CardContent className="p-0">
                      <div className="relative aspect-video bg-gray-900 rounded-t-lg overflow-hidden">
                        <SmartThumbnail
                          thumbnailUrl={video.thumbnail_url}
                          title={video.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                          {formatDuration(video.duration)}
                        </div>
                        <div className="absolute top-2 left-2 flex flex-col gap-1">
                          {isLocalhostUrl(video.video_url) && (
                            <Badge className="bg-red-900/20 text-red-400 border-red-500/30 border">
                              Invalid URL
                            </Badge>
                          )}
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm line-clamp-2 flex-1">{video.title}</h3>
                          <div className="flex items-center gap-1 ml-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditVideo(video);
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteConfirmVideo(video);
                              }}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {formatDate(video.created_at)}
                          </span>
                          <span className="capitalize">{video.video_type}</span>
                        </div>

                        {video.tags.length > 0 && (
                          <div className="mt-2">
                            <PlayerTagDisplay
                              players={getPlayersForVideo(video.tags)}
                              loading={playersLoading}
                              size="sm"
                              showJerseyNumber={true}
                              showTeamInfo={false}
                              className="text-xs"
                            />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                          <SmartThumbnail
                            thumbnailUrl={video.thumbnail_url}
                            title={video.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-0 right-0 bg-black/80 text-white px-1 text-xs">
                            {formatDuration(video.duration)}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-white truncate flex-1">{video.title}</h3>
                            <div className="flex items-center gap-2 ml-2">
                              {getTypeIcon(video.video_type)}
                              {isLocalhostUrl(video.video_url) && (
                                <Badge className="bg-red-900/20 text-red-400 border-red-500/30 border text-xs">
                                  Invalid URL
                                </Badge>
                              )}
                              <div className="flex items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditVideo(video);
                                  }}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-white hover:bg-gray-700"
                                >
                                  <Edit3 className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteConfirmVideo(video);
                                  }}
                                  className="h-6 w-6 p-0 text-gray-400 hover:text-red-400 hover:bg-gray-700"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(video.created_at)}
                            </span>
                            <span className="capitalize">{video.video_type}</span>
                            {video.opposing_team && (
                              <span>vs {video.opposing_team}</span>
                            )}
                          </div>

                          {video.tags.length > 0 && (
                            <div className="mt-2">
                              <PlayerTagDisplay
                                players={getPlayersForVideo(video.tags)}
                                loading={playersLoading}
                                size="sm"
                                showJerseyNumber={true}
                                showTeamInfo={false}
                                className="text-xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Video Analytics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-bright-pink">{videos.length}</div>
                  <div className="text-gray-400">Total Videos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {videos.filter(v => v.ai_analysis_status === 'completed').length}
                  </div>
                  <div className="text-gray-400">Analyzed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Math.round(videos.reduce((acc, v) => acc + v.duration, 0) / 60)}
                  </div>
                  <div className="text-gray-400">Total Minutes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tags" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Tags className="w-5 h-5" />
                Player Tags
              </CardTitle>
            </CardHeader>
            <CardContent>
              {playersLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-bright-pink"></div>
                  <span className="ml-3 text-gray-400">Loading players...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {allPlayersData.map((player) => {
                    const videoCount = videos.filter(v => v.tags.includes(player.id)).length;
                    return (
                      <div key={player.id} className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                            {player.headshot_url || player.photo_url ? (
                              <img
                                src={player.headshot_url || player.photo_url || ''}
                                alt={player.full_name || 'Player'}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-white font-semibold text-sm">
                                {player.full_name?.slice(0, 2).toUpperCase() || '??'}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-white font-medium">{player.full_name || 'Unknown Player'}</h4>
                              {player.jersey_number && (
                                <Badge className="bg-bright-pink text-white text-xs px-2 py-0.5 font-bold">
                                  #{player.jersey_number}
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-400 text-sm">{player.position || 'Unknown Position'}</p>
                          </div>
                        </div>
                        <Badge className="bg-bright-pink/20 text-bright-pink border-bright-pink/30">
                          {videoCount} video{videoCount !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    );
                  })}
                  {allPlayersData.length === 0 && (
                    <div className="text-center py-8">
                      <Tags className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-400">No players tagged in any videos</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Video Dialog */}
      <Dialog open={!!editingVideo} onOpenChange={() => setEditingVideo(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Video</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title" className="text-white">Title *</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm(prev => ({ ...prev, title: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  placeholder="Enter video title"
                />
              </div>

              <div>
                <Label htmlFor="edit-description" className="text-white">Description</Label>
                <Textarea
                  id="edit-description"
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-gray-700 border-gray-600 text-white"
                  rows={3}
                  placeholder="Enter video description"
                />
              </div>

              <div>
                <Label htmlFor="edit-type" className="text-white">Video Type *</Label>
                <Select
                  value={editForm.video_type}
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, video_type: value as any }))}
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="highlight">Highlight</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Player Tags */}
            <div>
              <Label className="text-white">Tag Players</Label>
              <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto bg-gray-700/50 rounded-lg p-3">
                {teamPlayers.map((player) => (
                  <div key={player.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`edit-player-${player.id}`}
                      checked={editForm.playerTags.includes(player.id)}
                      onCheckedChange={(checked) => {
                        const newTags = checked
                          ? [...editForm.playerTags, player.id]
                          : editForm.playerTags.filter(id => id !== player.id);
                        setEditForm(prev => ({ ...prev, playerTags: newTags }));
                      }}
                    />
                    <label
                      htmlFor={`edit-player-${player.id}`}
                      className="text-sm text-white cursor-pointer"
                    >
                      {player.full_name} ({player.position})
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Match Details (if video type is match) */}
            {editForm.video_type === 'match' && (
              <div className="space-y-3">
                <Label className="text-white">Match Details</Label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="edit-opposing-team" className="text-white text-sm">Opposing Team *</Label>
                    <Input
                      id="edit-opposing-team"
                      value={editForm.matchDetails.opposingTeam}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, opposingTeam: e.target.value }
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Team name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-match-date" className="text-white text-sm">Match Date *</Label>
                    <Input
                      id="edit-match-date"
                      type="date"
                      value={editForm.matchDetails.matchDate}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, matchDate: e.target.value }
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-league" className="text-white text-sm">League *</Label>
                    <Input
                      id="edit-league"
                      value={editForm.matchDetails.league}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, league: e.target.value }
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="League name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-home-away" className="text-white text-sm">Home/Away</Label>
                    <Select
                      value={editForm.matchDetails.homeOrAway}
                      onValueChange={(value) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, homeOrAway: value as 'home' | 'away' }
                      }))}
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        <SelectItem value="away">Away</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-home-score" className="text-white text-sm">Home Score *</Label>
                    <Input
                      id="edit-home-score"
                      type="number"
                      min="0"
                      value={editForm.matchDetails.homeScore}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, homeScore: e.target.value }
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-away-score" className="text-white text-sm">Away Score *</Label>
                    <Input
                      id="edit-away-score"
                      type="number"
                      min="0"
                      value={editForm.matchDetails.awayScore}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, awayScore: e.target.value }
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="0"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="edit-venue" className="text-white text-sm">Venue</Label>
                    <Input
                      id="edit-venue"
                      value={editForm.matchDetails.venue}
                      onChange={(e) => setEditForm(prev => ({
                        ...prev,
                        matchDetails: { ...prev.matchDetails, venue: e.target.value }
                      }))}
                      className="bg-gray-700 border-gray-600 text-white"
                      placeholder="Stadium name"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingVideo(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateVideo}
              disabled={isUpdating || !editForm.title.trim()}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              {isUpdating ? "Updating..." : "Update Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmVideo} onOpenChange={() => setDeleteConfirmVideo(null)}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Video</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <p className="text-gray-300">
              Are you sure you want to delete "{deleteConfirmVideo?.title}"? This action cannot be undone.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmVideo(null)}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              onClick={() => deleteConfirmVideo && handleDeleteVideo(deleteConfirmVideo.id)}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? "Deleting..." : "Delete Video"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedVideoManagement;
