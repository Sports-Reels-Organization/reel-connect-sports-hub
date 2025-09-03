import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
import EnhancedVideoUploadForm from './EnhancedVideoUploadForm';

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

type ViewMode = 'grid' | 'list';
type SortOption = 'newest' | 'oldest' | 'title_asc' | 'title_desc' | 'duration_asc' | 'duration_desc';

const EnhancedVideoManagement = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<Video[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<Video[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamId, setCurrentTeamId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedPlayer, setSelectedPlayer] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  
  // Get unique players from all video tags
  const allPlayers = Array.from(new Set(videos.flatMap(video => video.tags || [])));

  useEffect(() => {
    fetchUserTeams();
  }, []);

  useEffect(() => {
    if (currentTeamId) {
      fetchVideos();
    }
  }, [currentTeamId]);

  useEffect(() => {
    applyFilters();
  }, [videos, searchTerm, selectedType, selectedStatus, selectedPlayer, sortBy]);

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

    // Status filter
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(video => video.ai_analysis_status === selectedStatus);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-900/20 text-green-400';
      case 'analyzing': return 'bg-blue-900/20 text-blue-400';
      case 'failed': return 'bg-red-900/20 text-red-400';
      default: return 'bg-gray-900/20 text-gray-400';
    }
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

                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="w-32 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="analyzing">Analyzing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={selectedPlayer} onValueChange={setSelectedPlayer}>
                      <SelectTrigger className="w-36 bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="All Players" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Players</SelectItem>
                        {allPlayers.map((player) => (
                          <SelectItem key={player} value={player}>
                            {player}
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
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Play className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                        <div className="absolute bottom-2 right-2 bg-black/80 text-white px-2 py-1 rounded text-sm">
                          {formatDuration(video.duration)}
                        </div>
                        <div className="absolute top-2 left-2">
                          <Badge className={`${getStatusColor(video.ai_analysis_status)} border-0`}>
                            {video.ai_analysis_status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-sm line-clamp-2">{video.title}</h3>
                          <div className="flex items-center text-gray-400 ml-2">
                            {getTypeIcon(video.video_type)}
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
                          <div className="flex flex-wrap gap-1 mt-2">
                            {video.tags.slice(0, 2).map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                {tag}
                              </Badge>
                            ))}
                            {video.tags.length > 2 && (
                              <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                +{video.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  ) : (
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        <div className="relative w-24 h-16 bg-gray-900 rounded overflow-hidden flex-shrink-0">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-600" />
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 bg-black/80 text-white px-1 text-xs">
                            {formatDuration(video.duration)}
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-white truncate">{video.title}</h3>
                            <div className="flex items-center gap-2 ml-2">
                              {getTypeIcon(video.video_type)}
                              <Badge className={`${getStatusColor(video.ai_analysis_status)} border-0 text-xs`}>
                                {video.ai_analysis_status}
                              </Badge>
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
                            <div className="flex flex-wrap gap-1">
                              {video.tags.slice(0, 3).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs border-gray-600 text-gray-300">
                                  {tag}
                                </Badge>
                              ))}
                              {video.tags.length > 3 && (
                                <Badge variant="outline" className="text-xs border-gray-600 text-gray-300">
                                  +{video.tags.length - 3}
                                </Badge>
                              )}
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
              <div className="flex flex-wrap gap-2">
                {allPlayers.map((player) => (
                  <Badge key={player} className="bg-bright-pink/20 text-bright-pink border-bright-pink/30">
                    {player}
                    <span className="ml-2 text-xs">
                      ({videos.filter(v => v.tags.includes(player)).length})
                    </span>
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedVideoManagement;
