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
import PlayerProfileModal from '@/components/PlayerProfileModal';
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

  const handlePlayerTagClick = async (playerName: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('id, full_name')
        .ilike('full_name', `%${playerName}%`)
        .limit(1)
        .single();

      if (error || !data) {
        console.error('Player not found:', playerName);
        return;
      }

      openPlayerProfile(data.id, data.full_name);
    } catch (error) {
      console.error('Error finding player:', error);
    }
  };

  const handleSendMessage = async (player: any, pitchId: string) => {
    try {
      // Get the pitch data to find the team ID
      const { data: pitchData, error: pitchError } = await supabase
        .from('transfer_pitches')
        .select('team_id')
        .eq('id', pitchId)
        .single();

      if (pitchError || !pitchData) {
        console.error('Supabase error:', pitchError, pitchData);
        toast({
          title: "Error",
          description: "Could not find pitch information",
          variant: "destructive"
        });
        return;
      }

      // Get the team's profile ID for messaging
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('profile_id')
        .eq('id', pitchData.team_id)
        .single();

      if (teamError || !teamData) {
        console.error('Supabase error:', teamError, teamData);
        toast({
          title: "Error",
          description: "Could not find team information",
          variant: "destructive"
        });
        return;
      }

      setSelectedPlayer({ ...player, pitchId });
      setSelectedPitchId(pitchId);
      setSelectedTeamProfileId(teamData.profile_id);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error getting team info:', error);
      toast({
        title: "Error",
        description: "Failed to get team information",
        variant: "destructive"
      });
    }
  };

  const handlePitchCreated = () => {
    fetchTransferPitches();
  };

  const addToShortlist = async (pitch: TransferPitch) => {
    if (profile?.user_type !== 'agent') return;

    try {
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        toast({
          title: "Profile Required",
          description: "Please complete your agent profile first",
          variant: "destructive"
        });
        return;
      }

      // Check if already shortlisted
      const { data: existing } = await supabase
        .from('shortlist')
        .select('id')
        .eq('agent_id', agentData.id)
        .eq('pitch_id', pitch.id)
        .single();

      if (existing) {
        console.log('Supabase existing shortlist:', existing);
        toast({
          title: "Already Shortlisted",
          description: "This player is already in your shortlist",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('shortlist')
        .insert({
          agent_id: agentData.id,
          player_id: pitch.player_id,
          pitch_id: pitch.id
        });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Player added to your shortlist",
      });
    } catch (error) {
      console.error('Error adding to shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to add player to shortlist",
        variant: "destructive"
      });
    }
  };

  const handleMessageClick = async (pitch: TransferPitch) => {
    if (!pitch.player) {
      toast({
        title: "Error",
        description: "Player information not available",
        variant: "destructive"
      });
      return;
    }

    // Get the team's profile ID for messaging
    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('profile_id')
        .eq('id', pitch.team_id)
        .single();

      if (teamError || !teamData) {
        console.error('Supabase error:', teamError, teamData);
        toast({
          title: "Error",
          description: "Could not find team information",
          variant: "destructive"
        });
        return;
      }

      setSelectedPlayer(pitch.player);
      setSelectedPitchId(pitch.id);
      setSelectedTeamProfileId(teamData.profile_id);
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error getting team info:', error);
      toast({
        title: "Error",
        description: "Failed to get team information",
        variant: "destructive"
      });
    }
  };

  const handleSendMessageToPlayer = async (content: string, receiverId: string, pitchId?: string) => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          content,
          sender_id: profile.id,
          receiver_id: receiverId,
          pitch_id: pitchId,
        })
        .select(`
          *,
          sender_profile:profiles!messages_sender_id_fkey(
            full_name,
            user_type
          ),
          receiver_profile:profiles!messages_receiver_id_fkey(
            full_name,
            user_type
          )
        `)
        .single();

      if (error) {
        console.error('Supabase error:', error, data);
        toast({
          title: "Error",
          description: error.message || "Failed to send message",
          variant: "destructive"
        });
        return;
      }

      // Add message to local state for instant feedback
      setMessages(prev => [...prev, data]);

      toast({
        title: "Message Sent",
        description: "Your message has been sent successfully",
        duration: 2000,
      });
    } catch (error) {
      console.error('Error in handleSendMessageToPlayer:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTaggedPlayerNames = (video: TransferPitch) => {
    // Handle the Json type from database - it could be null, string[], or other Json types
    const taggedPlayersData = video.tagged_videos;
    if (!taggedPlayersData || !Array.isArray(taggedPlayersData)) return [];

    return (taggedPlayersData as string[])
      .map((playerId: string) => {
        const player = transferPitches.flatMap(p => p.player ? [p.player] : []).find(p => p.id === playerId);
        return player ? { id: playerId, name: player.full_name } : null;
      })
      .filter(Boolean);
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
                    {/* Player Header */}
                    <div className="flex items-center gap-4">
                      <div
                        className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 cursor-pointer hover:ring-2 hover:ring-rosegold transition-all"
                        onClick={() => handlePlayerClick(pitch.player)}
                      >
                        {pitch.player?.photo_url ? (
                          <img
                            src={pitch.player.photo_url}
                            alt={pitch.player.full_name}
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
                          className="font-polysans font-bold text-white text-lg cursor-pointer hover:text-rosegold transition-colors"
                          onClick={() => handlePlayerClick(pitch.player)}
                        >
                          {pitch.player?.full_name || 'Unknown Player'}
                        </h3>
                        <p className="text-gray-300 font-poppins text-sm">
                          {pitch.player?.position || 'Unknown Position'}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {pitch.player?.jersey_number && (
                            <Badge variant="outline" className="text-rosegold border-rosegold">
                              #{pitch.player.jersey_number}
                            </Badge>
                          )}
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                            {pitch.transfer_type.toUpperCase()}
                          </Badge>
                          {pitch.player?.citizenship && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              {pitch.player.citizenship}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <MapPin className="h-3 w-3" />
                      <span>{pitch.team?.team_name || pitch.team?.full_name}, {pitch.team?.country || 'Unknown'}</span>
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Height:</span>
                        <span className="text-white">{pitch.player?.height || 'N/A'} cm</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Weight:</span>
                        <span className="text-white">{pitch.player?.weight || 'N/A'} kg</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Nationality:</span>
                        <span className="text-white">{pitch.player?.citizenship || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Value:</span>
                        <span className="text-white">
                          {pitch.player?.market_value
                            ? formatCurrency(pitch.player.market_value, pitch.currency)
                            : 'N/A'
                          }
                        </span>
                      </div>
                    </div>

                    {/* Videos */}
                    {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <Video className="h-4 w-4" />
                          <span>{pitch.tagged_videos.length} video(s) available</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                          {pitch.tagged_videos.slice(0, 3).map((videoId, index) => (
                            <div key={index} className="flex-shrink-0 w-20 h-12 bg-gray-700 rounded text-xs flex items-center justify-center">
                              <Video className="h-4 w-4 text-gray-400" />
                            </div>
                          ))}
                          {pitch.tagged_videos.length > 3 && (
                            <div className="flex-shrink-0 w-20 h-12 bg-gray-700 rounded text-xs flex items-center justify-center text-gray-400">
                              +{pitch.tagged_videos.length - 3}
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
                        {formatDate(pitch.created_at)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDaysLeft(pitch.expires_at)}
                      </div>
                    </div>

                    {/* Enhanced Tagged Players with clickable names */}
                    {getTaggedPlayerNames(pitch).length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Tagged Players:</Label>
                        <div className="flex flex-wrap gap-1">
                          {getTaggedPlayerNames(pitch).map((player: any) => (
                            <Badge
                              key={player.id}
                              variant="secondary"
                              className="cursor-pointer hover:bg-bright-pink hover:text-white border-0 transition-colors"
                              onClick={() => handlePlayerTagClick(player.name)}
                            >
                              <User className="w-3 h-3 mr-1" />
                              {player.name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {pitch.tags && pitch.tags.length > 0 && (
                      <div className="space-y-2">
                        <Label className="text-white text-sm">Tags:</Label>
                        <div className="flex flex-wrap gap-1">
                          {pitch.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="outline" className="text-gray-400 border-0">
                              <Star className="w-3 h-3 mr-1" />
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {profile?.user_type === 'agent' && (
                      <div className="space-y-2">
                        <Button
                          onClick={() => handleMessageClick(pitch)}
                          size="sm"
                          className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Button
                          onClick={() => addToShortlist(pitch)}
                          size="sm"
                          variant="outline"
                          className="w-full border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins"
                        >
                          <Star className="h-4 w-4 mr-1" />
                          Add to Shortlist
                        </Button>
                      </div>
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
        <PlayerProfileModal
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
