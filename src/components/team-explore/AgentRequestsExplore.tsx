import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  Tag, 
  MessageSquare, 
  Clock, 
  DollarSign,
  MapPin,
  User,
  TrendingUp,
  Plus,
  Bell
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  position: string;
  budget_min: number;
  budget_max: number;
  transfer_type: 'permanent' | 'loan';
  expires_at: string;
  created_at: string;
  tagged_players: string[];
  agents: {
    agency_name: string;
    specialization: string;
    profile_image?: string;
  };
}

interface TeamPlayer {
  id: string;
  full_name: string;
  position: string;
  market_value: number;
  photo_url?: string;
}

interface AgentRequestsExploreProps {
  subscriptionTier: string;
  memberAssociation: string;
}

const AgentRequestsExplore: React.FC<AgentRequestsExploreProps> = ({ 
  subscriptionTier,
  memberAssociation 
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [transferTypeFilter, setTransferTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchAgentRequests();
    fetchTeamPlayers();
  }, [profile]);

  useEffect(() => {
    const filtered = filterAndSortRequests();
    // Apply filtering logic here if needed
  }, [searchTerm, positionFilter, transferTypeFilter, sortBy]);

  const fetchAgentRequests = async () => {
    try {
      setLoading(true);
      
      const { data: requestsData, error } = await supabase
        .from('agent_requests')
        .select(`
          *,
          agents!inner(
            agency_name,
            specialization,
            profile_image
          )
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching agent requests:', error);
        return;
      }

      // Transform the data to match our interface
      const transformedRequests = (requestsData || []).map(request => ({
        ...request,
        tagged_players: Array.isArray(request.tagged_players) 
          ? request.tagged_players 
          : typeof request.tagged_players === 'string' 
            ? JSON.parse(request.tagged_players) 
            : []
      })) as AgentRequest[];

      setRequests(transformedRequests);
    } catch (error) {
      console.error('Error fetching agent requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamPlayers = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      // Only fetch players that have active pitches
      const { data: playersData } = await supabase
        .from('players')
        .select(`
          id,
          full_name,
          position,
          market_value,
          photo_url
        `)
        .eq('team_id', teamData.id);

      setTeamPlayers(playersData || []);
    } catch (error) {
      console.error('Error fetching team players:', error);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(request => 
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.position?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply position filter
    if (positionFilter) {
      filtered = filtered.filter(request => request.position === positionFilter);
    }

    // Apply transfer type filter
    if (transferTypeFilter) {
      filtered = filtered.filter(request => request.transfer_type === transferTypeFilter);
    }

    // Apply sorting
    switch (sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'expiring':
        filtered.sort((a, b) => new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime());
        break;
      case 'highest_budget':
        filtered.sort((a, b) => (b.budget_max || 0) - (a.budget_max || 0));
        break;
      case 'most_tagged':
        filtered.sort((a, b) => (b.tagged_players?.length || 0) - (a.tagged_players?.length || 0));
        break;
    }

    return filtered;
  };

  const handleTagPlayer = async (requestId: string, playerId: string) => {
    try {
      // Add player to request's tagged players
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updatedTaggedPlayers = [...(request.tagged_players || []), playerId];
      
      const { error } = await supabase
        .from('agent_requests')
        .update({ tagged_players: updatedTaggedPlayers })
        .eq('id', requestId);

      if (error) throw error;

      // Update local state
      setRequests(requests.map(r => 
        r.id === requestId 
          ? { ...r, tagged_players: updatedTaggedPlayers }
          : r
      ));

      toast({
        title: "Player Tagged",
        description: "Your player has been tagged to this request."
      });
    } catch (error: any) {
      console.error('Error tagging player:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to tag player.",
        variant: "destructive"
      });
    }
  };

  const getMatchingPlayers = (request: AgentRequest) => {
    return teamPlayers.filter(player => {
      // Basic position matching
      if (request.position && player.position !== request.position) return false;
      
      // Budget matching
      if (request.budget_max && player.market_value > request.budget_max) return false;
      if (request.budget_min && player.market_value < request.budget_min) return false;
      
      return true;
    });
  };

  const canTagToRequest = (request: AgentRequest) => {
    // Basic tier can only tag to domestic requests
    if (subscriptionTier === 'basic') {
      // This would need additional logic to determine if request is domestic
      return true; // Simplified for now
    }
    return true;
  };

  const filteredRequests = filterAndSortRequests();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-700 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-1/3"></div>
                  <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-polysans text-white">Agent Requests</h2>
          <p className="text-gray-400">Browse agent requests and tag your pitched players</p>
        </div>
        <Button 
          variant="outline" 
          className="border-gray-600 text-gray-300"
        >
          <Bell className="w-4 h-4 mr-2" />
          Follow Agents
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-600 text-white"
              />
            </div>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Positions</SelectItem>
                <SelectItem value="Goalkeeper">Goalkeeper</SelectItem>
                <SelectItem value="Centre-Back">Centre-Back</SelectItem>
                <SelectItem value="Left-Back">Left-Back</SelectItem>
                <SelectItem value="Right-Back">Right-Back</SelectItem>
                <SelectItem value="Defensive Midfielder">Defensive Midfielder</SelectItem>
                <SelectItem value="Central Midfielder">Central Midfielder</SelectItem>
                <SelectItem value="Attacking Midfielder">Attacking Midfielder</SelectItem>
                <SelectItem value="Left Winger">Left Winger</SelectItem>
                <SelectItem value="Right Winger">Right Winger</SelectItem>
                <SelectItem value="Striker">Striker</SelectItem>
              </SelectContent>
            </Select>

            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
                <SelectItem value="highest_budget">Highest Budget</SelectItem>
                <SelectItem value="most_tagged">Most Tagged</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      {filteredRequests.length === 0 ? (
        <Card className="border-gray-700">
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-medium text-white mb-2">No Requests Found</h3>
            <p className="text-gray-400">
              Try adjusting your filters or check back later for new agent requests.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const matchingPlayers = getMatchingPlayers(request);
            const canTag = canTagToRequest(request);
            
            return (
              <Card key={request.id} className="border-gray-700 hover:border-rosegold/30 transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    {/* Agent Avatar */}
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={request.agents.profile_image} alt={request.agents.agency_name} />
                      <AvatarFallback className="bg-gray-700 text-white">
                        <User className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>

                    {/* Main Content */}
                    <div className="flex-1 space-y-3">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">{request.title}</h3>
                          <p className="text-gray-400 text-sm">{request.agents.agency_name}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="border-blue-500/20 text-blue-400">
                            {request.transfer_type}
                          </Badge>
                          {matchingPlayers.length > 0 && (
                            <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                              {matchingPlayers.length} matches
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Request Details */}
                      <p className="text-gray-300 text-sm">{request.description}</p>

                      {/* Requirements */}
                      <div className="flex items-center gap-6 text-sm">
                        {request.position && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-white">{request.position}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="text-white">
                            ${request.budget_min?.toLocaleString()} - ${request.budget_max?.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{request.tagged_players?.length || 0}</span>
                          <span className="text-gray-500">tagged</span>
                        </div>
                      </div>

                      {/* Matching Players */}
                      {matchingPlayers.length > 0 && (
                        <div className="bg-gray-800 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-rosegold mb-2">
                            Your Matching Players ({matchingPlayers.length})
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {matchingPlayers.slice(0, 3).map((player) => (
                              <div 
                                key={player.id}
                                className="flex items-center gap-2 bg-gray-700 rounded px-3 py-1"
                              >
                                <Avatar className="w-6 h-6">
                                  <AvatarImage src={player.photo_url} alt={player.full_name} />
                                  <AvatarFallback className="bg-gray-600 text-xs">
                                    {player.full_name.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-white">{player.full_name}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleTagPlayer(request.id, player.id)}
                                  className="h-6 px-2 text-xs text-rosegold hover:text-rosegold hover:bg-rosegold/10"
                                  disabled={!canTag}
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                            {matchingPlayers.length > 3 && (
                              <span className="text-sm text-gray-400 px-2 py-1">
                                +{matchingPlayers.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Footer */}
                      <div className="flex items-center justify-between pt-2 border-t border-gray-700">
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>Posted {formatDistanceToNow(new Date(request.created_at))} ago</span>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Expires {formatDistanceToNow(new Date(request.expires_at))}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="outline" className="border-gray-600 text-gray-300">
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Contact Agent
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AgentRequestsExplore;
