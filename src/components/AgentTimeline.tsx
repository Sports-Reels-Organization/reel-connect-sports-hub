
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Eye, MessageCircle, Heart, Play, DollarSign, Clock, MapPin, User, Building2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ShortlistManager } from './ShortlistManager';
import MessageModal from './MessageModal';
import PlayerDetailModal from './PlayerDetailModal';

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
}

export const AgentTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<TimelinePlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<TimelinePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [transferTypeFilter, setTransferTypeFilter] = useState('');
  const [priceRangeFilter, setPriceRangeFilter] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messagePlayerData, setMessagePlayerData] = useState<any>(null);
  const [canMessage, setCanMessage] = useState(false);

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
    checkMessagingPermissions();
  }, [profile]);

  useEffect(() => {
    filterPlayers();
  }, [players, searchTerm, positionFilter, transferTypeFilter, priceRangeFilter]);

  const checkMessagingPermissions = async () => {
    if (!profile || profile.user_type !== 'agent') {
      setCanMessage(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('fifa_id, specialization')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;

      // For football agents, FIFA ID is required for messaging
      if (data.specialization?.includes('football')) {
        setCanMessage(!!data.fifa_id);
      } else {
        setCanMessage(true);
      }
    } catch (error) {
      console.error('Error checking messaging permissions:', error);
      setCanMessage(false);
    }
  };

  const fetchTimelinePlayers = async () => {
    try {
      const { data, error } = await supabase
        .from('active_pitches_view')
        .select('*')
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform the data to match our interface, handling Json types properly
      const transformedData = (data || []).map((pitch: any) => ({
        id: pitch.id,
        player_name: pitch.player_name,
        player_position: pitch.player_position,
        player_citizenship: pitch.player_citizenship,
        player_market_value: pitch.player_market_value,
        asking_price: pitch.asking_price,
        currency: pitch.currency,
        transfer_type: pitch.transfer_type,
        expires_at: pitch.expires_at,
        team_name: pitch.team_name,
        team_country: pitch.team_country,
        team_id: pitch.team_id,
        player_id: pitch.player_id,
        description: pitch.description,
        tagged_videos: Array.isArray(pitch.tagged_videos) ? pitch.tagged_videos : [],
        status: pitch.status
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

  const filterPlayers = () => {
    let filtered = [...players];

    // Search by name
    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by position
    if (positionFilter) {
      filtered = filtered.filter(player =>
        player.player_position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Filter by transfer type
    if (transferTypeFilter) {
      filtered = filtered.filter(player =>
        player.transfer_type === transferTypeFilter
      );
    }

    // Filter by price range
    if (priceRangeFilter) {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      filtered = filtered.filter(player =>
        player.asking_price >= min && player.asking_price <= max
      );
    }

    setFilteredPlayers(filtered);
  };

  const handleViewPlayer = async (playerId: string) => {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          team:teams(*)
        `)
        .eq('id', playerId)
        .single();

      if (error) throw error;
      setSelectedPlayer(data);
    } catch (error) {
      console.error('Error fetching player details:', error);
      toast({
        title: "Error",
        description: "Failed to load player details",
        variant: "destructive"
      });
    }
  };

  const handleMessagePlayer = (player: TimelinePlayer) => {
    if (!canMessage) {
      toast({
        title: "FIFA ID Required",
        description: "You need a FIFA ID to message football players",
        variant: "destructive"
      });
      return;
    }

    setMessagePlayerData({
      pitchId: player.id,
      playerId: player.player_id,
      teamId: player.team_id,
      playerName: player.player_name,
      teamName: player.team_name
    });
    setShowMessageModal(true);
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 24;
  };

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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Transfer Timeline</h1>
        <p className="text-gray-400">Discover and connect with players available for transfer</p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Positions</SelectItem>
                {positions.map(position => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {transferTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Price Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Prices</SelectItem>
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
                setPositionFilter('');
                setTransferTypeFilter('');
                setPriceRangeFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid gap-6">
        {filteredPlayers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No players found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredPlayers.map((player) => (
            <Card key={player.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-1">{player.player_name}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {player.player_position}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        {player.player_citizenship}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {player.team_name}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-rosegold mb-1">
                      {player.asking_price?.toLocaleString()} {player.currency}
                    </div>
                    <Badge 
                      variant={isExpiringSoon(player.expires_at) ? "destructive" : "secondary"}
                      className="mb-2"
                    >
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(player.expires_at))} left
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline">{player.transfer_type}</Badge>
                  {player.player_market_value && (
                    <Badge variant="secondary">
                      Market Value: {player.player_market_value.toLocaleString()} {player.currency}
                    </Badge>
                  )}
                </div>

                {player.description && (
                  <p className="text-gray-300 mb-4 line-clamp-2">{player.description}</p>
                )}

                {player.tagged_videos && player.tagged_videos.length > 0 && (
                  <div className="mb-4">
                    <Badge variant="outline" className="flex items-center gap-1 w-fit">
                      <Play className="w-3 h-3" />
                      {player.tagged_videos.length} Video{player.tagged_videos.length > 1 ? 's' : ''}
                    </Badge>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-700">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPlayer(player.player_id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {profile?.user_type === 'agent' && (
                      <>
                        <Button
                          variant={canMessage ? "default" : "secondary"}
                          size="sm"
                          onClick={() => handleMessagePlayer(player)}
                          disabled={!canMessage}
                          className={canMessage ? "bg-rosegold hover:bg-rosegold/90" : ""}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Message
                        </Button>
                        
                        <ShortlistManager
                          pitchId={player.id}
                          playerId={player.player_id}
                        />
                      </>
                    )}
                  </div>
                  
                  {!canMessage && profile?.user_type === 'agent' && (
                    <Badge variant="secondary" className="text-xs">
                      FIFA ID required for messaging
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
        />
      )}

      {showMessageModal && messagePlayerData && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => setShowMessageModal(false)}
          {...messagePlayerData}
          currentUserId={profile?.id || ''}
        />
      )}
    </div>
  );
};

export default AgentTimeline;
