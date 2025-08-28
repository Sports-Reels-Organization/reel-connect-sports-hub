
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import TransferTimelineActions from './TransferTimelineActions';
import ContractWorkflow from '@/components/contracts/ContractWorkflow';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Search,
  Filter,
  MapPin,
  Calendar,
  DollarSign,
  User,
  Eye,
  FileText,
  Briefcase,
  Globe
} from 'lucide-react';
import { TransferPitch } from '@/types/tranfer';

const AgentTransferTimeline: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<TransferPitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    position: '',
    minPrice: '',
    maxPrice: '',
    transferType: '',
    citizenship: '',
    dealStage: ''
  });
  const [selectedContract, setSelectedContract] = useState<string | null>(null);

  useEffect(() => {
    fetchPitches();
  }, []);

  const fetchPitches = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('active_pitches_view')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.position) {
        query = query.ilike('player_position', `%${filters.position}%`);
      }
      if (filters.minPrice) {
        query = query.gte('asking_price', filters.minPrice);
      }
      if (filters.maxPrice) {
        query = query.lte('asking_price', filters.maxPrice);
      }
      if (filters.transferType) {
        query = query.eq('transfer_type', filters.transferType);
      }
      if (filters.citizenship) {
        query = query.ilike('player_citizenship', `%${filters.citizenship}%`);
      }
      if (filters.dealStage) {
        query = query.eq('deal_stage', filters.dealStage);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data to match TransferPitch interface
      const transformedPitches: TransferPitch[] = (data || []).map(pitch => ({
        id: pitch.id,
        player_id: pitch.player_id,
        team_id: pitch.team_id,
        description: pitch.description || '',
        asking_price: pitch.asking_price || 0,
        currency: pitch.currency || 'USD',
        transfer_type: pitch.transfer_type || 'permanent',
        status: pitch.status || 'active',
        created_at: pitch.created_at || '',
        expires_at: pitch.expires_at || '',
        tagged_videos: pitch.tagged_videos || [],
        sign_on_bonus: pitch.sign_on_bonus || 0,
        performance_bonus: pitch.performance_bonus || 0,
        player_salary: pitch.player_salary || 0,
        relocation_support: pitch.relocation_support || 0,
        loan_fee: pitch.loan_fee || 0,
        loan_with_option: pitch.loan_with_option || false,
        loan_with_obligation: pitch.loan_with_obligation || false,
        is_international: pitch.is_international || false,
        service_charge_rate: pitch.service_charge_rate || 0,
        deal_stage: pitch.deal_stage || 'active',
        contract_finalized: pitch.contract_finalized || false,
        contract_finalized_at: pitch.contract_finalized_at || null,
        players: {
          id: pitch.player_id || '',
          full_name: pitch.player_name || 'Unknown Player',
          position: pitch.player_position || '',
          citizenship: pitch.player_citizenship || '',
          headshot_url: '',
          photo_url: '',
          jersey_number: 0,
          age: 0,
          bio: '',
          market_value: pitch.player_market_value || 0,
          height: 0,
          weight: 0
        },
        teams: {
          team_name: pitch.team_name || 'Unknown Team',
          country: pitch.team_country || '',
          logo_url: '',
          member_association: pitch.member_association || ''
        }
      }));

      // Apply search filter
      const filteredPitches = searchTerm
        ? transformedPitches.filter(pitch =>
            pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : transformedPitches;

      setPitches(filteredPitches);
    } catch (error) {
      console.error('Error fetching pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    fetchPitches();
  };

  const clearFilters = () => {
    setFilters({
      position: '',
      minPrice: '',
      maxPrice: '',
      transferType: '',
      citizenship: '',
      dealStage: ''
    });
    setSearchTerm('');
    fetchPitches();
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'contract_negotiation': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white font-polysans">Transfer Timeline</h1>
          <p className="text-gray-400 font-poppins mt-1">
            Discover and analyze available players
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="border-gray-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="Search by player name, team, or position..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Select value={filters.position} onValueChange={(value) => handleFilterChange('position', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Position" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Positions</SelectItem>
                  <SelectItem value="goalkeeper">Goalkeeper</SelectItem>
                  <SelectItem value="defender">Defender</SelectItem>
                  <SelectItem value="midfielder">Midfielder</SelectItem>
                  <SelectItem value="forward">Forward</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Min Price"
                type="number"
                value={filters.minPrice}
                onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              />

              <Input
                placeholder="Max Price"
                type="number"
                value={filters.maxPrice}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              />

              <Select value={filters.transferType} onValueChange={(value) => handleFilterChange('transferType', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Transfer Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Types</SelectItem>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="loan">Loan</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Citizenship"
                value={filters.citizenship}
                onChange={(e) => handleFilterChange('citizenship', e.target.value)}
              />

              <Select value={filters.dealStage} onValueChange={(value) => handleFilterChange('dealStage', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Deal Stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Stages</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="contract_negotiation">In Contract</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={applyFilters}>
                <Filter className="w-4 h-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {pitches.length === 0 ? (
        <Card className="border-gray-700">
          <CardContent className="p-12 text-center">
            <Briefcase className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">No Transfer Pitches Found</h3>
            <p className="text-gray-400">
              Try adjusting your search criteria or check back later for new opportunities.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {pitches.map((pitch) => (
            <Card key={pitch.id} className="border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-rosegold/20 to-rosegold/5 rounded-full flex items-center justify-center">
                      <User className="w-8 h-8 text-rosegold" />
                    </div>
                    <div>
                      <CardTitle className="text-xl text-white">
                        {pitch.players.full_name}
                      </CardTitle>
                      <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Briefcase className="w-4 h-4" />
                          {pitch.players.position}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="w-4 h-4" />
                          {pitch.players.citizenship}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {pitch.teams.team_name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Badge className={getDealStageColor(pitch.deal_stage || 'active')}>
                    {pitch.deal_stage?.replace('_', ' ') || 'Active'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent>
                <div className="space-y-4">
                  {/* Description */}
                  {pitch.description && (
                    <p className="text-gray-300">{pitch.description}</p>
                  )}

                  {/* Financial Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-400">Transfer Fee</p>
                      <p className="text-white font-semibold">
                        {formatCurrency(pitch.asking_price, pitch.currency)}
                      </p>
                    </div>
                    {pitch.player_salary > 0 && (
                      <div>
                        <p className="text-xs text-gray-400">Monthly Salary</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(pitch.player_salary, pitch.currency)}
                        </p>
                      </div>
                    )}
                    {pitch.sign_on_bonus > 0 && (
                      <div>
                        <p className="text-xs text-gray-400">Sign-on Bonus</p>
                        <p className="text-white font-semibold">
                          {formatCurrency(pitch.sign_on_bonus, pitch.currency)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-gray-400">Transfer Type</p>
                      <p className="text-white font-semibold capitalize">
                        {pitch.transfer_type}
                      </p>
                    </div>
                  </div>

                  {/* Contract Info */}
                  {pitch.deal_stage === 'contract_negotiation' && (
                    <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-orange-600" />
                          <span className="font-medium text-orange-900">Contract in Progress</span>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedContract(pitch.id)}
                          className="border-orange-300 text-orange-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Workflow
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <TransferTimelineActions
                    pitch={pitch}
                    onAction={() => fetchPitches()}
                  />

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-sm text-gray-400 pt-4 border-t border-gray-700">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        Posted {new Date(pitch.created_at).toLocaleDateString()}
                      </span>
                      {pitch.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          Expires {new Date(pitch.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {pitch.is_international && (
                      <Badge variant="outline" className="border-blue-300 text-blue-600">
                        International
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Contract Workflow Dialog */}
      <Dialog open={!!selectedContract} onOpenChange={() => setSelectedContract(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Contract Workflow</DialogTitle>
          </DialogHeader>
          {selectedContract && (
            <ContractWorkflow
              contractId={selectedContract}
              onWorkflowUpdate={() => {
                fetchPitches();
                setSelectedContract(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AgentTransferTimeline;
