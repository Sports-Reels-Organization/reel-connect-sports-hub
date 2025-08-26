
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Eye, 
  MessageCircle, 
  Heart, 
  Play, 
  DollarSign, 
  Clock, 
  MapPin, 
  User, 
  Building2, 
  Users, 
  Star,
  Grid3X3,
  List
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface TimelinePlayer {
  id: string;
  player_name: string;
  player_position: string;
  player_citizenship: string;
  player_market_value: number;
  asking_price: number;
  currency: string;
  transfer_type: string;
  expires_at: string;
  team_name: string;
  team_country: string;
  team_id: string;
  player_id: string;
  description: string;
  tagged_videos: any[];
  status: string;
  player_image?: string;
  team_logo?: string;
  is_international: boolean;
  deal_stage: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
}

export const EnhancedAgentTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [players, setPlayers] = useState<TimelinePlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<TimelinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [shortlistedItems, setShortlistedItems] = useState<Set<string>>(new Set());

  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'];
  const transferTypes = ['permanent', 'loan'];
  const priceRanges = [
    { label: 'Under $100K', value: '0-100000' },
    { label: '$100K - $500K', value: '100000-500000' },
    { label: '$500K - $1M', value: '500000-1000000' },
    { label: '$1M - $5M', value: '1000000-5000000' },
    { label: 'Over $5M', value: '5000000-999999999' }
  ];

  useEffect(() => {
    fetchTimelinePlayers();
    fetchShortlistedItems();
    setupRealtimeSubscription();
  }, [profile]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, positionFilter, transferTypeFilter, priceRangeFilter]);

  const fetchTimelinePlayers = async () => {
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
            market_value,
            portrait_url,
            photo_url
          ),
          teams!inner(
            id,
            team_name,
            country,
            logo_url
          )
        `)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedData: TimelinePlayer[] = (data || []).map((pitch: any) => ({
        id: pitch.id,
        player_name: pitch.players?.full_name || '',
        player_position: pitch.players?.position || '',
        player_citizenship: pitch.players?.citizenship || '',
        player_market_value: pitch.players?.market_value || 0,
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD',
        transfer_type: pitch.transfer_type,
        expires_at: pitch.expires_at,
        team_name: pitch.teams?.team_name || '',
        team_country: pitch.teams?.country || '',
        team_id: pitch.team_id,
        player_id: pitch.player_id,
        description: pitch.description || '',
        tagged_videos: Array.isArray(pitch.tagged_videos) ? pitch.tagged_videos : [],
        status: pitch.status,
        player_image: pitch.players?.portrait_url || pitch.players?.photo_url,
        team_logo: pitch.teams?.logo_url,
        is_international: pitch.is_international || false,
        deal_stage: pitch.deal_stage || 'pitch',
        view_count: pitch.view_count || 0,
        message_count: pitch.message_count || 0,
        shortlist_count: pitch.shortlist_count || 0
      }));

      setPlayers(transformedData);
    } catch (error) {
      console.error('Error fetching timeline players:', error);
      toast({
        title: "Error",
        description: "Failed to load players",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchShortlistedItems = async () => {
    if (!profile || profile.user_type !== 'agent') return;

    try {
      const { data, error } = await supabase
        .from('agent_shortlist')
        .select('pitch_id')
        .eq('agent_id', profile.id);

      if (error) throw error;

      const shortlistedIds = new Set(data?.map(item => item.pitch_id) || []);
      setShortlistedItems(shortlistedIds);
    } catch (error) {
      console.error('Error fetching shortlisted items:', error);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('transfer-pitches-realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transfer_pitches'
      }, () => {
        fetchTimelinePlayers();
        // Show notification for new pitches
        toast({
          title: "New Transfer Pitch",
          description: "A new player has been added to the timeline"
        });
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'transfer_pitches'
      }, () => {
        fetchTimelinePlayers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const filterPlayers = () => {
    let filtered = [...players];

    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.player_position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (positionFilter !== 'all') {
      filtered = filtered.filter(player =>
        player.player_position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(player =>
        player.transfer_type === transferTypeFilter
      );
    }

    if (priceRangeFilter !== 'all') {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      filtered = filtered.filter(player =>
        player.asking_price >= min && player.asking_price <= max
      );
    }

    setFilteredPlayers(filtered);
  };

  const handleViewPlayer = (playerId: string) => {
    navigate(`/player-profile/${playerId}`);
  };

  const handleViewDetails = (pitchId: string) => {
    navigate(`/transfer-pitch/${pitchId}`);
  };

  const handleMessagePlayer = (player: TimelinePlayer) => {
    navigate('/messages', { 
      state: { 
        newMessage: {
          receiverId: player.team_id,
          playerId: player.player_id,
          playerName: player.player_name,
          teamName: player.team_name
        }
      }
    });
  };

  const handleShortlist = async (player: TimelinePlayer) => {
    if (!profile || profile.user_type !== 'agent') return;

    try {
      const isShortlisted = shortlistedItems.has(player.id);
      
      if (isShortlisted) {
        await supabase
          .from('agent_shortlist')
          .delete()
          .eq('agent_id', profile.id)
          .eq('pitch_id', player.id);
        
        setShortlistedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(player.id);
          return newSet;
        });

        toast({ title: "Removed from shortlist" });
      } else {
        await supabase
          .from('agent_shortlist')
          .insert({
            agent_id: profile.id,
            pitch_id: player.id,
            player_id: player.player_id
          });
        
        setShortlistedItems(prev => new Set(prev).add(player.id));
        toast({ title: "Added to shortlist" });
      }
    } catch (error) {
      console.error('Error updating shortlist:', error);
      toast({
        title: "Error",
        description: "Failed to update shortlist",
        variant: "destructive"
      });
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const renderPlayerCard = (player: TimelinePlayer) => (
    <Card
      key={player.id}
      className="group bg-gradient-to-br border-0 overflow-hidden hover:border-rosegold/50 transition-all duration-300"
    >
      <CardContent className="p-0 bg-card border-0">
        <div className="flex">
          {/* Player Image Section */}
          <div className="w-1/3 relative overflow-hidden">
            <div className="aspect-square bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center">
              {player.player_image ? (
                <img
                  src={player.player_image}
                  alt={player.player_name}
                  className="w-full h-full min-h-[200px] object-cover object-top"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rosegold/20 to-rosegold/10 flex items-center justify-center">
                  <User className="w-16 h-16 text-rosegold/70" />
                </div>
              )}
              <div className="hidden w-full h-full bg-gradient-to-br from-rosegold/20 to-rosegold/10 flex items-center justify-center">
                <User className="w-16 h-16 text-rosegold/70" />
              </div>
            </div>

            {/* Overlays */}
            <div className="absolute top-3 right-3">
              {isExpiringSoon(player.expires_at) && (
                <Badge variant="destructive" className="text-xs font-medium animate-pulse">
                  <Clock className="w-3 h-3 mr-1" />
                  Expiring Soon
                </Badge>
              )}
            </div>

            <div className="absolute bottom-3 left-3">
              <Badge variant="outline" className="capitalize text-xs bg-black/50 backdrop-blur-sm">
                {player.transfer_type}
              </Badge>
            </div>
          </div>

          {/* Content Section */}
          <div className="w-2/3 p-6 flex flex-col justify-between">
            {/* Header */}
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-white group-hover:text-rosegold/90 transition-colors">
                  {player.player_name}
                </h3>
                <p className="text-sm text-gray-400 font-medium">
                  {player.player_position}
                </p>
              </div>

              {/* Player & Team Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-rosegold/70" />
                  <span>{player.player_citizenship}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  {player.team_logo && (
                    <img src={player.team_logo} alt="" className="w-4 h-4 rounded" />
                  )}
                  <Building2 className="w-4 h-4 text-rosegold/70" />
                  <span>{player.team_name}, {player.team_country}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="space-y-4">
              {/* Price and Market Value */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold text-rosegold">
                    {formatCurrency(player.asking_price, player.currency)}
                  </div>
                  <div className="text-xs text-gray-400">
                    Expires {formatDistanceToNow(new Date(player.expires_at), { addSuffix: true })}
                  </div>
                </div>
                <div className="flex gap-2">
                  {player.tagged_videos && player.tagged_videos.length > 0 && (
                    <Badge variant="outline" className="border-rosegold/50 text-rosegold bg-rosegold/5">
                      <Play className="w-3 h-3 mr-1" />
                      {player.tagged_videos.length} Video{player.tagged_videos.length > 1 ? 's' : ''}
                    </Badge>
                  )}
                  {player.is_international && (
                    <Badge variant="outline" className="border-blue-400 text-blue-400 bg-blue-400/5">
                      International
                    </Badge>
                  )}
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {player.view_count}
                </div>
                <div className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {player.message_count}
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {player.shortlist_count}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleViewDetails(player.id)}
                  className="flex-1"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleMessagePlayer(player)}
                  className="flex-1 bg-rosegold hover:bg-rosegold/90 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  Message
                </Button>

                <Button
                  size="sm"
                  variant={shortlistedItems.has(player.id) ? "default" : "outline"}
                  onClick={() => handleShortlist(player)}
                  className={shortlistedItems.has(player.id) ? "bg-yellow-500 hover:bg-yellow-600" : ""}
                >
                  <Heart className={`w-4 h-4 ${shortlistedItems.has(player.id) ? 'fill-current' : ''}`} />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderListView = (player: TimelinePlayer) => (
    <Card key={player.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1">
            {player.player_image && (
              <img
                src={player.player_image}
                alt={player.player_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            )}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-white">{player.player_name}</h3>
                <Badge variant="outline" className="text-xs">
                  {player.player_position}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {player.team_logo && (
                  <img src={player.team_logo} alt="" className="w-4 h-4 rounded" />
                )}
                <span>{player.team_name}</span>
                <span>•</span>
                <span>{player.player_citizenship}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="font-bold text-rosegold">
                {formatCurrency(player.asking_price, player.currency)}
              </div>
              <div className="text-xs text-gray-400">
                {player.transfer_type}
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleViewDetails(player.id)}
              >
                View Details
              </Button>
              
              <Button
                size="sm"
                onClick={() => handleMessagePlayer(player)}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                Message
              </Button>
              
              <Button
                size="sm"
                variant={shortlistedItems.has(player.id) ? "default" : "outline"}
                onClick={() => handleShortlist(player)}
              >
                <Heart className={`w-4 h-4 ${shortlistedItems.has(player.id) ? 'fill-current' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold mx-auto mb-4"></div>
          <p className="text-gray-400">Loading players...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 font-polysans">Agent Transfer Timeline</h1>
          <p className="text-gray-500">
            Discover exceptional talent and connect with players ready for their next opportunity
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
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
            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="Transfer Type" />
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
            <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="Price Range" />
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
              onClick={() => {
                setSearchTerm('');
                setPositionFilter('all');
                setTransferTypeFilter('all');
                setPriceRangeFilter('all');
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-rosegold/50"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Content */}
      {filteredPlayers.length === 0 ? (
        <Card className="border-0">
          <CardContent className="p-12 text-center">
            <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
            <h3 className="text-2xl font-semibold text-white mb-3">No players found</h3>
            <p className="text-gray-400 text-lg">Try adjusting your search criteria or filters</p>
          </CardContent>
        </Card>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'space-y-4'}>
          {filteredPlayers.map(player => 
            viewMode === 'grid' ? renderPlayerCard(player) : renderListView(player)
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedAgentTimeline;
