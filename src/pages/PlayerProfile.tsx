
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { usePlayerData } from '@/hooks/usePlayerData';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  User,
  Calendar,
  MapPin,
  Ruler,
  Weight,
  DollarSign,
  Video,
  MessageCircle,
  Star,
  Trophy,
  Target,
  ArrowLeft,
  Play
} from 'lucide-react';
import VideoPlayer from '@/components/VideoPlayer';
import { supabase } from '@/integrations/supabase/client';

interface Video {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  description?: string;
  tagged_players?: any;
  match_date?: string;
  opposing_team?: string;
  score?: string;
}

const PlayerProfile = () => {
  const { playerId } = useParams<{ playerId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  console.log('PlayerProfile - playerId from params:', playerId);
  
  // Validate playerId
  const isValidPlayerId = playerId && playerId !== ':playerId' && playerId.length > 10;
  
  const { player, loading, error } = usePlayerData(isValidPlayerId ? playerId : null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [age, setAge] = useState<number | null>(null);

  useEffect(() => {
    console.log('PlayerProfile effect - playerId:', playerId, 'isValid:', isValidPlayerId);
    if (isValidPlayerId) {
      fetchPlayerVideos();
      checkIfShortlisted();
    }
  }, [playerId, isValidPlayerId]);

  useEffect(() => {
    if (player?.date_of_birth) {
      calculateAge(player.date_of_birth);
    }
  }, [player]);

  const calculateAge = (dateOfBirth: string) => {
    if (dateOfBirth) {
      const birthDate = new Date(dateOfBirth);
      const today = new Date();
      const calculatedAge = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        setAge(calculatedAge - 1);
      } else {
        setAge(calculatedAge);
      }
    }
  };

  const fetchPlayerVideos = async () => {
    if (!isValidPlayerId || !player) return;

    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .contains('tagged_players', [player?.full_name])
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching videos:', error);
        return;
      }

      setVideos(data || []);
    } catch (error) {
      console.error('Error in fetchPlayerVideos:', error);
    }
  };

  const checkIfShortlisted = async () => {
    if (!player || !profile?.id || !isValidPlayerId) return;

    try {
      const { data, error } = await supabase
        .from('shortlist')
        .select('id')
        .eq('player_id', playerId)
        .single();

      setIsShortlisted(!!data && !error);
    } catch (error) {
      console.error('Error checking shortlist status:', error);
    }
  };

  const handleAddToShortlist = async () => {
    if (!player || !profile?.id) return;

    try {
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agent) {
        toast({
          title: "Error",
          description: "You must be an agent to add players to shortlist.",
          variant: "destructive"
        });
        return;
      }

      const { data: pitch } = await supabase
        .from('transfer_pitches')
        .select('id')
        .eq('player_id', player.id)
        .eq('status', 'active')
        .single();

      if (!pitch) {
        toast({
          title: "Error",
          description: "No active pitch found for this player.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('shortlist')
        .insert({
          agent_id: agent.id,
          player_id: player.id,
          pitch_id: pitch.id
        });

      if (error) throw error;

      setIsShortlisted(true);
      toast({
        title: "Added to Shortlist",
        description: `${player.full_name} has been added to your shortlist.`,
      });
    } catch (error: any) {
      console.error('Error adding to shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to add player to shortlist.",
        variant: "destructive"
      });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Show error or loading states
  if (!isValidPlayerId) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-white text-2xl mb-4">Invalid player ID</h2>
            <Button onClick={() => navigate(-1)} className="bg-rosegold text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto mb-2"></div>
            <p className="text-white">Loading player data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !player) {
    return (
      <Layout>
        <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-white text-2xl mb-4">
              {error ? `Error: ${error}` : 'Player not found'}
            </h2>
            <Button onClick={() => navigate(-1)} className="bg-rosegold text-black">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const metadata = selectedVideo ? {
    playerTags: [player.full_name],
    matchDetails: {
      homeTeam: 'Home Team',
      awayTeam: selectedVideo.opposing_team || 'Away Team',
      league: 'League',
      finalScore: selectedVideo.score || '0-0'
    },
    duration: 300
  } : {
    playerTags: [],
    matchDetails: {
      homeTeam: '',
      awayTeam: '',
      league: '',
      finalScore: ''
    },
    duration: 0
  };

  return (
    <Layout>
      <div className="min-h-screen bg-[#1a1a1a] p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-white hover:text-rosegold"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex gap-2">
              <Button
                onClick={isShortlisted ? () => {} : handleAddToShortlist}
                className={isShortlisted 
                  ? "bg-gray-600 hover:bg-gray-700 text-white" 
                  : "bg-rosegold hover:bg-rosegold/90 text-black"
                }
              >
                <Star className={`w-4 h-4 mr-2 ${isShortlisted ? 'fill-current' : ''}`} />
                {isShortlisted ? 'In Shortlist' : 'Add to Shortlist'}
              </Button>
            </div>
          </div>

          {/* Player Header */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-32 h-32 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
              {player.headshot_url || player.photo_url ? (
                <img
                  src={player.headshot_url || player.photo_url}
                  alt={player.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-16 h-16 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-4">
              <h1 className="text-3xl font-bold text-white font-polysans">
                {player.full_name}
              </h1>
              
              <div className="flex items-center gap-3 flex-wrap">
                <Badge variant="outline" className="text-rosegold border-rosegold text-lg px-3 py-1">
                  {player.position}
                </Badge>
                {player.jersey_number && (
                  <Badge variant="outline" className="text-blue-400 border-blue-400 text-lg px-3 py-1">
                    #{player.jersey_number}
                  </Badge>
                )}
                <Badge variant="outline" className="text-gray-300 border-gray-300">
                  {player.gender?.toUpperCase()}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Age</p>
                    <p className="text-white font-semibold">{age || player.age || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Nationality</p>
                    <p className="text-white font-semibold">{player.citizenship}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Ruler className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Height</p>
                    <p className="text-white font-semibold">{player.height ? `${player.height} cm` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Weight className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Weight</p>
                    <p className="text-white font-semibold">{player.weight ? `${player.weight} kg` : 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400">Market Value</p>
                    <p className="text-white font-semibold">
                      {player.market_value ? formatCurrency(player.market_value) : 'N/A'}
                    </p>
                  </div>
                </div>
                {player.foot && (
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-gray-400">Preferred Foot</p>
                      <p className="text-white font-semibold capitalize">{player.foot}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
              <TabsTrigger value="videos" className="text-white">Videos</TabsTrigger>
              <TabsTrigger value="career" className="text-white">Career</TabsTrigger>
              <TabsTrigger value="stats" className="text-white">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              {player.bio && (
                <Card className="bg-gray-800 border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Biography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 font-poppins">{player.bio}</p>
                  </CardContent>
                </Card>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-gray-800 border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {player.date_of_birth && (
                      <div>
                        <p className="text-gray-400 text-sm">Date of Birth</p>
                        <p className="text-white">{formatDate(player.date_of_birth)}</p>
                      </div>
                    )}
                    {player.place_of_birth && (
                      <div>
                        <p className="text-gray-400 text-sm">Place of Birth</p>
                        <p className="text-white">{player.place_of_birth}</p>
                      </div>
                    )}
                    {player.fifa_id && (
                      <div>
                        <p className="text-gray-400 text-sm">FIFA ID</p>
                        <p className="text-white">{player.fifa_id}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Career Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {player.current_club && (
                      <div>
                        <p className="text-gray-400 text-sm">Current Club</p>
                        <p className="text-white">{player.current_club}</p>
                      </div>
                    )}
                    {player.player_agent && (
                      <div>
                        <p className="text-gray-400 text-sm">Agent</p>
                        <p className="text-white">{player.player_agent}</p>
                      </div>
                    )}
                    {player.contract_expires && (
                      <div>
                        <p className="text-gray-400 text-sm">Contract Expires</p>
                        <p className="text-white">{formatDate(player.contract_expires)}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="videos" className="space-y-6 mt-6">
              {selectedVideo ? (
                <div className="space-y-4">
                  <Button
                    onClick={() => setSelectedVideo(null)}
                    variant="outline"
                    className="border-rosegold text-rosegold hover:bg-rosegold hover:text-black"
                  >
                    ← Back to Videos
                  </Button>
                  <VideoPlayer
                    videoUrl={selectedVideo.video_url}
                    title={selectedVideo.title}
                    videoId={selectedVideo.id}
                    metadata={metadata}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {videos.map((video) => (
                        <Card key={video.id} className="bg-gray-800 border-rosegold/20 cursor-pointer hover:border-rosegold/50 transition-all">
                          <div className="relative aspect-video bg-black rounded-t-lg overflow-hidden">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <Play className="w-12 h-12 text-rosegold" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Button
                                onClick={() => setSelectedVideo(video)}
                                size="sm"
                                className="bg-rosegold hover:bg-rosegold/90 text-black"
                              >
                                <Play className="w-4 h-4 mr-2" />
                                Watch with AI Analysis
                              </Button>
                            </div>
                          </div>
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-white mb-2 line-clamp-2">
                              {video.title}
                            </h4>
                            {video.description && (
                              <p className="text-gray-400 text-sm line-clamp-2 mb-2">
                                {video.description}
                              </p>
                            )}
                            <div className="flex justify-between items-center text-xs text-gray-500">
                              {video.match_date && (
                                <span>{new Date(video.match_date).toLocaleDateString()}</span>
                              )}
                              {video.opposing_team && (
                                <span>vs {video.opposing_team}</span>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="bg-gray-800 border-rosegold/20">
                      <CardContent className="p-8 text-center">
                        <Video className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-gray-400">No videos available for this player</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="career" className="space-y-6 mt-6">
              <Card className="bg-gray-800 border-rosegold/20">
                <CardHeader>
                  <CardTitle className="text-white font-polysans">Career Highlights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {player.leagues_participated && player.leagues_participated.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Leagues Participated</p>
                      <div className="flex flex-wrap gap-2">
                        {player.leagues_participated.map((league, index) => (
                          <Badge key={index} variant="outline" className="text-blue-400 border-blue-400">
                            {league}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {player.titles_seasons && player.titles_seasons.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Titles & Seasons</p>
                      <div className="flex flex-wrap gap-2">
                        {player.titles_seasons.map((title, index) => (
                          <Badge key={index} variant="outline" className="text-yellow-400 border-yellow-400">
                            <Trophy className="h-3 w-3 mr-1" />
                            {title}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {player.achievements && player.achievements.length > 0 && (
                    <div>
                      <p className="text-gray-400 text-sm mb-2">Achievements</p>
                      <div className="space-y-2">
                        {player.achievements.slice(0, 5).map((achievement, index) => (
                          <div key={index} className="text-sm text-gray-300">
                            • {achievement}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="stats" className="space-y-6 mt-6">
              {player.match_stats ? (
                <Card className="bg-gray-800 border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Performance Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(player.match_stats as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-2xl font-bold text-rosegold">{value}</p>
                          <p className="text-gray-400 text-sm capitalize">{key.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-gray-800 border-rosegold/20">
                  <CardContent className="p-8 text-center">
                    <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-400 mb-2">No statistics available</p>
                    <p className="text-gray-500 text-sm">Player statistics will be displayed here when available</p>
                  </CardContent>
                </Card>
              )}

              {player.ai_analysis && (
                <Card className="bg-gray-800 border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-400" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {Object.entries(player.ai_analysis as Record<string, any>).map(([key, value]) => (
                        <div key={key}>
                          <p className="text-gray-400 text-sm capitalize">{key.replace('_', ' ')}</p>
                          <p className="text-white">{value}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default PlayerProfile;
