import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft,
  User,
  Calendar,
  MapPin,
  Ruler,
  Weight,
  TrendingUp,
  Award,
  Video,
  Play,
  BarChart3,
  Target,
  Users,
  Flag
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import VideoAnalysisResults from './VideoAnalysisResults';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  jersey_number?: number;
  citizenship: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  foot?: string;
  market_value?: number;
  bio?: string;
  photo_url?: string;
  headshot_url?: string;
  team_id: string;
  teams?: {
    team_name: string;
    logo_url?: string;
    country: string;
  };
}

interface PlayerVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  video_type: string;
  duration?: number;
  ai_analysis_status: string;
  created_at: string;
  performance_rating?: number;
}

interface PlayerStats {
  season: string;
  league: string;
  goals: number;
  assists: number;
  matches_played: number;
  minutes_played: number;
  yellow_cards: number;
  red_cards: number;
}

const PlayerProfilePage: React.FC = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [videos, setVideos] = useState<PlayerVideo[]>([]);
  const [stats, setStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<PlayerVideo | null>(null);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);

  useEffect(() => {
    if (playerId) {
      fetchPlayerData();
    }
  }, [playerId]);

  const fetchPlayerData = async () => {
    if (!playerId) return;

    try {
      setLoading(true);

      // Fetch player data
      const { data: playerData, error: playerError } = await supabase
        .from('players')
        .select(`
          *,
          teams (
            team_name,
            logo_url,
            country
          )
        `)
        .eq('id', playerId)
        .single();

      if (playerError) {
        console.error('Player not found:', playerError);
        toast({
          title: "Player Not Found",
          description: "The requested player profile could not be found.",
          variant: "destructive"
        });
        navigate('/players');
        return;
      }

      setPlayer(playerData);

      // Fetch player videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', playerData.team_id)
        .order('created_at', { ascending: false });

      if (!videosError) {
        setVideos(videosData || []);
      }

      // Fetch player performance stats
      const { data: statsData, error: statsError } = await supabase
        .from('player_performance')
        .select('*')
        .eq('player_id', playerId)
        .order('season', { ascending: false });

      if (!statsError) {
        setStats(statsData || []);
      }

    } catch (error) {
      console.error('Error fetching player data:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load player profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatMarketValue = (value?: number) => {
    if (!value) return 'Not specified';
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    }
    if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
    return `$${value.toLocaleString()}`;
  };

  const getPositionColor = (position: string) => {
    switch (position.toLowerCase()) {
      case 'goalkeeper':
      case 'gk':
        return 'bg-yellow-500';
      case 'defender':
      case 'cb':
      case 'lb':
      case 'rb':
        return 'bg-blue-500';
      case 'midfielder':
      case 'cm':
      case 'dm':
      case 'am':
        return 'bg-green-500';
      case 'forward':
      case 'st':
      case 'lw':
      case 'rw':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-8 text-center">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Player Not Found</h3>
            <p className="text-gray-400 mb-4">The requested player profile could not be found.</p>
            <Button onClick={() => navigate('/')} className="bg-bright-pink hover:bg-bright-pink/90">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-gray-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Player Header */}
        <Card className="border-0">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Player Photo */}
              <div className="flex-shrink-0">
                <div className="w-48 h-48 rounded-full overflow-hidden bg-gray-700 flex items-center justify-center">
                  {player.headshot_url || player.photo_url ? (
                    <img
                      src={player.headshot_url || player.photo_url}
                      alt={player.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-24 h-24 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Player Info */}
              <div className="flex-1">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">{player.full_name}</h1>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge className={`${getPositionColor(player.position)} text-white px-3 py-1`}>
                        {player.position}
                      </Badge>
                      {player.jersey_number && (
                        <Badge variant="outline" className="text-rosegold border-rosegold px-3 py-1">
                          #{player.jersey_number}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2 text-gray-300">
                        <Flag className="w-4 h-4" />
                        {player.citizenship}
                      </div>
                    </div>
                    {player.teams && (
                      <div className="flex items-center gap-2 text-lg text-gray-300">
                        <span>Playing for</span>
                        <span className="text-bright-pink font-semibold">{player.teams.team_name}</span>
                      </div>
                    )}
                  </div>

                  {player.market_value && (
                    <div className="text-right">
                      <div className="text-3xl font-bold text-bright-pink">{formatMarketValue(player.market_value)}</div>
                      <div className="text-gray-400">Market Value</div>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  {player.date_of_birth && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Calendar className="w-5 h-5 text-bright-pink" />
                      </div>
                      <div className="text-2xl font-bold text-white">{calculateAge(player.date_of_birth)}</div>
                      <div className="text-gray-400 text-sm">Years Old</div>
                    </div>
                  )}

                  {player.height && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Ruler className="w-5 h-5 text-bright-pink" />
                      </div>
                      <div className="text-2xl font-bold text-white">{player.height}cm</div>
                      <div className="text-gray-400 text-sm">Height</div>
                    </div>
                  )}

                  {player.weight && (
                    <div className="text-center">
                      <div className="flex items-center justify-center mb-2">
                        <Weight className="w-5 h-5 text-bright-pink" />
                      </div>
                      <div className="text-2xl font-bold text-white">{player.weight}kg</div>
                      <div className="text-gray-400 text-sm">Weight</div>
                    </div>
                  )}

                  <div className="text-center">
                    <div className="flex items-center justify-center mb-2">
                      <Target className="w-5 h-5 text-bright-pink" />
                    </div>
                    <div className="text-2xl font-bold text-white">{player.foot || 'N/A'}</div>
                    <div className="text-gray-400 text-sm">Preferred Foot</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 p-1">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="videos" className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              Videos ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Statistics
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Biography */}
            {player.bio && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Biography</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 leading-relaxed">{player.bio}</p>
                </CardContent>
              </Card>
            )}

            {/* Career Highlights */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-bright-pink" />
                  Career Highlights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-bright-pink">{stats.reduce((sum, s) => sum + s.goals, 0)}</div>
                    <div className="text-sm text-gray-400">Total Goals</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-green-500">{stats.reduce((sum, s) => sum + s.assists, 0)}</div>
                    <div className="text-sm text-gray-400">Total Assists</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-blue-500">{stats.reduce((sum, s) => sum + s.matches_played, 0)}</div>
                    <div className="text-sm text-gray-400">Matches Played</div>
                  </div>
                  <div className="text-center p-4 bg-gray-700 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-500">{Math.round(stats.reduce((sum, s) => sum + s.minutes_played, 0) / 90)}</div>
                    <div className="text-sm text-gray-400">Full Games</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="videos" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.length === 0 ? (
                <Card className="col-span-full bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-white font-medium mb-2">No Videos Available</h3>
                    <p className="text-gray-400">No videos have been uploaded for this player yet.</p>
                  </CardContent>
                </Card>
              ) : (
                videos.map((video) => (
                  <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors">
                    <div className="relative">
                      {video.thumbnail_url ? (
                        <img
                          src={video.thumbnail_url}
                          alt={video.title}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-700 flex items-center justify-center rounded-t-lg">
                          <Video className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-1 rounded">
                        {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : 'Unknown'}
                      </div>
                    </div>

                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div>
                          <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{video.title}</h3>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline" className="text-xs">
                              {video.video_type.toUpperCase()}
                            </Badge>
                            <Badge className={`text-xs ${video.ai_analysis_status === 'completed' ? 'bg-green-500' :
                              video.ai_analysis_status === 'processing' ? 'bg-yellow-500' : 'bg-gray-500'
                              } text-white`}>
                              {video.ai_analysis_status}
                            </Badge>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white"
                          onClick={() => {
                            setSelectedVideo(video);
                            setIsVideoDialogOpen(true);
                          }}
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Watch & Analyze
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            {stats.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Statistics Available</h3>
                  <p className="text-gray-400">Performance statistics will be displayed here when available.</p>
                </CardContent>
              </Card>
            ) : (
              stats.map((stat, index) => (
                <Card key={index} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white">{stat.season} - {stat.league}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-bright-pink">{stat.goals}</div>
                        <div className="text-sm text-gray-400">Goals</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-500">{stat.assists}</div>
                        <div className="text-sm text-gray-400">Assists</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-500">{stat.matches_played}</div>
                        <div className="text-sm text-gray-400">Matches</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-500">{stat.minutes_played}</div>
                        <div className="text-sm text-gray-400">Minutes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-yellow-500">{stat.yellow_cards}</div>
                        <div className="text-sm text-gray-400">Yellow Cards</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-red-500">{stat.red_cards}</div>
                        <div className="text-sm text-gray-400">Red Cards</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="performance">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-8 text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-white font-medium mb-2">Performance Analysis</h3>
                <p className="text-gray-400">Detailed performance metrics and analysis will be displayed here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Video Analysis Dialog */}
        {selectedVideo && (
          <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
            <DialogContent className="bg-gray-800 border-gray-700 max-w-6xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-white">{selectedVideo.title}</DialogTitle>
              </DialogHeader>
              <VideoAnalysisResults
                videoId={selectedVideo.id}
                videoType={selectedVideo.video_type as any}
                teamId={player.team_id}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default PlayerProfilePage;
