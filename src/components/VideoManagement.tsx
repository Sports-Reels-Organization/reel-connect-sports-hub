
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Play, Upload, Filter, Search, Eye, Calendar, 
  Clock, Users, Tag, BarChart3, Trash2, 
  Video, Download, Share, Brain
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import EnhancedVideoAnalysis from './EnhancedVideoAnalysis';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration?: number;
  match_date?: string;
  created_at: string;
  tagged_players: any[];
  ai_analysis_status: string;
  upload_status: string;
  tags: string[];
  opposing_team?: string;
  score?: string;
  file_size?: number;
  compressed_url?: string;
  players?: any[];
}

interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  photo_url?: string;
}

const VideoManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<VideoData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    if (profile) {
      fetchVideos();
      fetchPlayers();
    }
  }, [profile]);

  useEffect(() => {
    filterVideos();
  }, [videos, searchTerm, filterPlayer, filterStatus, filterTag, activeTab]);

  const fetchVideos = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      // Get team ID
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          players:tagged_players
        `)
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Process videos to handle tagged_players properly
      const processedVideos = (data || []).map(video => ({
        ...video,
        tagged_players: Array.isArray(video.tagged_players) 
          ? video.tagged_players 
          : video.tagged_players 
          ? [video.tagged_players] 
          : [],
        tags: Array.isArray(video.tags) ? video.tags : [],
        players: [] // Will be populated when needed
      }));

      setVideos(processedVideos);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load videos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayers = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data, error } = await supabase
        .from('players')
        .select('id, full_name, position, photo_url')
        .eq('team_id', teamData.id);

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const filterVideos = () => {
    let filtered = videos;

    // Filter by tab
    if (activeTab === 'analyzed') {
      filtered = filtered.filter(video => video.ai_analysis_status === 'completed');
    } else if (activeTab === 'pending') {
      filtered = filtered.filter(video => 
        video.ai_analysis_status === 'pending' || video.upload_status === 'processing'
      );
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.opposing_team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Player filter
    if (filterPlayer) {
      filtered = filtered.filter(video =>
        video.tagged_players.includes(filterPlayer)
      );
    }

    // Status filter
    if (filterStatus) {
      filtered = filtered.filter(video => video.ai_analysis_status === filterStatus);
    }

    // Tag filter
    if (filterTag) {
      filtered = filtered.filter(video =>
        video.tags.includes(filterTag)
      );
    }

    setFilteredVideos(filtered);
  };

  const startVideoAnalysis = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from('videos')
        .update({ ai_analysis_status: 'analyzing' })
        .eq('id', videoId);

      if (error) throw error;

      // Find video and start analysis
      const video = videos.find(v => v.id === videoId);
      if (video) {
        setSelectedVideo(video);
        setShowAnalysis(true);
      }

      toast({
        title: "Analysis Started",
        description: "AI analysis has begun for this video",
      });
    } catch (error) {
      console.error('Error starting analysis:', error);
      toast({
        title: "Error",
        description: "Failed to start video analysis",
        variant: "destructive"
      });
    }
  };

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      setVideos(prev => prev.filter(video => video.id !== videoId));
      
      toast({
        title: "Video Deleted",
        description: "Video has been successfully deleted",
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

  const getPlayerName = (playerId: string) => {
    const player = players.find(p => p.id === playerId);
    return player?.full_name || 'Unknown Player';
  };

  const getAnalysisStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'analyzing': return 'bg-yellow-500 text-black';
      case 'failed': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown';
    const MB = bytes / (1024 * 1024);
    return MB > 1 ? `${MB.toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;
  };

  if (showAnalysis && selectedVideo) {
    return (
      <EnhancedVideoAnalysis
        videoId={selectedVideo.id}
        videoUrl={selectedVideo.video_url}
        videoTitle={selectedVideo.title}
        videoMetadata={{
          playerTags: selectedVideo.tagged_players,
          matchDetails: {
            opposingTeam: selectedVideo.opposing_team || 'Unknown',
            matchDate: selectedVideo.match_date || new Date().toISOString().split('T')[0],
            finalScore: selectedVideo.score || '0-0'
          },
          duration: selectedVideo.duration || 0,
          videoDescription: selectedVideo.description
        }}
        onClose={() => {
          setShowAnalysis(false);
          setSelectedVideo(null);
          fetchVideos(); // Refresh to get updated analysis status
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white font-polysans flex items-center gap-2">
            <Video className="w-8 h-8 text-bright-pink" />
            Video Management
          </h2>
          <p className="text-gray-400 mt-1">
            Manage and analyze your team's video content
          </p>
        </div>

        <Button className="bg-bright-pink hover:bg-bright-pink/90 text-white">
          <Upload className="w-4 h-4 mr-2" />
          Upload New Video
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="all">All Videos ({videos.length})</TabsTrigger>
          <TabsTrigger value="analyzed">
            Analyzed ({videos.filter(v => v.ai_analysis_status === 'completed').length})
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({videos.filter(v => v.ai_analysis_status === 'pending' || v.upload_status === 'processing').length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <div className="mt-6">
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
                    {players.map((player) => (
                      <SelectItem key={player.id} value={player.id}>
                        {player.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Analysis Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Status</SelectItem>
                    <SelectItem value="completed">Analyzed</SelectItem>
                    <SelectItem value="analyzing">Analyzing</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterTag} onValueChange={setFilterTag}>
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue placeholder="Filter by Tag" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Tags</SelectItem>
                    <SelectItem value="highlight">Highlights</SelectItem>
                    <SelectItem value="training">Training</SelectItem>
                    <SelectItem value="match">Match</SelectItem>
                    <SelectItem value="skills">Skills</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setFilterPlayer('');
                    setFilterStatus('');
                    setFilterTag('');
                  }}
                  className="border-gray-600"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Video Grid */}
        <TabsContent value={activeTab} className="space-y-4">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse bg-gray-800">
                  <CardContent className="p-4">
                    <div className="h-48 bg-gray-700 rounded mb-4"></div>
                    <div className="h-4 bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredVideos.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-12 text-center">
                <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Videos Found
                </h3>
                <p className="text-gray-400">
                  Upload your first video or adjust your filters to find videos.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredVideos.map((video) => (
                <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-0">
                    {/* Video Thumbnail */}
                    <div className="relative">
                      <div className="h-48 bg-gray-900 rounded-t-lg overflow-hidden">
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-12 h-12 text-gray-600" />
                          </div>
                        )}
                        
                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Button
                            size="lg"
                            className="rounded-full bg-white/20 hover:bg-white/30"
                            onClick={() => {
                              setSelectedVideo(video);
                              setShowAnalysis(true);
                            }}
                          >
                            <Play className="w-8 h-8 text-white" />
                          </Button>
                        </div>

                        {/* Duration Badge */}
                        {video.duration && (
                          <Badge className="absolute bottom-2 right-2 bg-black/60 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {/* Title and Description */}
                      <div>
                        <h3 className="font-polysans font-bold text-white text-lg line-clamp-1">
                          {video.title}
                        </h3>
                        {video.description && (
                          <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                            {video.description}
                          </p>
                        )}
                      </div>

                      {/* Match Info */}
                      {video.opposing_team && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Users className="w-3 h-3" />
                          <span>vs {video.opposing_team}</span>
                          {video.score && (
                            <Badge variant="outline" className="text-xs">
                              {video.score}
                            </Badge>
                          )}
                        </div>
                      )}

                      {/* Tagged Players */}
                      {video.tagged_players.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Tag className="w-3 h-3 text-gray-400" />
                          <div className="flex flex-wrap gap-1">
                            {video.tagged_players.slice(0, 2).map((playerId) => (
                              <Badge key={playerId} variant="secondary" className="text-xs">
                                {getPlayerName(playerId)}
                              </Badge>
                            ))}
                            {video.tagged_players.length > 2 && (
                              <Badge variant="secondary" className="text-xs">
                                +{video.tagged_players.length - 2} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Analysis Status */}
                      <div className="flex items-center justify-between">
                        <Badge className={getAnalysisStatusColor(video.ai_analysis_status)}>
                          {video.ai_analysis_status === 'completed' && <BarChart3 className="w-3 h-3 mr-1" />}
                          {video.ai_analysis_status === 'analyzing' && <Brain className="w-3 h-3 mr-1 animate-pulse" />}
                          {video.ai_analysis_status.charAt(0).toUpperCase() + video.ai_analysis_status.slice(1)}
                        </Badge>
                        
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(video.created_at))} ago
                        </span>
                      </div>

                      {/* Video Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatFileSize(video.file_size)}</span>
                        {video.match_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(video.match_date).toLocaleDateString()}
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                          onClick={() => {
                            setSelectedVideo(video);
                            setShowAnalysis(true);
                          }}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          View & Analyze
                        </Button>
                        
                        {video.ai_analysis_status === 'pending' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-xs"
                            onClick={() => startVideoAnalysis(video.id)}
                          >
                            <Brain className="w-3 h-3 mr-1" />
                            Analyze
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          onClick={() => deleteVideo(video.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VideoManagement;
