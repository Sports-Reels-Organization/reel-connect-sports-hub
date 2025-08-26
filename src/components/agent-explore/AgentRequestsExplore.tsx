
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Search, Clock, DollarSign, MapPin, User, Eye, MessageSquare, 
  Heart, Filter, Bookmark, TrendingUp, AlertCircle, Star,
  Edit, XCircle, Play, Grid3X3, List, MessageCircle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { ShortlistManager } from '@/components/ShortlistManager';
import MessageModal from '@/components/MessageModal';

interface TransferPitch {
  id: string;
  asking_price: number | null;
  currency: string;
  transfer_type: string;
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
  is_international: boolean;
  description: string;
  deal_stage: string;
  status: string;
  tagged_videos: string[];
  
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    age: number;
    photo_url?: string;
    market_value?: number;
    headshot_url?: string;
    date_of_birth: string;
  };
  teams: {
    id: string;
    team_name: string;
    country: string;
    logo_url?: string;
    sport_type?: string;
  };
}

interface AgentRequestsExploreProps {
  initialSearch?: string;
}

const AgentRequestsExplore: React.FC<AgentRequestsExploreProps> = ({ initialSearch = '' }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [agentSportTypes, setAgentSportTypes] = useState<string[]>([]);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<TransferPitch | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [dealStageFilter, setDealStageFilter] = useState('all');
  const [sportTypeFilter, setSportTypeFilter] = useState('all');
  
  // Filter options
  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'];
  const transferTypes = ['permanent', 'loan'];
  const dealStages = ['pitch', 'interest', 'discussion', 'expired'];
  const sportTypes = ['football', 'basketball', 'volleyball', 'tennis', 'rugby'];
  const priceRanges = [
    { label: 'Under $100K', value: '0-100000' },
    { label: '$100K - $500K', value: '100000-500000' },
    { label: '$500K - $1M', value: '500000-1000000' },
    { label: '$1M - $5M', value: '1000000-5000000' },
    { label: 'Over $5M', value: '5000000-999999999' }
  ];
  
  useEffect(() => {
    fetchTransferPitches();
    fetchAgentSportTypes();
  }, []);
  
  useEffect(() => {
    applyFilters();
  }, [pitches, searchTerm, positionFilter, transferTypeFilter, priceRangeFilter, dealStageFilter, sportTypeFilter, agentSportTypes]);

  const fetchAgentSportTypes = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('specialization')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;
      
      if (data?.specialization) {
        setAgentSportTypes(data.specialization);
      }
    } catch (error) {
      console.error('Error fetching agent sport types:', error);
    }
  };

  const fetchTransferPitches = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          id,
          asking_price,
          currency,
          transfer_type,
          deal_stage,
          expires_at,
          created_at,
          view_count,
          message_count,
          shortlist_count,
          is_international,
          description,
          tagged_videos,
          status,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            photo_url,
            headshot_url,
            market_value,
            date_of_birth
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url,
            sport_type
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedPitches = (data || []).map(pitch => ({
        ...pitch,
        asking_price: pitch.asking_price || null,
        deal_stage: pitch.deal_stage || 'pitch',
        is_international: pitch.is_international || false,
        tagged_videos: Array.isArray(pitch.tagged_videos) 
          ? pitch.tagged_videos.map((video: any) => String(video))
          : pitch.tagged_videos 
            ? [String(pitch.tagged_videos)]
            : [],
        players: {
          ...pitch.players,
          age: pitch.players.date_of_birth 
            ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
            : 25
        }
      }));

      setPitches(processedPitches);
      
      console.log(`Loaded ${processedPitches.length} active transfer pitches`);
    } catch (error) {
      console.error('Error fetching transfer pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pitches];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pitch =>
        pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.players.position === positionFilter);
    }

    // Transfer type filter
    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.transfer_type === transferTypeFilter);
    }

    // Deal stage filter
    if (dealStageFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.deal_stage === dealStageFilter);
    }

    // Sport type filter (only show pitches matching agent's specialization)
    if (sportTypeFilter !== 'all') {
      filtered = filtered.filter(pitch => 
        pitch.teams.sport_type === sportTypeFilter
      );
    }

    // Price range filter
    if (priceRangeFilter !== 'all') {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      filtered = filtered.filter(pitch => {
        const price = pitch.asking_price || 0;
        return price >= min && price <= max;
      });
    }

    // Apply agent sport type filtering (automatic)
    if (agentSportTypes.length > 0) {
      filtered = filtered.filter(pitch => 
        pitch.teams.sport_type && agentSportTypes.includes(pitch.teams.sport_type)
      );
    }

    // Sort by newest first
    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setFilteredPitches(filtered);
  };

  const updatePitchEngagement = async (pitchId: string, type: 'view' | 'message' | 'shortlist') => {
    try {
      const column = type === 'view' ? 'view_count' : 
                   type === 'message' ? 'message_count' : 'shortlist_count';
      
      const { data: currentPitch } = await supabase
        .from('transfer_pitches')
        .select(column)
        .eq('id', pitchId)
        .single();

      if (currentPitch) {
        const newCount = (currentPitch[column] || 0) + 1;
        
        await supabase
          .from('transfer_pitches')
          .update({ [column]: newCount })
          .eq('id', pitchId);

        // Update local state
        setPitches(prev => prev.map(pitch => 
          pitch.id === pitchId 
            ? { ...pitch, [column]: newCount }
            : pitch
        ));
      }
    } catch (error) {
      console.error(`Error updating ${type} count:`, error);
    }
  };

  const handleViewPlayer = (pitch: TransferPitch) => {
    updatePitchEngagement(pitch.id, 'view');
    navigate(`/player-profile/${pitch.players.id}`, { 
      state: { 
        pitchId: pitch.id,
        fromTransferTimeline: true 
      }
    });
  };

  const handleMessagePlayer = (pitch: TransferPitch) => {
    updatePitchEngagement(pitch.id, 'message');
    setSelectedPitch(pitch);
    setShowMessageModal(true);
  };



  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
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

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
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

  const handleWatchVideo = (pitch: TransferPitch) => {
    if (pitch.tagged_videos && pitch.tagged_videos.length > 0) {
      // Navigate to video player or open video modal
      navigate(`/videos`, { 
        state: { 
          highlightVideoId: pitch.tagged_videos[0],
          searchTerm: `${pitch.players.full_name} - ${pitch.teams.team_name}`
        }
      });
    } else {
      toast({
        title: "No Videos Available",
        description: "This player doesn't have any videos attached yet.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-gray-800">
              <CardContent className="p-4">
                <div className="h-48 bg-gray-700 rounded mb-4"></div>
                <div className="h-4 bg-gray-700 rounded mb-2"></div>
                <div className="h-3 bg-gray-700 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

    return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="w-5 h-5" />
              Agent Transfer Timeline ({filteredPitches.length})
            </CardTitle>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
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
            
            <Select value={sportTypeFilter} onValueChange={setSportTypeFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map(sport => (
                  <SelectItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
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
                setSportTypeFilter('all');
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
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {pitches.length === 0 ? 'No Transfer Pitches Available' : 'No Results Found'}
              </h3>
              <p className="text-gray-400">
                {pitches.length === 0 
                  ? 'No transfer pitches are currently available on the timeline.'
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredPitches.map((pitch) => (
                <Card 
                  key={pitch.id} 
                  className={`border-gray-600 transition-all duration-200 hover:border-rosegold/50 hover:shadow-lg ${
                    isExpiringSoon(pitch.expires_at) ? 'border-red-500 border-2' : ''
                  } ${viewMode === 'list' ? 'w-full' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Player and Team Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {pitch.players.photo_url || pitch.players.headshot_url ? (
                            <img
                              src={pitch.players.photo_url || pitch.players.headshot_url}
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
                            {pitch.asking_price ? formatCurrency(pitch.asking_price, pitch.currency) : 'Price on request'}
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
                          {pitch.view_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {pitch.message_count || 0}
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {pitch.shortlist_count || 0} shortlisted
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
                          onClick={() => handleViewPlayer(pitch)}
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
                          <MessageSquare className="w-4 h-4" />
                        </Button>

                        <ShortlistManager
                          pitchId={pitch.id}
                          playerId={pitch.players.id}
                          onShortlistChange={(isShortlisted) => {
                            if (isShortlisted) {
                              updatePitchEngagement(pitch.id, 'shortlist');
                            }
                          }}
                        />

                        {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-green-600 text-green-400 hover:bg-green-600/10"
                            onClick={() => handleWatchVideo(pitch)}
                          >
                            <Play className="w-4 h-4" />
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

      {/* Message Modal */}
      {showMessageModal && selectedPitch && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          receiverId={selectedPitch.players.id}
          playerName={selectedPitch.players.full_name}
          pitchId={selectedPitch.id}
          currentUserId={profile?.id || ''}
        />
      )}
    </div>
  );
};

export default AgentRequestsExplore;
