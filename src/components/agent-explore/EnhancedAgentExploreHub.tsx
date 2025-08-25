
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import {
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  MessageCircle,
  Users,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  TrendingUp,
  Eye,
  Star,
  MoreHorizontal,
  User,
  Send
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
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
  preferred_league: string;
  preferred_countries: string[];
  age_min: number;
  age_max: number;
  experience_level: string;
  urgency: string;
  is_public: boolean;
  is_editable: boolean;
  edit_count: number;
  created_at: string;
  expires_at: string;
  agents: {
    full_name: string;
    country: string;
    agency_name: string;
  };
  comments?: AgentRequestComment[];
}

interface AgentRequestComment {
  id: string;
  content: string;
  tagged_players: any[];
  created_at: string;
  profiles: {
    full_name: string;
    user_type: string;
  };
}

const EnhancedAgentExploreHub: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    budgetMin: '',
    budgetMax: '',
    country: '',
    urgency: '',
    experience: ''
  });
  const [sortBy, setSortBy] = useState('newest');
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCommentDialogOpen, setIsCommentDialogOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [taggedPlayers, setTaggedPlayers] = useState<string[]>([]);

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
          agents!inner(
            full_name,
            country,
            agency_name
          )
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString());

      // Apply filters
      if (filters.position) {
        query = query.ilike('position', `%${filters.position}%`);
      }
      if (filters.budgetMin) {
        query = query.gte('budget_min', parseInt(filters.budgetMin));
      }
      if (filters.budgetMax) {
        query = query.lte('budget_max', parseInt(filters.budgetMax));
      }
      if (filters.urgency) {
        query = query.eq('urgency', filters.urgency);
      }
      if (filters.experience) {
        query = query.eq('experience_level', filters.experience);
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
        case 'urgent':
          query = query.order('urgency', { ascending: false });
          break;
      }

      const { data, error } = await query;

      if (error) throw error;

      setRequests(data || []);
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

  const fetchComments = async (requestId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_request_comments')
        .select(`
          *,
          profiles!inner(
            full_name,
            user_type
          )
        `)
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      return [];
    }
  };

  const handleEditRequest = async (requestData: Partial<AgentRequest>) => {
    if (!selectedRequest) return;

    try {
      const { error } = await supabase
        .from('agent_requests')
        .update({
          title: requestData.title,
          description: requestData.description,
          budget_min: requestData.budget_min,
          budget_max: requestData.budget_max,
          urgency: requestData.urgency
        })
        .eq('id', selectedRequest.id);

      if (error) throw error;

      toast({
        title: "Request Updated",
        description: "Agent request has been updated successfully"
      });

      setIsEditDialogOpen(false);
      fetchRequests();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update agent request",
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

  const handleAddComment = async () => {
    if (!selectedRequest || !commentText.trim()) return;

    try {
      const { error } = await supabase
        .from('agent_request_comments')
        .insert({
          request_id: selectedRequest.id,
          profile_id: profile?.id,
          content: commentText,
          tagged_players: taggedPlayers
        });

      if (error) throw error;

      toast({
        title: "Comment Added",
        description: "Your comment has been added successfully"
      });

      setCommentText('');
      setTaggedPlayers([]);
      setIsCommentDialogOpen(false);
      
      // Refresh comments
      const comments = await fetchComments(selectedRequest.id);
      setSelectedRequest({ ...selectedRequest, comments });
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
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
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
          <CardTitle className="text-white text-2xl font-bold flex items-center gap-3">
            <div className="p-2 bg-bright-pink/20 rounded-lg">
              <Users className="w-6 h-6 text-bright-pink" />
            </div>
            Agent Explore Hub
          </CardTitle>
          <p className="text-gray-300">
            Discover and respond to agent requests for players
          </p>
        </CardHeader>
      </Card>

      <Tabs defaultValue="requests" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800 p-1">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Browse Requests
          </TabsTrigger>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            My Requests
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Market Insights
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
                    <SelectItem value="urgent">Most Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Advanced Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  placeholder="Position"
                  value={filters.position}
                  onChange={(e) => setFilters({ ...filters, position: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Min Budget"
                  type="number"
                  value={filters.budgetMin}
                  onChange={(e) => setFilters({ ...filters, budgetMin: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Max Budget"
                  type="number"
                  value={filters.budgetMax}
                  onChange={(e) => setFilters({ ...filters, budgetMax: e.target.value })}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Select value={filters.urgency} onValueChange={(value) => setFilters({ ...filters, urgency: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Urgency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Urgency</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filters.experience} onValueChange={(value) => setFilters({ ...filters, experience: value })}>
                  <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Experience</SelectItem>
                    <SelectItem value="youth">Youth</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="experienced">Experienced</SelectItem>
                    <SelectItem value="veteran">Veteran</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => setFilters({ position: '', budgetMin: '', budgetMax: '', country: '', urgency: '', experience: '' })}
                  variant="outline"
                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Request List */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-bright-pink border-t-transparent rounded-full" />
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-white font-medium mb-2">No Requests Found</h3>
                  <p className="text-gray-400">Try adjusting your search or filters</p>
                </CardContent>
              </Card>
            ) : (
              filteredRequests.map((request) => (
                <Card key={request.id} className="bg-gray-800 border-gray-700 hover:border-bright-pink/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-white font-semibold text-lg">{request.title}</h3>
                          <Badge className={`${getUrgencyColor(request.urgency)} text-white text-xs`}>
                            {request.urgency.toUpperCase()}
                          </Badge>
                          {request.edit_count > 0 && (
                            <Badge variant="outline" className="text-yellow-400 border-yellow-400">
                              Edited {request.edit_count}x
                            </Badge>
                          )}
                        </div>
                        <p className="text-gray-300 mb-3 line-clamp-2">{request.description}</p>
                        
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{request.position}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{formatBudget(request.budget_min, request.budget_max, request.currency)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{request.age_min}-{request.age_max} years</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">Expires {new Date(request.expires_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              className="border-bright-pink text-bright-pink hover:bg-bright-pink hover:text-white"
                              onClick={async () => {
                                const comments = await fetchComments(request.id);
                                setSelectedRequest({ ...request, comments });
                              }}
                            >
                              <MessageCircle className="w-4 h-4 mr-1" />
                              Comment
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
                            <DialogHeader>
                              <DialogTitle className="text-white">{request.title}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-white font-medium mb-2">Request Details</h4>
                                <p className="text-gray-300 text-sm">{request.description}</p>
                              </div>
                              
                              <div>
                                <h4 className="text-white font-medium mb-2">Comments</h4>
                                <ScrollArea className="h-64 border border-gray-600 rounded-lg p-4">
                                  {selectedRequest?.comments && selectedRequest.comments.length > 0 ? (
                                    <div className="space-y-3">
                                      {selectedRequest.comments.map((comment) => (
                                        <div key={comment.id} className="p-3 bg-gray-700 rounded-lg">
                                          <div className="flex items-center gap-2 mb-2">
                                            <span className="text-white font-medium">{comment.profiles.full_name}</span>
                                            <Badge variant="outline" className="text-xs">
                                              {comment.profiles.user_type}
                                            </Badge>
                                            <span className="text-gray-400 text-xs">
                                              {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                          </div>
                                          <p className="text-gray-300 text-sm">{comment.content}</p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-gray-400 text-center">No comments yet</p>
                                  )}
                                </ScrollArea>
                              </div>
                              
                              <div className="space-y-3">
                                <Textarea
                                  placeholder="Add your comment..."
                                  value={commentText}
                                  onChange={(e) => setCommentText(e.target.value)}
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                                <Button
                                  onClick={handleAddComment}
                                  className="bg-bright-pink hover:bg-bright-pink/90 text-white"
                                  disabled={!commentText.trim()}
                                >
                                  <Send className="w-4 h-4 mr-2" />
                                  Add Comment
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                        
                        {profile?.user_type === 'agent' && profile?.id === request.agent_id && request.is_editable && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => {
                                setSelectedRequest(request);
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
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm text-gray-400 border-t border-gray-700 pt-4">
                      <div className="flex items-center gap-4">
                        <span>by {request.agents.full_name}</span>
                        <span>•</span>
                        <span>{request.agents.agency_name}</span>
                        <span>•</span>
                        <span>{request.agents.country}</span>
                      </div>
                      <span>{new Date(request.created_at).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-requests">
          {/* My Requests content would go here */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">My Requests</h3>
              <p className="text-gray-400">View and manage your agent requests</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          {/* Analytics content would go here */}
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-8 text-center">
              <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-white font-medium mb-2">Market Insights</h3>
              <p className="text-gray-400">Analyze market trends and request patterns</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      {selectedRequest && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="bg-gray-800 border-gray-700 max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-white">Edit Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Request Title"
                defaultValue={selectedRequest.title}
                className="bg-gray-700 border-gray-600 text-white"
              />
              <Textarea
                placeholder="Request Description"
                defaultValue={selectedRequest.description}
                className="bg-gray-700 border-gray-600 text-white"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Min Budget"
                  type="number"
                  defaultValue={selectedRequest.budget_min}
                  className="bg-gray-700 border-gray-600 text-white"
                />
                <Input
                  placeholder="Max Budget"
                  type="number"
                  defaultValue={selectedRequest.budget_max}
                  className="bg-gray-700 border-gray-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => handleEditRequest(selectedRequest)}
                  className="bg-bright-pink hover:bg-bright-pink/90 text-white"
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
      )}
    </div>
  );
};

export default EnhancedAgentExploreHub;
