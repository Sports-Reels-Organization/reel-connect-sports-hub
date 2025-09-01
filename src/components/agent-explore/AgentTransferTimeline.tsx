import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Clock, MessageCircle, Eye, AlertCircle, TrendingUp,
  Search, Filter, Grid3X3, List, Play, Building2, User, MapPin, Calendar, DollarSign, Heart, HeartOff, CheckCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSportData } from '@/hooks/useSportData';
import MessagePlayerModal from '../MessagePlayerModal';

interface TimelinePitch {
  id: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  deal_stage: string;
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
  is_international: boolean;
  description: string;
  tagged_videos: any[];
  team_id: string;
  status: string;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    photo_url?: string;
    age?: number;
    market_value?: number;
  };
  teams: {
    id: string;
    team_name: string;
    logo_url?: string;
    country: string;
    sport_type?: string;
    profile_id: string;
  };
  agent_interest?: Array<{
    id: string;
    agent_id: string;
    status: 'interested' | 'requested' | 'negotiating';
    created_at: string;
  }>;
}

const AgentTransferTimeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<TimelinePitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<TimelinePitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [agentSportType, setAgentSportType] = useState<'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby'>('football');
  const [shortlistedPitches, setShortlistedPitches] = useState<Set<string>>(new Set());
  const [selectedPlayerForMessage, setSelectedPlayerForMessage] = useState<TimelinePitch | null>(null);
  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedPitchForInterest, setSelectedPitchForInterest] = useState<TimelinePitch | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestType, setInterestType] = useState<'interested' | 'requested'>('interested');
  const [expressedInterests, setExpressedInterests] = useState<Set<string>>(new Set());
  const [existingInterestData, setExistingInterestData] = useState<{status: string, message: string} | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [dealStageFilter, setDealStageFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  // Get sport-specific data
  const { positions } = useSportData(agentSportType);
  const transferTypes = ['permanent', 'loan'];
  const dealStages = ['pitch', 'interest', 'discussion', 'expired'];
  const priceRanges = [
    { label: 'Under $100K', value: '0-100000' },
    { label: '$100K - $500K', value: '100000-500000' },
    { label: '$500K - $1M', value: '500000-1000000' },
    { label: '$1M - $5M', value: '1000000-5000000' },
    { label: 'Over $5M', value: '5000000-999999999' }
  ];

  // Get unique teams for filtering
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);

  useEffect(() => {
    fetchAgentSportType();
  }, [profile]);

  useEffect(() => {
    if (agentSportType) {
      fetchTimelinePitches();
      fetchShortlistedPitches();
      fetchExpressedInterests();
    }
  }, [agentSportType]);

  useEffect(() => {
    applyFilters();
  }, [pitches, searchTerm, positionFilter, transferTypeFilter, priceRangeFilter, dealStageFilter, teamFilter]);

  const fetchAgentSportType = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('specialization')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching agent sport type:', error);
        return;
      }

      if (data?.specialization && Array.isArray(data.specialization) && data.specialization.length > 0) {
        const sportType = data.specialization[0] as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby';
        setAgentSportType(sportType);
      }
    } catch (error) {
      console.error('Error fetching agent sport type:', error);
    }
  };

  const fetchShortlistedPitches = async () => {
    if (!profile?.id) return;

    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      // Use the correct table name from the database schema
      const { data, error } = await supabase
        .from('shortlist')
        .select('pitch_id')
        .eq('agent_id', agentData.id);

      if (error) {
        console.error('Error fetching shortlisted pitches:', error);
        return;
      }

      const shortlistedIds = new Set(data.map(item => item.pitch_id));
      setShortlistedPitches(shortlistedIds);
    } catch (error) {
      console.error('Error fetching shortlisted pitches:', error);
    }
  };

  const fetchExpressedInterests = async () => {
    if (!profile?.id) return;

    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      // Fetch all pitches where this agent has expressed interest
      const { data, error } = await supabase
        .from('agent_interest')
        .select('pitch_id')
        .eq('agent_id', agentData.id);

      if (error) {
        console.error('Error fetching expressed interests:', error);
        return;
      }

      const interestIds = new Set(data.map(item => item.pitch_id));
      setExpressedInterests(interestIds);
    } catch (error) {
      console.error('Error fetching expressed interests:', error);
    }
  };

  const fetchTimelinePitches = async () => {
    try {
      // Simplified query to avoid foreign key relationship issues
      const { data: pitchesData, error: pitchesError } = await supabase
        .from('transfer_pitches')
        .select('*')
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (pitchesError) throw pitchesError;

      // Fetch team and player data separately to avoid relationship issues
      const enrichedPitches = await Promise.all(
        (pitchesData || []).map(async (pitch) => {
          // Fetch team data
          const { data: teamData } = await supabase
            .from('teams')
            .select('id, team_name, logo_url, country, sport_type, profile_id')
            .eq('id', pitch.team_id)
            .single();

          // Fetch player data
          const { data: playerData } = await supabase
            .from('players')
            .select('id, full_name, position, citizenship, photo_url, date_of_birth, market_value')
            .eq('id', pitch.player_id)
            .single();

          // Fetch agent interest data
          const { data: interestData } = await supabase
            .from('agent_interest')
            .select('id, agent_id, status, created_at')
            .eq('pitch_id', pitch.id);

          return {
            ...pitch,
            teams: teamData || {},
            players: playerData || {},
            agent_interest: interestData || []
          };
        })
      );

      // Filter by sport type after fetching data
      const filteredPitches = enrichedPitches.filter(pitch => 
        pitch.teams?.sport_type === agentSportType
      );

      // Process data to add age calculation and ensure proper typing
      const processedPitches: TimelinePitch[] = filteredPitches.map(pitch => ({
        ...pitch,
        tagged_videos: Array.isArray(pitch.tagged_videos) ? pitch.tagged_videos : [],
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD',
        transfer_type: pitch.transfer_type || 'permanent',
        deal_stage: pitch.deal_stage || 'pitch',
        view_count: pitch.view_count || 0,
        message_count: pitch.message_count || 0,
        shortlist_count: pitch.shortlist_count || 0,
        is_international: pitch.is_international || false,
        description: pitch.description || '',
        players: {
          ...pitch.players,
          age: pitch.players.date_of_birth ?
            new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear() : undefined
        }
      }));

      setPitches(processedPitches);

      // Extract unique teams for filtering
      const teams = [...new Set(processedPitches.map(p => p.teams.team_name))].sort();
      setAvailableTeams(teams);

    } catch (error) {
      console.error('Error fetching timeline pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer timeline",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pitches];

    if (searchTerm) {
      filtered = filtered.filter(pitch =>
        pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (positionFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.players.position === positionFilter);
    }

    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.transfer_type === transferTypeFilter);
    }

    if (dealStageFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.deal_stage === dealStageFilter);
    }

    if (teamFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.teams.team_name === teamFilter);
    }

    if (priceRangeFilter !== 'all') {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      filtered = filtered.filter(pitch => {
        const price = pitch.asking_price || 0;
        return price >= min && price <= max;
      });
    }

    setFilteredPitches(filtered);
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'bg-blue-500';
      case 'interest': return 'bg-yellow-500';
      case 'discussion': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDealStageText = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'New Pitch';
      case 'interest': return 'Interest Shown';
      case 'discussion': return 'In Discussion';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = async (pitch: TimelinePitch) => {
    // Simply navigate to player profile - no RPC call needed since function doesn't exist
    navigate(`/player/${pitch.players.id}`, {
      state: {
        pitchId: pitch.id,
        fromTransferTimeline: true
      }
    });
  };

  const handleToggleShortlist = async (pitch: TimelinePitch) => {
    if (!profile?.id) return;

    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        toast({
          title: "Error",
          description: "Agent profile not found",
          variant: "destructive"
        });
        return;
      }

      const isShortlisted = shortlistedPitches.has(pitch.id);

      if (isShortlisted) {
        // Remove from shortlist
        const { error } = await supabase
          .from('shortlist')
          .delete()
          .eq('agent_id', agentData.id)
          .eq('pitch_id', pitch.id);

        if (error) throw error;

        setShortlistedPitches(prev => {
          const newSet = new Set(prev);
          newSet.delete(pitch.id);
          return newSet;
        });

        toast({
          title: "Removed",
          description: `${pitch.players.full_name} removed from shortlist`,
        });
      } else {
        // Add to shortlist
        const { error } = await supabase
          .from('shortlist')
          .insert({
            agent_id: agentData.id,
            pitch_id: pitch.id,
            player_id: pitch.players.id,
            priority_level: 'medium'
          });

        if (error) throw error;

        setShortlistedPitches(prev => new Set([...prev, pitch.id]));

        toast({
          title: "Added",
          description: `${pitch.players.full_name} added to shortlist`,
        });
      }
    } catch (error) {
      console.error('Error toggling shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      });
    }
  };

  const handleMessagePlayer = (pitch: TimelinePitch) => {
    setSelectedPlayerForMessage(pitch);
  };

  const handleOpenInterestModal = async (pitch: TimelinePitch) => {
    setSelectedPitchForInterest(pitch);
    
    // If agent has already expressed interest, fetch existing data
    if (expressedInterests.has(pitch.id)) {
      try {
        const { data: agentData } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile?.id)
          .single();

        if (agentData) {
          const { data: existingInterest } = await supabase
            .from('agent_interest')
            .select('status, message')
            .eq('pitch_id', pitch.id)
            .eq('agent_id', agentData.id)
            .single();

          if (existingInterest) {
            setExistingInterestData({
              status: existingInterest.status,
              message: existingInterest.message || ''
            });
            setInterestType(existingInterest.status as 'interested' | 'requested');
            setInterestMessage(existingInterest.message || '');
          }
        }
      } catch (error) {
        console.error('Error fetching existing interest:', error);
      }
    } else {
      // Reset form for new interest
      setExistingInterestData(null);
      setInterestType('interested');
      setInterestMessage('');
    }
    
    setShowInterestModal(true);
  };

  const handleInterestInPitch = async (pitch: TimelinePitch) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "Please log in to express interest",
        variant: "destructive"
      });
      return;
    }

    try {
      // First, get the agent record to ensure we have the correct agent_id
      let { data: agentData, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .maybeSingle(); // Changed from single() to maybeSingle() to handle missing agent records

      if (agentError) {
        console.error('Error fetching agent data:', agentError);
        toast({
          title: "Error",
          description: "Failed to fetch agent profile. Please try again.",
          variant: "destructive"
        });
        return;
      }

      if (!agentData) {
        // No agent record exists, create one
        console.log('No agent record found, creating one...');
        const { data: newAgentData, error: createError } = await supabase
          .from('agents')
          .insert({
            profile_id: profile.id,
            agency_name: 'Agency', // Default name
            specialization: ['football']
          })
          .select('id')
          .single();
        
        if (createError) {
          console.error('Error creating agent record:', createError);
          toast({
            title: "Error",
            description: "Failed to create agent profile. Please ensure you have a complete agent profile.",
            variant: "destructive"
          });
          return;
        }
        
        agentData = newAgentData;
        console.log('Created agent with ID:', agentData.id);
      }

      // Check if interest already exists to prevent duplicate key errors
      const { data: existingInterest, error: checkError } = await supabase
        .from('agent_interest')
        .select('id, status')
        .eq('pitch_id', pitch.id)
        .eq('agent_id', agentData.id)
        .maybeSingle(); // Changed from single() to maybeSingle() to handle no existing interest

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw checkError;
      }

      if (existingInterest) {
        // Update existing interest instead of creating new one
        const { error: updateError } = await supabase
          .from('agent_interest')
          .update({
            status: interestType,
            message: interestMessage,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingInterest.id);

        if (updateError) throw updateError;

        toast({
          title: "Interest Updated!",
          description: "Your interest has been updated successfully.",
        });
      } else {
        // Create new agent interest record
        const { error: interestError } = await supabase
          .from('agent_interest')
          .insert({
            pitch_id: pitch.id,
            agent_id: agentData.id,
            status: interestType,
            message: interestMessage,
            created_at: new Date().toISOString()
          });

        if (interestError) throw interestError;

        toast({
          title: "Success!",
          description: "Interest expressed successfully. The team will be notified.",
        });
      }

      // Create or update initial message
      const messageContent = interestMessage || `I'm interested in ${pitch.players.full_name}`;
      
      // Check if message already exists
      const { data: existingMessage } = await supabase
        .from('messages')
        .select('id')
        .eq('sender_id', profile.id)
        .eq('receiver_id', pitch.teams.profile_id)
        .eq('pitch_id', pitch.id)
        .eq('message_type', 'interest') // Reverted back to 'interest' since it's now valid
        .maybeSingle(); // Changed from single() to maybeSingle() to handle no existing message

      if (!existingMessage) {
        // Create new message only if one doesn't exist
        const { error: messageError } = await supabase
          .from('messages')
          .insert({
            sender_id: profile.id,
            receiver_id: pitch.teams.profile_id,
            pitch_id: pitch.id,
            content: messageContent,
            message_type: 'interest', // Reverted back to 'interest' since it's now valid
            created_at: new Date().toISOString()
          });

        if (messageError) throw messageError;
      }

      // Update local state to show the button as "Interest Expressed"
      setExpressedInterests(prev => new Set([...prev, pitch.id]));

      setShowInterestModal(false);
      setSelectedPitchForInterest(null);
      setInterestMessage('');
      fetchTimelinePitches(); // Refresh to show new interest
      fetchExpressedInterests(); // Refresh expressed interests
    } catch (error: any) {
      console.error('Error expressing interest:', error);
      
      let errorMessage = "Failed to express interest";
      if (error.code === '23505') {
        errorMessage = "You have already expressed interest in this player";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };



  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-white text-lg sm:text-xl">
                <TrendingUp className="w-5 h-5" />
                Transfer Timeline ({filteredPitches.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <Select value={agentSportType} onValueChange={(value: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby') => setAgentSportType(value)}>
                  <SelectTrigger className="w-32 text-white border-gray-600 bg-gray-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="football" className="text-white">Football</SelectItem>
                    <SelectItem value="basketball" className="text-white">Basketball</SelectItem>
                    <SelectItem value="volleyball" className="text-white">Volleyball</SelectItem>
                    <SelectItem value="tennis" className="text-white">Tennis</SelectItem>
                    <SelectItem value="rugby" className="text-white">Rugby</SelectItem>
                  </SelectContent>
                </Select>
                {filteredPitches.length > 0 && (
                  <Badge variant="outline" className="text-rosegold border-rosegold text-xs sm:text-sm">
                    {filteredPitches.length} pitches
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="bg-rosegold hover:bg-rosegold/90 text-white text-xs"
              >
                <Grid3X3 className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">Grid</span>
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="bg-rosegold hover:bg-rosegold/90 text-white text-xs"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline ml-1">List</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            {/* Search Bar - Full Width */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-white placeholder:text-gray-500 w-full"
              />
            </div>

            {/* Filters Grid - Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="text-white text-sm">
                  <SelectValue placeholder="All Positions" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Positions</SelectItem>
                  {positions.map(position => (
                    <SelectItem key={position} value={position}>
                      {position}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="text-white text-sm">
                  <SelectValue placeholder="All Teams" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Teams</SelectItem>
                  {availableTeams.map(team => (
                    <SelectItem key={team} value={team}>
                      {team}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
                <SelectTrigger className="text-white text-sm">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Types</SelectItem>
                  {transferTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dealStageFilter} onValueChange={setDealStageFilter}>
                <SelectTrigger className="text-white text-sm">
                  <SelectValue placeholder="All Stages" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Stages</SelectItem>
                  {dealStages.map(stage => (
                    <SelectItem key={stage} value={stage}>
                      {getDealStageText(stage)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
                <SelectTrigger className="text-white text-sm">
                  <SelectValue placeholder="All Prices" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all">All Prices</SelectItem>
                  {priceRanges.map(range => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setPositionFilter('all');
                  setTransferTypeFilter('all');
                  setPriceRangeFilter('all');
                  setDealStageFilter('all');
                  setTeamFilter('all');
                }}
                className="text-white border-gray-600 hover:bg-gray-700 text-sm"
              >
                <Filter className="w-4 h-4 mr-2" />
                Clear
              </Button>
            </div>
          </div>

          {/* Results */}
          {filteredPitches.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {pitches.length === 0 ? 'No Active Pitches' : 'No Results Found'}
              </h3>
              <p className="text-gray-400">
                {pitches.length === 0
                  ? `No transfer pitches are currently active for ${agentSportType}.`
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'card' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6' : 'space-y-3'}>
              {filteredPitches.map((pitch) => (
                <Card
                  key={pitch.id}
                  className={`border-gray-600 transition-all duration-200 hover:border-rosegold/50 hover:shadow-lg ${isExpiringSoon(pitch.expires_at) ? 'border-red-500 border-2' : ''
                    } ${viewMode === 'list' ? 'w-full' : ''}`}
                >
                  <CardContent className={`${viewMode === 'list' ? 'p-3' : 'p-4'}`}>
                    <div className={`${viewMode === 'list' ? 'space-y-2' : 'space-y-3'}`}>
                      {/* Player and Team Info */}
                      <div className={`${viewMode === 'list' ? 'flex items-center gap-4' : 'flex items-start justify-between'}`}>
                        <div className={`flex items-center gap-3 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                          {pitch.players.photo_url ? (
                            <img
                              src={pitch.players.photo_url}
                              alt={pitch.players.full_name}
                              className={`${viewMode === 'list' ? 'w-10 h-10' : 'w-12 h-12'} rounded-full object-cover`}
                            />
                          ) : (
                            <div className={`${viewMode === 'list' ? 'w-10 h-10' : 'w-12 h-12'} rounded-full bg-gray-700 flex items-center justify-center`}>
                              <User className={`${viewMode === 'list' ? 'w-5 h-5' : 'w-6 h-6'} text-gray-400`} />
                            </div>
                          )}
                          <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                            <h3 className={`font-semibold text-white ${viewMode === 'list' ? 'text-base' : ''}`}>
                              {pitch.players.full_name}
                            </h3>
                            <p className={`text-gray-400 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                              {pitch.players.position} • {pitch.players.citizenship}
                              {pitch.players.age && ` • ${pitch.players.age} years`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {pitch.teams.logo_url && (
                                <img
                                  src={pitch.teams.logo_url}
                                  alt={pitch.teams.team_name}
                                  className="w-4 h-4 rounded-sm object-contain"
                                />
                              )}
                              <p className="text-xs text-gray-500">
                                {pitch.teams.team_name} • {pitch.teams.country}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className={`text-right ${viewMode === 'list' ? 'flex-shrink-0' : ''}`}>
                          <div className={`font-bold text-rosegold ${viewMode === 'list' ? 'text-base' : 'text-lg'}`}>
                            {formatCurrency(pitch.asking_price, pitch.currency)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {pitch.transfer_type.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {pitch.description && (
                        <p className={`text-gray-300 line-clamp-2 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                          {pitch.description}
                        </p>
                      )}

                      {/* Tags and Status */}
                      <div className={`${viewMode === 'list' ? 'flex items-center gap-4' : 'flex items-center justify-between'}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${getDealStageColor(pitch.deal_stage)} text-white border-none ${viewMode === 'list' ? 'text-xs' : ''}`}
                          >
                            {getDealStageText(pitch.deal_stage)}
                          </Badge>
                          {pitch.is_international && (
                            <Badge variant="outline" className={`text-blue-400 border-blue-400 ${viewMode === 'list' ? 'text-xs' : ''}`}>
                              International
                            </Badge>
                          )}
                          {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                            <Badge variant="outline" className={`text-green-400 border-green-400 ${viewMode === 'list' ? 'text-xs' : ''}`}>
                              <Play className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-3 h-4'} mr-1`} />
                              {pitch.tagged_videos.length} Videos
                            </Badge>
                          )}
                          {isExpiringSoon(pitch.expires_at) && (
                            <Badge variant="outline" className={`text-red-400 border-red-400 animate-pulse ${viewMode === 'list' ? 'text-xs' : ''}`}>
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <div className={`text-gray-400 ${viewMode === 'list' ? 'text-xs flex-shrink-0' : 'text-xs'}`}>
                          Expires {formatDistanceToNow(new Date(pitch.expires_at), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className={`flex items-center gap-4 text-gray-400 ${viewMode === 'list' ? 'text-xs' : 'text-sm'}`}>
                        <div className="flex items-center gap-1">
                          <Eye className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          {pitch.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          {pitch.message_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className={`${viewMode === 'list' ? 'w-3 h-3' : 'w-4 h-4'}`} />
                          {pitch.shortlist_count} shortlisted
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={`${viewMode === 'list' ? 'flex flex-wrap gap-2' : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2'}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                          onClick={() => handleViewDetails(pitch)}
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">View</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 text-xs"
                          onClick={() => handleMessagePlayer(pitch)}
                        >
                          <MessageCircle className="w-3 h-3 mr-1" />
                          <span className="hidden sm:inline">Message</span>
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className={`border-gray-600 hover:bg-gray-700 text-xs ${shortlistedPitches.has(pitch.id)
                            ? 'text-red-400 border-red-400'
                            : 'text-gray-300'
                            }`}
                          onClick={() => handleToggleShortlist(pitch)}
                        >
                          {shortlistedPitches.has(pitch.id) ? (
                            <HeartOff className="w-3 h-3" />
                          ) : (
                            <Heart className="w-3 h-3" />
                          )}
                          <span className="hidden sm:inline ml-1">Shortlist</span>
                        </Button>

                        {/* Express Interest Button */}
                        {!expressedInterests.has(pitch.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-rosegold text-rosegold hover:bg-rosegold hover:text-white text-xs"
                            onClick={() => handleOpenInterestModal(pitch)}
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Interest</span>
                          </Button>
                        )}

                        {expressedInterests.has(pitch.id) && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white text-xs"
                            onClick={() => handleOpenInterestModal(pitch)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            <span className="hidden sm:inline">Update</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Player Modal */}
      {selectedPlayerForMessage && (
        <MessagePlayerModal
          player={{
            id: selectedPlayerForMessage.players.id,
            full_name: selectedPlayerForMessage.players.full_name,
            position: selectedPlayerForMessage.players.position,
            photo_url: selectedPlayerForMessage.players.photo_url,
          }}
          isOpen={!!selectedPlayerForMessage}
          onClose={() => setSelectedPlayerForMessage(null)}
        />
      )}

      {/* Interest Modal */}
      {showInterestModal && selectedPitchForInterest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
                         <h3 className="text-xl font-semibold text-white mb-4">
               {expressedInterests.has(selectedPitchForInterest.id) ? 'Update Interest' : 'Express Interest'} in {selectedPitchForInterest.players.full_name}
             </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Interest Type
                </label>
                <Select value={interestType} onValueChange={(value: 'interested' | 'requested') => setInterestType(value)}>
                  <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="interested" className="text-white">Interested</SelectItem>
                    <SelectItem value="requested" className="text-white">Request More Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Tell the team why you're interested..."
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white min-h-[100px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
                             <Button
                 onClick={() => handleInterestInPitch(selectedPitchForInterest)}
                 className="bg-rosegold hover:bg-rosegold/90 text-white flex-1"
               >
                 <Heart className="w-4 h-4 mr-2" />
                 {expressedInterests.has(selectedPitchForInterest.id) ? 'Update Interest' : 'Express Interest'}
               </Button>
                             <Button
                 onClick={() => {
                   setShowInterestModal(false);
                   setSelectedPitchForInterest(null);
                   setInterestMessage('');
                   setInterestType('interested');
                   setExistingInterestData(null);
                 }}
                 variant="outline"
                 className="border-gray-600 text-white"
               >
                 Cancel
               </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentTransferTimeline;

