
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Video, Play, Upload, Search, Filter, Calendar, 
  User, Tag, Trash2, Edit, Eye, BarChart3
} from 'lucide-react';
import VideoUploadForm from './VideoUploadForm';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  opposing_team?: string;
  score?: string;
  match_date?: string;
  home_or_away?: string;
  video_type: string;
  tags?: string[];
  tagged_players?: any[];
  duration: number;
  file_size?: number;
  upload_status: string;
  ai_analysis_status: string;
  created_at: string;
  players: Array<{
    id: string;
    full_name: string;
    position: string;
  }>;
}

const VideoManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [filterType, setFilterType] = useState('');
  const [availablePlayers, setAvailablePlayers] = useState<Array<{id: string; full_name: string; position: string}>>([]);
  const [allTags, setAllTags] = useState<string[]>([]);

  useEffect(() => {
    fetchVideos();
    fetchPlayers();
  }, [profile]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, filterPlayer, filterTag, filterType]);

  const fetchVideos = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!team) return;

      const { data: videosData, error } = await supabase
        .from('videos')
        .select(`
          *,
          players:players!inner(
            id,
            full_name,
            position
          )
        `)
        .eq('team_id', team.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process videos to get unique tags
      const tags = new Set<string>();
      const processedVideos = videosData?.map(video => {
        if (video.tags) {
          video.tags.forEach(tag => tags.add(tag));
        }
        return {
          ...video,
          players: video.tagged_players 
            ? videosData.filter(v => v.id === video.id).flatMap(v => 
                v.tagged_players?.map(playerId => 
                  availablePlayers.find(p => p.id === playerId)
                ).filter(Boolean) || []
              )
            : []
        };
      }) || [];

      setVideos(processedVideos);
      setAllTags(Array.from(tags));
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to fetch videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    if (!profile) return;

    try {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!team) return;

      const { data: players } = await supabase
        .from('players')
        .select('id, full_name, position')
        .eq('team_id', team.id);

      setAvailablePlayers(players || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Search by title, description, or opposing team
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.opposing_team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by player
    if (filterPlayer) {
      filtered = filtered.filter(video =>
        video.tagged_players?.includes(filterPlayer) ||
        video.players?.some(player => player.id === filterPlayer)
      );
    }

    // Filter by tag
    if (filterTag) {
      filtered = filtered.filter(video =>
        video.tags?.includes(filterTag)
      );
    }

    // Filter by type
    if (filterType) {
      filtered = filtered.filter(video =>
        video.video_type === filterType
      );
    }

    setFilteredVideos(filtered);
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(v => v.id !== videoId));
      
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video",
        variant: "destructive"
      });
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown size';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatDuration = (seconds: number) => {
    if (seconds === 0) return 'Unknown';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500';
      case 'processing':
        return 'bg-yellow-500';
      case 'analyzing':
        return 'bg-blue-500';
      case 'failed':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (showUploadForm) {
    return <VideoUploadForm onClose={() => setShowUploadForm(false)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-polysans">Video Management</h1>
          <p className="text-gray-400 mt-1">Manage your team's match videos and highlights</p>
        </div>
        
        <Button
          onClick={() => setShowUploadForm(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-black font-semibold"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600"
              />
            </div>

            <Select value={filterPlayer} onValueChange={setFilterPlayer}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by Player" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Players</SelectItem>
                {availablePlayers.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterTag} onValueChange={setFilterTag}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Tags</SelectItem>
                {allTags.map(tag => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Filter by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
                <SelectItem value="full_match">Full Match</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="analysis">Analysis</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterPlayer('');
                setFilterTag('');
                setFilterType('');
              }}
              className="border-gray-600 hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Videos Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-gray-800">
              <div className="h-48 bg-gray-700 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded mb-4"></div>
                <div className="flex gap-2">
                  <div className="h-6 bg-gray-700 rounded flex-1"></div>
                  <div className="h-6 bg-gray-700 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredVideos.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No Videos Found</h3>
            <p className="text-gray-400 mb-4">
              {videos.length === 0 
                ? "You haven't uploaded any videos yet. Get started by uploading your first match video."
                : "No videos match your current filters. Try adjusting your search criteria."
              }
            </p>
            {videos.length === 0 && (
              <Button
                onClick={() => setShowUploadForm(true)}
                className="bg-rosegold hover:bg-rosegold/90 text-black"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Your First Video
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-colors">
              <div className="relative">
                <div className="h-48 bg-gray-900 rounded-t-lg flex items-center justify-center">
                  {video.thumbnail_url ? (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-full h-full object-cover rounded-t-lg"
                    />
                  ) : (
                    <Video className="w-12 h-12 text-gray-500" />
                  )}
                </div>
                
                {/* Status Indicators */}
                <div className="absolute top-2 right-2 flex gap-1">
                  <Badge
                    variant="secondary"
                    className={`${getStatusColor(video.upload_status)} text-white text-xs`}
                  >
                    {video.upload_status}
                  </Badge>
                  {video.ai_analysis_status === 'completed' && (
                    <Badge variant="secondary" className="bg-blue-500 text-white text-xs">
                      <BarChart3 className="w-3 h-3 mr-1" />
                      AI
                    </Badge>
                  )}
                </div>
              </div>

              <CardContent className="p-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-bold text-white text-lg font-polysans line-clamp-1">
                      {video.title}
                    </h3>
                    {video.description && (
                      <p className="text-gray-400 text-sm font-poppins line-clamp-2 mt-1">
                        {video.description}
                      </p>
                    )}
                  </div>

                  {/* Match Details */}
                  {video.opposing_team && (
                    <div className="flex items-center text-sm text-gray-300">
                      <span>vs {video.opposing_team}</span>
                      {video.score && <span className="ml-2 text-rosegold">({video.score})</span>}
                    </div>
                  )}

                  {/* Video Info */}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{formatDuration(video.duration)}</span>
                    <span>{formatFileSize(video.file_size)}</span>
                    <span>{video.video_type}</span>
                  </div>

                  {/* Tags */}
                  {video.tags && video.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.tags.slice(0, 3).map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          <Tag className="w-3 h-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                      {video.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{video.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Tagged Players */}
                  {video.players && video.players.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.players.slice(0, 2).map(player => (
                        <Badge key={player.id} variant="secondary" className="text-xs">
                          <User className="w-3 h-3 mr-1" />
                          {player.full_name}
                        </Badge>
                      ))}
                      {video.players.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{video.players.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      size="sm"
                      className="flex-1 bg-rosegold hover:bg-rosegold/90 text-black"
                      onClick={() => window.open(video.video_url, '_blank')}
                    >
                      <Play className="w-4 h-4 mr-1" />
                      Play
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 hover:bg-gray-700"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteVideo(video.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats Footer */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Total Videos: {videos.length}</span>
            <span>Filtered Results: {filteredVideos.length}</span>
            <span>AI Analyzed: {videos.filter(v => v.ai_analysis_status === 'completed').length}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VideoManagement;
