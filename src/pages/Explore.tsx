import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Plus, Calendar, DollarSign, MapPin, Trophy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InfoTooltip from '@/components/InfoTooltip';

interface AgentRequest {
  id: string;
  agent: {
    agency_name: string;
    profile: {
      full_name: string;
      country: string;
    };
  };
  title: string;
  description: string;
  sport_type: string;
  position?: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  transfer_type: string;
  expires_at: string;
  created_at: string;
}

const Explore = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [filters, setFilters] = useState({
    sport: '',
    position: '',
    transfer_type: '',
    search: ''
  });

  // New request form
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    sport_type: '',
    position: '',
    budget_min: '',
    budget_max: '',
    transfer_type: ''
  });

  useEffect(() => {
    fetchRequests();
  }, [filters]);

  const fetchRequests = async () => {
    try {
      let query = supabase
        .from('agent_requests')
        .select(`
          *,
          agent:agents(
            agency_name,
            profile:profiles(full_name, country)
          )
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (filters.sport) {
        query = query.eq('sport_type', filters.sport as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby');
      }

      if (filters.transfer_type) {
        query = query.eq('transfer_type', filters.transfer_type as 'loan' | 'permanent');
      }

      const { data, error } = await query;

      if (error) throw error;

      let filteredData = data || [];

      if (filters.position) {
        filteredData = filteredData.filter(request => 
          request.position?.toLowerCase().includes(filters.position.toLowerCase())
        );
      }

      if (filters.search) {
        filteredData = filteredData.filter(request =>
          request.title.toLowerCase().includes(filters.search.toLowerCase()) ||
          request.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          request.agent.agency_name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      setRequests(filteredData);
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

  const handleCreateRequest = async () => {
    if (profile?.user_type !== 'agent') {
      toast({
        title: "Access Denied",
        description: "Only agents can create requests",
        variant: "destructive"
      });
      return;
    }

    try {
      // Get agent profile
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) throw new Error('Agent profile not found');

      const { error } = await supabase
        .from('agent_requests')
        .insert({
          agent_id: agentData.id,
          title: newRequest.title,
          description: newRequest.description,
          sport_type: newRequest.sport_type as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby',
          position: newRequest.position || null,
          budget_min: newRequest.budget_min ? parseFloat(newRequest.budget_min) : null,
          budget_max: newRequest.budget_max ? parseFloat(newRequest.budget_max) : null,
          transfer_type: newRequest.transfer_type as 'loan' | 'permanent'
        });

      if (error) throw error;

      toast({
        title: "Request Created",
        description: "Your transfer request has been posted successfully",
      });

      setShowCreateForm(false);
      setNewRequest({
        title: '',
        description: '',
        sport_type: '',
        position: '',
        budget_min: '',
        budget_max: '',
        transfer_type: ''
      });
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive"
      });
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

  const getExpiryText = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffInDays = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays <= 0) return 'Expired';
    if (diffInDays === 1) return 'Expires tomorrow';
    return `Expires in ${diffInDays} days`;
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Explore Requests
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-rosegold font-poppins">
              Discover transfer opportunities from agents worldwide
            </p>
            <InfoTooltip content="Agents post their transfer requirements here. Teams can view and respond to these requests." />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <div></div>
          {profile?.user_type === 'agent' && (
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Request
            </Button>
          )}
        </div>

        {/* Create Request Form */}
        {showCreateForm && (
          <Card className="bg-white/5 border-rosegold/20">
            <CardHeader>
              <CardTitle className="font-polysans text-white">Create Transfer Request</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  placeholder="e.g. Looking for striker for Premier League club"
                  className="font-poppins"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Select value={newRequest.sport_type} onValueChange={(value) => setNewRequest({...newRequest, sport_type: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="football">Football</SelectItem>
                      <SelectItem value="basketball">Basketball</SelectItem>
                      <SelectItem value="volleyball">Volleyball</SelectItem>
                      <SelectItem value="tennis">Tennis</SelectItem>
                      <SelectItem value="rugby">Rugby</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transfer Type</Label>
                  <Select value={newRequest.transfer_type} onValueChange={(value) => setNewRequest({...newRequest, transfer_type: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="loan">Loan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="position">Position (Optional)</Label>
                <Input
                  id="position"
                  value={newRequest.position}
                  onChange={(e) => setNewRequest({...newRequest, position: e.target.value})}
                  placeholder="e.g. Striker, Midfielder, Goalkeeper"
                  className="font-poppins"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget_min">Min Budget (USD)</Label>
                  <Input
                    id="budget_min"
                    type="number"
                    value={newRequest.budget_min}
                    onChange={(e) => setNewRequest({...newRequest, budget_min: e.target.value})}
                    placeholder="50000"
                    className="font-poppins"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Max Budget (USD)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={newRequest.budget_max}
                    onChange={(e) => setNewRequest({...newRequest, budget_max: e.target.value})}
                    placeholder="200000"
                    className="font-poppins"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Detailed requirements, preferred player characteristics, etc."
                  className="font-poppins h-24"
                  maxLength={550}
                />
                <p className="text-sm text-gray-500">
                  {newRequest.description.length}/550 characters
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateRequest}
                  disabled={!newRequest.title || !newRequest.description || !newRequest.sport_type || !newRequest.transfer_type}
                  className="bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                >
                  Post Request
                </Button>
                <Button
                  onClick={() => setShowCreateForm(false)}
                  variant="outline"
                  className="border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-white/5 border-rosegold/20">
          <CardHeader>
            <CardTitle className="font-polysans text-white">Filter Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Select value={filters.sport} onValueChange={(value) => setFilters({...filters, sport: value})}>
                  <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                    <SelectValue placeholder="Sport" />
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
              </div>
              
              <div>
                <Select value={filters.transfer_type} onValueChange={(value) => setFilters({...filters, transfer_type: value})}>
                  <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                    <SelectValue placeholder="Transfer Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    <SelectItem value="permanent">Permanent</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  placeholder="Search requests or agencies"
                  value={filters.search}
                  onChange={(e) => setFilters({...filters, search: e.target.value})}
                  className="bg-white/10 border-rosegold/30 text-white placeholder:text-gray-400"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Requests */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/5 border-rosegold/20 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-64 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : requests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Search className="h-12 w-12 text-rosegold mx-auto mb-4" />
              <h3 className="text-xl font-polysans text-white mb-2">No Active Requests</h3>
              <p className="text-gray-400 font-poppins">
                No requests match your current filters. Try adjusting your search criteria.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="bg-white/5 border-rosegold/20 hover:border-rosegold/40 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-polysans font-bold text-white text-lg mb-1">
                          {request.title}
                        </h3>
                        <p className="text-rosegold font-poppins text-sm">
                          {request.agent.agency_name}
                        </p>
                        <p className="text-gray-400 font-poppins text-xs">
                          {request.agent.profile.full_name}
                          {request.agent.profile.country && ` • ${request.agent.profile.country}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="h-4 w-4 text-bright-pink" />
                      </div>
                    </div>

                    {/* Request Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="bg-rosegold text-white">
                          {request.sport_type.toUpperCase()}
                        </Badge>
                        <Badge variant={request.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                          {request.transfer_type.toUpperCase()}
                        </Badge>
                        {request.position && (
                          <Badge variant="outline" className="text-bright-pink border-bright-pink">
                            {request.position}
                          </Badge>
                        )}
                      </div>

                      {(request.budget_min || request.budget_max) && (
                        <div className="flex items-center gap-2 text-bright-pink font-polysans font-bold">
                          <DollarSign className="h-4 w-4" />
                          {request.budget_min && request.budget_max ? (
                            `${formatCurrency(request.budget_min, request.currency)} - ${formatCurrency(request.budget_max, request.currency)}`
                          ) : request.budget_min ? (
                            `From ${formatCurrency(request.budget_min, request.currency)}`
                          ) : (
                            `Up to ${formatCurrency(request.budget_max!, request.currency)}`
                          )}
                        </div>
                      )}
                    </div>

                    {/* Description */}
                    <p className="text-gray-300 font-poppins text-sm line-clamp-3">
                      {request.description}
                    </p>

                    {/* Timing */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(request.created_at)}
                      </div>
                      <span className="text-bright-pink">
                        {getExpiryText(request.expires_at)}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      {profile?.user_type === 'team' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins"
                        >
                          Tag Player
                        </Button>
                      )}
                      <Button
                        size="sm"
                        className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                      >
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Explore;
