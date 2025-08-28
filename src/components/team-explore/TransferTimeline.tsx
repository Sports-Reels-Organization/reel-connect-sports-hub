import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { 
  Clock, MessageCircle, Eye, AlertCircle, TrendingUp, 
  Search, Filter, Grid3X3, List, Edit, XCircle, Play,
  Building2, User, MapPin, Calendar, DollarSign, Trash2
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { useSportData } from '@/hooks/useSportData';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import ContractWizard from '@/components/contracts/ContractWizard';

interface TimelinePitch {
  id: string;
  asking_price: number;
  currency: string;
  transfer_type: string;
  deal_stage: string;
  expires_at: string;
  created_at: string;
  view_count: number;
  message_count: number;
  shortlist_count: number;
  is_international: boolean;
  description: string;
  tagged_videos: any[];
  team_id: string;
  players: {
    id: string;
    full_name: string;
    position: string;
    citizenship: string;
    photo_url?: string;
    age?: number;
    market_value?: number;
  };
  teams: {
    id: string;
    team_name: string;
    logo_url?: string;
    country: string;
    sport_type?: string;
  };
}

const TransferTimeline = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [pitches, setPitches] = useState<TimelinePitch[]>([]);
  const [filteredPitches, setFilteredPitches] = useState<TimelinePitch[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const [teamSportType, setTeamSportType] = useState<'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby'>('football');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pitchToDelete, setPitchToDelete] = useState<TimelinePitch | null>(null);
  
  // Contract Wizard State
  const [showContractWizard, setShowContractWizard] = useState(false);
  const [selectedPitchForContract, setSelectedPitchForContract] = useState<TimelinePitch | null>(null);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [transferTypeFilter, setTransferTypeFilter] = useState('all');
  const [priceRangeFilter, setPriceRangeFilter] = useState('all');
  const [dealStageFilter, setDealStageFilter] = useState('all');
  const [teamFilter, setTeamFilter] = useState('all');

  // Get sport-specific data
  const { positions } = useSportData(teamSportType);
  const transferTypes = ['permanent', 'loan'];
  const dealStages = ['pitch', 'interest', 'discussion', 'expired'];
  const priceRanges = [
    { label: 'Under $100K', value: '0-100000' },
    { label: '$100K - $500K', value: '100000-500000' },
    { label: '$500K - $1M', value: '500000-1000000' },
    { label: '$1M - $5M', value: '1000000-5000000' },
    { label: 'Over $5M', value: '5000000-999999999' }
  ];

  // Get unique teams for filtering
  const [availableTeams, setAvailableTeams] = useState<string[]>([]);

  useEffect(() => {
    fetchTeamSportType();
  }, [profile]);

  useEffect(() => {
    if (teamSportType) {
      fetchTimelinePitches();
    }
  }, [teamSportType]);

  useEffect(() => {
    applyFilters();
  }, [pitches, searchTerm, positionFilter, transferTypeFilter, priceRangeFilter, dealStageFilter, teamFilter]);

  const fetchTeamSportType = async () => {
    if (!profile?.id) return;
    
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('sport_type')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching team sport type:', error);
        return;
      }

      if (data?.sport_type) {
        const sportType = data.sport_type as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby';
        setTeamSportType(sportType);
      }
    } catch (error) {
      console.error('Error fetching team sport type:', error);
    }
  };

  const fetchTimelinePitches = async () => {
    try {
      const { data, error } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            photo_url,
            date_of_birth,
            market_value
          ),
          teams!inner(
            id,
            team_name,
            logo_url,
            country,
            sport_type
          )
        `)
        .eq('status', 'active')
        .eq('teams.sport_type', teamSportType)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      // Process data to add age calculation and ensure proper typing
      const processedPitches: TimelinePitch[] = (data || []).map(pitch => ({
        ...pitch,
        tagged_videos: Array.isArray(pitch.tagged_videos) ? pitch.tagged_videos : [],
        players: {
          ...pitch.players,
          age: pitch.players.date_of_birth ? 
            new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear() : undefined
        }
      }));
      
      setPitches(processedPitches);

      // Extract unique teams for filtering
      const teams = [...new Set(processedPitches.map(p => p.teams.team_name))].sort();
      setAvailableTeams(teams);
      
    } catch (error) {
      console.error('Error fetching timeline pitches:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer timeline",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...pitches];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(pitch =>
        pitch.players.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.teams.team_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pitch.players.position.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Position filter
    if (positionFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.players.position === positionFilter);
    }

    // Transfer type filter
    if (transferTypeFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.transfer_type === transferTypeFilter);
    }

    // Deal stage filter
    if (dealStageFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.deal_stage === dealStageFilter);
    }

    // Team filter
    if (teamFilter !== 'all') {
      filtered = filtered.filter(pitch => pitch.teams.team_name === teamFilter);
    }

    // Price range filter
    if (priceRangeFilter !== 'all') {
      const [min, max] = priceRangeFilter.split('-').map(Number);
      filtered = filtered.filter(pitch => {
        const price = pitch.asking_price || 0;
        return price >= min && price <= max;
      });
    }

    setFilteredPitches(filtered);
  };

  const getDealStageColor = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'bg-blue-500';
      case 'interest': return 'bg-yellow-500';
      case 'discussion': return 'bg-green-500';
      case 'expired': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getDealStageText = (stage: string) => {
    switch (stage) {
      case 'pitch': return 'New Pitch';
      case 'interest': return 'Interest Shown';
      case 'discussion': return 'In Discussion';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  const isExpiringSoon = (expiresAt: string) => {
    const expiryDate = new Date(expiresAt);
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    return expiryDate <= sevenDaysFromNow;
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleViewDetails = (pitch: TimelinePitch) => {
    navigate(`/player-profile/${pitch.players.id}`, { 
      state: { 
        pitchId: pitch.id,
        fromTransferTimeline: true 
      }
    });
  };

  const handleEditPitch = (pitch: TimelinePitch) => {
    navigate(`/edit-pitch/${pitch.id}`);
  };

  const handleDeletePitchDialog = (pitch: TimelinePitch) => {
    setPitchToDelete(pitch);
    setDeleteDialogOpen(true);
  };

  const handleDeletePitch = async () => {
    if (!pitchToDelete) return;

    try {
      const { error } = await supabase
        .from('transfer_pitches')
        .update({ status: 'cancelled' })
        .eq('id', pitchToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transfer pitch deleted successfully",
      });

      // Refresh the list
      fetchTimelinePitches();
      setDeleteDialogOpen(false);
      setPitchToDelete(null);
    } catch (error) {
      console.error('Error deleting pitch:', error);
      toast({
        title: "Error",
        description: "Failed to delete transfer pitch",
        variant: "destructive"
      });
    }
  };

  const canEditPitch = (pitch: TimelinePitch) => {
    return profile?.user_type === 'team' && profile?.id === pitch.teams.id;
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
    fetchTimelinePitches();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-24 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <Card className="border-0">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <CardTitle className="flex items-center gap-2 text-white">
                <TrendingUp className="w-5 h-5" />
                Transfer Timeline ({filteredPitches.length})
              </CardTitle>
              {filteredPitches.length > 0 && (
                <Badge variant="outline" className="text-rosegold border-rosegold">
                  {teamSportType.charAt(0).toUpperCase() + teamSportType.slice(1)}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'card' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('card')}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search players or teams..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 text-white placeholder:text-gray-500"
              />
            </div>
            
            <Select value={positionFilter} onValueChange={setPositionFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Positions" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Positions</SelectItem>
                {positions.map(position => (
                  <SelectItem key={position} value={position}>
                    {position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={teamFilter} onValueChange={setTeamFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Teams" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Teams</SelectItem>
                {availableTeams.map(team => (
                  <SelectItem key={team} value={team}>
                    {team}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={transferTypeFilter} onValueChange={setTransferTypeFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Types</SelectItem>
                {transferTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={dealStageFilter} onValueChange={setDealStageFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Stages</SelectItem>
                {dealStages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {getDealStageText(stage)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={priceRangeFilter} onValueChange={setPriceRangeFilter}>
              <SelectTrigger className="text-white">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="all">All Prices</SelectItem>
                {priceRanges.map(range => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setPositionFilter('all');
                setTransferTypeFilter('all');
                setPriceRangeFilter('all');
                setDealStageFilter('all');
                setTeamFilter('all');
              }}
              className="text-white border-gray-600 hover:bg-gray-700"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>

          {/* Results */}
          {filteredPitches.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {pitches.length === 0 ? 'No Active Pitches' : 'No Results Found'}
              </h3>
              <p className="text-gray-400">
                {pitches.length === 0 
                  ? `No transfer pitches are currently active for ${teamSportType}.`
                  : 'Try adjusting your filters to see more results.'
                }
              </p>
            </div>
          ) : (
            <div className={viewMode === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
              {filteredPitches.map((pitch) => (
                <Card 
                  key={pitch.id} 
                  className={`border-gray-600 transition-all duration-200 hover:border-rosegold/50 hover:shadow-lg ${
                    isExpiringSoon(pitch.expires_at) ? 'border-red-500 border-2' : ''
                  } ${viewMode === 'list' ? 'w-full' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Player and Team Info */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          {pitch.players.photo_url ? (
                            <img
                              src={pitch.players.photo_url}
                              alt={pitch.players.full_name}
                              className="w-12 h-12 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-gray-700 flex items-center justify-center">
                              <User className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                          <div>
                            <h3 className="font-semibold text-white">
                              {pitch.players.full_name}
                            </h3>
                            <p className="text-sm text-gray-400">
                              {pitch.players.position} • {pitch.players.citizenship}
                              {pitch.players.age && ` • ${pitch.players.age} years`}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              {pitch.teams.logo_url && (
                                <img
                                  src={pitch.teams.logo_url}
                                  alt={pitch.teams.team_name}
                                  className="w-4 h-4 rounded-sm object-contain"
                                />
                              )}
                              <p className="text-xs text-gray-500">
                                {pitch.teams.team_name} • {pitch.teams.country}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-rosegold">
                            {formatCurrency(pitch.asking_price, pitch.currency)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {pitch.transfer_type.toUpperCase()}
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      {pitch.description && (
                        <p className="text-sm text-gray-300 line-clamp-2">
                          {pitch.description}
                        </p>
                      )}

                      {/* Tags and Status */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge
                            variant="outline"
                            className={`${getDealStageColor(pitch.deal_stage)} text-white border-none`}
                          >
                            {getDealStageText(pitch.deal_stage)}
                          </Badge>
                          {pitch.is_international && (
                            <Badge variant="outline" className="text-blue-400 border-blue-400">
                              International
                            </Badge>
                          )}
                          {pitch.tagged_videos && pitch.tagged_videos.length > 0 && (
                            <Badge variant="outline" className="text-green-400 border-green-400">
                              <Play className="w-3 h-4 mr-1" />
                              {pitch.tagged_videos.length} Videos
                            </Badge>
                          )}
                          {isExpiringSoon(pitch.expires_at) && (
                            <Badge variant="outline" className="text-red-400 border-red-400 animate-pulse">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Expiring Soon
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          Expires {formatDistanceToNow(new Date(pitch.expires_at), { addSuffix: true })}
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {pitch.view_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {pitch.message_count}
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-4 h-4" />
                          {pitch.shortlist_count} shortlisted
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-gray-600 text-gray-300 hover:bg-gray-700 flex-1"
                          onClick={() => handleViewDetails(pitch)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-rosegold text-rosegold hover:bg-rosegold/10"
                          onClick={() => handleGenerateContract(pitch)}
                        >
                          <DollarSign className="w-4 h-4 mr-2" />
                          Generate Contract
                        </Button>
                        
                        {canEditPitch(pitch) && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              onClick={() => handleEditPitch(pitch)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600/10"
                              onClick={() => handleDeletePitchDialog(pitch)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Transfer Pitch</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this transfer pitch for {pitchToDelete?.players.full_name}? 
              This action cannot be undone and will remove the pitch from the timeline.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeletePitch}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Contract Wizard */}
      {showContractWizard && selectedPitchForContract && (
        <ContractWizard
          pitchId={selectedPitchForContract.id}
          onComplete={handleContractComplete}
          onCancel={() => {
            setShowContractWizard(false);
            setSelectedPitchForContract(null);
          }}
        />
      )}
    </div>
  );
};

export default TransferTimeline;
