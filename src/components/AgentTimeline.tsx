import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Eye, MessageCircle, Heart, Play, DollarSign, Clock, MapPin, User, Building2, Tag, Users } from 'lucide-react';
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
  const [positionFilter, setPositionFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messagePlayerData, setMessagePlayerData] = useState<any>(null);
  const [canMessage, setCanMessage] = useState(false);
  const [taggedRequests, setTaggedRequests] = useState<{ [playerId: string]: any[] }>({});
  const [taggedInComments, setTaggedInComments] = useState<{ [playerId: string]: any[] }>({});

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

  useEffect(() => {
    if (players.length > 0) {
      fetchTaggedRequests();
    }
  }, [players]);

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
      // Use direct query to transfer_pitches table with joins since the view might not exist yet
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            full_name,
            position,
            citizenship,
            market_value
          ),
          teams!inner(
            team_name,
            country
          )
        `)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface, handling Json types properly
      const transformedData = (data || []).map((pitch: any) => ({
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
    if (positionFilter !== 'all') {
      filtered = filtered.filter(player =>
        player.player_position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Filter by transfer type
    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(player =>
        player.transfer_type === transferTypeFilter
      );
    }

    // Filter by price range
    if (priceRangeFilter !== 'all') {
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

  const fetchTaggedRequests = async () => {
    try {
      // Get all player IDs from the timeline
      const playerIds = players.map(player => player.player_id);

      if (playerIds.length === 0) return;

      // Fetch explore requests that have tagged these players
      const { data: requestData, error: requestError } = await supabase
        .from('agent_requests')
        .select(`
          id,
          title,
          agent_id,
          tagged_players,
          agents!inner(
            agency_name,
            profiles!inner(
              full_name
            )
          )
        `)
        .eq('is_public', true)
        .gte('expires_at', new Date().toISOString())
        .not('tagged_players', 'is', null);

      if (requestError) throw requestError;

      // Fetch comments that have tagged these players
      const { data: commentData, error: commentError } = await supabase
        .from('agent_request_comments')
        .select(`
          id,
          tagged_players,
          agent_requests!inner(
            title,
            agents!inner(
              agency_name
            )
          ),
          profiles!inner(
            full_name,
            user_type
          )
        `)
        .not('tagged_players', 'is', null);

      if (commentError) throw commentError;

      // Create maps for tagged requests and comments
      const requestTaggedMap: { [playerId: string]: any[] } = {};
      const commentTaggedMap: { [playerId: string]: any[] } = {};

      // Process request tags
      (requestData || []).forEach((request: any) => {
        const taggedPlayerIds = request.tagged_players || [];
        taggedPlayerIds.forEach((playerId: string) => {
          if (playerIds.includes(playerId)) {
            if (!requestTaggedMap[playerId]) {
              requestTaggedMap[playerId] = [];
            }
            requestTaggedMap[playerId].push({
              id: request.id,
              title: request.title,
              agency_name: request.agents?.agency_name,
              agent_name: request.agents?.profiles?.full_name,
              type: 'request'
            });
          }
        });
      });

      // Process comment tags
      (commentData || []).forEach((comment: any) => {
        const taggedPlayerIds = comment.tagged_players || [];
        taggedPlayerIds.forEach((playerId: string) => {
          if (playerIds.includes(playerId)) {
            if (!commentTaggedMap[playerId]) {
              commentTaggedMap[playerId] = [];
            }
            commentTaggedMap[playerId].push({
              id: comment.id,
              title: comment.agent_requests?.title,
              agency_name: comment.agent_requests?.agents?.agency_name,
              commenter_name: comment.profiles?.full_name,
              commenter_type: comment.profiles?.user_type,
              type: 'comment'
            });
          }
        });
      });

      setTaggedRequests(requestTaggedMap);
      setTaggedInComments(commentTaggedMap);
    } catch (error) {
      console.error('Error fetching tagged requests:', error);
      setTaggedRequests({});
      setTaggedInComments({});
    }
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
                <SelectItem value="all">All Positions</SelectItem>
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
                <SelectItem value="all">All Types</SelectItem>
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

                {/* Tagged in Explore Requests */}
                {taggedRequests[player.player_id] && taggedRequests[player.player_id].length > 0 && (
                  <div className="mb-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Tagged in {taggedRequests[player.player_id].length} Explore Request{taggedRequests[player.player_id].length > 1 ? 's' : ''}:
                    </p>
                    <div className="space-y-1">
                      {taggedRequests[player.player_id].slice(0, 3).map((request: any) => (
                        <div key={request.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-300 truncate">{request.title}</span>
                          <span className="text-gray-500 ml-2">by {request.agency_name}</span>
                        </div>
                      ))}
                      {taggedRequests[player.player_id].length > 3 && (
                        <p className="text-xs text-gray-500">
                          +{taggedRequests[player.player_id].length - 3} more requests
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Tagged in Comments */}
                {taggedInComments[player.player_id] && taggedInComments[player.player_id].length > 0 && (
                  <div className="mb-4 p-3 bg-gray-700 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      Tagged in {taggedInComments[player.player_id].length} Comment{taggedInComments[player.player_id].length > 1 ? 's' : ''}:
                    </p>
                    <div className="space-y-1">
                      {taggedInComments[player.player_id].slice(0, 2).map((comment: any) => (
                        <div key={comment.id} className="text-xs">
                          <span className="text-gray-300">on "{comment.title}"</span>
                          <span className="text-gray-500 ml-2">by {comment.commenter_name} ({comment.commenter_type})</span>
                        </div>
                      ))}
                      {taggedInComments[player.player_id].length > 2 && (
                        <p className="text-xs text-gray-500">
                          +{taggedInComments[player.player_id].length - 2} more comments
                        </p>
                      )}
                    </div>
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
