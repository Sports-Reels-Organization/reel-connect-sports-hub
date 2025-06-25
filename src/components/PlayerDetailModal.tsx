
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, MessageSquare, FileText, Play, User, Calendar, MapPin, Target, Award } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import MessagePlayerModal from './MessagePlayerModal';

type DatabasePlayer = Tables<'players'>;
type DatabaseVideo = Tables<'videos'>;

interface PlayerDetailModalProps {
  player: DatabasePlayer;
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
}

const PlayerDetailModal: React.FC<PlayerDetailModalProps> = ({
  player,
  isOpen,
  onClose,
  onEdit
}) => {
  const { profile } = useAuth();
  const [videos, setVideos] = useState<DatabaseVideo[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && player) {
      fetchPlayerVideos();
    }
  }, [isOpen, player]);

  const fetchPlayerVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('player_id', player.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching player videos:', error);
    }
  };

  const calculateAge = (birthDate: string | null) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white font-polysans text-2xl">
              {player.full_name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Header Section with Photos */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-1 space-y-4">
                {/* Headshot */}
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto rounded-full overflow-hidden bg-gray-700 border-4 border-rosegold">
                    {player.headshot_url || player.photo_url ? (
                      <img
                        src={player.headshot_url || player.photo_url || ''}
                        alt={`${player.full_name} headshot`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-16 h-16 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-rosegold border-rosegold mt-2">
                    {player.jersey_number ? `#${player.jersey_number}` : 'No Number'}
                  </Badge>
                </div>
              </div>

              <div className="md:col-span-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{calculateAge(player.date_of_birth)}</div>
                    <div className="text-sm text-gray-400">Years Old</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{player.height || 'N/A'}</div>
                    <div className="text-sm text-gray-400">Height (cm)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{player.weight || 'N/A'}</div>
                    <div className="text-sm text-gray-400">Weight (kg)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-bright-pink">
                      {player.market_value ? formatCurrency(player.market_value) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-400">Market Value</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-rosegold" />
                    <span className="text-white font-semibold">{player.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-rosegold" />
                    <span className="text-gray-300">{player.citizenship}</span>
                  </div>
                  {player.current_club && (
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-rosegold" />
                      <span className="text-gray-300">{player.current_club}</span>
                    </div>
                  )}
                  {player.foot && (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400">Preferred Foot:</span>
                      <span className="text-white capitalize">{player.foot}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={onEdit} className="bg-rosegold hover:bg-rosegold/90 text-white">
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Player
                  </Button>
                  {profile?.user_type === 'agent' && (
                    <Button 
                      onClick={() => setShowMessageModal(true)}
                      className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                    >
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Photos */}
            {(player.portrait_url || player.full_body_url) && (
              <div className="grid grid-cols-2 gap-4">
                {player.portrait_url && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Portrait</h4>
                    <img
                      src={player.portrait_url}
                      alt={`${player.full_name} portrait`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
                {player.full_body_url && (
                  <div>
                    <h4 className="text-white font-semibold mb-2">Full Body</h4>
                    <img
                      src={player.full_body_url}
                      alt={`${player.full_name} full body`}
                      className="w-full h-64 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Tabs Section */}
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-4 bg-gray-800">
                <TabsTrigger value="details" className="text-white data-[state=active]:bg-rosegold">Details</TabsTrigger>
                <TabsTrigger value="videos" className="text-white data-[state=active]:bg-rosegold">Videos</TabsTrigger>
                <TabsTrigger value="stats" className="text-white data-[state=active]:bg-rosegold">Stats</TabsTrigger>
                <TabsTrigger value="contract" className="text-white data-[state=active]:bg-rosegold">Contract</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Full Name:</span>
                        <span className="text-white ml-2">{player.full_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Gender:</span>
                        <span className="text-white ml-2 capitalize">{player.gender}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Date of Birth:</span>
                        <span className="text-white ml-2">
                          {player.date_of_birth ? new Date(player.date_of_birth).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Place of Birth:</span>
                        <span className="text-white ml-2">{player.place_of_birth || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">FIFA ID:</span>
                        <span className="text-white ml-2">{player.fifa_id || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Agent:</span>
                        <span className="text-white ml-2">{player.player_agent || 'N/A'}</span>
                      </div>
                    </div>
                    {player.bio && (
                      <div className="mt-4">
                        <span className="text-gray-400">Bio:</span>
                        <p className="text-white mt-2">{player.bio}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="videos" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Player Videos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {videos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {videos.map((video) => (
                          <div key={video.id} className="bg-gray-900 rounded-lg p-4">
                            <div className="relative">
                              {video.thumbnail_url ? (
                                <img
                                  src={video.thumbnail_url}
                                  alt={video.title}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-32 bg-gray-700 rounded-lg flex items-center justify-center">
                                  <Play className="w-8 h-8 text-gray-400" />
                                </div>
                              )}
                              <Button
                                size="sm"
                                className="absolute inset-0 bg-black/50 hover:bg-black/70 text-white"
                                onClick={() => window.open(video.video_url, '_blank')}
                              >
                                <Play className="w-6 h-6" />
                              </Button>
                            </div>
                            <h4 className="text-white font-semibold mt-2">{video.title}</h4>
                            <p className="text-gray-400 text-sm">{video.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Play className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                        <p className="text-gray-400">No videos uploaded yet</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Performance Statistics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Award className="w-16 h-16 mx-auto text-gray-500 mb-4" />
                      <p className="text-gray-400">Statistics will be available soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contract" className="space-y-4">
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white font-polysans">Contract Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">Joined Date:</span>
                        <span className="text-white ml-2">
                          {player.joined_date ? new Date(player.joined_date).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Contract Expires:</span>
                        <span className="text-white ml-2">
                          {player.contract_expires ? new Date(player.contract_expires).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {showMessageModal && (
        <MessagePlayerModal
          player={player}
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </>
  );
};

export default PlayerDetailModal;
