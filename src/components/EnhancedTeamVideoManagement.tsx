
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
  Video, Users, User, Filter, Search, Calendar,
  Star, Play, Upload, Tag, Clock, Eye
} from 'lucide-react';
import VideoUploadForm from './VideoUploadForm';

interface VideoData {
  id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  match_date?: string;
  opposing_team?: string;
  score?: string;
  tagged_players?: string[];
  tags?: string[];
  created_at: string;
  video_type: string;
  duration?: number;
  ai_analysis_status: string;
}

interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  photo_url?: string;
}

const EnhancedTeamVideoManagement = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [teamVideos, setTeamVideos] = useState<VideoData[]>([]);
  const [playerVideos, setPlayerVideos] = useState<VideoData[]>([]);
  const [players, setPlayers] = useState<PlayerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPlayer, setFilterPlayer] = useState('');
  const [filterPosition, setFilterPosition] = useState('');
  const [filterVideoType, setFilterVideoType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    if (profile) {
      fetchVideos();
      fetchPlayers();
    }
  }, [profile]);

  const fetchVideos = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedVideos = (data || []).map(video => ({
        ...video,
        tagged_players: Array.isArray(video.tagged_players) 
          ? video.tagged_players 
          : [],
        tags: Array.isArray(video.tags) ? video.tags : []
      }));

      // Separate team and player videos
      setTeamVideos(processedVideos.filter(v => v.video_type === 'match' || v.video_type === 'training'));
      setPlayerVideos(processedVideos.filter(v => v.video_type === 'highlight' || v.video_type === 'skill'));
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

  const filterVideos = (videos: VideoData[]) => {
    let filtered = videos;

    if (searchTerm) {
      filtered = filtered.filter(video =>
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        video.opposing_team?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterPlayer) {
      filtered = filtered.filter(video =>
        video.tagged_players?.includes(filterPlayer)
      );
    }

    if (filterVideoType) {
      filtered = filtered.filter(video => video.video_type === filterVideoType);
    }

    if (filterStatus) {
      filtered = filtered.filter(video => video.ai_analysis_status === filterStatus);
    }

    // Sort videos
    if (sortBy === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'title') {
      filtered.sort((a, b) => a.title.localeCompare(b.title));
    }

    return filtered;
  };

  const VideoGrid = ({ videos, title }: { videos: VideoData[], title: string }) => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold text-white">{title}</h3>
        <Badge variant="outline" className="text-gray-400">
          {videos.length} videos
        </Badge>
      </div>
      
      {videos.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Video className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No Videos Found</h3>
            <p className="text-gray-400">Upload your first video or adjust your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-colors">
              <CardContent className="p-0">
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
                    
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <Button size="lg" className="rounded-full bg-white/20 hover:bg-white/30">
                        <Play className="w-8 h-8 text-white" />
                      </Button>
                    </div>

                    {video.duration && (
                      <Badge className="absolute bottom-2 right-2 bg-black/60 text-white">
                        <Clock className="w-3 h-3 mr-1" />
                        {Math.floor(video.duration / 60)}:{String(video.duration % 60).padStart(2, '0')}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="p-4 space-y-3">
                  <h3 className="font-semibold text-white text-lg line-clamp-1">
                    {video.title}
                  </h3>
                  
                  {video.description && (
                    <p className="text-gray-400 text-sm line-clamp-2">
                      {video.description}
                    </p>
                  )}

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

                  {video.tagged_players && video.tagged_players.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {video.tagged_players.slice(0, 2).map((playerId) => {
                        const player = players.find(p => p.id === playerId);
                        return (
                          <Badge key={playerId} variant="secondary" className="text-xs">
                            {player?.full_name || 'Unknown Player'}
                          </Badge>
                        );
                      })}
                      {video.tagged_players.length > 2 && (
                        <Badge variant="secondary" className="text-xs">
                          +{video.tagged_players.length - 2} more
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Badge className={
                      video.ai_analysis_status === 'completed' ? 'bg-green-500' :
                      video.ai_analysis_status === 'analyzing' ? 'bg-yellow-500' :
                      'bg-gray-500'
                    }>
                      {video.ai_analysis_status}
                    </Badge>
                    
                    <Button size="sm" className="bg-bright-pink hover:bg-bright-pink/90">
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPlayer('');
    setFilterPosition('');
    setFilterVideoType('');
    setFilterStatus('');
    setSortBy('newest');
  };

  if (showUploadForm) {
    return (
      <VideoUploadForm
        onSuccess={() => {
          setShowUploadForm(false);
          fetchVideos();
        }}
        onCancel={() => setShowUploadForm(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white font-polysans flex items-center gap-2">
            <Video className="w-8 h-8 text-bright-pink" />
            Team Video Management
          </h2>
          <p className="text-gray-400 mt-1">
            Advanced video management and scouting platform
          </p>
        </div>

        <Button 
          onClick={() => setShowUploadForm(true)}
          className="bg-bright-pink hover:bg-bright-pink/90 text-white"
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload Video
        </Button>
      </div>

      {/* Advanced Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Advanced Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search videos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Select value={filterPlayer} onValueChange={setFilterPlayer}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Filter by Player" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Players</SelectItem>
                {players.map((player) => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterVideoType} onValueChange={setFilterVideoType}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Video Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="match">Match</SelectItem>
                <SelectItem value="training">Training</SelectItem>
                <SelectItem value="highlight">Highlight</SelectItem>
                <SelectItem value="skill">Skills</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Analysis Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Analyzed</SelectItem>
                <SelectItem value="analyzing">Analyzing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Sort By" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="title">Alphabetical</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={clearFilters}
              className="border-gray-600"
            >
              Clear All
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="team" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-gray-800">
          <TabsTrigger value="team" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team Videos ({filterVideos(teamVideos).length})
          </TabsTrigger>
          <TabsTrigger value="player" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Player Videos ({filterVideos(playerVideos).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="team" className="mt-6">
          <VideoGrid videos={filterVideos(teamVideos)} title="Team Match & Training Videos" />
        </TabsContent>

        <TabsContent value="player" className="mt-6">
          <VideoGrid videos={filterVideos(playerVideos)} title="Player Highlights & Skills" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EnhancedTeamVideoManagement;
