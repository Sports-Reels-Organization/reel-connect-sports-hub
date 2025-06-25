
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Calendar, DollarSign, MapPin, MessageSquare } from 'lucide-react';

interface AgentRequest {
  id: string;
  title: string;
  description: string;
  position?: string;
  sport_type: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  transfer_type: string;
  created_at: string;
  expires_at: string;
  agents: {
    agency_name: string;
  };
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

  // Form state for creating new requests
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    position: '',
    sport_type: 'football',
    budget_min: '',
    budget_max: '',
    currency: 'USD',
    transfer_type: 'permanent',
    is_public: true
  });

  useEffect(() => {
    fetchAgentRequests();
  }, [filters]);

  const fetchAgentRequests = async () => {
    try {
      let query = supabase
        .from('agent_requests')
        .select(`
          *,
          agents(agency_name)
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (filters.sport) {
        query = query.eq('sport_type', filters.sport as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby');
      }

      if (filters.transfer_type) {
        query = query.eq('transfer_type', filters.transfer_type as 'permanent' | 'loan');
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
          request.description.toLowerCase().includes(filters.search.toLowerCase())
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

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

      if (!agentData) {
        toast({
          title: "Error",
          description: "Agent profile not found. Please complete your profile setup.",
          variant: "destructive"
        });
        return;
      }

      const { error } = await supabase
        .from('agent_requests')
        .insert({
          title: formData.title,
          description: formData.description,
          position: formData.position || null,
          sport_type: formData.sport_type as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby',
          budget_min: formData.budget_min ? parseFloat(formData.budget_min) : null,
          budget_max: formData.budget_max ? parseFloat(formData.budget_max) : null,
          currency: formData.currency,
          transfer_type: formData.transfer_type as 'permanent' | 'loan',
          is_public: formData.is_public
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Request created successfully!",
      });

      setShowCreateForm(false);
      setFormData({
        title: '',
        description: '',
        position: '',
        sport_type: 'football',
        budget_min: '',
        budget_max: '',
        currency: 'USD',
        transfer_type: 'permanent',
        is_public: true
      });
      fetchAgentRequests();
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Explore Requests
            </h1>
            <p className="text-rosegold font-poppins">
              Discover what agents are looking for and post your own requests
            </p>
          </div>
          {profile?.user_type === 'agent' && (
            <Button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="bg-rosegold hover:bg-rosegold/90 font-polysans"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Request
            </Button>
          )}
        </div>

        {/* Create Request Form */}
        {showCreateForm && profile?.user_type === 'agent' && (
          <Card className="bg-white/5 border-rosegold/20">
            <CardHeader>
              <CardTitle className="font-polysans text-white">Create New Request</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateRequest} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Title</Label>
                    <Input
                      placeholder="e.g. Looking for striker"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="bg-white/10 border-rosegold/30 text-white"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Position</Label>
                    <Input
                      placeholder="e.g. Striker, Midfielder"
                      value={formData.position}
                      onChange={(e) => setFormData({...formData, position: e.target.value})}
                      className="bg-white/10 border-rosegold/30 text-white"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    placeholder="Describe what you're looking for..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="bg-white/10 border-rosegold/30 text-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Sport</Label>
                    <Select value={formData.sport_type} onValueChange={(value) => setFormData({...formData, sport_type: value})}>
                      <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                        <SelectValue />
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
                    <Label className="text-white">Transfer Type</Label>
                    <Select value={formData.transfer_type} onValueChange={(value) => setFormData({...formData, transfer_type: value})}>
                      <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="permanent">Permanent</SelectItem>
                        <SelectItem value="loan">Loan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">Currency</Label>
                    <Select value={formData.currency} onValueChange={(value) => setFormData({...formData, currency: value})}>
                      <SelectTrigger className="bg-white/10 border-rosegold/30 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Min Budget</Label>
                    <Input
                      type="number"
                      placeholder="Minimum budget"
                      value={formData.budget_min}
                      onChange={(e) => setFormData({...formData, budget_min: e.target.value})}
                      className="bg-white/10 border-rosegold/30 text-white"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-white">Max Budget</Label>
                    <Input
                      type="number"
                      placeholder="Maximum budget"
                      value={formData.budget_max}
                      onChange={(e) => setFormData({...formData, budget_max: e.target.value})}
                      className="bg-white/10 border-rosegold/30 text-white"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="bg-rosegold hover:bg-rosegold/90">
                    Create Request
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                    className="border-rosegold text-rosegold hover:bg-rosegold hover:text-white"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Filters */}
        <Card className="bg-white/5 border-rosegold/20">
          <CardHeader>
            <CardTitle className="font-polysans text-white">Filter Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                <Input
                  placeholder="Position"
                  value={filters.position}
                  onChange={(e) => setFilters({...filters, position: e.target.value})}
                  className="bg-white/10 border-rosegold/30 text-white placeholder:text-gray-400"
                />
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
                  placeholder="Search requests"
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
                  <div className="h-48 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : requests.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Search className="h-12 w-12 text-rosegold mx-auto mb-4" />
              <h3 className="text-xl font-polysans text-white mb-2">No Requests Found</h3>
              <p className="text-gray-400 font-poppins">
                No agent requests match your current filters.
              </p>
            </div>
          ) : (
            requests.map((request) => (
              <Card key={request.id} className="bg-white/5 border-rosegold/20 hover:border-rosegold/40 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-polysans font-bold text-white text-lg mb-2">
                        {request.title}
                      </h3>
                      <p className="text-gray-300 font-poppins text-sm line-clamp-3">
                        {request.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-rosegold border-rosegold">
                        {request.sport_type.toUpperCase()}
                      </Badge>
                      <Badge variant={request.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                        {request.transfer_type.toUpperCase()}
                      </Badge>
                    </div>

                    {request.position && (
                      <div className="flex items-center gap-2 text-sm text-gray-400">
                        <MapPin className="h-3 w-3" />
                        Position: {request.position}
                      </div>
                    )}

                    {(request.budget_min || request.budget_max) && (
                      <div className="flex items-center gap-2 text-sm text-bright-pink">
                        <DollarSign className="h-4 w-4" />
                        Budget: {request.budget_min && formatCurrency(request.budget_min, request.currency)} 
                        {request.budget_min && request.budget_max && ' - '}
                        {request.budget_max && formatCurrency(request.budget_max, request.currency)}
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 pt-2 border-t border-gray-700">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatTimeAgo(request.created_at)}
                      </div>
                      <span className="text-rosegold">
                        {request.agents?.agency_name}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                    >
                      <MessageSquare className="h-4 w-4 mr-1" />
                      Respond to Request
                    </Button>
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
