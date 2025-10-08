import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Send, Clock, CheckCircle, AlertCircle, DollarSign,
  TrendingUp, User, Building2, Calendar, Target, ArrowRight, Plus, MessageSquare, Search, Filter
} from 'lucide-react';
import { Eye } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface SimplifiedContractWorkflowProps {
  pitchId?: string;
  contractId?: string;
}

interface Contract {
  id: string;
  pitch_id: string;
  team_id: string;
  agent_id: string;
  status: 'draft' | 'sent' | 'under_review' | 'negotiating' | 'finalizing' | 'completed';
  deal_stage: string;
  contract_value: number;
  currency: string;
  terms: string;
  created_at: string;
  updated_at: string;
  pitch: {
    players: {
      full_name: string;
      position: string;
      photo_url?: string;
    };
    teams: {
      team_name: string;
      logo_url?: string;
    };
    asking_price: number;
    currency: string;
  };
  team: {
    team_name: string;
    logo_url?: string;
  };
  agent: {
    profile: {
      full_name: string;
    };
  };
}

const contractStages = [
  { key: 'draft', label: 'Draft', description: 'Contract is being prepared', color: 'bg-gray-500' },
  { key: 'sent', label: 'Sent', description: 'Contract sent to counterparty', color: 'bg-blue-500' },
  { key: 'under_review', label: 'Under Review', description: 'Counterparty reviewing terms', color: 'bg-yellow-500' },
  { key: 'negotiating', label: 'Negotiating', description: 'Terms being negotiated', color: 'bg-purple-500' },
  { key: 'finalizing', label: 'Finalizing', description: 'Final terms agreed', color: 'bg-indigo-500' },
  { key: 'completed', label: 'Completed', description: 'Contract signed and active', color: 'bg-green-500' }
];

