import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, MapPin, MessageSquare, User, Clock, Target, Plus, Video, Star } from 'lucide-react';
import MessagePlayerModal from '@/components/MessagePlayerModal';
import CreateTransferPitch from '@/components/CreateTransferPitch';

interface TransferPitch {
  id: string;
  description: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  status: string;
  created_at: string;
  expires_at: string;
  tagged_videos: string[];
  sign_on_bonus: number;
  performance_bonus: number;
  player_salary: number;
  relocation_support: number;
  loan_fee: number;
  loan_with_option: boolean;
  loan_with_obligation: boolean;
  is_international: boolean;
  service_charge_rate: number;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    headshot_url: string;
    photo_url: string;
    jersey_number: number;
    age?: number;
    bio: string;
    market_value: number;
    height: number;
    weight: number;
  };
  teams: {
    team_name: string;
    country: string;
    logo_url: string;
    member_association: string;
  };
  tagged_video_details?: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration: number;
  }[];
}

const Timeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCreatePitch, setShowCreatePitch] = useState(false);
  const [currentTeamAssociation, setCurrentTeamAssociation] = useState<string>('');

  useEffect(() => {
    fetchCurrentTeamAssociation();
    fetchTransferPitches();
  }, []);

  const fetchCurrentTeamAssociation = async () => {
    if (!profile?.id) return;

    try {
      const { data: team } = await supabase
        .from('teams')
        .select('member_association')
        .eq('profile_id', profile.id)
        .single();

      if (team) {
        setCurrentTeamAssociation(team.member_association || '');
      }
    } catch (error) {
      console.error('Error fetching team association:', error);
    }
  };

  const fetchTransferPitches = async () => {
    try {
      let query = supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            headshot_url,
            photo_url,
            jersey_number,
            date_of_birth,
            bio,
            market_value,
            height,
            weight
          ),
          teams!inner(
            team_name,
            country,
            logo_url,
            member_association
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      // For basic tier, filter by same member association
      if (currentTeamAssociation) {
        query = query.eq('teams.member_association', currentTeamAssociation);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Process the data to include video details and calculate age
      const processedData = await Promise.all((data || []).map(async (pitch) => {
        // Calculate age
        const age = pitch.players.date_of_birth
          ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
          : undefined;

        // Handle tagged_videos - ensure it's an array of strings
        const taggedVideos = Array.isArray(pitch.tagged_videos) 
          ? pitch.tagged_videos as string[]
          : pitch.tagged_videos 
            ? [pitch.tagged_videos as string]
            : [];

        // Fetch video details for tagged videos
        let tagged_video_details = [];
        if (taggedVideos.length > 0) {
          const { data: videoData } = await supabase
            .from('videos')
            .select('id, title, thumbnail_url, duration')
            .in('id', taggedVideos);
          
          tagged_video_details = videoData || [];
        }

        return {
          ...pitch,
          tagged_videos: taggedVideos,
          players: {
            ...pitch.players,
            age
          },
          tagged_video_details
        };
      }));

      setPitches(processedData);
    } catch (error) {
      console.error('Error fetching transfer pitches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const formatDaysLeft = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 0) return 'Expired';
    if (diffInDays === 1) return '1 day left';
    return `${diffInDays} days left`;
  };

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
  };

  const handleSendMessage = (player: any, pitchId: string) => {
    setSelectedPlayer({ ...player, pitchId });
    setShowMessageModal(true);
  };

  const handlePitchCreated = () => {
    fetchTransferPitches();
  };

  return (
    <Layout>
      <div className="space-y-6 bg-background min-h-screen p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Transfer Timeline
            </h1>
            <p className="text-gray-400 font-poppins">
              Discover and promote player transfer opportunities
            </p>
          </div>
          {profile?.user_type === 'team' && (
            <Button
              onClick={() => setShowCreatePitch(true)}
              className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pitch
            </Button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-gray-700 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-48 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : pitches.length === 0 ? (
          <Card className="border-gray-700">
            <CardContent className="p-12 text-center">
              <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                No Active Transfer Pitches
              </h3>
              <p className="text-gray-400 font-poppins mb-6">
                {profile?.user_type === 'team' 
                  ? "Create your first transfer pitch to promote your players"
                  : "There are currently no active player transfer opportunities available."
                }
              </p>
              {profile?.user_type === 'team' && (
                <Button
                  onClick={() => setShowCreatePitch(true)}
                  className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Your First Pitch
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pitches.map((pitch) => (
              <Card key={pitch.id} className="border-gray-700 hover:border-rosegold/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Player Header */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 cursor-pointer"
                        onClick={() => handlePlayerClick(pitch.players)}
                      >
                        {pitch.players.headshot_url || pitch.players.photo_url ? (
                          <img
                            src={pitch.players.headshot_url || pitch.players.photo_url}
                            alt={pitch.players.full_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3
                          className="font-polysans font-bold text-white text-lg cursor-pointer hover:text-rosegold"
                          onClick={() => handlePlayerClick(pitch.players)}
                        >
                          {pitch.players.full_name}
                        </h3>
                        <p className="text-gray-300 font-poppins text-sm">
                          {pitch.players.position}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {pitch.players.jersey_number && (
                            <Badge variant="outline" className="text-rosegold border-rosegold">
                              #{pitch.players.jersey_number}
                            </Badge>
                          )}
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                            {pitch.transfer_type.toUpperCase()}
                          </Badge>
                          {pitch.is_international && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              INT'L
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{pitch.teams.team_name}, {pitch.teams.country}</span>
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Age:</span>
                        <span className="text-white">{pitch.players.age || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Height:</span>
                        <span className="text-white">{pitch.players.height || 'N/A'} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nationality:</span>
                        <span className="text-white">{pitch.players.citizenship}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Value:</span>
                        <span className="text-white">
                          {pitch.players.market_value 
                            ? formatCurrency(pitch.players.market_value, pitch.currency)
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Videos */}
                    {pitch.tagged_video_details && pitch.tagged_video_details.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Video className="h-4 w-4" />
                          <span>{pitch.tagged_video_details.length} video(s) available</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                          {pitch.tagged_video_details.slice(0, 3).map((video) => (
                            <div key={video.id} className="flex-shrink-0 w-20 h-12 bg-gray-700 rounded text-xs flex items-center justify-center">
                              <Video className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                          {pitch.tagged_video_details.length > 3 && (
                            <div className="flex-shrink-0 w-20 h-12 bg-gray-700 rounded text-xs flex items-center justify-center text-gray-400">
                              +{pitch.tagged_video_details.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {pitch.description && (
                      <p className="text-gray-300 font-poppins text-sm line-clamp-3">
                        {pitch.description}
                      </p>
                    )}

                    {/* Price */}
                    <div className="space-y-2">
                      {pitch.transfer_type === 'permanent' && pitch.asking_price && (
                        <div className="flex items-center gap-2 text-lg font-bold text-bright-pink">
                          <DollarSign className="h-5 w-5" />
                          {formatCurrency(pitch.asking_price, pitch.currency)}
                        </div>
                      )}
                      {pitch.transfer_type === 'loan' && pitch.loan_fee && (
                        <div className="flex items-center gap-2 text-lg font-bold text-bright-pink">
                          <DollarSign className="h-5 w-5" />
                          {formatCurrency(pitch.loan_fee, pitch.currency)} (Loan)
                        </div>
                      )}
                      
                      {/* Additional fees for permanent transfers */}
                      {pitch.transfer_type === 'permanent' && (
                        <div className="text-xs text-gray-400 space-y-1">
                          {pitch.sign_on_bonus && (
                            <div>Sign-on: {formatCurrency(pitch.sign_on_bonus, pitch.currency)}</div>
                          )}
                          {pitch.player_salary && (
                            <div>Salary: {formatCurrency(pitch.player_salary, pitch.currency)}</div>
                          )}
                        </div>
                      )}

                      {/* Loan options */}
                      {pitch.transfer_type === 'loan' && (
                        <div className="text-xs text-gray-400">
                          {pitch.loan_with_option && <div>• Option to buy</div>}
                          {pitch.loan_with_obligation && <div>• Obligation to buy</div>}
                        </div>
                      )}
                    </div>

                    {/* Service charge notice */}
                    <div className="text-xs text-blue-400 bg-blue-900/20 p-2 rounded">
                      {pitch.service_charge_rate}% service charge applies
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(pitch.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDaysLeft(pitch.expires_at)}
                      </div>
                    </div>

                    {/* Action Button */}
                    {profile?.user_type === 'agent' && (
                      <Button
                        onClick={() => handleSendMessage(pitch.players, pitch.id)}
                        size="sm"
                        className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Express Interest
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Transfer Pitch Modal */}
        <CreateTransferPitch
          isOpen={showCreatePitch}
          onClose={() => setShowCreatePitch(false)}
          onPitchCreated={handlePitchCreated}
        />

        {/* Message Player Modal */}
        {showMessageModal && selectedPlayer && (
          <MessagePlayerModal
            player={selectedPlayer}
            isOpen={showMessageModal}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedPlayer(null);
            }}
          />
        )}
      </div>
    </Layout>
  );
};

export default Timeline;
