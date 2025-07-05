import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Filter, Plus, Building, Calendar, Clock, User, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import CreateRequestModal from './CreateRequestModal';
import { RequestComments } from './RequestComments';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Explore Requests</h1>
          <p className="text-gray-400">Discover transfer opportunities and requirements from agents worldwide</p>
        </div>
        {profile?.user_type === 'agent' && (
          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-rosegold hover:bg-rosegold/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Request
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={sportFilter} onValueChange={setSportFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sports</SelectItem>
                <SelectItem value="football">Football</SelectItem>
                <SelectItem value="basketball">Basketball</SelectItem>
                <SelectItem value="tennis">Tennis</SelectItem>
                <SelectItem value="rugby">Rugby</SelectItem>
              </SelectContent>
            </Select>
            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Transfer Type" />
              </SelectTrigger>
              <SelectContent>
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
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Requests List */}
      <div className="space-y-6">
        {filteredRequests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No requests found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or check back later</p>
            </CardContent>
          </Card>
        ) : (
          filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{request.title}</h3>
                      <Badge variant="secondary" className="capitalize">
                        {request.sport_type}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {request.transfer_type}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
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
                    
                    <p className="text-gray-300 mb-4">{request.description}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                      {request.position && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {request.position}
                        </Badge>
                      )}
                      {request.budget_min && request.budget_max && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <DollarSign className="w-3 h-3" />
                          {request.budget_min.toLocaleString()} - {request.budget_max.toLocaleString()} {request.currency}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <RequestComments 
                  requestId={request.id}
                  isPublic={request.is_public}
                />
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <CreateRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRequestCreated={handleRequestCreated}
        />
      )}
    </div>
  );
};

export default ExploreRequests;
