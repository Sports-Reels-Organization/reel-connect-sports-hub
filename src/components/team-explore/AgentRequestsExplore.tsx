
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, MessageSquare, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  position: string;
  budget_max: number;
  budget_min: number;
  currency: string;
  created_at: string;
  expires_at: string;
  agent_id: string;
  agent_name?: string;
  message_count?: number;
}

interface AgentRequestsExploreProps {
  initialSearch?: string;
}

export const AgentRequestsExplore: React.FC<AgentRequestsExploreProps> = ({ initialSearch = '' }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [selectedRequest, setSelectedRequest] = useState<AgentRequest | null>(null);
  const [messageContent, setMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [profile]);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const fetchRequests = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_requests')
        .select(`
          *,
          agent:profiles!agent_requests_agent_id_fkey(full_name)
        `)
        .eq('status', 'active')
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      const requestsWithAgentName = data?.map(request => ({
        id: request.id,
        title: request.title,
        description: request.description,
        sport_type: request.sport_type,
        position: request.position,
        budget_max: request.budget_max || 0,
        budget_min: request.budget_min || 0,
        currency: request.currency || 'USD',
        created_at: request.created_at || new Date().toISOString(),
        expires_at: request.expires_at || new Date().toISOString(),
        agent_id: request.agent_id,
        agent_name: Array.isArray(request.agent) ? request.agent[0]?.full_name : request.agent?.full_name || 'Unknown Agent'
      })) || [];

      setRequests(requestsWithAgentName);
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

  const handleSendMessage = async () => {
    if (!selectedRequest || !messageContent.trim() || !profile?.id) return;

    try {
      setSendingMessage(true);
      const { error } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: selectedRequest.agent_id,
          content: messageContent,
          message_type: 'request_response',
          subject: `Response to: ${selectedRequest.title}`
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Message sent successfully",
      });

      setMessageContent('');
      setSelectedRequest(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive"
      });
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredRequests = requests.filter(request =>
    request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.sport_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
    request.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (request.agent_name && request.agent_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search agent requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Active Requests</h3>
            <p className="text-muted-foreground">
              {searchQuery ? 'No requests match your search criteria.' : 'There are no active agent requests at the moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{request.title}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>{request.agent_name}</span>
                      <span>•</span>
                      <Clock className="h-4 w-4" />
                      <span>Expires {format(new Date(request.expires_at), 'MMM dd, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{request.sport_type}</Badge>
                    <Badge variant="outline">{request.position}</Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {request.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    Budget: {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: request.currency || 'USD'
                    }).format(request.budget_min)} - {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: request.currency || 'USD'
                    }).format(request.budget_max)}
                  </div>
                  
                  <Button 
                    size="sm" 
                    onClick={() => setSelectedRequest(request)}
                    className="flex items-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    Respond
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedRequest && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Respond to: {selectedRequest.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Write your response to this agent request..."
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              rows={4}
            />
            <div className="flex gap-2">
              <Button 
                onClick={handleSendMessage}
                disabled={!messageContent.trim() || sendingMessage}
              >
                {sendingMessage ? 'Sending...' : 'Send Response'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSelectedRequest(null);
                  setMessageContent('');
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
