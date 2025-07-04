
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { 
  User, Video, Star, Calendar, MapPin, Trophy, Play, TrendingUp, Target, 
  Award, BarChart3, DollarSign, Globe, Users, Zap 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { analyzePlayer, PlayerAnalysis } from '@/services/geminiService';
import VideoPlayer from './VideoPlayer';

interface PlayerProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  playerId: string;
  playerName?: string;
}

interface PlayerData {
  id: string;
  full_name: string;
  position: string;
  age?: number;
  height: number;
  weight: number;
  citizenship: string;
  photo_url?: string;
  jersey_number?: number;
  market_value?: number;
  bio?: string;
  fifa_id?: string;
  date_of_birth?: string;
  current_club?: string;
  contract_expires?: string;
  transfer_history?: any;
  match_stats?: any;
}

interface VideoData {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url?: string;
  match_date?: string;
  opposing_team?: string;
  score?: string;
  tagged_players?: any;
  tags?: string[];
  description?: string;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  isOpen,
  onClose,
  playerId,
  playerName
}) => {
  const [player, setPlayer] = useState<PlayerData | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<PlayerAnalysis | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoData | null>(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);

  useEffect(() => {
    if (isOpen && playerId) {
      fetchPlayerData();
      fetchPlayerVideos();
    }
  }, [isOpen, playerId]);

  useEffect(() => {
    if (player && !aiAnalysis) {
      generateAIAnalysis();
    }
  }, [player, aiAnalysis]);

  const fetchPlayerData = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      setPlayer(data);
    } catch (error) {
      console.error('Error fetching player:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlayerVideos = async () => {
    try {
      // First try to find videos where the player is tagged
      const { data: taggedVideos, error: taggedError } = await supabase
        .from('videos')
        .select('*')
        .contains('tagged_players', [playerId])
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (!taggedError && taggedVideos && taggedVideos.length > 0) {
        setVideos(taggedVideos);
        return;
      }

      // If no tagged videos, try to find videos from the player's team
      const { data: playerData } = await supabase
        .from('players')
        .select('team_id')
        .eq('id', playerId)
        .single();

      if (playerData?.team_id) {
        const { data: teamVideos, error: teamError } = await supabase
          .from('videos')
          .select('*')
          .eq('team_id', playerData.team_id)
          .eq('is_public', true)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!teamError && teamVideos) {
          setVideos(teamVideos);
        }
      }
    } catch (error) {
      console.error('Error fetching player videos:', error);
    }
  };

  const generateAIAnalysis = async () => {
    if (!player) return;

    try {
      const analysis = await analyzePlayer({
        name: player.full_name,
        position: player.position,
        age: player.age || 25,
        height: player.height,
        weight: player.weight,
        citizenship: player.citizenship,
        currentClub: player.current_club,
        marketValue: player.market_value,
        stats: player.match_stats || {},
        recentPerformance: videos.slice(0, 3).map(v => `${v.title} - ${v.opposing_team || 'Unknown opponent'}`),
        bio: player.bio
      });
      setAiAnalysis(analysis);
    } catch (error) {
      console.error('Error generating AI analysis:', error);
    }
  };

  const handleVideoClick = (video: VideoData) => {
    setSelectedVideo(video);
    setShowVideoPlayer(true);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return 'text-green-600';
    if (rating >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (showVideoPlayer && selectedVideo) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {
        setShowVideoPlayer(false);
        setSelectedVideo(null);
      }}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-6 bg-[#111111]">
          <DialogHeader className="mb-4">
            <DialogTitle className="font-polysans text-2xl text-white">
              {selectedVideo.title}
            </DialogTitle>
            <Button
              onClick={() => {
                setShowVideoPlayer(false);
                setSelectedVideo(null);
              }}
              variant="outline"
              className="w-fit border-[#d4af37] text-[#d4af37] hover:bg-[#d4af37] hover:text-black"
            >
              Back to Profile
            </Button>
          </DialogHeader>
          
          <VideoPlayer
            videoUrl={selectedVideo.video_url}
            title={selectedVideo.title}
            metadata={{
              playerTags: [player?.full_name || ''],
              matchDetails: {
                homeTeam: player?.current_club || 'Home Team',
                awayTeam: selectedVideo.opposing_team || 'Away Team',
                league: 'League',
                finalScore: selectedVideo.score || '0-0'
              },
              duration: 300
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader className="border-b border-[#d4af37]/20 pb-4">
          <DialogTitle className="font-polysans text-3xl text-black flex items-center gap-3">
            <User className="w-8 h-8 text-[#d4af37]" />
            Player Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#d4af37]/20 border-t-[#d4af37]"></div>
              <User className="absolute inset-0 m-auto w-6 h-6 text-[#d4af37]" />
            </div>
          </div>
        ) : player ? (
          <div className="space-y-6">
            {/* Enhanced Player Header */}
            <Card className="bg-gradient-to-r from-[#d4af37]/10 to-pink-400/10 border-[#d4af37]/30 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-start gap-8">
                  <div className="relative">
                    <Avatar className="w-32 h-32 border-4 border-[#d4af37] shadow-lg">
                      <AvatarImage src={player.photo_url} alt={player.full_name} />
                      <AvatarFallback className="bg-[#d4af37] text-black text-2xl font-bold">
                        {player.full_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    {player.jersey_number && (
                      <div className="absolute -bottom-2 -right-2 bg-[#d4af37] text-black font-bold text-lg rounded-full w-8 h-8 flex items-center justify-center shadow-lg">
                        {player.jersey_number}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h2 className="font-polysans text-4xl font-bold text-black mb-3">
                      {player.full_name}
                    </h2>
                    
                    <div className="flex flex-wrap gap-3 mb-6">
                      <Badge className="bg-[#d4af37] text-black hover:bg-[#d4af37]/90 text-base px-4 py-2">
                        {player.position}
                      </Badge>
                      <Badge variant="outline" className="border-pink-400 text-pink-600 text-base px-4 py-2">
                        <Globe className="w-4 h-4 mr-2" />
                        {player.citizenship}
                      </Badge>
                      {player.age && (
                        <Badge variant="outline" className="border-blue-500 text-blue-600 text-base px-4 py-2">
                          <Calendar className="w-4 h-4 mr-2" />
                          {player.age} years old
                        </Badge>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="text-center p-4 bg-white rounded-lg border border-[#d4af37]/20 shadow-sm">
                        <p className="text-gray-500 font-poppins text-sm">Height</p>
                        <p className="font-bold text-black text-xl">{player.height} cm</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-[#d4af37]/20 shadow-sm">
                        <p className="text-gray-500 font-poppins text-sm">Weight</p>
                        <p className="font-bold text-black text-xl">{player.weight} kg</p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-[#d4af37]/20 shadow-sm">
                        <p className="text-gray-500 font-poppins text-sm">Market Value</p>
                        <p className="font-bold text-[#d4af37] text-xl">
                          {player.market_value ? formatCurrency(player.market_value) : 'N/A'}
                        </p>
                      </div>
                      <div className="text-center p-4 bg-white rounded-lg border border-[#d4af37]/20 shadow-sm">
                        <p className="text-gray-500 font-poppins text-sm">Videos</p>
                        <p className="font-bold text-pink-600 text-xl">{videos.length}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                <TabsTrigger value="overview" className="font-poppins data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="videos" className="font-poppins data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                  Videos ({videos.length})
                </TabsTrigger>
                <TabsTrigger value="stats" className="font-poppins data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                  Statistics
                </TabsTrigger>
                <TabsTrigger value="ai-analysis" className="font-poppins data-[state=active]:bg-[#d4af37] data-[state=active]:text-black">
                  AI Analysis
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-6">
                <Card className="bg-white border-[#d4af37]/20 shadow-sm">
                  <CardHeader>
                    <CardTitle className="font-polysans text-[#d4af37] flex items-center gap-2">
                      <User className="w-6 h-6" />
                      Player Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {player.bio && (
                      <div>
                        <h4 className="font-poppins font-semibold text-black mb-3">Biography</h4>
                        <p className="text-gray-700 font-poppins leading-relaxed">{player.bio}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {player.fifa_id && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-poppins font-semibold text-black mb-2">FIFA ID</h4>
                          <p className="text-gray-700 font-poppins">{player.fifa_id}</p>
                        </div>
                      )}
                      {player.current_club && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-poppins font-semibold text-black mb-2">Current Club</h4>
                          <p className="text-gray-700 font-poppins">{player.current_club}</p>
                        </div>
                      )}
                      {player.contract_expires && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-poppins font-semibold text-black mb-2">Contract Expires</h4>
                          <p className="text-gray-700 font-poppins">{formatDate(player.contract_expires)}</p>
                        </div>
                      )}
                      {player.date_of_birth && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <h4 className="font-poppins font-semibold text-black mb-2">Date of Birth</h4>
                          <p className="text-gray-700 font-poppins">{formatDate(player.date_of_birth)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="videos" className="space-y-6 mt-6">
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {videos.map((video) => (
                      <Card 
                        key={video.id} 
                        className="bg-white border-[#d4af37]/20 hover:border-[#d4af37] transition-all duration-200 cursor-pointer group shadow-sm hover:shadow-lg" 
                        onClick={() => handleVideoClick(video)}
                      >
                        <CardContent className="p-4">
                          <div className="relative mb-4 overflow-hidden rounded-lg">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-40 object-cover transition-transform duration-200 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-40 bg-gradient-to-br from-[#d4af37]/20 to-pink-400/20 flex items-center justify-center">
                                <Video className="w-12 h-12 text-[#d4af37]" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                              <Play className="w-12 h-12 text-white" />
                            </div>
                          </div>
                          
                          <h4 className="font-poppins font-semibold text-black mb-3 line-clamp-2">
                            {video.title}
                          </h4>
                          
                          <div className="space-y-2 text-sm text-gray-600">
                            {video.match_date && (
                              <p className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-[#d4af37]" />
                                {formatDate(video.match_date)}
                              </p>
                            )}
                            {video.opposing_team && (
                              <p className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-pink-500" />
                                vs {video.opposing_team}
                              </p>
                            )}
                            {video.score && (
                              <p className="font-semibold text-[#d4af37] text-center bg-[#d4af37]/10 rounded px-2 py-1">
                                {video.score}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white border-[#d4af37]/20">
                    <CardContent className="p-16 text-center">
                      <Video className="w-20 h-20 mx-auto mb-6 text-gray-300" />
                      <h3 className="font-polysans text-2xl font-semibold text-black mb-3">
                        No Videos Available
                      </h3>
                      <p className="text-gray-600 font-poppins text-lg">
                        This player hasn't been featured in any videos yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stats" className="space-y-6 mt-6">
                <Card className="bg-white border-[#d4af37]/20">
                  <CardHeader>
                    <CardTitle className="font-polysans text-[#d4af37] flex items-center gap-2">
                      <BarChart3 className="w-6 h-6" />
                      Match Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {player.match_stats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {Object.entries(player.match_stats as any).map(([key, value]) => (
                          <div key={key} className="text-center p-6 bg-gradient-to-br from-[#d4af37]/10 to-pink-400/10 rounded-lg border border-[#d4af37]/20">
                            <p className="text-3xl font-bold text-[#d4af37] mb-2">{value as string}</p>
                            <p className="text-sm text-gray-600 font-poppins font-medium capitalize">
                              {key.replace('_', ' ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-16">
                        <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p className="text-gray-600 font-poppins text-lg">
                          No statistics available for this player.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-analysis" className="space-y-6 mt-6">
                <Card className="bg-white border-[#d4af37]/20">
                  <CardHeader>
                    <CardTitle className="font-polysans text-[#d4af37] flex items-center gap-2">
                      <Zap className="w-6 h-6" />
                      AI-Powered Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-8">
                    {aiAnalysis ? (
                      <>
                        {/* Market Value & Ratings */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="text-center p-6 bg-gradient-to-br from-[#d4af37]/20 to-pink-400/20 rounded-xl border border-[#d4af37]/30">
                            <DollarSign className="w-8 h-8 mx-auto mb-3 text-[#d4af37]" />
                            <h3 className="font-polysans text-lg font-bold text-black mb-2">Market Value</h3>
                            <p className="text-3xl font-bold text-[#d4af37]">
                              {formatCurrency(aiAnalysis.marketValue)}
                            </p>
                          </div>
                          
                          <div className="text-center p-6 bg-gradient-to-br from-green-100 to-green-200 rounded-xl border border-green-300">
                            <Target className="w-8 h-8 mx-auto mb-3 text-green-600" />
                            <h3 className="font-polysans text-lg font-bold text-black mb-2">Current Rating</h3>
                            <p className={`text-3xl font-bold ${getRatingColor(aiAnalysis.overallRating)}`}>
                              {aiAnalysis.overallRating}/100
                            </p>
                            <Progress value={aiAnalysis.overallRating} className="mt-2" />
                          </div>
                          
                          <div className="text-center p-6 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl border border-blue-300">
                            <TrendingUp className="w-8 h-8 mx-auto mb-3 text-blue-600" />
                            <h3 className="font-polysans text-lg font-bold text-black mb-2">Potential</h3>
                            <p className={`text-3xl font-bold ${getRatingColor(aiAnalysis.potentialRating)}`}>
                              {aiAnalysis.potentialRating}/100
                            </p>
                            <Progress value={aiAnalysis.potentialRating} className="mt-2" />
                          </div>
                        </div>

                        {/* Strengths & Weaknesses */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h4 className="font-poppins font-bold text-black mb-4 flex items-center gap-2">
                              <Award className="w-5 h-5 text-green-500" />
                              Key Strengths
                            </h4>
                            <div className="space-y-3">
                              {aiAnalysis.strengths.map((strength, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 font-poppins">{strength}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-poppins font-bold text-black mb-4 flex items-center gap-2">
                              <Target className="w-5 h-5 text-orange-500" />
                              Areas for Improvement
                            </h4>
                            <div className="space-y-3">
                              {aiAnalysis.weaknesses.map((weakness, index) => (
                                <div key={index} className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                                  <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 font-poppins">{weakness}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Playing Style */}
                        <div>
                          <h4 className="font-poppins font-bold text-black mb-4">Playing Style Analysis</h4>
                          <div className="p-6 bg-gradient-to-r from-[#d4af37]/10 to-pink-400/10 rounded-lg border border-[#d4af37]/20">
                            <p className="text-gray-700 font-poppins leading-relaxed text-lg">
                              {aiAnalysis.playingStyle}
                            </p>
                          </div>
                        </div>

                        {/* Key Stats */}
                        <div>
                          <h4 className="font-poppins font-bold text-black mb-4">Performance Statistics</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {Object.entries(aiAnalysis.keyStats).map(([key, value]) => (
                              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-2xl font-bold text-[#d4af37] mb-1">{value}</p>
                                <p className="text-sm text-gray-600 font-poppins">{key}</p>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Comparable Players */}
                        <div>
                          <h4 className="font-poppins font-bold text-black mb-4 flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Similar Players
                          </h4>
                          <div className="flex flex-wrap gap-3">
                            {aiAnalysis.comparisonPlayers.map((player, index) => (
                              <Badge key={index} variant="outline" className="border-blue-500 text-blue-600 px-4 py-2">
                                {player}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Transfer Recommendation */}
                        <div>
                          <h4 className="font-poppins font-bold text-black mb-4">Transfer Recommendation</h4>
                          <div className="p-6 bg-gradient-to-r from-pink-400/10 to-[#d4af37]/10 rounded-lg border border-pink-400/20">
                            <p className="text-gray-700 font-poppins leading-relaxed text-lg">
                              {aiAnalysis.transferRecommendation}
                            </p>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-16">
                        <div className="relative mb-6">
                          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#d4af37]/20 border-t-[#d4af37] mx-auto"></div>
                          <Zap className="absolute inset-0 m-auto w-8 h-8 text-[#d4af37]" />
                        </div>
                        <p className="text-gray-600 font-poppins font-medium text-lg">Generating AI analysis...</p>
                        <p className="text-gray-400 text-sm font-poppins mt-2">This may take a few moments</p>
                      </div>
                    )}
                  </CardContent>
                </Card>  
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-20">
            <User className="w-20 h-20 mx-auto mb-6 text-gray-300" />
            <h3 className="font-polysans text-2xl font-semibold text-black mb-3">
              Player Not Found
            </h3>
            <p className="text-gray-600 font-poppins text-lg">
              The requested player profile could not be loaded.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlayerProfileModal;