const SimplifiedContractWorkflow: React.FC<SimplifiedContractWorkflowProps> = ({
  pitchId,
  contractId
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);

  // Expanded contract state
  const [expandedContract, setExpandedContract] = useState<string | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalContracts, setTotalContracts] = useState(0);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination helpers
  const totalPages = Math.ceil(totalContracts / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalContracts);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedContract(null); // Close any expanded contract when changing pages
  };

  useEffect(() => {
    if (pitchId) {
      fetchContractsByPitch();
    } else if (contractId) {
      fetchContractById();
    } else {
      fetchAllContracts(currentPage);
    }
  }, [pitchId, contractId, currentPage, statusFilter, sortBy, sortOrder]);

  // Separate effect for search to avoid too many API calls
  useEffect(() => {
    if (!pitchId && !contractId) {
      const timeoutId = setTimeout(() => {
        fetchAllContracts(currentPage);
      }, 300); // Debounce search

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery]);


  // Helper function to enrich contract data with related information
  const enrichContractData = async (contracts: any[]) => {
    if (!contracts || contracts.length === 0) return [];

    return Promise.all(
      contracts.map(async (contract) => {
        const [pitchData, agentData, teamData] = await Promise.all([
          // Get pitch data
          contract.pitch_id ? supabase
            .from('transfer_pitches')
            .select(`
              id,
              asking_price,
              currency,
              player_id,
              team_id
            `)
            .eq('id', contract.pitch_id)
            .single() : Promise.resolve({ data: null, error: null }),

          // Get agent data
          contract.agent_id ? supabase
            .from('agents')
            .select(`
              id,
              profile_id
            `)
            .eq('id', contract.agent_id)
            .single() : Promise.resolve({ data: null, error: null }),

          // Get team data
          contract.team_id ? supabase
            .from('teams')
            .select(`
              id,
              team_name,
              logo_url
            `)
            .eq('id', contract.team_id)
            .single() : Promise.resolve({ data: null, error: null })
        ]);

        // Get player data if pitch has a player
        let playerData = null;
        if (pitchData.data?.player_id) {
          const { data: player } = await supabase
            .from('players')
            .select(`
              id,
              full_name,
              position,
              photo_url
            `)
            .eq('id', pitchData.data.player_id)
            .single();
          playerData = player;
        }

        // Get pitch team data
        let pitchTeamData = null;
        if (pitchData.data?.team_id) {
          const { data: pitchTeam } = await supabase
            .from('teams')
            .select(`
              id,
              team_name,
              logo_url
            `)
            .eq('id', pitchData.data.team_id)
            .single();
          pitchTeamData = pitchTeam;
        }

        // Get agent profile data if agent exists
        let agentProfileData = null;
        if (agentData.data?.profile_id) {
          const { data: agentProfile } = await supabase
            .from('profiles')
            .select(`
              id,
              full_name
            `)
            .eq('id', agentData.data.profile_id)
            .single();
          agentProfileData = agentProfile;
        }

        // Combine all data
        return {
          ...contract,
          pitch: pitchData.data ? {
            ...pitchData.data,
            players: playerData,
            teams: pitchTeamData
          } : null,
          agent: agentData.data ? {
            ...agentData.data,
            profile: agentProfileData
          } : null,
          team: teamData.data
        };
      })
    );
  };

  const fetchContractsByPitch = async () => {
    if (!pitchId) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('pitch_id', pitchId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedContracts = await enrichContractData(data || []);
      setContracts(enrichedContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to validate UUID format
  const isValidUUID = (uuid: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const fetchContractById = async () => {
    if (!contractId) return;

    // Validate UUID format before querying
    if (!isValidUUID(contractId)) {
      console.warn('Invalid contract ID format:', contractId);
      setContracts([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('id', contractId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        const enrichedContracts = await enrichContractData([data]);
        setContracts(enrichedContracts);
      } else {
        // No contract found with this ID
        setContracts([]);
        console.log('No contract found with ID:', contractId);
      }
    } catch (error) {
      console.error('Error fetching contract:', error);
      setContracts([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllContracts = async (page = 1) => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let baseQuery = supabase
        .from('contracts')
        .select('*', { count: 'exact' });

      // Filter by user role - need to get the actual team/agent ID first
      if (profile.user_type === 'team') {
        const { data: team } = await supabase
          .from('teams')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (team) {
          baseQuery = baseQuery.eq('team_id', team.id);
        } else {
          setContracts([]);
          setTotalContracts(0);
          return;
        }
      } else if (profile.user_type === 'agent') {
        const { data: agent } = await supabase
          .from('agents')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (agent) {
          baseQuery = baseQuery.eq('agent_id', agent.id);
        } else {
          setContracts([]);
          setTotalContracts(0);
          return;
        }
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        baseQuery = baseQuery.eq('status', statusFilter);
      }

      // Apply sorting
      const ascending = sortOrder === 'asc';
      if (sortBy === 'created_at') {
        baseQuery = baseQuery.order('created_at', { ascending });
      } else if (sortBy === 'contract_value') {
        baseQuery = baseQuery.order('contract_value', { ascending });
      } else if (sortBy === 'status') {
        baseQuery = baseQuery.order('status', { ascending });
      } else {
        baseQuery = baseQuery.order('created_at', { ascending: false });
      }

      // Get total count
      const { count } = await baseQuery;
      setTotalContracts(count || 0);

      // Get paginated data
      const { data, error } = await baseQuery.range(from, to);
      if (error) throw error;

      const enrichedContracts = await enrichContractData(data || []);

      // Apply client-side search filtering
      let filteredContracts = enrichedContracts;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        filteredContracts = enrichedContracts.filter(contract =>
          contract.pitch?.players?.full_name?.toLowerCase().includes(query) ||
          contract.team?.team_name?.toLowerCase().includes(query) ||
          contract.id.toLowerCase().includes(query) ||
          contract.pitch?.teams?.team_name?.toLowerCase().includes(query)
        );
      }

      setContracts(filteredContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch contracts',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };


  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      // Map status to appropriate deal_stage
      const getDealStage = (status: string): string => {
        switch (status) {
          case 'draft': return 'draft';
          case 'sent': return 'negotiating';
          case 'under_review': return 'under_review';
          case 'negotiating': return 'negotiating';
          case 'finalizing': return 'under_review';
          case 'completed': return 'signed';
          default: return 'draft';
        }
      };

      const { error } = await supabase
        .from('contracts')
        .update({
          status: newStatus,
          deal_stage: getDealStage(newStatus),
          updated_at: new Date().toISOString()
        })
        .eq('id', contractId);

      if (error) throw error;

      toast({
        title: "Status updated!",
        description: `Contract moved to ${newStatus} stage`,
      });

      // Refresh contracts
      if (pitchId) {
        fetchContractsByPitch();
      } else {
        fetchAllContracts();
      }
    } catch (error: any) {
      console.error('Error updating contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update contract",
        variant: "destructive"
      });
    }
  };

  const getCurrentStageIndex = (status: string) => {
    return contractStages.findIndex(stage => stage.key === status);
  };

  const canAdvanceStage = (currentStatus: string) => {
    const currentIndex = getCurrentStageIndex(currentStatus);
    return currentIndex < contractStages.length - 1;
  };

  const getNextStage = (currentStatus: string) => {
    const currentIndex = getCurrentStageIndex(currentStatus);
    if (currentIndex < contractStages.length - 1) {
      return contractStages[currentIndex + 1];
    }
    return null;
  };

  if (loading) {
    return (
      <div className="text-center py-16">
        <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-gray-500 animate-spin" />
        </div>
        <h3 className="text-xl  text-white mb-2">Loading Contracts</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl flex items-center gap-2">
                <FileText className="w-6 h-6" />
                Contract Workflow
              </CardTitle>
              <p className="text-gray-400">
                {pitchId ? 'Manage contracts for this pitch' : 'Track all your contracts and negotiations'}
              </p>
            </div>

          </div>
        </CardHeader>

        {/* Search and Filter Controls */}
        <div className="px-6 py-4 border-b border-gray-600 bg-gray-800/30">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Box */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search contracts by player name, team, or contract ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 border-gray-600 bg-gray-800 text-white placeholder-gray-400"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32 border-gray-600 bg-gray-800 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="all" className="text-white">All Status</SelectItem>
                  <SelectItem value="draft" className="text-white">Draft</SelectItem>
                  <SelectItem value="sent" className="text-white">Sent</SelectItem>
                  <SelectItem value="under_review" className="text-white">Under Review</SelectItem>
                  <SelectItem value="negotiating" className="text-white">Negotiating</SelectItem>
                  <SelectItem value="finalizing" className="text-white">Finalizing</SelectItem>
                  <SelectItem value="completed" className="text-white">Completed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-32 border-gray-600 bg-gray-800 text-white">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  <SelectItem value="created_at" className="text-white">Date Created</SelectItem>
                  <SelectItem value="contract_value" className="text-white">Contract Value</SelectItem>
                  <SelectItem value="status" className="text-white">Status</SelectItem>
                  <SelectItem value="player_name" className="text-white">Player Name</SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
                variant="outline"
                size="sm"
                className="border-gray-600 text-white hover:bg-gray-700"
              >
                <TrendingUp className={`w-4 h-4 ${sortOrder === 'desc' ? 'rotate-180' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-white mb-3">
                No Contracts Found
              </h3>
              <p className="text-gray-400 mb-6 max-w-md mx-auto text-lg">
                {pitchId
                  ? 'No contracts have been created for this pitch yet.'
                  : 'Start creating contracts to manage your transfer negotiations.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <Card key={contract.id} className="border-gray-600 overflow-hidden">
                  {/* Compact View */}
                  <div className="p-4 bg-[#111111]">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-base font-semibold text-white">
                            Contract #{contract.id.slice(0, 8)}
                          </h3>
                          <Badge
                            variant="outline"
                            className={`text-xs px-2 py-0.5 ${contract.status === 'completed' ? 'border-green-500 text-green-400' :
                              contract.status === 'negotiating' ? 'border-yellow-500 text-yellow-400' :
                                contract.status === 'draft' ? 'border-gray-500 text-gray-400' :
                                  'border-blue-500 text-blue-400'
                              }`}
                          >
                            {contract.status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                              {(contract.pitch?.players as any)?.photo_url ? (
                                <img
                                  src={(contract.pitch.players as any).photo_url}
                                  alt={contract.pitch.players.full_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <User className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">Player</p>
                              <p className="text-white text-sm font-medium">
                                {contract.pitch?.players?.full_name || 'Unknown Player'}
                              </p>
                              <p className="text-gray-500 text-xs">
                                {contract.pitch?.players?.position || 'Unknown Position'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden">
                              {(contract.team as any)?.logo_url ? (
                                <img
                                  src={(contract.team as any).logo_url}
                                  alt={contract.team.team_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building2 className="w-4 h-4 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-gray-400 text-xs mb-0.5">Team</p>
                              <p className="text-white text-xs">
                                {contract.team?.team_name || 'Unknown Team'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1.5">
                            <DollarSign className="w-3 h-3 text-green-400" />
                            <span className="text-xs text-gray-300">
                              {contract.contract_value ? contract.contract_value.toLocaleString() : '0'} {contract.currency || 'USD'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3 text-purple-400" />
                            <span className="text-xs text-gray-300">
                              {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 ml-3">
                        <Button
                          onClick={() => setExpandedContract(expandedContract === contract.id ? null : contract.id)}
                          variant="outline"
                          size="sm"
                          className="border-gray-600 text-white hover:bg-gray-700 transition-colors text-xs px-2 py-1"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          {expandedContract === contract.id ? 'Hide' : 'View'}
                        </Button>
                        <Button
                          onClick={() => navigate(`/contract-negotiation/${contract.id}`)}
                          variant="outline"
                          size="sm"
                          className="text-white bg-primary transition-colors text-xs px-2 py-1"
                        >
                          <MessageSquare className="w-3 h-3 mr-1" />
                          Negotiate
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${expandedContract === contract.id ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                    <div className="border-t border-gray-600 p-6 bg-gray-800/50">

                      {/* Contract Details */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="text-center p-3 bg-gray-800 rounded-lg">
                          <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
                          <p className="text-sm text-gray-400">Contract Value</p>
                          <p className="text-lg font-bold text-white">
                            {contract.contract_value ? contract.contract_value.toLocaleString() : '0'} {contract.currency || 'USD'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded-lg">
                          <Target className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                          <p className="text-sm text-gray-400">Asking Price</p>
                          <p className="text-lg font-bold text-white">
                            {contract.pitch?.asking_price ? contract.pitch.asking_price.toLocaleString() : '0'} {contract.pitch?.currency || 'USD'}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-gray-800 rounded-lg">
                          <Calendar className="w-6 h-6 mx-auto mb-2 text-purple-400" />
                          <p className="text-sm text-gray-400">Created</p>
                          <p className="text-sm text-white">
                            {formatDistanceToNow(new Date(contract.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>

                      {/* Workflow Progress */}
                      <div className="mb-6">
                        <h4 className="text-sm font-medium text-white mb-3">Contract Progress</h4>
                        <div className="flex items-center justify-between">
                          {contractStages.map((stage, index) => {
                            const isCompleted = index <= getCurrentStageIndex(contract.status);
                            const isCurrent = index === getCurrentStageIndex(contract.status);

                            return (
                              <div key={stage.key} className="flex flex-col items-center flex-1">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${isCompleted ? stage.color : 'bg-gray-600'
                                  }`}>
                                  {isCompleted ? (
                                    <CheckCircle className="w-5 h-5 text-white" />
                                  ) : (
                                    <span className="text-white text-sm">{index + 1}</span>
                                  )}
                                </div>
                                <div className="text-center">
                                  <p className={`text-xs font-medium ${isCurrent ? 'text-white' : 'text-gray-400'
                                    }`}>
                                    {stage.label}
                                  </p>
                                  <p className="text-xs text-gray-500 hidden md:block">
                                    {stage.description}
                                  </p>
                                </div>
                                {index < contractStages.length - 1 && (
                                  <ArrowRight className={`w-4 h-4 mt-4 ${isCompleted ? 'text-green-400' : 'text-gray-600'
                                    }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Terms */}
                      {contract.terms && (
                        <div className="mb-6">
                          <h4 className="text-sm font-medium text-white mb-2">Contract Terms</h4>
                          <div className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg">
                            {typeof contract.terms === 'string' ? (
                              <p>{contract.terms}</p>
                            ) : typeof contract.terms === 'object' ? (
                              <div className="space-y-2">
                                {Object.entries(contract.terms)
                                  .filter(([key, value]) => {
                                    // Filter out signature-related fields
                                    const signatureFields = ['signatureData', 'signature_data', 'agent_signature_data', 'signatures'];
                                    return !signatureFields.includes(key.toLowerCase()) &&
                                      !key.toLowerCase().includes('signature') &&
                                      !String(value).startsWith('data:image');
                                  })
                                  .map(([key, value]) => (
                                    <div key={key} className="flex justify-between">
                                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                      <span className="font-medium">
                                        {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                      </span>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <p>{String(contract.terms)}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2">
                        {canAdvanceStage(contract.status) && (
                          <Button
                            onClick={() => updateContractStatus(contract.id, getNextStage(contract.status)?.key || '')}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Advance to {getNextStage(contract.status)?.label}
                          </Button>
                        )}

                        <Button
                          onClick={() => navigate(`/contract-negotiation/${contract.id}`)}
                          variant="outline"
                          className="border-gray-600 text-white hover:bg-gray-700"
                        >
                          <MessageSquare className="w-4 h-4 mr-2" />
                          View Negotiation
                        </Button>

                        <Button variant="outline" className="border-gray-600 text-white">
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {totalContracts > itemsPerPage && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-400">
                Showing {startIndex} to {endIndex} of {totalContracts} contracts
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Previous
                </Button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <Button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        className={`w-8 h-8 p-0 ${currentPage === pageNum
                          ? "bg-blue-600 hover:bg-blue-700 text-white"
                          : "border-gray-600 text-white hover:bg-gray-700"
                          }`}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  className="border-gray-600 text-white hover:bg-gray-700 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default SimplifiedContractWorkflow;
