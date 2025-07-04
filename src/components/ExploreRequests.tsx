
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Search, Plus, MessageCircle, Calendar, MapPin, User, DollarSign } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  transfer_type: string;
  position: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  expires_at: string;
  created_at: string;
  tagged_players: string[];
  agent_name: string;
  agency_name: string;
  agent_logo_url: string;
  agent_country: string;
}

export const ExploreRequests: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agentId, setAgentId] = useState<string | null>(null);
  
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    sport_type: 'football',
    transfer_type: 'permanent',
    position: '',
    budget_min: '',
    budget_max: '',
    currency: 'USD'
  });

  const sportTypes = ['football', 'basketball', 'volleyball', 'tennis', 'rugby'];
  const transferTypes = ['permanent', 'loan'];
  const currencies = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
  const positions = ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'];

  useEffect(() => {
    fetchRequests();
    if (profile?.user_type === 'agent') {
      fetchAgentId();
    }
  }, [profile]);

  const fetchAgentId = async () => {
    if (!profile) return;
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) throw error;
      setAgentId(data.id);
    } catch (error) {
      console.error('Error fetching agent ID:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('active_agent_requests_view')
        .select('*')
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
    }
  };

  const createRequest = async () => {
    if (!agentId || !newRequest.title || !newRequest.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const requestData = {
        agent_id: agentId,
        title: newRequest.title,
        description: newRequest.description,
        sport_type: newRequest.sport_type,
        transfer_type: newRequest.transfer_type,
        position: newRequest.position || null,
        budget_min: newRequest.budget_min ? parseFloat(newRequest.budget_min) : null,
        budget_max: newRequest.budget_max ? parseFloat(newRequest.budget_max) : null,
        currency: newRequest.currency,
        is_public: true
      };

      const { error } = await supabase
        .from('agent_requests')
        .insert(requestData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request posted successfully",
      });

      setNewRequest({
        title: '',
        description: '',
        sport_type: 'football',
        transfer_type: 'permanent',
        position: '',
        budget_min: '',
        budget_max: '',
        currency: 'USD'
      });
      setShowCreateForm(false);
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const generateRequestDescription = () => {
    const parts = [];
    parts.push("I am looking for");
    if (newRequest.position) parts.push(`a ${newRequest.position}`);
    parts.push(`for a ${newRequest.sport_type} club`);
    if (newRequest.transfer_type) parts.push(`for a ${newRequest.transfer_type} transfer`);
    if (newRequest.budget_min || newRequest.budget_max) {
      const budget = [];
      if (newRequest.budget_min) budget.push(`min ${newRequest.budget_min}`);
      if (newRequest.budget_max) budget.push(`max ${newRequest.budget_max}`);
      parts.push(`with budget ${budget.join(', ')} ${newRequest.currency}`);
    }
    
    setNewRequest(prev => ({ 
      ...prev, 
      description: parts.join(' ') + '.' 
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Explore Requests</h1>
          <p className="text-gray-400">Discover player requests from agents worldwide</p>
        </div>
        {profile?.user_type === 'agent' && (
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-rosegold hover:bg-rosegold/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Post Request
          </Button>
        )}
      </div>

      {/* Create Request Form */}
      {showCreateForm && profile?.user_type === 'agent' && (
        <Card>
          <CardHeader>
            <CardTitle>Post New Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Request Title *</Label>
                <Input
                  value={newRequest.title}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Looking for striker for Premier League club"
                />
              </div>
              <div>
                <Label>Sport *</Label>
                <Select
                  value={newRequest.sport_type}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, sport_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sportTypes.map(sport => (
                      <SelectItem key={sport} value={sport}>
                        {sport.charAt(0).toUpperCase() + sport.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Position</Label>
                <Select
                  value={newRequest.position}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map(position => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Transfer Type *</Label>
                <Select
                  value={newRequest.transfer_type}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, transfer_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {transferTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Min Budget</Label>
                <Input
                  type="number"
                  value={newRequest.budget_min}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, budget_min: e.target.value }))}
                  placeholder="Minimum budget"
                />
              </div>
              <div>
                <Label>Max Budget</Label>
                <Input
                  type="number"
                  value={newRequest.budget_max}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, budget_max: e.target.value }))}
                  placeholder="Maximum budget"
                />
              </div>
              <div>
                <Label>Currency</Label>
                <Select
                  value={newRequest.currency}
                  onValueChange={(value) => setNewRequest(prev => ({ ...prev, currency: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency} value={currency}>
                        {currency}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Description *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRequestDescription}
                >
                  Auto Generate
                </Button>
              </div>
              <Textarea
                value={newRequest.description}
                onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe what kind of player you're looking for..."
                rows={4}
                maxLength={550}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newRequest.description.length}/550 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={createRequest}
                disabled={loading}
                className="bg-rosegold hover:bg-rosegold/90"
              >
                {loading ? 'Posting...' : 'Post Request'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Requests List */}
      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No requests found</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to post a request</p>
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    {request.agent_logo_url && (
                      <img
                        src={request.agent_logo_url}
                        alt={request.agency_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{request.agency_name}</h3>
                      <p className="text-sm text-gray-400">{request.agent_name}</p>
                      {request.agent_country && (
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {request.agent_country}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      <Calendar className="w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(request.expires_at))} left
                    </Badge>
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-white mb-2">{request.title}</h4>
                <p className="text-gray-300 mb-4">{request.description}</p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="secondary">{request.sport_type}</Badge>
                  <Badge variant="outline">{request.transfer_type}</Badge>
                  {request.position && (
                    <Badge variant="outline">
                      <User className="w-3 h-3 mr-1" />
                      {request.position}
                    </Badge>
                  )}
                  {(request.budget_min || request.budget_max) && (
                    <Badge variant="outline">
                      <DollarSign className="w-3 h-3 mr-1" />
                      {request.budget_min && `${request.budget_min.toLocaleString()}`}
                      {request.budget_min && request.budget_max && ' - '}
                      {request.budget_max && `${request.budget_max.toLocaleString()}`}
                      {' '}{request.currency}
                    </Badge>
                  )}
                </div>

                {request.tagged_players && request.tagged_players.length > 0 && (
                  <div className="mt-4 p-3 bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-400 mb-2">Tagged Players:</p>
                    <div className="flex flex-wrap gap-1">
                      {request.tagged_players.map((playerId, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          Player {playerId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default ExploreRequests;
