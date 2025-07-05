import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Plus, Building, Calendar, Clock, User, DollarSign, Eye, MessageCircle, Users, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CreateRequestModal from './CreateRequestModal';
import { RequestComments } from './RequestComments';
import { PlayerProfileModal } from './PlayerProfileModal';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  transfer_type: string;
  position: string | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string;
  expires_at: string;
  created_at: string;
  is_public: boolean;
  agent_id: string;
  agents?: {
    agency_name: string;
  };
}

const ExploreRequests = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const { selectedPlayerId, selectedPlayerName, isModalOpen, openPlayerProfile, closePlayerProfile } = usePlayerProfile();
  const [expandedRequests, setExpandedRequests] = useState<Set<string>>(new Set());
  const [taggedPlayersModal, setTaggedPlayersModal] = useState<{ isOpen: boolean; request: any }>({ isOpen: false, request: null });

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, sportFilter, transferTypeFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_requests')
        .select(`
          *,
          agents (
            agency_name
          )
        `)
        .eq('is_public', true)
        .gte('expires_at', new Date().toISOString())
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
    let filtered = [...requests];

    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (request.agents?.agency_name && request.agents.agency_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (sportFilter !== 'all') {
      filtered = filtered.filter(request => request.sport_type === sportFilter);
    }

    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(request => request.transfer_type === transferTypeFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleRequestCreated = () => {
    fetchRequests();
  };

  const toggleRequestExpansion = (requestId: string) => {
    const newExpanded = new Set(expandedRequests);
    if (newExpanded.has(requestId)) {
      newExpanded.delete(requestId);
    } else {
      newExpanded.add(requestId);
    }
    setExpandedRequests(newExpanded);
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const showTaggedPlayersModal = (request: any) => {
    setTaggedPlayersModal({ isOpen: true, request });
  };

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Explore Requests</h1>
          <p className="text-gray-400">Discover transfer opportunities from agents worldwide</p>
        </div>
        {profile?.user_type === 'agent' && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-rosegold hover:bg-rosegold/90 text-white px-6 py-2"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="bg-gray-800/50 border-gray-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-700 border-gray-600 text-white"
              />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="rugby">Rugby</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="permanent">Permanent</SelectItem>
                <SelectItem value="loan">Loan</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSportFilter('all');
                setTransferTypeFilter('all');
              }}
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <Card className="bg-gray-800/50 border-gray-700">
            <CardContent className="p-8 text-center">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No requests found</h3>
              <p className="text-gray-400">Try adjusting your filters or check back later</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => {
            const isExpanded = expandedRequests.has(request.id);
            return (
              <Card key={request.id} className="bg-gray-800/30 border-gray-700 hover:border-rosegold/30 transition-all duration-200 hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex gap-4">
                    {/* Agent Avatar */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center border border-blue-500/20">
                        <Building className="w-6 h-6 text-blue-400" />
                      </div>
                    </div>

                    {/* Request Content */}
                    <div className="flex-1 space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{request.title}</h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-2">
                            <span className="flex items-center gap-1">
                              <Building className="w-4 h-4" />
                              {request.agents?.agency_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatDistanceToNow(new Date(request.created_at))} ago
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDistanceToNow(new Date(request.expires_at))} left
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="capitalize bg-rosegold/20 text-rosegold border-rosegold/30">
                          {request.sport_type}
                        </Badge>
                        <Badge variant="outline" className="capitalize border-gray-600">
                          {request.transfer_type}
                        </Badge>
                        {request.position && (
                          <Badge variant="outline" className="border-gray-600">
                            <User className="w-3 h-3 mr-1" />
                            {request.position}
                          </Badge>
                        )}
                        {request.budget_min && request.budget_max && (
                          <Badge variant="outline" className="border-green-600 text-green-400">
                            <DollarSign className="w-3 h-3 mr-1" />
                            ${request.budget_min.toLocaleString()} - ${request.budget_max.toLocaleString()}
                          </Badge>
                        )}
                      </div>

                      {/* Description */}
                      <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30">
                        <p className="text-gray-300 leading-relaxed">
                          {isExpanded ? request.description : truncateText(request.description)}
                        </p>
                        {request.description.length > 120 && (
                          <button
                            onClick={() => toggleRequestExpansion(request.id)}
                            className="mt-2 text-rosegold hover:text-rosegold/80 text-sm font-medium"
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleRequestExpansion(request.id)}
                            className="border-gray-600 hover:border-rosegold/50 hover:bg-rosegold/10"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {isExpanded ? 'Collapse' : 'View Details'}
                          </Button>
                          
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => showTaggedPlayersModal(request)}
                            className="border-gray-600 hover:border-blue-500/50 hover:bg-blue-500/10"
                          >
                            <Users className="w-4 h-4 mr-1" />
                            Tagged Players
                          </Button>
                        </div>

                        <Badge variant="secondary" className="bg-gray-700">
                          <MessageCircle className="w-3 h-3 mr-1" />
                          Discussion
                        </Badge>
                      </div>

                      {/* Comments Section - Only show when expanded */}
                      {isExpanded && (
                        <div className="border-t border-gray-700 pt-4 mt-4">
                          <RequestComments 
                            requestId={request.id}
                            isPublic={request.is_public}
                            onPlayerClick={openPlayerProfile}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Tagged Players Modal */}
      <Dialog open={taggedPlayersModal.isOpen} onOpenChange={(open) => setTaggedPlayersModal({ isOpen: open, request: null })}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Tagged Players</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {taggedPlayersModal.request?.tagged_players?.length > 0 ? (
              taggedPlayersModal.request.tagged_players.map((playerId: string) => (
                <Card key={playerId} className="bg-gray-700/50 border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-rosegold/20 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-rosegold" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">Player #{playerId.slice(-8)}</h4>
                        <p className="text-sm text-gray-400">Click to view details</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPlayerProfile(playerId, `Player ${playerId.slice(-8)}`)}
                        className="border-gray-600 hover:border-rosegold/50"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8">
                <Tag className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-400">No players tagged in this request</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modals */}
      {showCreateModal && (
        <CreateRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRequestCreated={handleRequestCreated}
        />
      )}

      {isModalOpen && selectedPlayerId && (
        <PlayerProfileModal
          playerId={selectedPlayerId}
          playerName={selectedPlayerName}
          isOpen={isModalOpen}
          onClose={closePlayerProfile}
        />
      )}
    </div>
  );
};

export default ExploreRequests;
