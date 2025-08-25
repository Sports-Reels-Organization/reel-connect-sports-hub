import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  Eye, 
  Clock, 
  DollarSign,
  Users,
  MapPin,
  TrendingUp,
  Heart,
  MoreVertical
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CreateAgentRequestModal from './CreateRequestModal';
import TaggedPlayerCard from './TaggedPlayerCard';

interface AgentRequest {
  id: string;
  created_at: string;
  title: string;
  description: string;
  sport_type: 'football' | 'basketball' | 'tennis' | 'rugby';
  transfer_type: 'permanent' | 'loan';
  position: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  agent_id: string;
}

interface Player {
  id: string;
  full_name: string;
  position: string;
  citizenship: string;
  market_value: number;
  team?: {
    team_name: string;
    country: string;
  };
}

const AgentRequestsExplore: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSport, setFilterSport] = useState('');
  const [filterTransferType, setFilterTransferType] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [taggedPlayers, setTaggedPlayers] = useState<{ [requestId: string]: string[] }>({});
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  useEffect(() => {
    fetchRequests();
  }, [profile]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, filterSport, filterTransferType]);

  const fetchRequests = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      const { data, error } = await supabase
        .from('agent_requests')
        .select('*')
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    if (searchTerm) {
      filtered = filtered.filter(req =>
        req.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterSport) {
      filtered = filtered.filter(req => req.sport_type === filterSport);
    }

    if (filterTransferType) {
      filtered = filtered.filter(req => req.transfer_type === filterTransferType);
    }

    setFilteredRequests(filtered);
  };

  const handleTagPlayer = async (requestId: string) => {
    if (!selectedPlayerId) {
      toast({
        title: "Error",
        description: "Please select a player to tag.",
        variant: "destructive"
      });
      return;
    }

    try {
      const existingTags = taggedPlayers[requestId] || [];
      if (existingTags.includes(selectedPlayerId)) {
        toast({
          title: "Info",
          description: "Player already tagged to this request.",
        });
        return;
      }

      const updatedTags = [...existingTags, selectedPlayerId];
      setTaggedPlayers(prev => ({ ...prev, [requestId]: updatedTags }));

      // Optimistically update state
      setTaggedPlayers(prev => ({
        ...prev,
        [requestId]: updatedTags,
      }));

      // Update in Supabase
      const { error } = await supabase
        .from('agent_requests')
        .update({ tagged_players: updatedTags })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Player tagged successfully",
      });
    } catch (error) {
      console.error('Error tagging player:', error);
      toast({
        title: "Error",
        description: "Failed to tag player",
        variant: "destructive"
      });

      // Revert optimistic update on error
      fetchRequests();
    } finally {
      setSelectedPlayerId(null);
    }
  };

  const handleUntagPlayer = async (requestId: string, playerId: string) => {
    try {
      const existingTags = taggedPlayers[requestId] || [];
      const updatedTags = existingTags.filter(id => id !== playerId);

      // Optimistically update state
      setTaggedPlayers(prev => ({
        ...prev,
        [requestId]: updatedTags,
      }));

      // Update in Supabase
      const { error } = await supabase
        .from('agent_requests')
        .update({ tagged_players: updatedTags })
        .eq('id', requestId);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Player untagged successfully",
      });
    } catch (error) {
      console.error('Error untagging player:', error);
      toast({
        title: "Error",
        description: "Failed to untag player",
        variant: "destructive"
      });

      // Revert optimistic update on error
      fetchRequests();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white font-polysans flex items-center gap-2">
            <Heart className="w-8 h-8 text-bright-pink" />
            Agent Requests
          </h2>
          <p className="text-gray-400 mt-1">
            {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Button className="bg-bright-pink hover:bg-bright-pink/90 text-white" onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Create Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 bg-gray-700 border-gray-600"
              />
            </div>

            <Select value={filterSport} onValueChange={setFilterSport}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Sport" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Sports</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="rugby">Rugby</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterTransferType} onValueChange={setFilterTransferType}>
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterSport('');
                setFilterTransferType('');
              }}
              className="border-gray-600"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests Grid */}
      {loading ? (
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
      ) : filteredRequests.length === 0 ? (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-12 text-center">
            <Heart className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No Requests Found
            </h3>
            <p className="text-gray-400">
              Create a new request or adjust your search filters.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">{request.title}</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <div className="text-gray-400 text-sm">{request.description}</div>
                
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="w-3 h-3" />
                  Created {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Badge variant="secondary">{request.sport_type.toUpperCase()}</Badge>
                    <Badge variant="outline" className="ml-2">{request.transfer_type.toUpperCase()}</Badge>
                  </div>

                  {request.budget_min && request.budget_max && (
                    <div className="text-bright-pink font-medium">
                      <DollarSign className="w-3 h-3 inline mr-1" />
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: request.currency || 'USD',
                        minimumFractionDigits: 0
                      }).format(request.budget_min)} - {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: request.currency || 'USD',
                        minimumFractionDigits: 0
                      }).format(request.budget_max)}
                    </div>
                  )}
                </div>

                {/* Tagged Players */}
                <div>
                  <h4 className="text-sm text-gray-400 mb-2">Tagged Players</h4>
                  <div className="flex flex-wrap gap-2">
                    {(taggedPlayers[request.id] || []).map(playerId => (
                      <Badge key={playerId} variant="default" className="gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        {playerId}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="-mr-1 h-5 w-5"
                          onClick={() => handleUntagPlayer(request.id, playerId)}
                        >
                          <MoreVertical className="h-3 w-3" />
                          <span className="sr-only">Untag</span>
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" className="flex-1 bg-rosegold hover:bg-rosegold/90 text-white text-xs">
                    <MessageSquare className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateAgentRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onRequestCreated={fetchRequests}
      />
    </div>
  );
};

export default AgentRequestsExplore;
