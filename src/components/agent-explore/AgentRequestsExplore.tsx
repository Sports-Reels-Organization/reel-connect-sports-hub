
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
  Heart, Filter, Bookmark, TrendingUp, AlertCircle, Star
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { AgentExploreFilters } from './AgentExploreFilters';
import { ShortlistManager } from '@/components/ShortlistManager';
import TaggedPlayerCard from './TaggedPlayerCard';

interface TransferPitch {
  id: string;
  asking_price: number;
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
  };
}

interface AgentRequestsExploreProps {
  initialSearch?: string;
}

const AgentRequestsExplore: React.FC<AgentRequestsExploreProps> = ({ initialSearch = '' }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<any>({});
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedPitch, setSelectedPitch] = useState<TransferPitch | null>(null);

  useEffect(() => {
    fetchTransferPitches();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [pitches, filters]);

  const fetchTransferPitches = async () => {
    try {
      setLoading(true);
      
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
            headshot_url,
            market_value,
            date_of_birth
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const processedPitches = (data || []).map(pitch => ({
        ...pitch,
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

    // Apply search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(pitch =>
        pitch.players.full_name.toLowerCase().includes(searchLower) ||
        pitch.teams.team_name.toLowerCase().includes(searchLower) ||
        pitch.players.position.toLowerCase().includes(searchLower) ||
        pitch.description?.toLowerCase().includes(searchLower)
      );
    }

    // Apply position filter
    if (filters.position && filters.position !== 'all') {
      filtered = filtered.filter(pitch => 
        pitch.players.position.toLowerCase() === filters.position.toLowerCase()
      );
    }

    // Apply nationality filter
    if (filters.nationality && filters.nationality !== 'all') {
      filtered = filtered.filter(pitch => 
        pitch.players.citizenship === filters.nationality
      );
    }

    // Apply transfer type filter
    if (filters.transferType && filters.transferType !== 'all') {
      filtered = filtered.filter(pitch => 
        pitch.transfer_type === filters.transferType
      );
    }

    // Apply age range filter
    if (filters.ageRange) {
      const [minAge, maxAge] = filters.ageRange;
      filtered = filtered.filter(pitch => 
        pitch.players.age >= minAge && pitch.players.age <= maxAge
      );
    }

    // Apply price range filter
    if (filters.priceRange && filters.asking_price) {
      const [minPrice, maxPrice] = filters.priceRange;
      filtered = filtered.filter(pitch => 
        pitch.asking_price >= minPrice && pitch.asking_price <= maxPrice
      );
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'expiring':
        filtered.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
        break;
      case 'highest_value':
        filtered.sort((a, b) => (b.asking_price || 0) - (a.asking_price || 0));
        break;
      case 'most_viewed':
        filtered.sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
        break;
      case 'most_shortlisted':
        filtered.sort((a, b) => (b.shortlist_count || 0) - (a.shortlist_count || 0));
        break;
      default: // newest
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

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
    setSelectedPitch(pitch);
  };

  const handleMessagePlayer = (pitch: TransferPitch) => {
    updatePitchEngagement(pitch.id, 'message');
    // Navigate to messaging
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
      {/* Filters */}
      <AgentExploreFilters
        onFiltersChange={setFilters}
        initialFilters={{ searchTerm: initialSearch }}
      />

      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">
            Transfer Opportunities ({filteredPitches.length})
          </h3>
          <p className="text-gray-400 text-sm">
            Active pitches from verified teams worldwide
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(value: 'grid' | 'list') => setViewMode(value)}>
            <SelectTrigger className="w-32 bg-gray-700 border-gray-600">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-700 border-gray-600">
              <SelectItem value="grid">Grid View</SelectItem>
              <SelectItem value="list">List View</SelectItem>
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            size="sm"
            onClick={fetchTransferPitches}
            className="border-gray-600"
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Results */}
      {filteredPitches.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Transfer Opportunities Found
            </h3>
            <p className="text-gray-400">
              Try adjusting your filters or check back later for new pitches.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {filteredPitches.map((pitch) => (
            <Card 
              key={pitch.id} 
              className={`bg-gray-800 border-gray-600 hover:border-bright-pink/50 transition-colors ${
                isExpiringSoon(pitch.expires_at) ? 'border-red-500 border-2' : ''
              }`}
            >
              <CardContent className="p-0">
                {/* Player Header */}
                <div className="relative">
                  <div className="h-32 bg-gradient-to-br from-gray-800 to-gray-900 p-4 flex items-center">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700 mr-4">
                      {pitch.players.photo_url || pitch.players.headshot_url ? (
                        <img
                          src={pitch.players.photo_url || pitch.players.headshot_url}
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
                      <h3 className="font-bold text-white text-lg line-clamp-1">
                        {pitch.players.full_name}
                      </h3>
                      <p className="text-gray-300 text-sm">
                        {pitch.players.position} • Age {pitch.players.age}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        <span className="text-gray-400 text-xs">{pitch.players.citizenship}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expiring Badge */}
                  {isExpiringSoon(pitch.expires_at) && (
                    <Badge variant="destructive" className="absolute top-2 right-2 text-xs animate-pulse">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Expiring Soon
                    </Badge>
                  )}
                </div>

                <div className="p-4 space-y-4">
                  {/* Team & Transfer Info */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-400">
                      <span>{pitch.teams.team_name}, {pitch.teams.country}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge 
                        variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}
                      >
                        {pitch.transfer_type.toUpperCase()}
                      </Badge>
                      
                      <div className="text-xs text-gray-400">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {formatDistanceToNow(new Date(pitch.expires_at))} left
                      </div>
                    </div>

                    {pitch.asking_price && (
                      <div className="flex items-center gap-1 text-bright-pink font-bold text-lg">
                        <DollarSign className="h-4 w-4" />
                        {formatCurrency(pitch.asking_price, pitch.currency)}
                      </div>
                    )}
                  </div>

                  {/* Engagement Stats */}
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {pitch.view_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {pitch.message_count || 0}
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {pitch.shortlist_count || 0}
                    </div>
                    {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4" />
                        {pitch.tagged_videos.length} videos
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {pitch.description && (
                    <p className="text-gray-300 text-sm line-clamp-2">
                      {pitch.description}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 border-gray-600 text-xs"
                      onClick={() => handleViewPlayer(pitch)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      View Profile
                    </Button>
                    
                    <Button
                      size="sm"
                      className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white text-xs"
                      onClick={() => handleMessagePlayer(pitch)}
                    >
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Message
                    </Button>
                    
                    <div className="flex-shrink-0">
                      <ShortlistManager
                        pitchId={pitch.id}
                        playerId={pitch.players.id}
                        onShortlistChange={(isShortlisted) => {
                          if (isShortlisted) {
                            updatePitchEngagement(pitch.id, 'shortlist');
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AgentRequestsExplore;
