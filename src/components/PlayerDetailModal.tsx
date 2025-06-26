
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  User, 
  Calendar, 
  MapPin, 
  Ruler, 
  Weight, 
  DollarSign, 
  Video, 
  MessageSquare,
  Star,
  Trophy,
  Target,
  X,
  Play,
  Edit
} from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;
type DatabaseVideo = Tables<'videos'>;

interface PlayerDetailModalProps {
  player: DatabasePlayer;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({ 
  player, 
  isOpen, 
  onClose, 
  onEdit 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState<number | null>(null);
  const [isOwnPlayer, setIsOwnPlayer] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      calculateAge();
      checkOwnership();
      fetchPlayerVideos();
    }
  }, [isOpen, player, profile]);

  const calculateAge = () => {
    if (player.date_of_birth) {
      const birthDate = new Date(player.date_of_birth);
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

  const checkOwnership = async () => {
    if (!profile?.id) return;

    try {
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (team && team.id === player.team_id) {
        setIsOwnPlayer(true);
      }
    } catch (error) {
      console.error('Error checking ownership:', error);
    }
  };

  const fetchPlayerVideos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('team_id', player.team_id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-[#1a1a1a] border-gray-700">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-white font-polysans text-2xl">
            {player.full_name}
          </DialogTitle>
          <div className="flex gap-2">
            {isOwnPlayer && onEdit && (
              <Button variant="outline" size="sm" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Player Header */}
          <div className="flex items-start gap-6">
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
                    <p className="text-white font-semibold">{age || 'N/A'}</p>
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

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-gray-800">
              <TabsTrigger value="overview" className="text-white">Overview</TabsTrigger>
              <TabsTrigger value="career" className="text-white">Career</TabsTrigger>
              <TabsTrigger value="videos" className="text-white">Videos</TabsTrigger>
              <TabsTrigger value="stats" className="text-white">Stats</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* Bio */}
              {player.bio && (
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Biography</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-300 font-poppins">{player.bio}</p>
                  </CardContent>
                </Card>
              )}

              {/* Personal Information */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white font-polysans">Personal Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    {player.player_agent && (
                      <div>
                        <p className="text-gray-400 text-sm">Agent</p>
                        <p className="text-white">{player.player_agent}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="career" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white font-polysans">Career Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {player.current_club && (
                      <div>
                        <p className="text-gray-400 text-sm">Current Club</p>
                        <p className="text-white">{player.current_club}</p>
                      </div>
                    )}
                    {player.contract_expires && (
                      <div>
                        <p className="text-gray-400 text-sm">Contract Expires</p>
                        <p className="text-white">{formatDate(player.contract_expires)}</p>
                      </div>
                    )}
                    {player.joined_date && (
                      <div>
                        <p className="text-gray-400 text-sm">Joined Date</p>
                        <p className="text-white">{formatDate(player.joined_date)}</p>
                      </div>
                    )}
                  </div>

                  {/* Leagues */}
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

                  {/* Titles */}
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="videos" className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto"></div>
                  <p className="text-gray-400 mt-2">Loading videos...</p>
                </div>
              ) : videos.length === 0 ? (
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-8 text-center">
                    <Video className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                    <p className="text-gray-400">No videos available</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="bg-gray-800 border-gray-700 hover:border-rosegold/50 transition-colors group cursor-pointer">
                      <CardContent className="p-4">
                        <div className="aspect-video bg-gray-700 rounded-lg mb-3 relative overflow-hidden">
                          {video.thumbnail_url ? (
                            <img
                              src={video.thumbnail_url}
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Video className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Play className="w-8 h-8 text-white" />
                          </div>
                        </div>
                        <h4 className="text-white font-polysans font-semibold truncate">{video.title}</h4>
                        {video.description && (
                          <p className="text-gray-400 text-sm mt-1 line-clamp-2">{video.description}</p>
                        )}
                        <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                          <span>{video.duration ? `${video.duration}s` : 'N/A'}</span>
                          <span>{video.video_type || 'highlight'}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white font-polysans">Performance Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  {player.match_stats ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {Object.entries(player.match_stats as Record<string, any>).map(([key, value]) => (
                        <div key={key} className="text-center">
                          <p className="text-2xl font-bold text-rosegold">{value}</p>
                          <p className="text-gray-400 text-sm capitalize">{key.replace('_', ' ')}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400 text-center py-8">No statistics available</p>
                  )}
                </CardContent>
              </Card>

              {/* AI Analysis */}
              {player.ai_analysis && (
                <Card className="bg-gray-800 border-gray-700">
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
      </DialogContent>
    </Dialog>
  );
};

export default PlayerDetailModal;
