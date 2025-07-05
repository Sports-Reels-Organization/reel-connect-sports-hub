
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Eye, MessageCircle, Heart, Play, DollarSign, Clock, MapPin, User, Building2, Tag, Users, Star } from 'lucide-react';
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
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Players Grid */}
      <div className="grid gap-4">
        {filteredPlayers.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No players found</h3>
              <p className="text-gray-400">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredPlayers.map((player) => (
            <Card key={player.id} className="bg-gray-800/30 border-gray-700 hover:border-rosegold/50 transition-all duration-200 hover:shadow-lg">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-6">
                  {/* Player Avatar/Image */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-rosegold/20 to-rosegold/10 rounded-xl flex items-center justify-center border border-rosegold/20">
                      <User className="w-10 h-10 text-rosegold" />
                    </div>
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">{player.player_name}</h3>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{player.player_position}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{player.player_citizenship}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            <span>{player.team_name}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Price and Status */}
                      <div className="text-right">
                        <div className="text-2xl font-bold text-rosegold mb-1">
                          ${player.asking_price?.toLocaleString()}
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

                    {/* Transfer Details */}
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="capitalize">
                        {player.transfer_type}
                      </Badge>
                      {player.player_market_value && (
                        <Badge variant="secondary" className="bg-gray-700">
                          Market: ${player.player_market_value.toLocaleString()}
                        </Badge>
                      )}
                      {player.tagged_videos && player.tagged_videos.length > 0 && (
                        <Badge variant="outline" className="border-rosegold/50 text-rosegold">
                          <Play className="w-3 h-3 mr-1" />
                          {player.tagged_videos.length} Video{player.tagged_videos.length > 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>

                    {/* Description */}
                    {player.description && (
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                        {player.description}
                      </p>
                    )}

                    {/* Tagged Activity */}
                    <div className="space-y-2">
                      {taggedRequests[player.player_id] && taggedRequests[player.player_id].length > 0 && (
                        <div className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30">
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="w-4 h-4 text-rosegold" />
                            <span className="text-sm font-medium text-rosegold">
                              Tagged in {taggedRequests[player.player_id].length} Request{taggedRequests[player.player_id].length > 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="text-xs text-gray-400">
                            {taggedRequests[player.player_id].slice(0, 2).map((request: any) => (
                              <div key={request.id} className="flex items-center justify-between py-1">
                                <span className="truncate">{request.title}</span>
                                <span className="ml-2 text-gray-500">by {request.agency_name}</span>
                              </div>
                            ))}
                            {taggedRequests[player.player_id].length > 2 && (
                              <span className="text-gray-500">+{taggedRequests[player.player_id].length - 2} more</span>
                            )}
                          </div>
                        </div>
                      )}

                      {taggedInComments[player.player_id] && taggedInComments[player.player_id].length > 0 && (
                        <div className="bg-gray-600/20 rounded-lg p-3 border border-gray-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-blue-400" />
                            <span className="text-sm font-medium text-blue-400">
                              Mentioned in {taggedInComments[player.player_id].length} Comment{taggedInComments[player.player_id].length > 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-700 mt-4">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleViewPlayer(player.player_id)}
                      className="border-gray-600 hover:border-rosegold/50 hover:bg-rosegold/10"
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
                      FIFA ID required
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
