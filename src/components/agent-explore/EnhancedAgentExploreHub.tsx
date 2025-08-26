import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Filter,
  Plus,
  Eye,
  MessageSquare,
  Calendar,
  DollarSign,
  MapPin,
  Users,
  TrendingUp,
  Star,
  Clock,
  Globe,
  Target,
  Award,
  BarChart3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  position: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  sport_type: string;
  transfer_type: string;
  expires_at: string;
  created_at: string;
  is_public: boolean;
  tagged_players: string[];
  agent: {
    full_name: string;
    country: string;
  };
}

interface RequestComment {
  id: string;
  content: string;
  created_at: string;
  profile_id: string;
  tagged_players: string[];
  profile: {
    full_name: string;
  };
}

const EnhancedAgentExploreHub: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [comments, setComments] = useState<RequestComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport_type: '',
    transfer_type: '',
    budget_range: '',
    position: '',
    location: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    position: '',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    sport_type: 'football',
    transfer_type: 'permanent',
    expires_at: ''
  });

  useEffect(() => {
    fetchRequests();
    fetchComments();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agent_requests')
        .select(`
          *,
          agent:profiles!agent_requests_agent_id_fkey(full_name, country)
        `)
        .eq('is_public', true);

      // Apply filters
      if (filters.sport_type) {
        query = query.eq('sport_type', filters.sport_type as any);
      }
      if (filters.transfer_type) {
        query = query.eq('transfer_type', filters.transfer_type as any);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'budget_high':
          query = query.order('budget_max', { ascending: false });
          break;
        case 'budget_low':
          query = query.order('budget_min', { ascending: true });
          break;
        case 'expires_soon':
          query = query.order('expires_at', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Map the data to ensure proper typing
      const mappedRequests: AgentRequest[] = (data || []).map(request => ({
        id: request.id,
        title: request.title,
        description: request.description,
        position: request.position,
        budget_min: request.budget_min,
        budget_max: request.budget_max,
        currency: request.currency,
        sport_type: request.sport_type,
        transfer_type: request.transfer_type,
        expires_at: request.expires_at,
        created_at: request.created_at,
        is_public: request.is_public,
        tagged_players: Array.isArray(request.tagged_players) ? 
          request.tagged_players.map((player: any) => typeof player === 'string' ? player : String(player)) : 
          [],
        agent: {
          full_name: request.agent?.full_name || 'Unknown',
          country: request.agent?.country || 'Unknown'
        }
      }));

      setRequests(mappedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Loading Error",
        description: "Failed to load agent requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_request_comments')
        .select(`
          *,
          profile:profiles!agent_request_comments_profile_id_fkey(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Map comments with proper typing
      const mappedComments: RequestComment[] = (data || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        profile_id: comment.profile_id,
        tagged_players: Array.isArray(comment.tagged_players) ? 
          comment.tagged_players.map((player: any) => typeof player === 'string' ? player : String(player)) : 
          [],
        profile: {
          full_name: comment.profile?.full_name || 'Unknown'
        }
      }));

      setComments(mappedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!profile) return;

    try {
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        toast({
          title: "Agent Profile Required",
          description: "Please complete your agent profile first",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('agent_requests')
        .insert({
          agent_id: agentData.id,
          title: newRequest.title,
          description: newRequest.description,
          position: newRequest.position,
          budget_min: parseInt(newRequest.budget_min),
          budget_max: parseInt(newRequest.budget_max),
          currency: newRequest.currency,
          sport_type: newRequest.sport_type as any,
          transfer_type: newRequest.transfer_type as any,
          expires_at: newRequest.expires_at,
          is_public: true
        });

      if (error) throw error;

      toast({
        title: "Request Created",
        description: "Your player request has been created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewRequest({
        title: '',
        description: '',
        position: '',
        budget_min: '',
        budget_max: '',
        currency: 'USD',
        sport_type: 'football',
        transfer_type: 'permanent',
        expires_at: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create request",
        variant: "destructive"
      });
    }
  };

  const formatBudget = (min: number, max: number, currency: string) => {
    const formatNumber = (num: number) => {
      if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
      if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
      return num.toString();
    };
    
    return `${currency} ${formatNumber(min)} - ${formatNumber(max)}`;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.agent.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-gray-700">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
                <div className="p-2 bg-bright-pink/20 rounded-lg">
                  <Target className="w-6 h-6 text-bright-pink" />
                </div>
                Agent Requests Hub
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Discover player requests from agents worldwide
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Request
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 p-1">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Target className="w-4 h-4" />
            All Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Market Analytics
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search requests..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-48 bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="budget_high">Highest Budget</SelectItem>
                    <SelectItem value="budget_low">Lowest Budget</SelectItem>
                    <SelectItem value="expires_soon">Expires Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={filters.sport_type} onValueChange={(value) => setFilters({ ...filters, sport_type: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Sport Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Sports</SelectItem>
                    <SelectItem value="football">Football</SelectItem>
                    <SelectItem value="basketball">Basketball</SelectItem>
                    <SelectItem value="volleyball">Volleyball</SelectItem>
                    <SelectItem value="tennis">Tennis</SelectItem>
                    <SelectItem value="rugby">Rugby</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.transfer_type} onValueChange={(value) => setFilters({ ...filters, transfer_type: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Transfer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Position"
                  value={filters.position}
                  onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />

                <Input
                  placeholder="Location"
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={() => setFilters({ sport_type: '', transfer_type: '', budget_range: '', position: '', location: '' })}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 mt-4"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>

          {/* Requests List */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {loading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="col-span-full bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Requests Found</h3>
                  <p className="text-gray-400">Try adjusting your search filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => {
                const daysUntilExpiry = getDaysUntilExpiry(request.expires_at);
                return (
                  <Card key={request.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{request.title}</h3>
                            <p className="text-gray-400 text-sm line-clamp-2">{request.description}</p>
                          </div>
                          <Badge className={`text-xs ${
                            daysUntilExpiry <= 7 ? 'bg-red-500' : 
                            daysUntilExpiry <= 14 ? 'bg-yellow-500' : 'bg-green-500'
                          } text-white`}>
                            {daysUntilExpiry}d left
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {request.sport_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {request.transfer_type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {request.position}
                          </Badge>
                        </div>

                        <div className="text-sm text-gray-300">
                          <div className="flex items-center gap-1 mb-1">
                            <DollarSign className="w-3 h-3" />
                            <span>{formatBudget(request.budget_min, request.budget_max, request.currency)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            <span>{request.agent.full_name} • {request.agent.country}</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsViewDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Market Analytics</h3>
              <p className="text-gray-400">Detailed analytics and insights about the agent request market</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Trends & Insights</h3>
              <p className="text-gray-400">Actionable insights and trends in player requests</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create Player Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Request Title"
              value={newRequest.title}
              onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />
            
            <Textarea
              placeholder="Detailed Description"
              value={newRequest.description}
              onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white min-h-[100px]"
            />

            <div className="grid grid-cols-2 gap-4">
              <Select 
                value={newRequest.sport_type} 
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, sport_type: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Sport Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="volleyball">Volleyball</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="rugby">Rugby</SelectItem>
                </SelectContent>
              </Select>

              <Select 
                value={newRequest.transfer_type} 
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, transfer_type: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Transfer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              placeholder="Position Required"
              value={newRequest.position}
              onChange={(e) => setNewRequest(prev => ({ ...prev, position: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />

            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Min Budget"
                value={newRequest.budget_min}
                onChange={(e) => setNewRequest(prev => ({ ...prev, budget_min: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Input
                type="number"
                placeholder="Max Budget"
                value={newRequest.budget_max}
                onChange={(e) => setNewRequest(prev => ({ ...prev, budget_max: e.target.value }))}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Select 
                value={newRequest.currency} 
                onValueChange={(value) => setNewRequest(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Input
              type="date"
              placeholder="Expires At"
              value={newRequest.expires_at}
              onChange={(e) => setNewRequest(prev => ({ ...prev, expires_at: e.target.value }))}
              className="bg-gray-700 border-gray-600 text-white"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleCreateRequest}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
              >
                Create Request
              </Button>
              <Button
                onClick={() => setIsCreateDialogOpen(false)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Request Dialog */}
      {selectedRequest && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-white">{selectedRequest.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="text-white font-medium mb-2">Description</h3>
                <p className="text-gray-300">{selectedRequest.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-white font-medium mb-2">Request Details</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>Sport: {selectedRequest.sport_type}</div>
                    <div>Transfer Type: {selectedRequest.transfer_type}</div>
                    <div>Position: {selectedRequest.position}</div>
                    <div>Budget: {formatBudget(selectedRequest.budget_min, selectedRequest.budget_max, selectedRequest.currency)}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-white font-medium mb-2">Agent Information</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <div>Name: {selectedRequest.agent.full_name}</div>
                    <div>Country: {selectedRequest.agent.country}</div>
                    <div>Expires: {new Date(selectedRequest.expires_at).toLocaleDateString()}</div>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default EnhancedAgentExploreHub;
