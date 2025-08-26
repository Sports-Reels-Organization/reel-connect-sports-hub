import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
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
  MapPin,
  Star,
  TrendingUp,
  Eye,
  Heart,
  BarChart3,
  Settings,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface AgentRequest {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  position: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  expires_at: string;
  is_public: boolean;
  created_at: string;
  agent?: {
    full_name: string;
    country: string;
  };
}

interface RequestComment {
  id: string;
  request_id: string;
  profile_id: string;
  content: string;
  tagged_players: string[];
  created_at: string;
  profile?: {
    full_name: string;
  };
}

const EnhancedAgentExploreHub: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [comments, setComments] = useState<Record<string, RequestComment[]>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    budgetRange: '',
    country: '',
    dateRange: '',
    currency: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);
  const [newPlayerTag, setNewPlayerTag] = useState('');

  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    position: '',
    budget_min: 0,
    budget_max: 0,
    currency: 'USD',
    expires_at: ''
  });

  useEffect(() => {
    fetchRequests();
  }, [sortBy, filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('agent_requests')
        .select(`
          *,
          agent:profiles!agent_requests_agent_id_fkey(
            full_name,
            country
          )
        `)
        .eq('is_public', true);

      // Apply filters
      if (filters.position) {
        query = query.eq('position', filters.position);
      }
      if (filters.currency) {
        query = query.eq('currency', filters.currency);
      }

      // Apply sorting
      switch (sortBy) {
        case 'newest':
          query = query.order('created_at', { ascending: false });
          break;
        case 'oldest':
          query = query.order('created_at', { ascending: true });
          break;
        case 'expire_soon':
          query = query.order('expires_at', { ascending: true });
          break;
        case 'budget_high':
          query = query.order('budget_max', { ascending: false });
          break;
        case 'budget_low':
          query = query.order('budget_min', { ascending: true });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      // Type assertion to ensure proper typing
      const typedData = (data || []).map(item => ({
        id: item.id,
        agent_id: item.agent_id,
        title: item.title,
        description: item.description,
        position: item.position,
        budget_min: item.budget_min,
        budget_max: item.budget_max,
        currency: item.currency,
        expires_at: item.expires_at,
        is_public: item.is_public,
        created_at: item.created_at,
        agent: item.agent ? {
          full_name: item.agent.full_name,
          country: item.agent.country
        } : undefined
      })) as AgentRequest[];

      setRequests(typedData);
      await fetchCommentsForRequests(typedData.map(r => r.id));
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

  const fetchCommentsForRequests = async (requestIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('agent_request_comments')
        .select(`
          *,
          profile:profiles!agent_request_comments_profile_id_fkey(
            full_name
          )
        `)
        .in('request_id', requestIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group comments by request ID
      const groupedComments: Record<string, RequestComment[]> = {};
      (data || []).forEach(comment => {
        if (!groupedComments[comment.request_id]) {
          groupedComments[comment.request_id] = [];
        }
        groupedComments[comment.request_id].push({
          id: comment.id,
          request_id: comment.request_id,
          profile_id: comment.profile_id,
          content: comment.content,
          tagged_players: comment.tagged_players || [],
          created_at: comment.created_at,
          profile: comment.profile ? {
            full_name: comment.profile.full_name
          } : undefined
        });
      });

      setComments(groupedComments);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleCreateRequest = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('agent_requests')
        .insert({
          agent_id: profile.id,
          title: newRequest.title,
          description: newRequest.description,
          position: newRequest.position,
          budget_min: newRequest.budget_min,
          budget_max: newRequest.budget_max,
          currency: newRequest.currency,
          expires_at: newRequest.expires_at,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Request Created",
        description: "Your agent request has been created successfully"
      });

      setIsCreateDialogOpen(false);
      setNewRequest({
        title: '',
        description: '',
        position: '',
        budget_min: 0,
        budget_max: 0,
        currency: 'USD',
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

  const handleEditRequest = async () => {
    if (!selectedRequest || !profile) return;

    try {
      const { error } = await supabase
        .from('agent_requests')
        .update(newRequest)
        .eq('id', selectedRequest.id)
        .eq('agent_id', profile.id);

      if (error) throw error;

      toast({
        title: "Request Updated",
        description: "Your request has been updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update request",
        variant: "destructive"
      });
    }
  };

  const handleDeleteRequest = async (requestId: string) => {
    if (!profile) return;

    try {
      const { error } = await supabase
        .from('agent_requests')
        .delete()
        .eq('id', requestId)
        .eq('agent_id', profile.id);

      if (error) throw error;

      toast({
        title: "Request Deleted",
        description: "Request has been deleted successfully"
      });

      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete request",
        variant: "destructive"
      });
    }
  };

  const handleAddComment = async (requestId: string) => {
    if (!profile || !newComment.trim()) return;

    try {
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
      setTaggedPlayers([]);
      fetchCommentsForRequests([requestId]);
    } catch (error) {
      console.error('Error adding comment:', error);
      toast({
        title: "Comment Failed",
        description: "Failed to add comment",
        variant: "destructive"
      });
    }
  };

  const addPlayerTag = () => {
    if (newPlayerTag.trim() && !taggedPlayers.includes(newPlayerTag.trim())) {
      setTaggedPlayers(prev => [...prev, newPlayerTag.trim()]);
      setNewPlayerTag('');
    }
  };

  const removePlayerTag = (tag: string) => {
    setTaggedPlayers(prev => prev.filter(t => t !== tag));
  };

  const formatBudget = (min: number, max: number, currency: string) => {
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const isMyRequest = (request: AgentRequest) => {
    return profile && request.agent_id === profile.id;
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.position.toLowerCase().includes(searchTerm.toLowerCase())
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
                Agent Explore Hub
              </CardTitle>
              <p className="text-gray-300 mt-2">
                Discover and connect with talent requests from agents worldwide
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

      <Tabs defaultValue="explore" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 p-1">
          <TabsTrigger value="explore" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Explore ({requests.length})
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            My Requests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
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
                    <SelectItem value="expire_soon">Expiring Soon</SelectItem>
                    <SelectItem value="budget_high">Highest Budget</SelectItem>
                    <SelectItem value="budget_low">Lowest Budget</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select value={filters.position} onValueChange={(value) => setFilters({ ...filters, position: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Position" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Positions</SelectItem>
                    <SelectItem value="forward">Forward</SelectItem>
                    <SelectItem value="midfielder">Midfielder</SelectItem>
                    <SelectItem value="defender">Defender</SelectItem>
                    <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filters.currency} onValueChange={(value) => setFilters({ ...filters, currency: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Currencies</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Min Budget"
                  className="bg-gray-700 border-gray-600 text-white"
                />

                <Input
                  placeholder="Max Budget"
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>

              <Button
                onClick={() => setFilters({ position: '', budgetRange: '', country: '', dateRange: '', currency: '' })}
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
                  <p className="text-gray-400">No agent requests match your current filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-bold text-lg">{request.title}</h3>
                          {isMyRequest(request) && (
                            <Badge className="bg-bright-pink text-white text-xs">
                              My Request
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-300 mb-3">{request.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{request.position}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{formatBudget(request.budget_min, request.budget_max, request.currency)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>Expires {new Date(request.expires_at).toLocaleDateString()}</span>
                          </div>
                        </div>

                        {request.agent && (
                          <div className="text-sm text-gray-400">
                            by {request.agent.full_name} {request.agent.country && `• ${request.agent.country}`}
                          </div>
                        )}
                      </div>

                      {isMyRequest(request) && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-gray-600 text-gray-300 hover:bg-gray-700"
                            onClick={() => {
                              setSelectedRequest(request);
                              setNewRequest({
                                title: request.title,
                                description: request.description,
                                position: request.position,
                                budget_min: request.budget_min,
                                budget_max: request.budget_max,
                                currency: request.currency,
                                expires_at: request.expires_at
                              });
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                            onClick={() => handleDeleteRequest(request.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Comments Section */}
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-400 text-sm">
                          {comments[request.id]?.length || 0} Comments
                        </span>
                      </div>

                      {/* Existing Comments */}
                      {comments[request.id] && comments[request.id].length > 0 && (
                        <div className="space-y-3 mb-4">
                          {comments[request.id].slice(0, 2).map((comment) => (
                            <div key={comment.id} className="bg-gray-700 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-white text-sm font-medium">
                                  {comment.profile?.full_name || 'Anonymous'}
                                </span>
                                <span className="text-gray-400 text-xs">
                                  {new Date(comment.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-300 text-sm">{comment.content}</p>
                              {comment.tagged_players.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {comment.tagged_players.map((player, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {player}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            value={newPlayerTag}
                            onChange={(e) => setNewPlayerTag(e.target.value)}
                            placeholder="Tag a player"
                            className="bg-gray-700 border-gray-600 text-white flex-1"
                            onKeyPress={(e) => e.key === 'Enter' && addPlayerTag()}
                          />
                          <Button
                            type="button"
                            onClick={addPlayerTag}
                            size="sm"
                            className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>

                        {taggedPlayers.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {taggedPlayers.map((tag, index) => (
                              <Badge key={index} variant="outline" className="border-bright-pink text-bright-pink">
                                {tag}
                                <button
                                  onClick={() => removePlayerTag(tag)}
                                  className="ml-1 hover:text-red-400"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="bg-gray-700 border-gray-600 text-white flex-1"
                            rows={2}
                          />
                          <Button
                            onClick={() => handleAddComment(request.id)}
                            className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                            disabled={!newComment.trim()}
                          >
                            <Send className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-requests">
          <div className="grid gap-4">
            {requests.filter(request => isMyRequest(request)).map((request) => (
              <Card key={request.id} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-white font-bold text-lg mb-2">{request.title}</h3>
                      <p className="text-gray-300 mb-3">{request.description}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{request.position}</span>
                        <span>{formatBudget(request.budget_min, request.budget_max, request.currency)}</span>
                        <span>{comments[request.id]?.length || 0} comments</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-600 text-gray-300 hover:bg-gray-700"
                        onClick={() => {
                          setSelectedRequest(request);
                          setNewRequest({
                            title: request.title,
                            description: request.description,
                            position: request.position,
                            budget_min: request.budget_min,
                            budget_max: request.budget_max,
                            currency: request.currency,
                            expires_at: request.expires_at
                          });
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Request Analytics</h3>
              <p className="text-gray-400">Detailed analytics and insights about agent requests</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Create Agent Request</DialogTitle>
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
              rows={3}
            />

            <div className="grid grid-cols-2 gap-4">
              <Select value={newRequest.position} onValueChange={(value) => setNewRequest({ ...newRequest, position: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="forward">Forward</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                </SelectContent>
              </Select>

              <Select value={newRequest.currency} onValueChange={(value) => setNewRequest({ ...newRequest, currency: value })}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Currency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                  <SelectItem value="GBP">GBP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Min Budget"
                value={newRequest.budget_min || ''}
                onChange={(e) => setNewRequest({ ...newRequest, budget_min: Number(e.target.value) })}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Input
                type="number"
                placeholder="Max Budget"
                value={newRequest.budget_max || ''}
                onChange={(e) => setNewRequest({ ...newRequest, budget_max: Number(e.target.value) })}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <Input
              type="datetime-local"
              placeholder="Expires At"
              value={newRequest.expires_at}
              onChange={(e) => setNewRequest({ ...newRequest, expires_at: e.target.value })}
              className="bg-gray-700 border-gray-600 text-white"
            />

            <div className="flex gap-2">
              <Button
                onClick={handleCreateRequest}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                disabled={!newRequest.title || !newRequest.description}
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

      {/* Edit Request Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Agent Request</DialogTitle>
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
              rows={3}
            />

            <div className="flex gap-2">
              <Button
                onClick={handleEditRequest}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                disabled={!newRequest.title || !newRequest.description}
              >
                Save Changes
              </Button>
              <Button
                onClick={() => setIsEditDialogOpen(false)}
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
