import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Calendar, DollarSign, MapPin, MessageSquare, User, Clock, Target, Plus, Video, Star, Building2, Search, Filter, TrendingUp, Eye, Flag, Trophy, Zap } from 'lucide-react';
import { MessageModal } from '@/components/MessageModal';
import CreateTransferPitch from '@/components/CreateTransferPitch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { contractService } from '@/services/contractService';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  view_count?: number;
  message_count?: number;
  shortlist_count?: number;
  is_featured?: boolean;
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

const Timeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [transferPitches, setTransferPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showCreatePitch, setShowCreatePitch] = useState(false);
  const [selectedPitchId, setSelectedPitchId] = useState<string | null>(null);
  const [selectedTeamProfileId, setSelectedTeamProfileId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  useEffect(() => {
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
      .subscribe();

    return () => {
      pitchesSubscription.unsubscribe();
    };
  }, [profile?.id, toast]);

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
        console.error('Error fetching transfer pitches:', error);
        toast({
          title: "Error",
          description: "Failed to load transfer timeline",
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

  const formatDaysLeft = (expiresAt: string) => {
    const expires = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays <= 0) return 'Expired';
    if (diffInDays === 1) return '1 day left';
    return `${diffInDays} days left`;
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

  const handlePitchCreated = () => {
    fetchTransferPitches();
  };

  const filteredAndSortedPitches = transferPitches
    .filter(pitch => {
      const matchesSearch = 
        pitch.player?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.team?.team_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.player?.position?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesFilter = 
        filterType === 'all' ||
        (filterType === 'permanent' && pitch.transfer_type === 'permanent') ||
        (filterType === 'loan' && pitch.transfer_type === 'loan') ||
        (filterType === 'featured' && pitch.is_featured) ||
        (filterType === 'international' && pitch.is_international);

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'price_high':
          return (b.asking_price || 0) - (a.asking_price || 0);
        case 'price_low':
          return (a.asking_price || 0) - (b.asking_price || 0);
        case 'expiring':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        default:
          return 0;
      }
    });

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl font-polysans font-bold text-white mb-4 bg-gradient-to-r from-rosegold to-bright-pink bg-clip-text text-transparent">
                Transfer Timeline
              </h1>
              <p className="text-gray-400 font-poppins text-xl max-w-2xl">
                Discover exceptional talent and explore transfer opportunities from clubs worldwide
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-rosegold border-rosegold px-4 py-2 text-sm">
                  <Zap className="w-4 h-4 mr-2" />
                  {transferPitches.length} Live Pitches
                </Badge>
                {profile?.user_type === 'agent' && (
                  <Badge variant="outline" className="text-blue-400 border-blue-400 px-4 py-2 text-sm">
                    <Eye className="w-4 h-4 mr-2" />
                    Agent View
                  </Badge>
                )}
              </div>
              
              {profile?.user_type === 'team' && (
                <Button
                  onClick={() => setShowCreatePitch(true)}
                  className="bg-gradient-to-r from-rosegold to-bright-pink hover:from-rosegold/90 hover:to-bright-pink/90 text-white font-polysans font-medium px-6 py-3 shadow-lg hover:shadow-rosegold/25 transition-all duration-300"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Pitch
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="border-gray-700 bg-gray-800/50 backdrop-blur-sm mb-8 shadow-xl">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search players, teams, positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-gray-800 border-gray-600 text-white"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Transfers</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                  <SelectItem value="featured">Featured</SelectItem>
                  <SelectItem value="international">International</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="price_high">Price: High to Low</SelectItem>
                  <SelectItem value="price_low">Price: Low to High</SelectItem>
                  <SelectItem value="expiring">Expiring Soon</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center justify-center text-sm text-gray-400 bg-gray-900/50 rounded-lg px-4 py-2">
                <Eye className="w-4 h-4 mr-2" />
                {filteredAndSortedPitches.length} results
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="border-gray-700 bg-gray-800/30 animate-pulse">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-16 h-16 bg-gray-700 rounded-full"></div>
                      <div className="flex-1">
                        <div className="h-5 bg-gray-700 rounded mb-2"></div>
                        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
                      </div>
                    </div>
                    <div className="h-24 bg-gray-700 rounded"></div>
                    <div className="h-10 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedPitches.length === 0 ? (
          <Card className="border-gray-700 bg-gray-800/30 backdrop-blur-sm shadow-xl">
            <CardContent className="p-16 text-center">
              <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-br from-rosegold to-bright-pink rounded-full flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-3xl font-polysans font-semibold text-white mb-4">
                {searchTerm || filterType !== 'all' ? 'No Matches Found' : 'No Active Transfer Pitches'}
              </h3>
              <p className="text-gray-400 font-poppins text-lg mb-8 max-w-md mx-auto">
                {searchTerm || filterType !== 'all' 
                  ? "Try adjusting your search criteria or filters to discover more opportunities"
                  : profile?.user_type === 'team'
                    ? "Create your first transfer pitch to promote your players to the global market"
                    : "There are currently no active player transfer opportunities. Check back soon for new listings."
                }
              </p>
              {(searchTerm || filterType !== 'all') ? (
                <Button 
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                  }}
                  className="bg-gradient-to-r from-rosegold to-bright-pink hover:from-rosegold/90 hover:to-bright-pink/90 text-white"
                >
                  Clear Filters
                </Button>
              ) : profile?.user_type === 'team' && (
                <Button
                  onClick={() => setShowCreatePitch(true)}
                  className="bg-gradient-to-r from-rosegold to-bright-pink hover:from-rosegold/90 hover:to-bright-pink/90 text-white font-polysans"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Pitch
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedPitches.map((pitch) => (
              <Card 
                key={pitch.id} 
                className="border-gray-700 bg-gray-800/30 backdrop-blur-sm hover:bg-gray-800/50 hover:border-rosegold/50 transition-all duration-500 group hover:shadow-2xl hover:shadow-rosegold/20 hover:scale-[1.02]"
              >
                <CardContent className="p-6">
                  <div className="space-y-5">
                    {/* Featured Badge */}
                    {pitch.is_featured && (
                      <div className="flex justify-between items-center">
                        <Badge className="bg-gradient-to-r from-rosegold to-bright-pink text-white border-0 px-3 py-1">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                        {pitch.is_international && (
                          <Badge variant="outline" className="text-cyan-400 border-cyan-400">
                            <Building2 className="w-3 h-3 mr-1" />
                            International
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Player Header */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <Avatar className="w-16 h-16 border-2 border-gray-600 group-hover:border-rosegold transition-colors duration-300">
                          {pitch.player?.photo_url ? (
                            <AvatarImage src={pitch.player.photo_url} alt={pitch.player.full_name} />
                          ) : (
                            <AvatarFallback className="bg-gradient-to-br from-gray-700 to-gray-600 text-white text-lg">
                              <User className="w-8 h-8" />
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {pitch.team?.logo_url && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full overflow-hidden border-2 border-gray-800 bg-white">
                            <img src={pitch.team.logo_url} alt={pitch.team.team_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-polysans font-bold text-white text-lg truncate group-hover:text-rosegold transition-colors duration-300">
                          {pitch.player?.full_name || 'Unknown Player'}
                        </h3>
                        <p className="text-gray-300 font-poppins text-sm mb-2">
                          {pitch.player?.position || 'Unknown Position'} 
                          {pitch.player?.age && ` • ${pitch.player.age} years`}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'} className="text-xs">
                            {pitch.transfer_type?.toUpperCase()}
                          </Badge>
                          {pitch.player?.jersey_number && (
                            <Badge variant="outline" className="text-cyan-400 border-cyan-400 text-xs">
                              #{pitch.player.jersey_number}
                            </Badge>
                          )}
                          {pitch.player?.citizenship && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400 text-xs">
                              <Flag className="w-3 h-3 mr-1" />
                              {pitch.player.citizenship}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Team Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-300 bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                      <MapPin className="h-4 w-4 text-rosegold flex-shrink-0" />
                      <span className="font-medium truncate">{pitch.team?.team_name || pitch.team?.full_name}</span>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400 truncate">{pitch.team?.country || 'Unknown'}</span>
                    </div>

                    {/* Player Stats */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                        <div className="text-gray-400 text-xs mb-1">Height</div>
                        <div className="text-white font-medium">{pitch.player?.height || 'N/A'} cm</div>
                      </div>
                      <div className="bg-gray-900/50 rounded-lg p-3 border border-gray-700/50">
                        <div className="text-gray-400 text-xs mb-1">Market Value</div>
                        <div className="text-white font-medium">
                          {pitch.player?.market_value
                            ? formatCurrency(pitch.player.market_value, pitch.currency)
                            : 'N/A'
                          }
                        </div>
                      </div>
                    </div>

                    {/* Videos */}
                    {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                      <div className="bg-blue-900/20 rounded-lg p-3 border border-blue-500/20">
                        <div className="flex items-center gap-2 text-sm text-blue-400 mb-2">
                          <Video className="h-4 w-4" />
                          <span>{pitch.tagged_videos.length} highlight video(s)</span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto">
                          {pitch.tagged_videos.slice(0, 3).map((videoId, index) => (
                            <div key={index} className="flex-shrink-0 w-16 h-12 bg-blue-800/30 rounded text-xs flex items-center justify-center border border-blue-500/30">
                              <Video className="h-4 w-4 text-blue-400" />
                            </div>
                          ))}
                          {pitch.tagged_videos.length > 3 && (
                            <div className="flex-shrink-0 w-16 h-12 bg-blue-800/30 rounded text-xs flex items-center justify-center text-blue-400 border border-blue-500/30">
                              +{pitch.tagged_videos.length - 3}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Description */}
                    {pitch.description && (
                      <p className="text-gray-300 font-poppins text-sm line-clamp-3 leading-relaxed bg-gray-900/30 rounded-lg p-3 border border-gray-700/50">
                        {pitch.description}
                      </p>
                    )}

                    {/* Price Section */}
                    <div className="space-y-3">
                      {pitch.transfer_type === 'permanent' && pitch.asking_price && (
                        <div className="bg-gradient-to-r from-bright-pink/10 to-rosegold/10 rounded-lg p-4 border border-bright-pink/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-bright-pink" />
                              <span className="text-sm text-gray-400">Transfer Fee</span>
                            </div>
                            <span className="text-xl font-bold text-bright-pink">
                              {formatCurrency(pitch.asking_price, pitch.currency)}
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {pitch.transfer_type === 'loan' && pitch.loan_fee && (
                        <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg p-4 border border-blue-500/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <DollarSign className="h-5 w-5 text-blue-400" />
                              <span className="text-sm text-gray-400">Loan Fee</span>
                            </div>
                            <span className="text-xl font-bold text-blue-400">
                              {formatCurrency(pitch.loan_fee, pitch.currency)}
                            </span>
                          </div>
                          {(pitch.loan_with_option || pitch.loan_with_obligation) && (
                            <div className="mt-2 text-xs text-blue-300">
                              {pitch.loan_with_option && <span>• Option to buy</span>}
                              {pitch.loan_with_obligation && <span>• Obligation to buy</span>}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Additional fees for permanent transfers */}
                      {pitch.transfer_type === 'permanent' && (pitch.sign_on_bonus || pitch.player_salary) && (
                        <div className="text-xs text-gray-400 space-y-1 bg-gray-900/30 rounded-lg p-3">
                          {pitch.sign_on_bonus && (
                            <div className="flex justify-between">
                              <span>Sign-on bonus:</span>
                              <span className="text-white">{formatCurrency(pitch.sign_on_bonus, pitch.currency)}</span>
                            </div>
                          )}
                          {pitch.player_salary && (
                            <div className="flex justify-between">
                              <span>Annual salary:</span>
                              <span className="text-white">{formatCurrency(pitch.player_salary, pitch.currency)}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Service charge notice */}
                    <div className="text-xs text-blue-400 bg-blue-900/20 p-3 rounded-lg border border-blue-500/20 text-center">
                      {pitch.service_charge_rate}% service charge applies to completed transfers
                    </div>

                    {/* Footer Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-400 pt-3 border-t border-gray-700">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(pitch.created_at).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDaysLeft(pitch.expires_at)}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        {pitch.view_count && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {pitch.view_count}
                          </div>
                        )}
                        {pitch.message_count && (
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {pitch.message_count}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {profile?.user_type === 'agent' && (
                      <div className="space-y-3 pt-2">
                        <Button
                          onClick={() => handleMessageClick(pitch)}
                          className="w-full bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/90 hover:to-rosegold/90 text-white font-poppins font-medium transition-all duration-300 hover:shadow-lg hover:shadow-rosegold/25"
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          Contact Team
                        </Button>
                        <Button
                          onClick={() => addToShortlist(pitch)}
                          variant="outline"
                          className="w-full border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins transition-all duration-300"
                        >
                          <Star className="h-4 w-4 mr-2" />
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
      </div>
    </Layout>
  );
};

export default Timeline;
