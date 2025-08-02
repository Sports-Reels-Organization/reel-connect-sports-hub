import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, MapPin, MessageSquare, User, Clock, Target, Plus, Video, Star, Building2 } from 'lucide-react';
import MessageModal from '@/components/MessageModal';
import CreateTransferPitch from '@/components/CreateTransferPitch';
import PlayerProfileWrapper from '@/components/PlayerProfileWrapper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contractService } from '@/services/contractService';
import { cn } from '@/lib/utils';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

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
  team_id: string;
  player_id: string;
  player?: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    nationality?: string;
    headshot_url?: string;
    photo_url: string;
    jersey_number: number;
    age?: number;
    bio: string;
    market_value: number;
    height: number;
    weight: number;
  };
  team?: {
    id?: string;
    team_name?: string;
    full_name: string;
    country: string;
    logo_url?: string;
    member_association?: string;
  };
  tagged_video_details?: {
    id: string;
    title: string;
    thumbnail_url: string;
    duration: number;
  }[];
  agent?: {
    id?: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  pitch_id?: string;
  contract_file_url?: string;
  created_at: string;
  status?: 'sent' | 'delivered' | 'read';
  sender_profile?: {
    full_name: string;
    user_type: string;
  };
}

function isValidPlayer(player: any): player is TransferPitch['player'] {
  return (
    player &&
    typeof player === 'object' &&
    !('error' in player) &&
    typeof player.id === 'string' &&
    typeof player.full_name === 'string' &&
    typeof player.position === 'string' &&
    typeof player.citizenship === 'string'
  );
}

const Timeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transferPitches, setTransferPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCreatePitch, setShowCreatePitch] = useState(false);
  const [currentTeamAssociation, setCurrentTeamAssociation] = useState<string>('');
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);
  const [selectedTeamProfileId, setSelectedTeamProfileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [realTimeConnected, setRealTimeConnected] = useState(false);

  const {
    selectedPlayerId,
    selectedPlayerName,
    isModalOpen: isPlayerModalOpen,
    openPlayerProfile,
    closePlayerProfile
  } = usePlayerProfile();

  useEffect(() => {
    fetchCurrentTeamAssociation();
    fetchTransferPitches();
  }, []);

  useEffect(() => {
    if (!profile?.id) return;

    // Subscribe to new transfer pitches
    const pitchesSubscription = supabase
      .channel('transfer_pitches')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transfer_pitches',
          filter: 'status=eq.active'
        },
        (payload) => {
          console.log('New transfer pitch received:', payload.new);

          // Fetch full pitch data with joins
          fetchPitchWithDetails(payload.new.id).then(newPitch => {
            if (newPitch) {
              setTransferPitches(prev => [newPitch, ...prev]);

              // Show notification
              toast({
                title: "New Transfer Pitch",
                description: `${newPitch.player?.full_name} is now available for transfer`,
                duration: 5000,
              });
            }
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'transfer_pitches'
        },
        (payload) => {
          // Update existing pitch
          setTransferPitches(prev =>
            prev.map(pitch =>
              pitch.id === payload.new.id ? { ...pitch, ...payload.new } : pitch
            )
          );
        }
      )
      .subscribe();

    // Subscribe to new messages
    const messagesSubscription = supabase
      .channel('timeline_messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${profile?.id}`
        },
        (payload) => {
          console.log('New message received:', payload.new);

          // Update unread count
          setUnreadCount(prev => prev + 1);

          // Add to messages if modal is open
          if (showMessageModal && selectedPlayer) {
            setMessages(prev => [...prev, payload.new as Message]);
          }

          // Show notification
          toast({
            title: "New Message",
            description: `You have a new message about ${selectedPlayer?.full_name || 'a transfer'}`,
            duration: 4000,
          });
        }
      )
      .subscribe();

    setRealTimeConnected(true);

    return () => {
      pitchesSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      setRealTimeConnected(false);
    };
  }, [profile?.id, showMessageModal, selectedPlayer, toast]);

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
      setLoading(true);
      console.log('Fetching transfer pitches...');

      // Fetch transfer pitches with full player and team data
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            height,
            weight,
            photo_url,
            jersey_number,
            bio,
            market_value,
            age
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url,
            member_association
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error:', error, data);
        toast({
          title: "Error",
          description: error.message || "Failed to load transfer timeline",
          variant: "destructive"
        });
        return;
      }

      console.log('Fetched transfer pitches:', data);

      // Transform the data to match the interface
      const transformedData = (data || []).map(pitch => {
        // Safely handle tagged_videos
        let taggedVideos: string[] = [];
        if (Array.isArray(pitch.tagged_videos)) {
          taggedVideos = pitch.tagged_videos.map(video =>
            typeof video === 'string' ? video : String(video)
          );
        }

        // Handle player data
        const playerData = Array.isArray(pitch.players) ? pitch.players[0] : pitch.players;

        // Handle team data
        const teamData = Array.isArray(pitch.teams) ? pitch.teams[0] : pitch.teams;

        return {
          ...pitch,
          tagged_videos: taggedVideos,
          player: playerData ? {
            id: playerData.id,
            full_name: playerData.full_name,
            position: playerData.position,
            citizenship: playerData.citizenship,
            height: playerData.height || 180,
            weight: playerData.weight || 70,
            photo_url: playerData.photo_url || '',
            jersey_number: playerData.jersey_number || 0,
            bio: playerData.bio || '',
            market_value: playerData.market_value || 0,
            age: playerData.age
          } : undefined,
          team: teamData ? {
            id: teamData.id,
            full_name: teamData.team_name,
            country: teamData.country,
            team_name: teamData.team_name,
            logo_url: teamData.logo_url,
            member_association: teamData.member_association
          } : undefined,
          agent: {
            id: '',
            full_name: 'Team Agent',
            email: '',
            phone: undefined
          }
        } as TransferPitch;
      });

      console.log('Transformed transfer pitches:', transformedData);
      setTransferPitches(transformedData);
    } catch (error) {
      console.error('Error in fetchTransferPitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchPitchWithDetails = async (pitchId: string): Promise<TransferPitch | null> => {
    try {
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            height,
            weight,
            photo_url,
            jersey_number,
            bio,
            market_value,
            age
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url,
            member_association
          )
        `)
        .eq('id', pitchId)
        .single();

      if (error) {
        console.error('Error fetching pitch details:', error);
        return null;
      }

      if (!data) {
        console.error('No pitch data found');
        return null;
      }

      // Safely handle tagged_videos
      let taggedVideos: string[] = [];
      if (Array.isArray(data.tagged_videos)) {
        taggedVideos = data.tagged_videos.map(video =>
          typeof video === 'string' ? video : String(video)
        );
      }

      // Handle player data
      const playerData = Array.isArray(data.players) ? data.players[0] : data.players;

      // Handle team data
      const teamData = Array.isArray(data.teams) ? data.teams[0] : data.teams;

      return {
        ...data,
        tagged_videos: taggedVideos,
        player: playerData ? {
          id: playerData.id,
          full_name: playerData.full_name,
          position: playerData.position,
          citizenship: playerData.citizenship,
          height: playerData.height || 180,
          weight: playerData.weight || 70,
          photo_url: playerData.photo_url || '',
          jersey_number: playerData.jersey_number || 0,
          bio: playerData.bio || '',
          market_value: playerData.market_value || 0,
          age: playerData.age
        } : undefined,
        team: teamData ? {
          id: teamData.id,
          full_name: teamData.team_name,
          country: teamData.country,
          team_name: teamData.team_name,
          logo_url: teamData.logo_url,
          member_association: teamData.member_association
        } : undefined,
        agent: {
          id: '',
          full_name: 'Team Agent',
          email: '',
          phone: undefined
        }
      } as TransferPitch;
    } catch (error) {
      console.error('Error in fetchPitchWithDetails:', error);
      return null;
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

  const handlePlayerClick = async (player: any) => {
    if (player && player.id) {
      openPlayerProfile(player.id, player.full_name);
    }
  };

  const handleMessagePlayer = (pitch: TransferPitch) => {
    if (!pitch.player) {
      toast({
        title: "Error",
        description: "Player information not available",
        variant: "destructive"
      });
      return;
    }

    setSelectedPlayer(pitch.player);
    setSelectedPitchId(pitch.id);
    setSelectedTeamProfileId(pitch.team_id);
    setShowMessageModal(true);
  };

  return (
    <Layout>
      <div className="space-y-6 bg-background min-h-screen p-[3rem]">
        <div className="flex items-center justify-between">
          <div className='text-start'>
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
        ) : transferPitches.length === 0 ? (
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
            {transferPitches.map((pitch) => (
              <Card key={pitch.id} className="border-gray-700 hover:border-rosegold/50 transition-colors group">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={pitch.player?.photo_url} alt={pitch.player?.full_name} />
                          <AvatarFallback>{pitch.player?.full_name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                          <h3 className="text-lg font-semibold text-white hover:underline cursor-pointer" onClick={() => handlePlayerClick(pitch.player)}>
                            {pitch.player?.full_name}
                          </h3>
                          <p className="text-sm text-gray-400">
                            {pitch.player?.position} | {pitch.player?.age} years
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="uppercase">
                        {pitch.transfer_type}
                      </Badge>
                    </div>

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <Building2 className="w-4 h-4" />
                        <span>{pitch.team?.team_name}, {pitch.team?.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Asking Price: {formatCurrency(pitch.asking_price, pitch.currency)}</span>
                      </div>
                      <p className="text-sm text-gray-400 line-clamp-3">
                        {pitch.description}
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>Posted {formatTimeAgo(pitch.created_at)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>Expires in {formatDaysLeft(pitch.expires_at)}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between">
                      <Button
                        variant="outline"
                        className="w-full bg-transparent hover:bg-secondary/50 border-gray-600 text-gray-300 hover:text-white font-polysans"
                        onClick={() => handleMessagePlayer(pitch)}
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
                    </div>
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
          onPitchCreated={() => fetchTransferPitches()}
        />

        {/* Message Player Modal */}
        {showMessageModal && selectedPlayer && (
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => {
              setShowMessageModal(false);
              setSelectedPlayer(null);
              setMessages([]);
            }}
            pitchId={selectedPitchId}
            receiverId={selectedTeamProfileId}
            receiverName={selectedPlayer.full_name}
            receiverType="team"
            pitchTitle={selectedPlayer ? `${selectedPlayer.full_name} - Transfer Pitch` : undefined}
            currentUserId={profile?.id || ''}
            playerName={selectedPlayer.full_name || 'Unknown Player'}
          />
        )}

        {/* Player Profile Modal */}
        <PlayerProfileWrapper
          isOpen={isPlayerModalOpen}
          onClose={closePlayerProfile}
          playerId={selectedPlayerId || ''}
          playerName={selectedPlayerName || ''}
        />
      </div>
    </Layout>
  );
};

export default Timeline;
