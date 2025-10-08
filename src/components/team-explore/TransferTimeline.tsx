import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import EditPitchModal from './EditPitchModal';
import ContractWizard from '@/components/contracts/ContractWizard';
import {
  Search, Filter, Heart, MessageSquare, Eye, Calendar, DollarSign,
  TrendingUp, MapPin, Users, Target, Star, Clock, AlertCircle, X, CheckCircle, Edit, FileText
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { EnhancedNotificationService } from '@/services/enhancedNotificationService';
import { usePlayerStatusRealtime } from '@/hooks/usePlayerStatusRealtime';

interface TimelinePitch {
  id: string;
  created_at: string;
  transfer_type: 'permanent' | 'loan';
  asking_price: number;
  currency: string;
  description: string;
  expires_at: string;
  status: string;
  view_count: number;
  teams: {
    id: string;
    team_name: string;
    logo_url?: string;
    country: string;
    sport_type?: string;
    profile_id: string;
  };
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    photo_url?: string;
    age?: number;
    market_value?: number;
  };
  agent_interest?: Array<{
    id: string;
    agent_id: string;
    status: 'interested' | 'requested' | 'negotiating';
    created_at: string;
    agent: {
      profile: {
        full_name: string;
        user_type: string;
      };
    };
  }>;
}

const TransferTimeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [pitches, setPitches] = useState<TimelinePitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSport, setSelectedSport] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPitchForEdit, setSelectedPitchForEdit] = useState<TimelinePitch | null>(null);

  // Real-time player status and interest management
  const { getStatusBadgeProps, incrementInterestCount, decrementInterestCount } = usePlayerStatusRealtime();

  const [showInterestModal, setShowInterestModal] = useState(false);
  const [selectedPitchForInterest, setSelectedPitchForInterest] = useState<TimelinePitch | null>(null);
  const [interestMessage, setInterestMessage] = useState('');
  const [interestType, setInterestType] = useState<'interested' | 'requested'>('interested');
  const [showContractWizard, setShowContractWizard] = useState(false);
  const [selectedPitchForContract, setSelectedPitchForContract] = useState<TimelinePitch | null>(null);

  useEffect(() => {
    fetchPitches();
  }, []);

  // Listen for immediate updates from agent actions
  useEffect(() => {
    if (!profile?.user_id || profile.user_type !== 'team') return;

    console.log('🎯 Setting up immediate team event listeners');

    // Listen for unified workflow updates
    const handleWorkflowUpdate = (event: CustomEvent) => {
      const { type, pitchId, playerName, agentName, teamProfileId } = event.detail;

      console.log('⚡ TEAM: Workflow update received:', type);

      if (type === 'agent_interest_expressed' && teamProfileId === profile.id) {
        // Update player status badge immediately
        incrementInterestCount(pitchId, '');

        // Immediate toast notification
        toast({
          title: "🎯 New Agent Interest!",
          description: `${agentName} has expressed interest in ${playerName}`,
          duration: 5000,
        });

        // Immediate refresh
        setTimeout(() => fetchPitches(), 500);

      } else if (type === 'agent_interest_cancelled') {
        // Update player status badge immediately
        decrementInterestCount(pitchId, '');

        // Immediate toast notification
        toast({
          title: "Interest Cancelled",
          description: `${agentName} has cancelled their interest`,
          duration: 4000,
        });

        // Immediate refresh
        setTimeout(() => fetchPitches(), 500);
      }
    };

    window.addEventListener('workflowUpdate', handleWorkflowUpdate as EventListener);

    return () => {
      console.log('🧹 TEAM: Cleaning up workflow event listeners');
      window.removeEventListener('workflowUpdate', handleWorkflowUpdate as EventListener);
    };
  }, [profile?.user_id, profile?.user_type, profile?.id, toast]);


  const fetchPitches = async () => {
    try {
      setLoading(true);

      // Simplified query to avoid foreign key relationship issues
      const { data: pitchesData, error: pitchesError } = await supabase
        .from('transfer_pitches')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (pitchesError) throw pitchesError;

      // Fetch team and player data separately to avoid relationship issues
      const enrichedPitches = await Promise.all(
        (pitchesData || []).map(async (pitch) => {
          // Fetch team data
          const { data: teamData } = await supabase
            .from('teams')
            .select('id, team_name, logo_url, country, sport_type, profile_id')
            .eq('id', pitch.team_id)
            .single();

          // Fetch player data
          const { data: playerData } = await supabase
            .from('players')
            .select('id, full_name, position, citizenship, photo_url, age, market_value')
            .eq('id', pitch.player_id)
            .single();

          // Fetch agent interest data (exclude withdrawn/rejected from timeline)
          const { data: interestData } = await supabase
            .from('agent_interest')
            .select('id, agent_id, status, created_at')
            .eq('pitch_id', pitch.id)
            .not('status', 'in', '(withdrawn,rejected)'); // Exclude withdrawn/rejected from timeline

          // Enrich agent interest with profile data
          const enrichedInterest = await Promise.all(
            (interestData || []).map(async (interest) => {
              const { data: agentData } = await supabase
                .from('agents')
                .select('profile_id')
                .eq('id', interest.agent_id)
                .single();

              if (agentData?.profile_id) {
                const { data: profileData } = await supabase
                  .from('profiles')
                  .select('full_name, user_type')
                  .eq('id', agentData.profile_id)
                  .single();

                return {
                  ...interest,
                  agent: {
                    profile: profileData
                  }
                };
              }
              return interest;
            })
          );

          return {
            ...pitch,
            teams: teamData || {},
            players: playerData || {},
            agent_interest: enrichedInterest
          };
        })
      );

      setPitches(enrichedPitches);
    } catch (error) {
      console.error('Error fetching pitches:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transfer pitches",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };


  const handleInterestInPitch = async (pitch: TimelinePitch) => {
    if (!profile?.id) {
      toast({
        title: "Error",
        description: "Please log in to express interest",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create agent interest record
      const { error: interestError } = await supabase
        .from('agent_interest')
        .insert({
          pitch_id: pitch.id,
          agent_id: profile.id,
          status: interestType,
          message: interestMessage,
          created_at: new Date().toISOString()
        });

      if (interestError) throw interestError;

      // Create initial message
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          sender_id: profile.id,
          receiver_id: pitch.teams.profile_id,
          pitch_id: pitch.id,
          content: interestMessage || `I'm interested in ${pitch.players.full_name}`,
          message_type: 'interest', // Reverted back to 'interest' since it's now valid
          created_at: new Date().toISOString()
        });

      if (messageError) throw messageError;

      toast({
        title: "Success!",
        description: "Interest expressed successfully. The team will be notified.",
      });

      setShowInterestModal(false);
      setSelectedPitchForInterest(null);
      setInterestMessage('');
      fetchPitches(); // Refresh to show new interest
    } catch (error: any) {
      console.error('Error expressing interest:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to express interest",
        variant: "destructive"
      });
    }
  };

  const handleEditPitch = (pitch: TimelinePitch) => {
    setSelectedPitchForEdit(pitch);
    setShowEditModal(true);
  };

  const handleDeletePitch = async (pitchId: string) => {
    try {
      // Check for related records
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id')
        .eq('pitch_id', pitchId)
        .eq('status', 'active');

      const { data: messages } = await supabase
        .from('messages')
        .select('id')
        .eq('pitch_id', pitchId);

      if (contracts && contracts.length > 0) {
        toast({
          title: "Cannot Delete",
          description: "This pitch has active contracts and cannot be deleted.",
          variant: "destructive"
        });
        return;
      }

      if (messages && messages.length > 0) {
        // Update pitch status to cancelled instead of deleting
        const { error } = await supabase
          .from('transfer_pitches')
          .update({ status: 'cancelled' })
          .eq('id', pitchId);

        if (error) throw error;

        toast({
          title: "Pitch Cancelled",
          description: "Pitch has been cancelled due to existing communications.",
        });
      } else {
        // Full delete if no related records
        const { error } = await supabase
          .from('transfer_pitches')
          .delete()
          .eq('id', pitchId);

        if (error) throw error;

        toast({
          title: "Success!",
          description: "Pitch deleted successfully",
        });
      }

      fetchPitches();
    } catch (error: any) {
      console.error('Error deleting pitch:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete pitch",
        variant: "destructive"
      });
    }
  };

  const canEditPitch = (pitch: TimelinePitch) => {
    return profile?.user_type === 'team' && profile?.id === pitch.teams.profile_id;
  };

  const canExpressInterest = (pitch: TimelinePitch) => {
    // For testing: allow any agent to express interest
    // In production: you might want to restrict this based on business rules
    return profile?.user_type === 'agent';
  };

  const hasExpressedInterest = (pitch: TimelinePitch) => {
    return pitch.agent_interest?.some(interest => interest.agent_id === profile?.id);
  };

  const handleGenerateContract = (pitch: TimelinePitch) => {
    setSelectedPitchForContract(pitch);
    setShowContractWizard(true);
  };

  const handleContractComplete = (contractId: string) => {
    setShowContractWizard(false);
    setSelectedPitchForContract(null);

    toast({
      title: "Contract Created",
      description: "Contract has been generated successfully!"
    });

    // Refresh the timeline to show updated status
    fetchPitches();
  };

  const filteredPitches = pitches.filter(pitch => {
    const matchesSearch = pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pitch.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSport = selectedSport === 'all' || !selectedSport || pitch.teams.sport_type === selectedSport;
    const matchesTeam = selectedTeam === 'all' || !selectedTeam || pitch.teams.id === selectedTeam;

    return matchesSearch && matchesSport && matchesTeam;
  });

  const availableTeams = Array.from(new Set(pitches.map(pitch => pitch.teams.id)));
  const availableSports = Array.from(new Set(pitches.map(pitch => pitch.teams.sport_type).filter(Boolean)));

  const processedPitches = filteredPitches.filter(pitch =>
    pitch.teams && pitch.players
  );

  return (
    <div className="space-y-6">


      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">Transfer Timeline</h2>
          <p className="text-gray-400">Browse available transfer opportunities</p>
        </div>

      </div>

      {/* Filters */}
      <Card className="border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or descriptions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-600 bg-gray-800 text-white"
              />
            </div>

            <Select value={selectedSport} onValueChange={setSelectedSport}>
              <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                <SelectValue placeholder="All Sports" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white">All Sports</SelectItem>
                {availableSports.map(sport => (
                  <SelectItem key={sport} value={sport} className="text-white">
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all" className="text-white">All Teams</SelectItem>
                {availableTeams.map(teamId => {
                  const team = pitches.find(p => p.teams.id === teamId)?.teams;
                  return teamId && teamId !== '' ? (
                    <SelectItem key={teamId} value={teamId} className="text-white">
                      {team?.team_name || 'Unknown Team'}
                    </SelectItem>
                  ) : null;
                })}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedSport('all');
                setSelectedTeam('all');
              }}
              className="border-gray-600 text-white"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pitches Grid */}
      {loading ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 mx-auto mb-4 text-gray-500 animate-spin" />
          <p className="text-gray-400">Loading transfer pitches...</p>
        </div>
      ) : processedPitches.length === 0 ? (
        <Card className="border-0">
          <CardContent className="p-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold text-white mb-2">
              No pitches found
            </h3>
            <p className="text-gray-400">
              {searchTerm || (selectedSport !== 'all') || (selectedTeam !== 'all')
                ? 'Try adjusting your filters'
                : 'No transfer pitches available at the moment.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {processedPitches.map((pitch) => (
            <Card key={pitch.id} className="border-0 hover:border-rosegold/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {pitch.players.photo_url && (
                      <img
                        src={pitch.players.photo_url}
                        alt={pitch.players.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold text-white">{pitch.players.full_name}</h3>
                      <p className="text-sm text-gray-400">{pitch.players.position}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={pitch.transfer_type === 'permanent' ? 'default' : 'secondary'}>
                      {pitch.transfer_type}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {pitch.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Team Info */}
                <div className="flex items-center gap-3">
                  {pitch.teams.logo_url && (
                    <img
                      src={pitch.teams.logo_url}
                      alt={pitch.teams.team_name}
                      className="w-8 h-8 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-white">{pitch.teams.team_name}</p>
                    <p className="text-sm text-gray-400">{pitch.teams.country}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-400" />
                  <span className="text-white font-semibold">
                    {pitch.asking_price.toLocaleString()} {pitch.currency}
                  </span>
                </div>

                {/* Description */}
                <p className="text-gray-300 text-sm line-clamp-3">
                  {pitch.description}
                </p>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {pitch.view_count} views
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-4 h-4" />
                    {pitch.agent_interest?.length || 0} interests
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDistanceToNow(new Date(pitch.expires_at), { addSuffix: true })}
                  </div>
                </div>

                {/* Agent Interest Display */}
                {pitch.agent_interest && pitch.agent_interest.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-400">Interested Agents:</p>
                    {pitch.agent_interest.slice(0, 3).map((interest) => (
                      <div key={interest.id} className="flex items-center gap-2 text-sm">
                        <Users className="w-4 h-4 text-blue-400" />
                        <span className="text-white">
                          {interest.agent?.profile?.full_name || `Agent #${interest.agent_id.slice(0, 8)}`}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {interest.status}
                        </Badge>
                      </div>
                    ))}
                    {pitch.agent_interest.length > 3 && (
                      <p className="text-xs text-gray-500">
                        +{pitch.agent_interest.length - 3} more
                      </p>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  {canExpressInterest(pitch) && (
                    <Button
                      onClick={() => {
                        setSelectedPitchForInterest(pitch);
                        setShowInterestModal(true);
                      }}
                      variant="outline"
                      className="flex-1 border-gray-600 text-white hover:border-rosegold"
                      disabled={hasExpressedInterest(pitch)}
                    >
                      {hasExpressedInterest(pitch) ? (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                          Interest Expressed
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4 mr-2" />
                          Express Interest
                        </>
                      )}
                    </Button>
                  )}


                  {canEditPitch(pitch) && (
                    <>
                      <Button
                        onClick={() => handleEditPitch(pitch)}
                        variant="outline"
                        size="sm"
                        className="border-gray-600 text-white"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeletePitch(pitch.id)}
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Pitch Modal */}
      {showEditModal && selectedPitchForEdit && (
        <EditPitchModal
          pitch={selectedPitchForEdit}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPitchForEdit(null);
          }}
          onPitchUpdated={() => {
            fetchPitches();
            setShowEditModal(false);
            setSelectedPitchForEdit(null);
          }}
        />
      )}

      {/* Interest Modal */}
      {showInterestModal && selectedPitchForInterest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-semibold text-white mb-4">
              Express Interest in {selectedPitchForInterest.players.full_name}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Interest Type
                </label>
                <Select value={interestType} onValueChange={(value: 'interested' | 'requested') => setInterestType(value)}>
                  <SelectTrigger className="border-gray-600 bg-gray-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-600">
                    <SelectItem value="interested" className="text-white">Interested</SelectItem>
                    <SelectItem value="requested" className="text-white">Request More Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium text-white mb-2 block">
                  Message (Optional)
                </label>
                <Textarea
                  placeholder="Tell the team why you're interested..."
                  value={interestMessage}
                  onChange={(e) => setInterestMessage(e.target.value)}
                  className="border-gray-600 bg-gray-800 text-white min-h-[100px]"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                onClick={() => handleInterestInPitch(selectedPitchForInterest)}
                className="bg-rosegold hover:bg-rosegold/90 text-white flex-1"
              >
                <Heart className="w-4 h-4 mr-2" />
                Express Interest
              </Button>
              <Button
                onClick={() => {
                  setShowInterestModal(false);
                  setSelectedPitchForInterest(null);
                  setInterestMessage('');
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

      {/* Contract Wizard Modal */}
      {showContractWizard && selectedPitchForContract && (
        <Dialog open={showContractWizard} onOpenChange={setShowContractWizard}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <ContractWizard
              pitchId={selectedPitchForContract.id}
              onComplete={handleContractComplete}
              onCancel={() => {
                setShowContractWizard(false);
                setSelectedPitchForContract(null);
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default TransferTimeline;
