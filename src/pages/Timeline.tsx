import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, MapPin, MessageSquare, User, Clock, Target, Plus, Video, Star, Building2 } from 'lucide-react';
import { MessageModal } from '@/components/MessageModal';
import CreateTransferPitch from '@/components/CreateTransferPitch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contractService } from '@/services/contractService';
import { cn } from '@/lib/utils';

interface TransferPitch {
  player_id: any;
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

      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          player:players(
            id,
            full_name,
            position,
            citizenship,
            height,
            weight,
            photo_url,
            jersey_number,
            bio,
            market_value
          ),
          team:profiles!transfer_pitches_team_id_fkey(
            id,
            full_name,
            country
          ),
          agent:profiles!transfer_pitches_agent_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching transfer pitches:', error);
        toast({
          title: "Error",
          description: "Failed to load transfer timeline",
          variant: "destructive"
        });
        return;
      }

      // Transform the data to match the interface
      const transformedData = (data || [])
        .filter(pitch => isValidPlayer(pitch.player))
        .map(pitch => {
          // Safely handle tagged_videos
          let taggedVideos: string[] = [];
          if (Array.isArray(pitch.tagged_videos)) {
            taggedVideos = pitch.tagged_videos.map(video => 
              typeof video === 'string' ? video : String(video)
            );
          }

          // Handle team data (might be array or single object)
          const teamData = Array.isArray(pitch.team) ? pitch.team[0] : pitch.team;
          
          // Handle agent data (might be array or single object)
          const agentData = Array.isArray(pitch.agent) ? pitch.agent[0] : pitch.agent;

          return {
            ...pitch,
            tagged_videos: taggedVideos,
            player: pitch.player,
            team: teamData ? {
              id: teamData.id || '',
              full_name: teamData.full_name || 'Unknown Team',
              country: teamData.country || 'Unknown',
              team_name: teamData.full_name || 'Unknown Team',
              logo_url: undefined,
              member_association: undefined
            } : {
              id: '',
              full_name: 'Unknown Team',
              country: 'Unknown',
              team_name: 'Unknown Team',
              logo_url: undefined,
              member_association: undefined
            },
            agent: agentData ? {
              id: agentData.id || '',
              full_name: agentData.full_name || 'Unknown Agent',
              email: agentData.email || '',
              phone: agentData.phone
            } : {
              id: '',
              full_name: 'Unknown Agent',
              email: '',
              phone: undefined
            }
          } as TransferPitch;
        });

      setTransferPitches(transformedData);
    } catch (error) {
      console.error('Error in fetchTransferPitches:', error);
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
          player:players(
            id,
            full_name,
            position,
            citizenship,
            height,
            weight,
            photo_url,
            jersey_number,
            bio,
            market_value
          ),
          team:profiles!transfer_pitches_team_id_fkey(
            id,
            full_name,
            country
          ),
          agent:profiles!transfer_pitches_agent_id_fkey(
            id,
            full_name,
            email,
            phone
          )
        `)
        .eq('id', pitchId)
        .single();

      if (error) {
        console.error('Error fetching pitch details:', error);
        return null;
      }

      if (!data || !isValidPlayer(data.player)) {
        console.error('Invalid player data in pitch details');
        return null;
      }

      // Safely handle tagged_videos
      let taggedVideos: string[] = [];
      if (Array.isArray(data.tagged_videos)) {
        taggedVideos = data.tagged_videos.map(video => 
          typeof video === 'string' ? video : String(video)
        );
      }

      // Handle team data (might be array or single object)
      const teamData = Array.isArray(data.team) ? data.team[0] : data.team;

      return {
        ...data,
        tagged_videos: taggedVideos,
        team: teamData ? {
          id: teamData.id || '',
          full_name: teamData.full_name || 'Unknown Team',
          country: teamData.country || 'Unknown',
          team_name: teamData.full_name || 'Unknown Team',
          logo_url: undefined,
          member_association: undefined
        } : {
          id: '',
          full_name: 'Unknown Team',
          country: 'Unknown',
          team_name: 'Unknown Team',
          logo_url: undefined,
          member_association: undefined
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

  const handlePlayerClick = (player: any) => {
    setSelectedPlayer(player);
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

      if (error) throw error;

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

    setSelectedPlayer(pitch.player);
    setShowMessageModal(true);

    // Fetch existing messages for this pitch
    try {
      const { data, error } = await supabase
        .from('messages')
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
        .eq('pitch_id', pitch.id)
        .or(`sender_id.eq.${profile?.id},receiver_id.eq.${profile?.id}`)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching messages:', error);
      } else {
        setMessages(data || []);

        // Mark messages as read
        const unreadMessages = data
          ?.filter(msg => msg.receiver_id === profile?.id && msg.status !== 'read')
          .map(msg => msg.id);

        if (unreadMessages && unreadMessages.length > 0) {
          await supabase
            .from('messages')
            .update({ status: 'read' })
            .in('id', unreadMessages);

          setUnreadCount(prev => Math.max(0, prev - unreadMessages.length));
        }
      }
    } catch (error) {
      console.error('Error in handleMessageClick:', error);
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
        console.error('Error sending message:', error);
        toast({
          title: "Error",
          description: "Failed to send message",
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
                        className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 cursor-pointer"
                        onClick={() => pitch.player && handlePlayerClick(pitch.player)}
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
                          className="font-polysans font-bold text-white text-lg cursor-pointer hover:text-rosegold"
                          onClick={() => pitch.player && handlePlayerClick(pitch.player)}
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
            playerId={selectedPlayer.id}
            teamId={selectedTeamProfileId}
            currentUserId={profile?.id || ''}
            playerName={selectedPlayer.full_name}
            teamName={selectedPlayer.team?.team_name}
          />
        )}
      </div>
    </Layout>
  );
};

export default Timeline;
