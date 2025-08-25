import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  MessageSquare, 
  Clock, 
  TrendingUp,
  Users,
  Target,
  Calendar
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { CreateAgentRequestModal } from './CreateAgentRequestModal';
import { TaggedPlayerCard } from './TaggedPlayerCard';
import { AgentExploreFilters } from './AgentExploreFilters';

interface AgentRequest {
  id: string;
  agent_id: string;
  title: string;
  description: string;
  position: string;
  sport_type: string;
  transfer_type: string;
  budget_min: number;
  budget_max: number;
  currency: string;
  passport_requirement: string;
  league_level: string;
  country: string;
  category: string;
  deal_stage: string;
  tagged_players: string[];
  is_public: boolean;
  expires_at: string;
  view_count: number;
  interaction_count: number;
  shortlist_count: number;
  created_at: string;
  agent_name?: string;
  agent_agency?: string;
}

interface AgentRequestsExploreProps {
  initialSearch?: string;
}

export const AgentRequestsExplore: React.FC<AgentRequestsExploreProps> = ({ initialSearch = '' }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [requests, setRequests] = useState<AgentRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<AgentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [sortBy, setSortBy] = useState('newest');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('all'); // 'all' | 'my-requests'
  const [activeFilters, setActiveFilters] = useState<any>({});
  const [agentId, setAgentId] = useState<string | null>(null);

  // Sport-specific data
  const sportPositions = {
    football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward', 'Striker', 'Winger'],
    basketball: ['Point Guard', 'Shooting Guard', 'Small Forward', 'Power Forward', 'Center'],
    tennis: ['Singles Player', 'Doubles Specialist'],
    volleyball: ['Setter', 'Outside Hitter', 'Middle Blocker', 'Opposite', 'Libero'],
    rugby: ['Prop', 'Hooker', 'Lock', 'Flanker', 'Number Eight', 'Scrum Half', 'Fly Half', 'Wing', 'Centre', 'Fullback']
  };

  const transferTypes = [
    { value: 'permanent', label: 'Permanent Transfer' },
    { value: 'loan', label: 'Loan' },
    { value: 'loan_with_option', label: 'Loan with Option' },
    { value: 'loan_with_obligation', label: 'Loan with Obligation' }
  ];

  const categories = [
    { value: 'youth', label: 'Youth' },
    { value: 'womens', label: "Women's" },
    { value: 'elite', label: 'Elite' },
    { value: 'academy', label: 'Academy' }
  ];

  const dealStages = [
    { value: 'open', label: 'Open' },
    { value: 'in_discussion', label: 'In Discussion' },
    { value: 'closed', label: 'Closed' }
  ];

  useEffect(() => {
    fetchAgentId();
  }, [profile]);

  useEffect(() => {
    fetchRequests();
  }, [agentId, viewMode]);

  useEffect(() => {
    filterAndSortRequests();
  }, [requests, searchQuery, sortBy, activeFilters]);

  const fetchAgentId = async () => {
    if (!profile?.user_type || profile.user_type !== 'agent') return;

    try {
      const { data } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      setAgentId(data?.id || null);
    } catch (error) {
      console.error('Error fetching agent ID:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      setLoading(true);

      // Use placeholder data since new tables might not be synchronized yet
      const placeholderRequests: AgentRequest[] = [
        {
          id: '1',
          agent_id: agentId || 'temp',
          title: 'Looking for EU Striker - Premier League Level',
          description: 'Seeking a young, talented striker with EU passport for a top-tier English club. Must have proven goal-scoring record.',
          position: 'Striker',
          sport_type: 'football',
          transfer_type: 'permanent',
          budget_min: 5000000,
          budget_max: 15000000,
          currency: 'EUR',
          passport_requirement: 'EU',
          league_level: 'Premier League',
          country: 'England',
          category: 'elite',
          deal_stage: 'open',
          tagged_players: [],
          is_public: true,
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          view_count: 156,
          interaction_count: 23,
          shortlist_count: 8,
          created_at: new Date().toISOString(),
          agent_name: 'John Smith',
          agent_agency: 'Elite Sports Agency'
        },
        {
          id: '2',
          agent_id: agentId || 'temp2',
          title: 'Loan Deal - Young Midfielder Development',
          description: 'Looking for a promising young midfielder for a 1-year loan with option to buy. Focus on development and playing time.',
          position: 'Midfielder',
          sport_type: 'football',
          transfer_type: 'loan',
          budget_min: 500000,
          budget_max: 2000000,
          currency: 'EUR',
          passport_requirement: 'Any',
          league_level: 'Championship',
          country: 'England',
          category: 'youth',
          deal_stage: 'open',
          tagged_players: [],
          is_public: true,
          expires_at: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
          view_count: 89,
          interaction_count: 12,
          shortlist_count: 4,
          created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          agent_name: 'Maria Garcia',
          agent_agency: 'Future Stars Agency'
        }
      ];

      setRequests(placeholderRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch agent requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortRequests = () => {
    let filtered = [...requests];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(request =>
        request.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.position?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        request.agent_agency?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply filters
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(request => {
          switch (key) {
            case 'position':
              return request.position?.toLowerCase().includes(String(value).toLowerCase());
            case 'transfer_type':
              return request.transfer_type === value;
            case 'category':
              return request.category === value;
            case 'deal_stage':
              return request.deal_stage === value;
            case 'budget_range':
              const [min, max] = String(value).split('-').map(Number);
              return request.budget_min >= min && request.budget_max <= max;
            default:
              return true;
          }
        });
      }
    });

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'expiring_soon':
          return new Date(a.expires_at).getTime() - new Date(b.expires_at).getTime();
        case 'most_interactions':
          return b.interaction_count - a.interaction_count;
        case 'most_shortlisted':
          return b.shortlist_count - a.shortlist_count;
        default:
          return 0;
      }
    });

    setFilteredRequests(filtered);
  };

  const handleCreateRequest = async () => {
    await fetchRequests();
    setShowCreateModal(false);
    toast({
      title: "Success",
      description: "Request posted successfully",
    });
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const hoursUntilExpiry = (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return hoursUntilExpiry <= 48;
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'open':
        return 'bg-green-500';
      case 'in_discussion':
        return 'bg-yellow-500';
      case 'closed':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search requests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={viewMode} onValueChange={setViewMode}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="my-requests">My Requests</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
              <SelectItem value="most_interactions">Most Interactions</SelectItem>
              <SelectItem value="most_shortlisted">Most Shortlisted</SelectItem>
            </SelectContent>
          </Select>

          <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Post Request
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <AgentExploreFilters
          activeFilters={activeFilters}
          onFiltersChange={setActiveFilters}
          sportPositions={sportPositions}
          transferTypes={transferTypes}
          categories={categories}
          dealStages={dealStages}
        />
      )}

      {/* Results */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">
              {requests.length === 0 ? 'No Requests Posted Yet' : 'No Requests Match Your Search'}
            </h3>
            <p className="text-muted-foreground mb-6">
              {requests.length === 0 
                ? 'Be the first to post a player request and start scouting.'
                : 'Try adjusting your search criteria or filters to find more requests.'
              }
            </p>
            {requests.length === 0 && (
              <Button onClick={() => setShowCreateModal(true)} className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Post Your First Request
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <Card key={request.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <CardTitle className="text-lg font-semibold">
                      {request.title}
                    </CardTitle>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{request.agent_name}</span>
                      <span>•</span>
                      <span>{request.agent_agency}</span>
                      <span>•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge 
                      className={`${getDealStageColor(request.deal_stage)} text-white`}
                    >
                      {request.deal_stage.replace('_', ' ').toUpperCase()}
                    </Badge>
                    
                    {isExpiringSoon(request.expires_at) && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Expires Soon
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Request Details */}
                <div className="flex flex-wrap gap-2">
                  {request.position && (
                    <Badge variant="outline">{request.position}</Badge>
                  )}
                  <Badge variant="secondary">{request.transfer_type.replace('_', ' ')}</Badge>
                  {request.category && (
                    <Badge variant="outline">{request.category}</Badge>
                  )}
                  {request.country && (
                    <Badge variant="outline">{request.country}</Badge>
                  )}
                </div>

                <p className="text-muted-foreground line-clamp-3">
                  {request.description}
                </p>

                {/* Budget Range */}
                {request.budget_min && request.budget_max && (
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span>Budget:</span>
                    <span className="text-primary">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: request.currency
                      }).format(request.budget_min)} - {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: request.currency
                      }).format(request.budget_max)}
                    </span>
                  </div>
                )}

                {/* Tagged Players */}
                {request.tagged_players && request.tagged_players.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Tagged Players ({request.tagged_players.length})
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {request.tagged_players.slice(0, 6).map((playerId) => (
                        <TaggedPlayerCard key={playerId} playerId={playerId} />
                      ))}
                    </div>
                  </div>
                )}

                {/* Engagement Stats */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {request.view_count} views
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {request.interaction_count} interactions
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4" />
                      {request.shortlist_count} shortlisted
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 inline mr-1" />
                    Expires {formatDistanceToNow(new Date(request.expires_at), { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Request Modal */}
      <CreateAgentRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleCreateRequest}
        sportPositions={sportPositions}
        transferTypes={transferTypes}
        categories={categories}
      />
    </div>
  );
};

export default AgentRequestsExplore;
