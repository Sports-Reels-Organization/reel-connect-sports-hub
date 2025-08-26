
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  Users,
  DollarSign,
  Calendar,
  Globe,
  TrendingUp,
  Eye,
  Heart,
  Clock,
  Star,
  Send
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

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
  is_public: boolean;
  created_at: string;
  tagged_players: string[];
  agent: {
    profile: {
      full_name: string;
      country: string;
    };
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
  const [comments, setComments] = useState<{ [key: string]: RequestComment[] }>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    sport: '',
    position: '',
    budget: '',
    transferType: '',
    dateRange: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [taggedPlayer, setTaggedPlayer] = useState('');
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    position: '',
    sport_type: 'football',
    transfer_type: 'permanent',
    budget_min: 0,
    budget_max: 0,
    currency: 'USD',
    expires_at: '',
    is_public: true
  });

  useEffect(() => {
    if (profile) {
      fetchRequests();
    }
  }, [profile, sortBy, filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agent_requests')
        .select(`
          *,
          agent:agents!inner(
            profile:profiles!inner(
              full_name,
              country
            )
          )
        `)
        .eq('is_public', true);

      // Apply filters
      if (filters.sport) {
        query = query.eq('sport_type', filters.sport);
      }
      if (filters.position) {
        query = query.eq('position', filters.position);
      }
      if (filters.transferType) {
        query = query.eq('transfer_type', filters.transferType);
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

      // Transform data to match interface
      const transformedRequests: AgentRequest[] = (data || []).map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        position: item.position,
        budget_min: item.budget_min,
        budget_max: item.budget_max,
        currency: item.currency,
        sport_type: item.sport_type,
        transfer_type: item.transfer_type,
        expires_at: item.expires_at,
        is_public: item.is_public,
        created_at: item.created_at,
        tagged_players: Array.isArray(item.tagged_players) ? item.tagged_players : [],
        agent: {
          profile: {
            full_name: item.agent?.profile?.full_name || 'Unknown Agent',
            country: item.agent?.profile?.country || 'Unknown'
          }
        }
      }));

      setRequests(transformedRequests);

      // Fetch comments for each request
      for (const request of transformedRequests) {
        await fetchCommentsForRequest(request.id);
      }

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

  const fetchCommentsForRequest = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_request_comments')
        .select(`
          *,
          profile:profiles(full_name)
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedComments: RequestComment[] = (data || []).map(comment => ({
        id: comment.id,
        content: comment.content,
        created_at: comment.created_at,
        profile_id: comment.profile_id,
        tagged_players: Array.isArray(comment.tagged_players) ? comment.tagged_players : [],
        profile: {
          full_name: comment.profile?.full_name || 'Unknown User'
        }
      }));

      setComments(prev => ({
        ...prev,
        [requestId]: transformedComments
      }));
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!profile) return;

    try {
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) {
        toast({
          title: "Error",
          description: "Agent profile not found",
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
          sport_type: newRequest.sport_type,
          transfer_type: newRequest.transfer_type,
          budget_min: newRequest.budget_min,
          budget_max: newRequest.budget_max,
          currency: newRequest.currency,
          expires_at: newRequest.expires_at,
          is_public: newRequest.is_public
        });

      if (error) throw error;

      toast({
        title: "Request Created",
        description: "Your agent request has been created successfully"
      });

      setIsCreateModalOpen(false);
      setNewRequest({
        title: '',
        description: '',
        position: '',
        sport_type: 'football',
        transfer_type: 'permanent',
        budget_min: 0,
        budget_max: 0,
        currency: 'USD',
        expires_at: '',
        is_public: true
      });
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Creation Failed",
        description: "Failed to create agent request",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('agent_requests')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      toast({
        title: "Request Deleted",
        description: "Agent request has been deleted successfully"
      });

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Delete Failed", 
        description: "Failed to delete agent request",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async (requestId: string) => {
    if (!profile || !newComment.trim()) return;

    try {
      const taggedPlayers = taggedPlayer ? [taggedPlayer] : [];
      
      const { error } = await supabase
        .from('agent_request_comments')
        .insert({
          request_id: requestId,
          profile_id: profile.id,
          content: newComment,
          tagged_players: taggedPlayers
        });

      if (error) throw error;

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully"
      });

      setNewComment('');
      setTaggedPlayer('');
      fetchCommentsForRequest(requestId);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Comment Failed",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const formatBudget = (min: number, max: number, currency: string) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    
    if (min === max) {
      return formatter.format(min);
    }
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const days = Math.ceil((new Date(expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.agent.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase())
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
                  <Users className="w-6 h-6 text-bright-pink" />
                </div>
                Enhanced Agent Explore Hub
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Discover and connect with agent requests from around the world
              </p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Request
            </Button>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 p-1">
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Explore Requests ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Market Analytics
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Heart className="w-4 h-4" />
            Saved & Following
          </TabsTrigger>
        </TabsList>

        <TabsContent value="explore" className="space-y-6">
          {/* Search and Filters */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4 mb-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search requests, positions, agents..."
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
                <Select value={filters.sport} onValueChange={(value) => setFilters({ ...filters, sport: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
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

                <Input
                  placeholder="Position"
                  value={filters.position}
                  onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />

                <Select value={filters.transferType} onValueChange={(value) => setFilters({ ...filters, transferType: value })}>
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
                  placeholder="Budget Range"
                  value={filters.budget}
                  onChange={(e) => setFilters({ ...filters, budget: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={() => setFilters({ sport: '', position: '', budget: '', transferType: '', dateRange: '' })}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 mt-4"
              >
                Clear All Filters
              </Button>
            </CardContent>
          </Card>

          {/* Request List */}
          <div className="grid gap-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Requests Found</h3>
                  <p className="text-gray-400">Try adjusting your search filters or create a new request</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-white font-semibold text-lg">{request.title}</h3>
                            <Badge variant="outline" className="text-xs">
                              {request.sport_type.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {request.transfer_type.toUpperCase()}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {request.agent.profile.full_name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Globe className="w-4 h-4" />
                              {request.agent.profile.country}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(request.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setIsEditModalOpen(true);
                            }}
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteRequest(request.id)}
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <p className="text-gray-300 mb-3">{request.description}</p>
                          
                          <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1 text-bright-pink">
                              <DollarSign className="w-4 h-4" />
                              {formatBudget(request.budget_min, request.budget_max, request.currency)}
                            </span>
                            <span className="text-gray-400">Position: {request.position}</span>
                            {getDaysUntilExpiry(request.expires_at) > 0 ? (
                              <span className="flex items-center gap-1 text-yellow-400">
                                <Clock className="w-4 h-4" />
                                {getDaysUntilExpiry(request.expires_at)} days left
                              </span>
                            ) : (
                              <span className="text-red-400">Expired</span>
                            )}
                          </div>

                          {request.tagged_players.length > 0 && (
                            <div className="mt-3">
                              <div className="flex flex-wrap gap-2">
                                {request.tagged_players.map((player, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {player}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <Button className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Contact Agent
                          </Button>
                          
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
                              <Heart className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                            <Button variant="outline" size="sm" className="flex-1 border-gray-600 text-gray-300">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Comments Section */}
                      <div className="border-t border-gray-700 pt-4">
                        <div className="space-y-3">
                          {comments[request.id]?.slice(0, 3).map((comment) => (
                            <div key={comment.id} className="bg-gray-700/50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-white">
                                  {comment.profile.full_name}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-gray-300">{comment.content}</p>
                              {comment.tagged_players.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {comment.tagged_players.map((player, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      @{player}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                          
                          {/* Add Comment */}
                          <div className="flex gap-2">
                            <Input
                              placeholder="Add a comment..."
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                              className="flex-1 bg-gray-700 border-gray-600 text-white"
                            />
                            <Input
                              placeholder="Tag player (optional)"
                              value={taggedPlayer}
                              onChange={(e) => setTaggedPlayer(e.target.value)}
                              className="w-32 bg-gray-700 border-gray-600 text-white"
                            />
                            <Button
                              onClick={() => handleAddComment(request.id)}
                              className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                            >
                              <Send className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Market Analytics</h3>
              <p className="text-gray-400">Insights and trends in the agent request market</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="saved">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <Heart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Saved & Following</h3>
              <p className="text-gray-400">Your saved requests and followed agents</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Request Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Agent Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Request Title"
              value={newRequest.title}
              onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />
            
            <Textarea
              placeholder="Request Description"
              value={newRequest.description}
              onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
              rows={4}
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                placeholder="Position"
                value={newRequest.position}
                onChange={(e) => setNewRequest({ ...newRequest, position: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <Select 
                value={newRequest.sport_type}
                onValueChange={(value) => setNewRequest({ ...newRequest, sport_type: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="football">Football</SelectItem>
                  <SelectItem value="basketball">Basketball</SelectItem>
                  <SelectItem value="tennis">Tennis</SelectItem>
                  <SelectItem value="rugby">Rugby</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <Input
                type="number"
                placeholder="Min Budget"
                value={newRequest.budget_min}
                onChange={(e) => setNewRequest({ ...newRequest, budget_min: parseInt(e.target.value) || 0 })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <Input
                type="number"
                placeholder="Max Budget"
                value={newRequest.budget_max}
                onChange={(e) => setNewRequest({ ...newRequest, budget_max: parseInt(e.target.value) || 0 })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              
              <Select 
                value={newRequest.currency}
                onValueChange={(value) => setNewRequest({ ...newRequest, currency: value })}
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

            <div className="grid grid-cols-2 gap-4">
              <Select 
                value={newRequest.transfer_type}
                onValueChange={(value) => setNewRequest({ ...newRequest, transfer_type: value })}
              >
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                type="date"
                placeholder="Expires At"
                value={newRequest.expires_at}
                onChange={(e) => setNewRequest({ ...newRequest, expires_at: e.target.value })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={handleCreateRequest}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
              >
                Create Request
              </Button>
              <Button
                onClick={() => setIsCreateModalOpen(false)}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EnhancedAgentExploreHub;
