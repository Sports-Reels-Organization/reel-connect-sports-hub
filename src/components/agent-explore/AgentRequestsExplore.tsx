
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, MessageCircle, Eye, AlertCircle, Search, Filter, 
  Plus, Users, FileText, Edit, Trash2, User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useSportData } from '@/hooks/useSportData';
import CreateAgentRequestModal from './CreateAgentRequestModal';
import RequestComments from '../RequestComments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  expires_at: string;
  created_at: string;
  is_public: boolean;
  request_type: string;
  tagged_players: string[];
  agents: {
    id: string;
    agency_name: string;
    specialization: string[];
    profiles: {
      full_name: string;
    };
  };
}

interface AgentRequestsExploreProps {
  initialSearch?: string;
}

const AgentRequestsExplore: React.FC<AgentRequestsExploreProps> = ({ initialSearch }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [agentSportType, setAgentSportType] = useState<string>('football');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [requestToDelete, setRequestToDelete] = useState<AgentRequest | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState(initialSearch || '');
  const [typeFilter, setTypeFilter] = useState('all');
  const [budgetFilter, setBudgetFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const requestTypes = ['player_search', 'team_recommendation', 'market_analysis', 'contract_negotiation'];
  const budgetRanges = [
    { label: 'Under $10K', value: '0-10000' },
    { label: '$10K - $50K', value: '10000-50000' },
    { label: '$50K - $100K', value: '50000-100000' },
    { label: 'Over $100K', value: '100000-999999999' }
  ];

  useEffect(() => {
    fetchAgentSportType();
  }, [profile]);

  useEffect(() => {
    if (agentSportType) {
      fetchRequests();
    }
  }, [agentSportType]);

  useEffect(() => {
    applyFilters();
  }, [requests, searchTerm, typeFilter, budgetFilter, statusFilter]);

  const fetchAgentSportType = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('specialization')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching agent sport type:', error);
        return;
      }

      if (data?.specialization && Array.isArray(data.specialization) && data.specialization.length > 0) {
        setAgentSportType(data.specialization[0]);
      }
    } catch (error) {
      console.error('Error fetching agent sport type:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_requests')
        .select(`
          *,
          agents!inner(
            id,
            agency_name,
            specialization,
            profiles!inner(
              full_name
            )
          )
        `)
        .eq('is_public', true)
        .contains('agents.specialization', [agentSportType])
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform data to ensure all required properties are present
      const transformedData: AgentRequest[] = (data || []).map(item => ({
        ...item,
        request_type: item.request_type || 'player_search',
        tagged_players: Array.isArray(item.tagged_players) ? item.tagged_players : []
      }));
      
      setRequests(transformedData);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to load agent requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...requests];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.agents.agency_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(request => request.request_type === typeFilter);
    }

    // Budget filter
    if (budgetFilter !== 'all') {
      const [min, max] = budgetFilter.split('-').map(Number);
      filtered = filtered.filter(request => {
        const budgetMin = request.budget_min || 0;
        const budgetMax = request.budget_max || 999999999;
        return budgetMin >= min && budgetMax <= max;
      });
    }

    // Status filter (active vs expiring soon)
    if (statusFilter === 'expiring') {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      filtered = filtered.filter(request => 
        new Date(request.expires_at) <= sevenDaysFromNow
      );
    }

    setFilteredRequests(filtered);
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const canEditRequest = (request: AgentRequest) => {
    return profile?.user_type === 'agent' && profile?.id === request.agents.profiles.full_name; // This needs to be adjusted based on your data structure
  };

  const handleEditRequest = (request: AgentRequest) => {
    // Navigate to edit request page or open edit modal
    console.log('Edit request:', request.id);
    toast({
      title: "Coming Soon",
      description: "Edit functionality will be available soon",
    });
  };

  const handleDeleteRequestDialog = (request: AgentRequest) => {
    setRequestToDelete(request);
    setDeleteDialogOpen(true);
  };

  const handleDeleteRequest = async () => {
    if (!requestToDelete) return;

    try {
      const { error } = await supabase
        .from('agent_requests')
        .delete()
        .eq('id', requestToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request deleted successfully",
      });

      // Refresh the list
      fetchRequests();
      setDeleteDialogOpen(false);
      setRequestToDelete(null);
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Error",
        description: "Failed to delete request",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="border-0">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-6 bg-gray-700 rounded mb-2"></div>
                <div className="h-4 bg-gray-700 rounded mb-4 w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Agent Requests</h2>
          <p className="text-gray-400">Discover opportunities and connect with other agents</p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Request
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-white placeholder:text-gray-500"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                {requestTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={budgetFilter} onValueChange={setBudgetFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Budgets" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Budgets</SelectItem>
                {budgetRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="expiring">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('all');
                setBudgetFilter('all');
                setStatusFilter('all');
              }}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {filteredRequests.length === 0 ? (
        <Card className="border-0 text-center py-12">
          <CardContent>
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {requests.length === 0 ? 'No Requests Available' : 'No Results Found'}
            </h3>
            <p className="text-gray-400 mb-4">
              {requests.length === 0 
                ? `No agent requests are currently available for ${agentSportType}.`
                : 'Try adjusting your filters to see more results.'
              }
            </p>
            {requests.length === 0 && (
              <Button 
                onClick={() => setShowCreateModal(true)}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {request.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {request.description}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-lg font-bold text-rosegold">
                        {formatCurrency(request.budget_min, request.currency)} - {formatCurrency(request.budget_max, request.currency)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Budget Range
                      </div>
                    </div>
                  </div>

                  {/* Agent Info */}
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">
                      {request.agents.agency_name} • {request.agents.profiles.full_name}
                    </span>
                  </div>

                  {/* Tags and Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="text-blue-400 border-blue-400">
                        {request.request_type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Badge>
                      {request.tagged_players.length > 0 && (
                        <Badge variant="outline" className="text-green-400 border-green-400">
                          <Users className="w-3 h-3 mr-1" />
                          {request.tagged_players.length} Players Tagged
                        </Badge>
                      )}
                      {isExpiringSoon(request.expires_at) && (
                        <Badge variant="outline" className="text-red-400 border-red-400 animate-pulse">
                          <AlertCircle className="w-3 h-3 mr-1" />
                          Expiring Soon
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-400">
                      Expires {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
                      onClick={() => setSelectedRequestId(request.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    
                    {canEditRequest(request) && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          onClick={() => handleEditRequest(request)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600/10"
                          onClick={() => handleDeleteRequestDialog(request)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateAgentRequestModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onRequestCreated={() => {
            setShowCreateModal(false);
            fetchRequests();
          }}
        />
      )}

      {selectedRequestId && (
        <RequestComments
          requestId={selectedRequestId}
          isOpen={!!selectedRequestId}
          onClose={() => setSelectedRequestId(null)}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{requestToDelete?.title}"? 
              This action cannot be undone and will remove all associated comments.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRequest}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AgentRequestsExplore;
