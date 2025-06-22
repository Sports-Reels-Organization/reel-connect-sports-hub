
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  DollarSign, 
  Users, 
  Star,
  Target,
  MessageSquare,
  Heart,
  Share2,
  Eye,
  TrendingUp
} from 'lucide-react';
import InfoTooltip from '@/components/InfoTooltip';

interface Player {
  id: string;
  full_name: string;
  position: string;
  photo_url?: string;
  citizenship: string;
  market_value?: number;
}

interface TransferPitch {
  id: string;
  player: Player;
  team: {
    team_name: string;
    country: string;
    logo_url?: string;
  };
  transfer_type: 'loan' | 'permanent';
  asking_price?: number;
  currency: string;
  description?: string;
  expires_at: string;
}

interface AgentRequest {
  id: string;
  agent: {
    agency_name: string;
  };
  title: string;
  description: string;
  sport_type: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby';
  position?: string;
  budget_min?: number;
  budget_max?: number;
  currency: string;
  transfer_type: 'loan' | 'permanent';
  expires_at: string;
}

const Explore = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'players' | 'requests'>('players');
  const [searchTerm, setSearchTerm] = useState('');
  const [sportFilter, setSportFilter] = useState<string>('');
  const [transferTypeFilter, setTransferTypeFilter] = useState<string>('');
  const [transferPitches, setTransferPitches] = useState<TransferPitch[]>([]);
  const [agentRequests, setAgentRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // New request form for agents
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    sport_type: 'football' as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby',
    position: '',
    budget_min: '',
    budget_max: '',
    transfer_type: 'permanent' as 'loan' | 'permanent'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch transfer pitches
      const { data: pitches, error: pitchesError } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          player:players(*),
          team:teams(team_name, country, logo_url)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (pitchesError) throw pitchesError;

      // Fetch agent requests
      const { data: requests, error: requestsError } = await supabase
        .from('agent_requests')
        .select(`
          *,
          agent:agents(agency_name)
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString());

      if (requestsError) throw requestsError;

      setTransferPitches(pitches || []);
      setAgentRequests(requests || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer market data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async () => {
    if (!profile) return;

    try {
      // Get agent profile
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (agentError) throw agentError;

      const { error } = await supabase
        .from('agent_requests')
        .insert({
          agent_id: agent.id,
          title: newRequest.title,
          description: newRequest.description,
          sport_type: newRequest.sport_type,
          position: newRequest.position || null,
          budget_min: newRequest.budget_min ? parseFloat(newRequest.budget_min) : null,
          budget_max: newRequest.budget_max ? parseFloat(newRequest.budget_max) : null,
          transfer_type: newRequest.transfer_type
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your request has been published"
      });

      setShowRequestForm(false);
      setNewRequest({
        title: '',
        description: '',
        sport_type: 'football',
        position: '',
        budget_min: '',
        budget_max: '',
        transfer_type: 'permanent'
      });
      
      fetchData();
    } catch (error) {
      console.error('Error creating request:', error);
      toast({
        title: "Error",
        description: "Failed to create request",
        variant: "destructive"
      });
    }
  };

  const filteredPitches = transferPitches.filter(pitch => {
    const matchesSearch = pitch.player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pitch.player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         pitch.team.team_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSport = !sportFilter || true; // Assuming football for now
    const matchesTransferType = !transferTypeFilter || pitch.transfer_type === transferTypeFilter;
    
    return matchesSearch && matchesSport && matchesTransferType;
  });

  const filteredRequests = agentRequests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (request.position && request.position.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesSport = !sportFilter || request.sport_type === sportFilter;
    const matchesTransferType = !transferTypeFilter || request.transfer_type === transferTypeFilter;
    
    return matchesSearch && matchesSport && matchesTransferType;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-polysans text-3xl font-bold text-gray-900 mb-2">
          Transfer Market
        </h1>
        <p className="text-gray-600">
          Discover players available for transfer and agent requests
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b">
        <button
          onClick={() => setActiveTab('players')}
          className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
            activeTab === 'players'
              ? 'border-rosegold text-rosegold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4 inline mr-2" />
          Available Players ({filteredPitches.length})
        </button>
        <button
          onClick={() => setActiveTab('requests')}
          className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
            activeTab === 'requests'
              ? 'border-rosegold text-rosegold'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Target className="w-4 h-4 inline mr-2" />
          Agent Requests ({filteredRequests.length})
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-64">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder={activeTab === 'players' ? "Search players, positions, teams..." : "Search requests..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={sportFilter} onValueChange={setSportFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Sports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Sports</SelectItem>
            <SelectItem value="football">Football ⚽</SelectItem>
            <SelectItem value="basketball">Basketball 🏀</SelectItem>
            <SelectItem value="volleyball">Volleyball 🏐</SelectItem>
            <SelectItem value="tennis">Tennis 🎾</SelectItem>
            <SelectItem value="rugby">Rugby 🏈</SelectItem>
          </SelectContent>
        </Select>

        <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            <SelectItem value="permanent">Permanent</SelectItem>
            <SelectItem value="loan">Loan</SelectItem>
          </SelectContent>
        </Select>

        {profile?.user_type === 'agent' && activeTab === 'requests' && (
          <Button 
            onClick={() => setShowRequestForm(true)}
            className="bg-rosegold hover:bg-rosegold/90"
          >
            <Target className="w-4 h-4 mr-2" />
            Create Request
          </Button>
        )}
      </div>

      {/* Content */}
      {activeTab === 'players' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPitches.map((pitch) => (
            <Card key={pitch.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                      {pitch.player.photo_url ? (
                        <img 
                          src={pitch.player.photo_url} 
                          alt={pitch.player.full_name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <Users className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg font-polysans">
                        {pitch.player.full_name}
                      </CardTitle>
                      <p className="text-sm text-gray-600">{pitch.player.position}</p>
                    </div>
                  </div>
                  <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                    {pitch.transfer_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{pitch.player.citizenship}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>{pitch.team.team_name}, {pitch.team.country}</span>
                </div>

                {pitch.asking_price && (
                  <div className="flex items-center gap-2 text-sm font-medium text-rosegold">
                    <DollarSign className="w-4 h-4" />
                    <span>{pitch.asking_price.toLocaleString()} {pitch.currency}</span>
                  </div>
                )}

                {pitch.player.market_value && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <TrendingUp className="w-4 h-4" />
                    <span>Market Value: {pitch.player.market_value.toLocaleString()} USD</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Expires {new Date(pitch.expires_at).toLocaleDateString()}</span>
                </div>

                {pitch.description && (
                  <p className="text-sm text-gray-700 line-clamp-2">{pitch.description}</p>
                )}

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-rosegold hover:bg-rosegold/90">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Inquire
                  </Button>
                  <Button size="sm" variant="outline">
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="font-polysans">{request.title}</CardTitle>
                    <CardDescription>{request.agent.agency_name}</CardDescription>
                  </div>
                  <Badge variant={request.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                    {request.transfer_type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{request.sport_type}</Badge>
                  {request.position && <Badge variant="outline">{request.position}</Badge>}
                </div>

                {(request.budget_min || request.budget_max) && (
                  <div className="flex items-center gap-2 text-sm font-medium text-rosegold">
                    <DollarSign className="w-4 h-4" />
                    <span>
                      {request.budget_min && request.budget_max 
                        ? `${request.budget_min.toLocaleString()} - ${request.budget_max.toLocaleString()}`
                        : request.budget_min 
                        ? `From ${request.budget_min.toLocaleString()}`
                        : `Up to ${request.budget_max?.toLocaleString()}`
                      } {request.currency}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  <span>Expires {new Date(request.expires_at).toLocaleDateString()}</span>
                </div>

                <p className="text-sm text-gray-700">{request.description}</p>

                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-rosegold hover:bg-rosegold/90">
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Respond
                  </Button>
                  <Button size="sm" variant="outline">
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty States */}
      {activeTab === 'players' && filteredPitches.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No players found</h3>
          <p className="text-gray-500">Try adjusting your search filters</p>
        </div>
      )}

      {activeTab === 'requests' && filteredRequests.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No requests found</h3>
          <p className="text-gray-500">Try adjusting your search filters</p>
        </div>
      )}

      {/* Request Form Modal */}
      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle className="font-polysans">Create Transfer Request</CardTitle>
              <CardDescription>
                Describe what type of player you're looking for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Request Title</Label>
                <Input
                  id="title"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({...newRequest, title: e.target.value})}
                  placeholder="e.g., Looking for a striker for Premier League team"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Sport</Label>
                  <Select 
                    value={newRequest.sport_type} 
                    onValueChange={(value: 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby') => 
                      setNewRequest({...newRequest, sport_type: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="football">Football ⚽</SelectItem>
                      <SelectItem value="basketball">Basketball 🏀</SelectItem>
                      <SelectItem value="volleyball">Volleyball 🏐</SelectItem>
                      <SelectItem value="tennis">Tennis 🎾</SelectItem>
                      <SelectItem value="rugby">Rugby 🏈</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Transfer Type</Label>
                  <Select 
                    value={newRequest.transfer_type} 
                    onValueChange={(value: 'loan' | 'permanent') => 
                      setNewRequest({...newRequest, transfer_type: value})
                    }
                  >
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
                  placeholder="e.g., Striker, Midfielder, Goalkeeper"
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="budget_max">Max Budget (USD)</Label>
                  <Input
                    id="budget_max"
                    type="number"
                    value={newRequest.budget_max}
                    onChange={(e) => setNewRequest({...newRequest, budget_max: e.target.value})}
                    placeholder="500000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({...newRequest, description: e.target.value})}
                  placeholder="Describe the type of player you're looking for, specific requirements, playing style, etc."
                  rows={4}
                  maxLength={550}
                />
                <p className="text-xs text-gray-500">
                  {newRequest.description.length}/550 characters
                </p>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={handleCreateRequest}
                  disabled={!newRequest.title || !newRequest.description}
                  className="flex-1 bg-rosegold hover:bg-rosegold/90"
                >
                  Publish Request
                </Button>
                <Button 
                  onClick={() => setShowRequestForm(false)}
                  variant="outline"
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Explore;
