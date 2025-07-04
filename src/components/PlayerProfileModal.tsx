
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Video, Star, Calendar, MapPin, Trophy, Play } from 'lucide-react';
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
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .contains('tagged_players', [playerId])
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
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
        stats: player.match_stats || {},
        recentPerformance: videos.slice(0, 3).map(v => `${v.title} - ${v.opposing_team}`)
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

  if (showVideoPlayer && selectedVideo) {
    return (
      <Dialog open={isOpen} onOpenChange={() => {
        setShowVideoPlayer(false);
        setSelectedVideo(null);
      }}>
        <DialogContent className="max-w-7xl w-full h-[90vh] p-6">
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
              className="w-fit"
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
              duration: 300 // Default duration, could be stored in video metadata
            }}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-polysans text-2xl text-white">
            Player Profile
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold"></div>
          </div>
        ) : player ? (
          <div className="space-y-6">
            {/* Player Header */}
            <Card className="bg-white border-rosegold/20">
              <CardContent className="p-6">
                <div className="flex items-start gap-6">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={player.photo_url} alt={player.full_name} />
                    <AvatarFallback className="bg-rosegold text-white text-xl">
                      {player.full_name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1">
                    <h2 className="font-polysans text-3xl font-bold text-black mb-2">
                      {player.full_name}
                    </h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Badge variant="outline" className="border-rosegold text-rosegold">
                        {player.position}
                      </Badge>
                      {player.jersey_number && (
                        <Badge variant="outline" className="border-bright-pink text-bright-pink">
                          #{player.jersey_number}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-blue-500 text-blue-500">
                        {player.citizenship}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 font-poppins">Age</p>
                        <p className="font-semibold text-black">{player.age || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-poppins">Height</p>
                        <p className="font-semibold text-black">{player.height} cm</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-poppins">Weight</p>
                        <p className="font-semibold text-black">{player.weight} kg</p>
                      </div>
                      <div>
                        <p className="text-gray-500 font-poppins">Market Value</p>
                        <p className="font-semibold text-black">
                          {player.market_value ? formatCurrency(player.market_value) : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-100">
                <TabsTrigger value="overview" className="font-poppins">Overview</TabsTrigger>
                <TabsTrigger value="videos" className="font-poppins">Videos ({videos.length})</TabsTrigger>
                <TabsTrigger value="stats" className="font-poppins">Stats</TabsTrigger>
                <TabsTrigger value="ai-analysis" className="font-poppins">AI Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card className="bg-white border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="font-polysans text-rosegold flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Player Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {player.bio && (
                      <div>
                        <h4 className="font-poppins font-semibold text-black mb-2">Biography</h4>
                        <p className="text-gray-700 font-poppins">{player.bio}</p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {player.fifa_id && (
                        <div>
                          <h4 className="font-poppins font-semibold text-black mb-1">FIFA ID</h4>
                          <p className="text-gray-700 font-poppins">{player.fifa_id}</p>
                        </div>
                      )}
                      {player.current_club && (
                        <div>
                          <h4 className="font-poppins font-semibold text-black mb-1">Current Club</h4>
                          <p className="text-gray-700 font-poppins">{player.current_club}</p>
                        </div>
                      )}
                      {player.contract_expires && (
                        <div>
                          <h4 className="font-poppins font-semibold text-black mb-1">Contract Expires</h4>
                          <p className="text-gray-700 font-poppins">{formatDate(player.contract_expires)}</p>
                        </div>
                      )}
                      {player.date_of_birth && (
                        <div>
                          <h4 className="font-poppins font-semibold text-black mb-1">Date of Birth</h4>
                          <p className="text-gray-700 font-poppins">{formatDate(player.date_of_birth)}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="videos" className="space-y-4">
                {videos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {videos.map((video) => (
                      <Card key={video.id} className="bg-white border-rosegold/20 hover:border-rosegold transition-colors cursor-pointer" onClick={() => handleVideoClick(video)}>
                        <CardContent className="p-4">
                          <div className="relative mb-3">
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-32 object-cover rounded"
                              />
                            ) : (
                              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                                <Video className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 rounded flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                              <Play className="w-8 h-8 text-white" />
                            </div>
                          </div>
                          
                          <h4 className="font-poppins font-semibold text-black mb-2 line-clamp-2">
                            {video.title}
                          </h4>
                          
                          <div className="space-y-1 text-sm text-gray-600">
                            {video.match_date && (
                              <p className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {formatDate(video.match_date)}
                              </p>
                            )}
                            {video.opposing_team && (
                              <p className="flex items-center gap-1">
                                <Trophy className="w-3 h-3" />
                                vs {video.opposing_team}
                              </p>
                            )}
                            {video.score && (
                              <p className="font-semibold text-rosegold">{video.score}</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="bg-white border-rosegold/20">
                    <CardContent className="p-12 text-center">
                      <Video className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                      <h3 className="font-polysans text-xl font-semibold text-black mb-2">
                        No Videos Available
                      </h3>
                      <p className="text-gray-600 font-poppins">
                        This player hasn't been tagged in any videos yet.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <Card className="bg-white border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="font-polysans text-rosegold flex items-center gap-2">
                      <Trophy className="w-5 h-5" />
                      Match Statistics
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {player.match_stats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(player.match_stats as any).map(([key, value]) => (
                          <div key={key} className="text-center p-3 bg-gray-50 rounded">
                            <p className="text-2xl font-bold text-rosegold">{value as string}</p>
                            <p className="text-sm text-gray-600 font-poppins capitalize">
                              {key.replace('_', ' ')}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-gray-600 font-poppins py-8">
                        No statistics available for this player.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ai-analysis" className="space-y-4">
                <Card className="bg-white border-rosegold/20">
                  <CardHeader>
                    <CardTitle className="font-polysans text-rosegold flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      AI-Powered Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {aiAnalysis ? (
                      <>
                        <div className="text-center p-4 bg-gradient-to-r from-rosegold/10 to-bright-pink/10 rounded-lg">
                          <h3 className="font-polysans text-2xl font-bold text-black mb-2">
                            Estimated Market Value
                          </h3>
                          <p className="text-3xl font-bold text-rosegold">
                            {formatCurrency(aiAnalysis.marketValue)}
                          </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="font-poppins font-semibold text-black mb-3 flex items-center gap-2">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              Strengths
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.strengths.map((strength, index) => (
                                <li key={index} className="text-gray-700 font-poppins flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                  {strength}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-poppins font-semibold text-black mb-3 flex items-center gap-2">
                              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                              Areas for Improvement
                            </h4>
                            <ul className="space-y-2">
                              {aiAnalysis.weaknesses.map((weakness, index) => (
                                <li key={index} className="text-gray-700 font-poppins flex items-start gap-2">
                                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                  {weakness}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-poppins font-semibold text-black mb-3">Playing Style</h4>
                          <p className="text-gray-700 font-poppins bg-gray-50 p-4 rounded-lg">
                            {aiAnalysis.playingStyle}
                          </p>
                        </div>

                        <div>
                          <h4 className="font-poppins font-semibold text-black mb-3">Transfer Recommendation</h4>
                          <p className="text-gray-700 font-poppins bg-rosegold/10 p-4 rounded-lg border border-rosegold/20">
                            {aiAnalysis.transferRecommendation}
                          </p>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto mb-4"></div>
                        <p className="text-gray-600 font-poppins">Generating AI analysis...</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="w-16 h-16 mx-auto mb-4 text-gray-400" />
            <h3 className="font-polysans text-xl font-semibold text-white mb-2">
              Player Not Found
            </h3>
            <p className="text-gray-400 font-poppins">
              The requested player profile could not be loaded.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PlayerProfileModal;
