import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Search, Filter, Tag, Clock, DollarSign, MapPin } from 'lucide-react';
import { useCustomFilterViews } from '@/hooks/useCustomFilterViews';
import { useSquadAvailability } from '@/hooks/useSquadAvailability';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  position?: string;
  transfer_type: 'loan' | 'permanent';
  budget_min?: number;
  budget_max?: number;
  currency: string;
  expires_at: string;
  created_at: string;
  agents?: {
    agency_name: string;
    specialization: string;
    profile_image?: string;
  } | null;
  tagged_players_count?: number;
}

interface FilterState {
  position?: string;
  transferType?: string;
  budgetMin?: number;
  budgetMax?: number;
  region?: string;
  sortBy: string;
}

const AgentRequestsExplore = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { views, saveView, deleteView } = useCustomFilterViews();
  const { availability } = useSquadAvailability();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSaveFilter, setShowSaveFilter] = useState(false);
  const [filterName, setFilterName] = useState('');
  const [filters, setFilters] = useState<FilterState>({
    sortBy: 'newest'
  });

  useEffect(() => {
    fetchRequests();
  }, [profile, filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);

      let query = supabase
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
        .gt('expires_at', new Date().toISOString());

      // Apply filters
      if (filters.position) {
        query = query.eq('position', filters.position);
      }

      if (filters.transferType && (filters.transferType === 'loan' || filters.transferType === 'permanent')) {
        query = query.eq('transfer_type', filters.transferType);
      }

      if (filters.budgetMin) {
        query = query.gte('budget_min', filters.budgetMin);
      }

      if (filters.budgetMax) {
        query = query.lte('budget_max', filters.budgetMax);
      }

      // Apply sorting
      switch (filters.sortBy) {
        case 'expiring':
          query = query.order('expires_at', { ascending: true });
          break;
        case 'highest_budget':
          query = query.order('budget_max', { ascending: false });
          break;
        case 'most_tagged':
          // Would need to join with tags table
          query = query.order('created_at', { ascending: false });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out requests with invalid agent data and get tagged players count
      const validRequests = (data || []).filter(request => {
        return request.agents && 
               typeof request.agents === 'object' && 
               !('error' in request.agents) &&
               'agency_name' in request.agents;
      });

      const requestsWithCounts = await Promise.all(
        validRequests.map(async (request) => {
          const { count } = await supabase
            .from('agent_request_player_tags')
            .select('*', { count: 'exact', head: true })
            .eq('request_id', request.id);

          return {
            id: request.id,
            title: request.title,
            description: request.description,
            position: request.position,
            transfer_type: request.transfer_type as 'loan' | 'permanent',
            budget_min: request.budget_min,
            budget_max: request.budget_max,
            currency: request.currency || 'USD',
            expires_at: request.expires_at,
            created_at: request.created_at,
            agents: request.agents as {
              agency_name: string;
              specialization: string;
              profile_image?: string;
            },
            tagged_players_count: count || 0
          } as AgentRequest;
        })
      );

      setRequests(requestsWithCounts);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTagPlayer = async (requestId: string, playerId: string) => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) throw new Error('Team not found');

      const { error } = await supabase
        .from('agent_request_player_tags')
        .insert({
          request_id: requestId,
          player_id: playerId,
          team_id: teamData.id
        });

      if (error) {
        if (error.code === '23505') {
          toast({
            title: "Already Tagged",
            description: "This player is already tagged to this request",
            variant: "destructive"
          });
        } else {
          throw error;
        }
      } else {
        toast({
          title: "Success",
          description: "Player tagged to request successfully"
        });
        fetchRequests(); // Refresh to update counts
      }
    } catch (error) {
      console.error('Error tagging player:', error);
      toast({
        title: "Error",
        description: "Failed to tag player to request",
        variant: "destructive"
      });
    }
  };

  const handleSaveFilter = async () => {
    if (!filterName.trim()) return;

    const success = await saveView(filterName, {
      ...filters,
      sortBy: filters.sortBy // Ensure sortBy is included
    });
    if (success) {
      setShowSaveFilter(false);
      setFilterName('');
    }
  };

  const handleLoadView = (viewId: string) => {
    const view = views.find(v => v.id === viewId);
    if (view) {
      setFilters({
        ...view.filter_config,
        sortBy: view.filter_config.sortBy || 'newest' // Provide default
      });
    }
  };

  const getMatchingPlayers = (request: AgentRequest) => {
    return availability.filter(player => 
      (!request.position || player.player.position === request.position) &&
      player.available_for_transfer &&
      (player.transfer_type.includes(request.transfer_type) || player.transfer_type.length === 0)
    );
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Explore Agent Requests
            </div>
            <div className="flex gap-2">
              {views.length > 0 && (
                <Select onValueChange={handleLoadView}>
                  <SelectTrigger className="w-48 bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Load saved filter" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {views.map((view) => (
                      <SelectItem key={view.id} value={view.id} className="text-white hover:bg-gray-700">
                        {view.view_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button
                onClick={() => setShowSaveFilter(true)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Save Filter
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <Select
              value={filters.position || ''}
              onValueChange={(value) => setFilters({ ...filters, position: value || undefined })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Position" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="" className="text-white hover:bg-gray-700">All Positions</SelectItem>
                <SelectItem value="Goalkeeper" className="text-white hover:bg-gray-700">Goalkeeper</SelectItem>
                <SelectItem value="Centre-Back" className="text-white hover:bg-gray-700">Centre-Back</SelectItem>
                <SelectItem value="Left-Back" className="text-white hover:bg-gray-700">Left-Back</SelectItem>
                <SelectItem value="Right-Back" className="text-white hover:bg-gray-700">Right-Back</SelectItem>
                <SelectItem value="Defensive Midfielder" className="text-white hover:bg-gray-700">Defensive Midfielder</SelectItem>
                <SelectItem value="Central Midfielder" className="text-white hover:bg-gray-700">Central Midfielder</SelectItem>
                <SelectItem value="Attacking Midfielder" className="text-white hover:bg-gray-700">Attacking Midfielder</SelectItem>
                <SelectItem value="Left Winger" className="text-white hover:bg-gray-700">Left Winger</SelectItem>
                <SelectItem value="Right Winger" className="text-white hover:bg-gray-700">Right Winger</SelectItem>
                <SelectItem value="Centre Forward" className="text-white hover:bg-gray-700">Centre Forward</SelectItem>
                <SelectItem value="Striker" className="text-white hover:bg-gray-700">Striker</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.transferType || ''}
              onValueChange={(value) => setFilters({ ...filters, transferType: value || undefined })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="" className="text-white hover:bg-gray-700">All Types</SelectItem>
                <SelectItem value="permanent" className="text-white hover:bg-gray-700">Permanent</SelectItem>
                <SelectItem value="loan" className="text-white hover:bg-gray-700">Loan</SelectItem>
                <SelectItem value="free" className="text-white hover:bg-gray-700">Free Transfer</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min Budget"
                value={filters.budgetMin || ''}
                onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value ? Number(e.target.value) : undefined })}
                className="bg-gray-800 border-gray-600 text-white"
              />
              <Input
                type="number"
                placeholder="Max Budget"
                value={filters.budgetMax || ''}
                onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value ? Number(e.target.value) : undefined })}
                className="bg-gray-800 border-gray-600 text-white"
              />
            </div>

            <Select
              value={filters.sortBy}
              onValueChange={(value) => setFilters({ ...filters, sortBy: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="newest" className="text-white hover:bg-gray-700">Newest</SelectItem>
                <SelectItem value="expiring" className="text-white hover:bg-gray-700">Expiring Soon</SelectItem>
                <SelectItem value="most_tagged" className="text-white hover:bg-gray-700">Most Tagged</SelectItem>
                <SelectItem value="highest_budget" className="text-white hover:bg-gray-700">Highest Budget</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Save Filter Modal */}
          {showSaveFilter && (
            <div className="flex gap-2 items-center p-3 bg-gray-800 rounded border border-gray-600">
              <Input
                placeholder="Filter name (e.g., 'Striker Requests under $1m in Africa')"
                value={filterName}
                onChange={(e) => setFilterName(e.target.value)}
                className="bg-gray-900 border-gray-600 text-white"
              />
              <Button onClick={handleSaveFilter} className="bg-rosegold hover:bg-rosegold/90 text-white">
                Save
              </Button>
              <Button
                onClick={() => setShowSaveFilter(false)}
                variant="outline"
                className="border-gray-600 text-gray-300"
              >
                Cancel
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="border-gray-600">
                <CardContent className="p-4">
                  <div className="animate-pulse">
                    <div className="h-24 bg-gray-700 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <Card className="border-gray-600">
            <CardContent className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No Requests Found
              </h3>
              <p className="text-gray-400">
                No agent requests match your current filters.
              </p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => {
            const matchingPlayers = getMatchingPlayers(request);
            return (
              <Card key={request.id} className={`border-gray-600 ${
                isExpiringSoon(request.expires_at) ? 'border-yellow-500 border-2' : 'hover:border-rosegold/50'
              } transition-colors`}>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {request.title}
                        </h3>
                        {request.agents && (
                          <div className="flex items-center gap-2 mb-2">
                            <img
                              src={request.agents.profile_image || '/placeholder.svg'}
                              alt={request.agents.agency_name}
                              className="w-8 h-8 rounded-full"
                            />
                            <div>
                              <p className="text-sm text-gray-300">{request.agents.agency_name}</p>
                              <p className="text-xs text-gray-500">{request.agents.specialization}</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        {request.budget_min && request.budget_max && (
                          <div className="text-lg font-bold text-rosegold">
                            {formatCurrency(request.budget_min, request.currency)} - {formatCurrency(request.budget_max, request.currency)}
                          </div>
                        )}
                        <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                          <Clock className="w-3 h-3" />
                          Expires {new Date(request.expires_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 flex-wrap">
                      {request.position && (
                        <Badge variant="outline" className="text-blue-400 border-blue-400">
                          {request.position}
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-green-400 border-green-400">
                        {request.transfer_type.toUpperCase()}
                      </Badge>
                      {isExpiringSoon(request.expires_at) && (
                        <Badge variant="outline" className="text-yellow-400 border-yellow-400 animate-pulse">
                          Expiring Soon
                        </Badge>
                      )}
                      {request.tagged_players_count && request.tagged_players_count > 0 && (
                        <Badge variant="outline" className="text-purple-400 border-purple-400">
                          <Tag className="w-3 h-3 mr-1" />
                          {request.tagged_players_count} players tagged
                        </Badge>
                      )}
                    </div>

                    <p className="text-gray-300 text-sm">
                      {request.description}
                    </p>

                    {matchingPlayers.length > 0 && (
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                          <p className="text-green-400 text-sm font-medium">
                            {matchingPlayers.length} matching player(s) from your squad
                          </p>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {matchingPlayers.slice(0, 3).map((player) => (
                            <Button
                              key={player.id}
                              size="sm"
                              onClick={() => handleTagPlayer(request.id, player.player_id)}
                              className="bg-green-600 hover:bg-green-700 text-white text-xs"
                            >
                              Tag {player.player.full_name}
                            </Button>
                          ))}
                          {matchingPlayers.length > 3 && (
                            <span className="text-xs text-green-400 self-center">
                              +{matchingPlayers.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        >
                          View Details
                        </Button>
                        <Button 
                          size="sm"
                          className="bg-rosegold hover:bg-rosegold/90 text-white"
                        >
                          Send Message
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Posted {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AgentRequestsExplore;
