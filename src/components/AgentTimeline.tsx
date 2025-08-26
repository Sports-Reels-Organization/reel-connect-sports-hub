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
  player_image?: string;
  specialization?: string;
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
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            full_name,
            position,
            citizenship,
            market_value,
            portrait_url
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
        status: pitch.status,
        player_image: pitch.players?.portrait_url,
        specialization: pitch.players?.specialization
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

    if (searchTerm) {
      filtered = filtered.filter(player =>
        player.player_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        player.team_name.toLowerCase().includes(searchTerm.toLowerCase())
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
      const playerIds = players.map(player => player.player_id);
      if (playerIds.length === 0) return;

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

      const requestTaggedMap: { [playerId: string]: any[] } = {};
      const commentTaggedMap: { [playerId: string]: any[] } = {};

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
    <div className="space-y-8">
      {/* Header */}
      <div className="text-start space-y-4">
        <h1 className="text-3xl font-bold text-white mb-2  font-polysans">Transfer Timeline</h1>
        <p className="text-gray-500">
          Discover exceptional talent and connect with players ready for their next opportunity
        </p>
      </div>

      {/* Filters */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className=" absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10   text-white placeholder:text-gray-500"
              />
            </div>
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="  text-white">
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
              <SelectTrigger className=" text-white">
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
              <SelectTrigger className=" text-white">
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

      {/* Players Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredPlayers.length === 0 ? (
          <div className="col-span-full">
            <Card className="border-0">
              <CardContent className="p-12 text-center">
                <Search className="w-20 h-20 text-gray-400 mx-auto mb-6" />
                <h3 className="text-2xl font-semibold text-white mb-3">No players found</h3>
                <p className="text-gray-400 text-lg">Try adjusting your search criteria or filters</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          filteredPlayers.map((player) => (
            <Card
              key={player.id}
              className="group bg-gradient-to-br border-0 overflow-hidden"
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
                          className="w-full h-full min-h-[391px] object-cover object-top"
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
                      <div className="hidden w-full h-full bg-gradient-to-br from-rosegold/20 to-rosegold/10  items-center justify-center">
                        <User className="w-16 h-16 text-rosegold/70" />
                      </div>
                    </div>

                    {/* Overlays */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={isExpiringSoon(player.expires_at) ? "destructive" : "secondary"}
                        className="text-xs font-medium"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDistanceToNow(new Date(player.expires_at))} left
                      </Badge>
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
                          {player.specialization || 'Professional Player'}
                        </p>
                      </div>

                      {/* Player Stats */}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-300">
                          <User className="w-4 h-4 text-rosegold/70" />
                          <span>{player.player_position}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <MapPin className="w-4 h-4 text-rosegold/70" />
                          <span>{player.player_citizenship}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-300">
                          <Building2 className="w-4 h-4 text-rosegold/70" />
                          <span>{player.team_name}, {player.team_country}</span>
                        </div>
                      </div>
                    </div>
                    {/* Footer */}
                    <div className="space-y-6 ">
                      {/* Price and Market Value */}
                      <div className="flex items-center justify-between">
                        <div className="text-right">
                          <div className="text-xl font-bold text-rosegold">
                            ${player.asking_price?.toLocaleString()}
                          </div>
                          {player.player_market_value && (
                            <div className="text-xs text-start text-gray-400">
                              Market: ${player.player_market_value.toLocaleString()}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {player.tagged_videos && player.tagged_videos.length > 0 && (
                            <Badge variant="outline" className="border-rosegold/50 text-rosegold bg-rosegold/5">
                              <Play className="w-3 h-3 mr-1" />
                              {player.tagged_videos.length} Video{player.tagged_videos.length > 1 ? 's' : ''}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Tagged Activity */}
                      {(taggedRequests[player.player_id]?.length > 0 || taggedInComments[player.player_id]?.length > 0) && (
                        <div className="space-y-1">
                          {taggedRequests[player.player_id] && taggedRequests[player.player_id].length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-rosegold/80">
                              <Tag className="w-3 h-3" />
                              <span>Tagged in {taggedRequests[player.player_id].length} request{taggedRequests[player.player_id].length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                          {taggedInComments[player.player_id] && taggedInComments[player.player_id].length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-blue-400/80">
                              <MessageCircle className="w-3 h-3" />
                              <span>Mentioned in {taggedInComments[player.player_id].length} comment{taggedInComments[player.player_id].length > 1 ? 's' : ''}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewPlayer(player.player_id)}
                          className=""
                        >
                          <Eye className="w-4 h-4 " />

                        </Button>

                        {profile?.user_type === 'agent' && (
                          <>
                            <Button
                              variant={canMessage ? "default" : "secondary"}
                              size="sm"
                              onClick={() => handleMessagePlayer(player)}
                              disabled={!canMessage}
                              className={canMessage ? "bg-rosegold hover:bg-rosegold  text-white" : ""}
                            >
                              <MessageCircle className="w-4 h-4" />
                            </Button>

                            <ShortlistManager
                              pitchId={player.id}
                              playerId={player.player_id}
                            />
                          </>
                        )}
                      </div>

                      {!canMessage && profile?.user_type === 'agent' && (
                        <div className="text-center">
                          <Badge variant="secondary" className="text-xs">
                            FIFA ID required for messaging
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Modals */}
      {
        selectedPlayer && (
          <PlayerDetailModal
            player={selectedPlayer}
            isOpen={!!selectedPlayer}
            onClose={() => setSelectedPlayer(null)}
          />
        )
      }

      {
        showMessageModal && messagePlayerData && (
          <MessageModal
            isOpen={showMessageModal}
            onClose={() => setShowMessageModal(false)}
            {...messagePlayerData}
            currentUserId={profile?.id || ''}
          />
        )
      }
    </div >
  );
};

export default AgentTimeline;