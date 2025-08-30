import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Clock, MessageCircle, Eye, AlertCircle, TrendingUp,
  Search, Filter, Grid3X3, List, Play, Building2, User, MapPin, Calendar, DollarSign, Heart, HeartOff
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
  };
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

  const fetchTimelinePitches = async () => {
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
            photo_url,
            date_of_birth,
            market_value
          ),
          teams!inner(
            id,
            team_name,
            logo_url,
            country,
            sport_type
          )
        `)
        .eq('status', 'active')
        .eq('teams.sport_type', agentSportType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Process data to add age calculation and ensure proper typing
      const processedPitches: TimelinePitch[] = (data || []).map(pitch => ({
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
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                Transfer Timeline ({filteredPitches.length})
              </CardTitle>
              {filteredPitches.length > 0 && (
                <Badge variant="outline" className="text-rosegold border-rosegold">
                  {agentSportType.charAt(0).toUpperCase() + agentSportType.slice(1)}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-white placeholder:text-gray-500"
              />
            </div>

            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="text-white">
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
              <SelectTrigger className="text-white">
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
              <SelectTrigger className="text-white">
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
              <SelectTrigger className="text-white">
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
              <SelectTrigger className="text-white">
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
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
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
            <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredPitches.map((pitch) => (
                <Card
                  key={pitch.id}
                  className={`border-gray-600 transition-all duration-200 hover:border-rosegold/50 hover:shadow-lg ${isExpiringSoon(pitch.expires_at) ? 'border-red-500 border-2' : ''
                    } ${viewMode === 'list' ? 'w-full' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Player and Team Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {pitch.players.photo_url ? (
                            <img
                              src={pitch.players.photo_url}
                              alt={pitch.players.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-white">
                              {pitch.players.full_name}
                            </h3>
                            <p className="text-sm text-gray-400">
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
                        <div className="text-right">
                          <div className="text-lg font-bold text-rosegold">
                            {formatCurrency(pitch.asking_price, pitch.currency)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {pitch.transfer_type.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {pitch.description && (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {pitch.description}
                        </p>
                      )}

                      {/* Tags and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${getDealStageColor(pitch.deal_stage)} text-white border-none`}
                          >
                            {getDealStageText(pitch.deal_stage)}
                          </Badge>
                          {pitch.is_international && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              International
                            </Badge>
                          )}
                          {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              <Play className="w-3 h-4 mr-1" />
                              {pitch.tagged_videos.length} Videos
                            </Badge>
                          )}
                          {isExpiringSoon(pitch.expires_at) && (
                            <Badge variant="outline" className="text-red-400 border-red-400 animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          Expires {formatDistanceToNow(new Date(pitch.expires_at), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {pitch.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {pitch.message_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {pitch.shortlist_count} shortlisted
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => handleViewDetails(pitch)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => handleMessagePlayer(pitch)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          className={`border-gray-600 hover:bg-gray-700 ${shortlistedPitches.has(pitch.id)
                            ? 'text-red-400 border-red-400'
                            : 'text-gray-300'
                            }`}
                          onClick={() => handleToggleShortlist(pitch)}
                        >
                          {shortlistedPitches.has(pitch.id) ? (
                            <HeartOff className="w-4 h-4" />
                          ) : (
                            <Heart className="w-4 h-4" />
                          )}
                        </Button>
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
    </div>
  );
};

export default AgentTransferTimeline;

