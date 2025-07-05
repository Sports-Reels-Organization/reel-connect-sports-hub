import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, MessageCircle, Calendar, MapPin, User, DollarSign, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import PlayerTaggingModal from './PlayerTaggingModal';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  transfer_type: string;
  position: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  expires_at: string;
  created_at: string;
  tagged_players: string[];
  agent_name: string;
  agency_name: string;
  agent_logo_url: string;
  agent_country: string;
}

interface TaggedPlayer {
  id: string;
  player_name: string;
  player_position: string;
  team_name: string;
  asking_price: number;
  currency: string;
}

export const ExploreRequests: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgentRequest[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showTaggingModal, setShowTaggingModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  const [positionFilter, setPositionFilter] = useState('all');
  const [sportTypeFilter, setSportTypeFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [taggedPlayers, setTaggedPlayers] = useState<TaggedPlayer[]>([]);
  const [requestTaggedPlayers, setRequestTaggedPlayers] = useState<{ [requestId: string]: TaggedPlayer[] }>({});

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    sport_type: 'football',
    transfer_type: 'permanent',
    position: '',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    tagged_players: [] as string[]
  });

  const sportTypes = ['football', 'basketball', 'volleyball', 'tennis', 'rugby'];
  const transferTypes = ['permanent', 'loan'];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'];

  useEffect(() => {
    fetchRequests();
    if (profile?.user_type === 'agent') {
      fetchAgentId();
    }
  }, [profile]);

  useEffect(() => {
    filterRequests();
  }, [requests, positionFilter, sportTypeFilter, transferTypeFilter]);

  const fetchAgentId = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;
      setAgentId(data.id);
    } catch (error) {
      console.error('Error fetching agent ID:', error);
    }
  };

  const fetchTaggedPlayers = async (playerIds: string[]) => {
    if (!playerIds.length) {
      setTaggedPlayers([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          player_id,
          asking_price,
          currency,
          players!inner(
            full_name,
            position
          ),
          teams!inner(
            team_name
          )
        `)
        .in('player_id', playerIds)
        .eq('status', 'active');

      if (error) throw error;

      const transformedData = (data || []).map((pitch: any) => ({
        id: pitch.player_id,
        player_name: pitch.players?.full_name || '',
        player_position: pitch.players?.position || '',
        team_name: pitch.teams?.team_name || '',
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD'
      }));

      setTaggedPlayers(transformedData);
    } catch (error) {
      console.error('Error fetching tagged players:', error);
    }
  };

  const handleTagPlayers = (playerIds: string[]) => {
    // Update the newRequest with tagged players
    setNewRequest(prev => ({
      ...prev,
      tagged_players: playerIds
    }));

    // Fetch the player details for display
    fetchTaggedPlayers(playerIds);
  };

  const removeTaggedPlayer = (playerId: string) => {
    const updatedPlayerIds = newRequest.tagged_players?.filter(id => id !== playerId) || [];
    setNewRequest(prev => ({
      ...prev,
      tagged_players: updatedPlayerIds
    }));
    fetchTaggedPlayers(updatedPlayerIds);
  };

  const fetchRequests = async () => {
    try {
      console.log('Fetching agent requests...');

      // First, get the agent requests with basic fields only
      const { data: requestsData, error: requestsError } = await supabase
        .from('agent_requests')
        .select(`
          id,
          agent_id,
          title,
          description,
          sport_type,
          transfer_type,
          position,
          budget_min,
          budget_max,
          currency,
          expires_at,
          created_at,
          is_public,
          tagged_players
        `)
        .eq('is_public', true)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (requestsError) {
        console.error('Error fetching agent requests:', requestsError);
        throw requestsError;
      }

      console.log('Found requests:', requestsData?.length || 0);

      if (!requestsData || requestsData.length === 0) {
        setRequests([]);
        return;
      }

      // Get agent IDs from the requests
      const agentIds = [...new Set(requestsData.map(req => req.agent_id))];

      // Fetch agents with their profiles
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select(`
          id,
          agency_name,
          profiles!inner(
            full_name,
            country
          )
        `)
        .in('id', agentIds);

      if (agentsError) {
        console.error('Error fetching agents:', agentsError);
        throw agentsError;
      }

      console.log('Found agents:', agentsData?.length || 0);

      // Create a map of agent data for quick lookup
      const agentMap = new Map();
      agentsData?.forEach(agent => {
        agentMap.set(agent.id, agent);
      });

      // Transform the data to match our interface
      const transformedData = requestsData.map((request: any) => {
        const agent = agentMap.get(request.agent_id);
        return {
          id: request.id,
          title: request.title || '',
          description: request.description || '',
          sport_type: request.sport_type || 'football',
          transfer_type: request.transfer_type || 'permanent',
          position: request.position || '',
          budget_min: request.budget_min || 0,
          budget_max: request.budget_max || 0,
          currency: request.currency || 'USD',
          expires_at: request.expires_at || '',
          created_at: request.created_at || '',
          tagged_players: request.tagged_players || [],
          agency_name: agent?.agency_name || '',
          agent_logo_url: '', // logo_url field might not exist in current database
          agent_name: agent?.profiles?.full_name || '',
          agent_country: agent?.profiles?.country || ''
        };
      });

      console.log('Transformed data:', transformedData.length);
      setRequests(transformedData);

      // Fetch tagged player details for requests that have tagged players
      await fetchRequestTaggedPlayers(transformedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive"
      });
    }
  };

  const fetchRequestTaggedPlayers = async (requestsData: AgentRequest[]) => {
    try {
      // Get all unique player IDs from all requests
      const allPlayerIds = new Set<string>();
      requestsData.forEach(request => {
        if (request.tagged_players && Array.isArray(request.tagged_players)) {
          request.tagged_players.forEach(playerId => allPlayerIds.add(playerId));
        }
      });

      if (allPlayerIds.size === 0) {
        setRequestTaggedPlayers({});
        return;
      }

      const playerIdsArray = Array.from(allPlayerIds);

      // Fetch player details for all tagged players
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          player_id,
          asking_price,
          currency,
          players!inner(
            full_name,
            position
          ),
          teams!inner(
            team_name
          )
        `)
        .in('player_id', playerIdsArray)
        .eq('status', 'active');

      if (error) throw error;

      // Create a map of player details
      const playerMap = new Map();
      (data || []).forEach((pitch: any) => {
        playerMap.set(pitch.player_id, {
          id: pitch.player_id,
          player_name: pitch.players?.full_name || '',
          player_position: pitch.players?.position || '',
          team_name: pitch.teams?.team_name || '',
          asking_price: pitch.asking_price || 0,
          currency: pitch.currency || 'USD'
        });
      });

      // Create a map of request ID to tagged players
      const requestTaggedMap: { [requestId: string]: TaggedPlayer[] } = {};
      requestsData.forEach(request => {
        if (request.tagged_players && Array.isArray(request.tagged_players)) {
          requestTaggedMap[request.id] = request.tagged_players
            .map(playerId => playerMap.get(playerId))
            .filter(Boolean);
        }
      });

      setRequestTaggedPlayers(requestTaggedMap);
    } catch (error) {
      console.error('Error fetching request tagged players:', error);
    }
  };

  const filterRequests = () => {
    let filtered = [...requests];

    // Filter by position
    if (positionFilter !== 'all') {
      filtered = filtered.filter(request =>
        request.position && request.position.toLowerCase().includes(positionFilter.toLowerCase())
      );
    }

    // Filter by sport type
    if (sportTypeFilter !== 'all') {
      filtered = filtered.filter(request =>
        request.sport_type === sportTypeFilter
      );
    }

    // Filter by transfer type
    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(request =>
        request.transfer_type === transferTypeFilter
      );
    }

    setFilteredRequests(filtered);
  };

  const createRequest = async () => {
    if (!agentId || !newRequest.title || !newRequest.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const requestData: any = {
        agent_id: agentId,
        title: newRequest.title,
        description: newRequest.description,
        sport_type: newRequest.sport_type as any,
        transfer_type: newRequest.transfer_type as any,
        position: newRequest.position || null,
        budget_min: newRequest.budget_min ? parseFloat(newRequest.budget_min) : null,
        budget_max: newRequest.budget_max ? parseFloat(newRequest.budget_max) : null,
        currency: newRequest.currency,
        tagged_players: newRequest.tagged_players || [],
        is_public: true
      };

      const { error } = await supabase
        .from('agent_requests')
        .insert(requestData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request posted successfully",
      });

      setNewRequest({
        title: '',
        description: '',
        sport_type: 'football',
        transfer_type: 'permanent',
        position: '',
        budget_min: '',
        budget_max: '',
        currency: 'USD',
        tagged_players: []
      });
      setTaggedPlayers([]);
      setShowCreateForm(false);
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRequestDescription = () => {
    const parts = [];
    parts.push("I am looking for");
    if (newRequest.position) parts.push(`a ${newRequest.position}`);
    parts.push(`for a ${newRequest.sport_type} club`);
    if (newRequest.transfer_type) parts.push(`for a ${newRequest.transfer_type} transfer`);
    if (newRequest.budget_min || newRequest.budget_max) {
      const budget = [];
      if (newRequest.budget_min) budget.push(`min ${newRequest.budget_min}`);
      if (newRequest.budget_max) budget.push(`max ${newRequest.budget_max}`);
      parts.push(`with budget ${budget.join(', ')} ${newRequest.currency}`);
    }

    setNewRequest(prev => ({
      ...prev,
      description: parts.join(' ') + '.'
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Explore Requests</h1>
          <p className="text-gray-400">Discover player requests from agents worldwide</p>
        </div>
        {profile?.user_type === 'agent' && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-rosegold hover:bg-rosegold/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Request
          </Button>
        )}
      </div>

      {/* Create Request Form */}
      {showCreateForm && profile?.user_type === 'agent' && (
        <Card>
          <CardHeader>
            <CardTitle>Post New Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Request Title *</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Looking for striker for Premier League club"
                />
              </div>
              <div>
                <Label>Sport *</Label>
                <Select
                  value={newRequest.sport_type}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, sport_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sportTypes.map(sport => (
                      <SelectItem key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Select
                  value={newRequest.position}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
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
              </div>
              <div>
                <Label>Transfer Type *</Label>
                <Select
                  value={newRequest.transfer_type}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, transfer_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transferTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Budget</Label>
                <Input
                  type="number"
                  value={newRequest.budget_min}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, budget_min: e.target.value }))}
                  placeholder="Minimum budget"
                />
              </div>
              <div>
                <Label>Max Budget</Label>
                <Input
                  type="number"
                  value={newRequest.budget_max}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, budget_max: e.target.value }))}
                  placeholder="Maximum budget"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={newRequest.currency}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Tagged Players Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Tagged Players</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTaggingModal(true)}
                >
                  <Tag className="w-4 h-4 mr-2" />
                  Tag Players
                </Button>
              </div>

              {taggedPlayers.length > 0 ? (
                <div className="space-y-2">
                  {taggedPlayers.map((player) => (
                    <div key={player.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium text-white">{player.player_name}</p>
                          <p className="text-sm text-gray-400">{player.player_position} • {player.team_name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {player.asking_price?.toLocaleString()} {player.currency}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTaggedPlayer(player.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 border-2 border-dashed border-gray-600 rounded-lg text-center">
                  <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-400">No players tagged yet</p>
                  <p className="text-sm text-gray-500">Click "Tag Players" to select from pitched players</p>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Description *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRequestDescription}
                >
                  Auto Generate
                </Button>
              </div>
              <Textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what kind of player you're looking for..."
                rows={4}
                maxLength={550}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newRequest.description.length}/550 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createRequest}
                disabled={loading}
                className="bg-rosegold hover:bg-rosegold/90"
              >
                {loading ? 'Posting...' : 'Post Request'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Select value={sportTypeFilter} onValueChange={setSportTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                {sportTypes.map(sport => (
                  <SelectItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                <SelectValue placeholder="All Transfer Types" />
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
            <Button
              variant="outline"
              onClick={() => {
                setPositionFilter('all');
                setSportTypeFilter('all');
                setTransferTypeFilter('all');
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="grid gap-4">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No requests found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {request.agent_logo_url && (
                      <img
                        src={request.agent_logo_url}
                        alt={request.agency_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{request.agency_name}</h3>
                      <p className="text-sm text-gray-400">{request.agent_name}</p>
                      {request.agent_country && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.agent_country}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(request.expires_at))} left
                    </Badge>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-white mb-2">{request.title}</h4>
                <p className="text-gray-300 mb-4">{request.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{request.sport_type}</Badge>
                  <Badge variant="outline">{request.transfer_type}</Badge>
                  {request.position && (
                    <Badge variant="outline">
                      <User className="w-3 h-3 mr-1" />
                      {request.position}
                    </Badge>
                  )}
                  {(request.budget_min || request.budget_max) && (
                    <Badge variant="outline">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {request.budget_min && `${request.budget_min.toLocaleString()}`}
                      {request.budget_min && request.budget_max && ' - '}
                      {request.budget_max && `${request.budget_max.toLocaleString()}`}
                      {' '}{request.currency}
                    </Badge>
                  )}
                </div>

                {request.tagged_players && request.tagged_players.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2 flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      Tagged Players ({request.tagged_players.length}):
                    </p>
                    <div className="space-y-2">
                      {requestTaggedPlayers[request.id]?.map((player) => (
                        <div key={player.id} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                          <div>
                            <p className="text-sm font-medium text-white">{player.player_name}</p>
                            <p className="text-xs text-gray-400">{player.player_position} • {player.team_name}</p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {player.asking_price?.toLocaleString()} {player.currency}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Player Tagging Modal */}
      <PlayerTaggingModal
        isOpen={showTaggingModal}
        onClose={() => setShowTaggingModal(false)}
        onTagPlayers={handleTagPlayers}
        currentlyTagged={newRequest.tagged_players || []}
      />
    </div>
  );
};

export default ExploreRequests;
