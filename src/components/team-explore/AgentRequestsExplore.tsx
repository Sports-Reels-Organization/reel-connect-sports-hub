
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Search, MessageSquare, Calendar, User, DollarSign } from 'lucide-react';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  position?: string;
  sport_type: string;
  transfer_type: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  expires_at: string;
  created_at: string;
  is_public: boolean;
  agents: {
    id: string;
    agency_name: string;
  };
}

interface AgentRequestsExploreProps {
  initialSearch?: string;
}

const AgentRequestsExplore = ({ initialSearch }: AgentRequestsExploreProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch || '');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  useEffect(() => {
    filterRequests();
  }, [requests, searchQuery]);

  const filterRequests = () => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const filtered = requests.filter(request => 
      request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.agents.agency_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredRequests(filtered);
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_requests')
        .select(`
          *,
          agents!inner(
            id,
            agency_name
          )
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching agent requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const handleContactAgent = async (agentId: string, requestTitle: string) => {
    try {
      // Get team ID
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!teamData) {
        toast({
          title: "Profile Required",
          description: "Please complete your team profile first",
          variant: "destructive"
        });
        return;
      }

      // Create a message to the agent
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_profile_id: profile?.id,
          recipient_profile_id: agentId,
          content: `Hi, I'm interested in your request: "${requestTitle}". Let's discuss further.`,
          message_type: 'general'
        });

      if (error) throw error;

      toast({
        title: "Message Sent",
        description: "Your message has been sent to the agent",
      });
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card className="border-gray-600">
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Search agent requests by title, description, position, or agency..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-gray-800 border-gray-600 text-white"
            />
            <Button variant="outline" size="icon" className="border-gray-600">
              <Search className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Agent Requests Feed */}
      <Card className="border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white font-polysans">
            <Search className="w-5 h-5" />
            Agent Player Requests ({filteredRequests.length})
            {searchQuery && (
              <Badge variant="outline" className="ml-2 text-rosegold border-rosegold">
                Filtered by: "{searchQuery}"
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-32 bg-gray-700 rounded"></div>
                </div>
              ))}
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                {searchQuery ? 'No Matching Requests' : 'No Agent Requests Available'}
              </h3>
              <p className="text-gray-400 font-poppins">
                {searchQuery 
                  ? `No agent requests found matching "${searchQuery}". Try adjusting your search terms.`
                  : 'No agents are currently looking for players. Check back later for new opportunities.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <Card key={request.id} className="border-gray-600 hover:border-rosegold/50 transition-colors">
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-polysans font-bold text-white text-lg mb-2">
                            {request.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              {request.agents.agency_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatTimeAgo(request.created_at)}
                            </div>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleContactAgent(request.agents.id, request.title)}
                          className="bg-rosegold hover:bg-rosegold/90 text-white"
                          size="sm"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Contact Agent
                        </Button>
                      </div>

                      <div className="flex gap-2 flex-wrap">
                        {request.position && (
                          <Badge variant="outline" className="text-rosegold border-rosegold">
                            {request.position}
                          </Badge>
                        )}
                        <Badge variant={request.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                          {request.transfer_type.toUpperCase()}
                        </Badge>
                        {request.budget_min && request.budget_max && (
                          <Badge variant="outline" className="text-green-400 border-green-400">
                            <DollarSign className="w-3 h-3 mr-1" />
                            {formatCurrency(request.budget_min, request.currency)} - {formatCurrency(request.budget_max, request.currency)}
                          </Badge>
                        )}
                      </div>

                      <p className="text-gray-300 leading-relaxed">
                        {request.description}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentRequestsExplore;
