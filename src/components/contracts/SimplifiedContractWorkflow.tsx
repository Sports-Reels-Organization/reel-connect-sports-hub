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
  TrendingUp, User, Building2, Calendar, Target, ArrowRight, Plus, MessageSquare
} from 'lucide-react';
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
    };
    teams: {
      team_name: string;
    };
    asking_price: number;
    currency: string;
  };
  team: {
    team_name: string;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPitch, setSelectedPitch] = useState<any>(null);
  const [availablePitches, setAvailablePitches] = useState<any[]>([]);

  // Contract creation form state
  const [contractForm, setContractForm] = useState({
    contractValue: '',
    currency: 'USD',
    terms: '',
    dealStage: 'draft'
  });

  useEffect(() => {
    if (pitchId) {
      fetchContractsByPitch();
    } else if (contractId) {
      fetchContractById();
    } else {
      fetchAllContracts();
    }
    fetchAvailablePitches();
  }, [pitchId, contractId]);

  const fetchAvailablePitches = async () => {
    if (!profile?.id) return;

    try {
      let query = supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(full_name, position),
          teams!inner(team_name, profile_id)
        `)
        .eq('status', 'active');

      // If user is a team, show their pitches
      if (profile.user_type === 'team') {
        query = query.eq('teams.profile_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAvailablePitches(data || []);
    } catch (error) {
      console.error('Error fetching pitches:', error);
    }
  };

  const fetchContractsByPitch = async () => {
    if (!pitchId) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          pitch:transfer_pitches!contracts_pitch_id_fkey(
            players!inner(full_name, position),
            teams!inner(team_name),
            asking_price,
            currency
          ),
          team:teams!contracts_team_id_fkey(team_name),
          agent:profiles!contracts_agent_id_fkey(full_name)
        `)
        .eq('pitch_id', pitchId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchContractById = async () => {
    if (!contractId) return;

    try {
      const { data, error } = await supabase
        .from('contracts')
        .select(`
          *,
          pitch:transfer_pitches!contracts_pitch_id_fkey(
            players!inner(full_name, position),
            teams!inner(team_name),
            asking_price,
            currency
          ),
          team:teams!contracts_team_id_fkey(team_name),
          agent:agents!contracts_agent_id_fkey(
            profile:profiles(full_name)
          )
        `)
        .eq('id', contractId)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) throw error;
      
      if (data) {
        setContracts([data]);
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

  const fetchAllContracts = async () => {
    if (!profile?.id) return;

    try {
      let query = supabase
        .from('contracts')
        .select(`
          *,
          pitch:transfer_pitches!contracts_pitch_id_fkey(
            players!inner(full_name, position),
            teams!inner(team_name),
            asking_price,
            currency
          ),
          team:teams!contracts_team_id_fkey(team_name),
          agent:agents!contracts_agent_id_fkey(
            profile:profiles(full_name)
          )
        `)
        .order('created_at', { ascending: false });

      // Filter by user role
      if (profile.user_type === 'team') {
        query = query.eq('team_id', profile.id);
      } else if (profile.user_type === 'agent') {
        query = query.eq('agent_id', profile.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const createContract = async () => {
    if (!selectedPitch || !profile?.id) return;

    try {
      const contractData = {
        pitch_id: selectedPitch.id,
        team_id: selectedPitch.teams.id,
        agent_id: profile.user_type === 'agent' ? profile.id : null,
        status: contractForm.dealStage as any,
        deal_stage: contractForm.dealStage,
        contract_value: parseFloat(contractForm.contractValue),
        currency: contractForm.currency,
        terms: contractForm.terms,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('contracts')
        .insert(contractData);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Contract created successfully",
      });

      setShowCreateModal(false);
      setSelectedPitch(null);
      setContractForm({
        contractValue: '',
        currency: 'USD',
        terms: '',
        dealStage: 'draft'
      });

      // Refresh contracts
      if (pitchId) {
        fetchContractsByPitch();
      } else {
        fetchAllContracts();
      }
    } catch (error: any) {
      console.error('Error creating contract:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create contract",
        variant: "destructive"
      });
    }
  };

  const updateContractStatus = async (contractId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          status: newStatus, 
          deal_stage: newStatus,
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
      <div className="text-center py-12">
        <Clock className="w-12 h-12 mx-auto mb-4 text-gray-500 animate-spin" />
        <p className="text-gray-400">Loading contracts...</p>
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
            
            {profile?.user_type === 'team' && (
              <Button
                onClick={() => setShowCreateModal(true)}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Contract
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {contracts.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                No contracts found
              </h3>
              <p className="text-gray-400">
                {pitchId 
                  ? 'No contracts have been created for this pitch yet.'
                  : 'Start creating contracts to manage your transfer negotiations.'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {contracts.map((contract) => (
                <Card key={contract.id} className="border-gray-600">
                  <CardContent className="p-6">
                    {/* Contract Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">
                          Contract #{contract.id.slice(0, 8)}
                        </h3>
                        <p className="text-gray-400">
                          {contract.pitch.players.full_name} ({contract.pitch.players.position})
                        </p>
                        <p className="text-sm text-gray-500">
                          {contract.pitch.teams.team_name} • {contract.team.team_name}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {contract.status}
                      </Badge>
                    </div>

                    {/* Contract Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-800 rounded-lg">
                        <DollarSign className="w-6 h-6 mx-auto mb-2 text-green-400" />
                        <p className="text-sm text-gray-400">Contract Value</p>
                        <p className="text-lg font-bold text-white">
                          {contract.contract_value.toLocaleString()} {contract.currency}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-gray-800 rounded-lg">
                        <Target className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                        <p className="text-sm text-gray-400">Asking Price</p>
                        <p className="text-lg font-bold text-white">
                          {contract.pitch.asking_price.toLocaleString()} {contract.pitch.currency}
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
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 ${
                                isCompleted ? stage.color : 'bg-gray-600'
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle className="w-5 h-5 text-white" />
                                ) : (
                                  <span className="text-white text-sm">{index + 1}</span>
                                )}
                              </div>
                              <div className="text-center">
                                <p className={`text-xs font-medium ${
                                  isCurrent ? 'text-white' : 'text-gray-400'
                                }`}>
                                  {stage.label}
                                </p>
                                <p className="text-xs text-gray-500 hidden md:block">
                                  {stage.description}
                                </p>
                              </div>
                              {index < contractStages.length - 1 && (
                                <ArrowRight className={`w-4 h-4 mt-4 ${
                                  isCompleted ? 'text-green-400' : 'text-gray-600'
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
                        <p className="text-gray-300 text-sm bg-gray-800 p-3 rounded-lg">
                          {contract.terms}
                        </p>
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
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contract Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Contract</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Select Pitch
                </label>
                <Select onValueChange={(value) => {
                  const pitch = availablePitches.find(p => p.id === value);
                  setSelectedPitch(pitch);
                }}>
                  <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                    <SelectValue placeholder="Choose a pitch" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    {availablePitches.map(pitch => (
                      <SelectItem key={pitch.id} value={pitch.id} className="text-white">
                        {pitch.players.full_name} - {pitch.teams.team_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Contract Value
                </label>
                <Input
                  type="number"
                  placeholder="Enter contract value"
                  value={contractForm.contractValue}
                  onChange={(e) => setContractForm(prev => ({ ...prev, contractValue: e.target.value }))}
                  className="border-gray-600 bg-gray-800 text-white"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Currency
                </label>
                <Select value={contractForm.currency} onValueChange={(value) => setContractForm(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="USD" className="text-white">USD</SelectItem>
                    <SelectItem value="EUR" className="text-white">EUR</SelectItem>
                    <SelectItem value="GBP" className="text-white">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Terms (Optional)
                </label>
                <Textarea
                  placeholder="Enter contract terms..."
                  value={contractForm.terms}
                  onChange={(e) => setContractForm(prev => ({ ...prev, terms: e.target.value }))}
                  className="border-gray-600 bg-gray-800 text-white min-h-[100px]"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                onClick={createContract}
                disabled={!selectedPitch || !contractForm.contractValue}
                className="bg-rosegold hover:bg-rosegold/90 text-white flex-1"
              >
                <FileText className="w-4 h-4 mr-2" />
                Create Contract
              </Button>
              <Button
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedPitch(null);
                  setContractForm({
                    contractValue: '',
                    currency: 'USD',
                    terms: '',
                    dealStage: 'draft'
                  });
                }}
                variant="outline"
                className="border-gray-600 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedContractWorkflow;
