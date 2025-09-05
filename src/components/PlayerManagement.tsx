
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Plus, Users, Target, AlertCircle, Video, BarChart3, Download,
  User, TrendingUp, Activity, Award, Heart, FileText, List, Upload, Trash2
} from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type DatabasePlayer = Tables['players']['Row'] & {
  age?: number;
  height?: number;
  weight?: number;
  contract_expires?: string;
  bio?: string;
  jersey_number?: number;
  place_of_birth?: string;
  foot?: string;
  fifa_id?: string;
  player_agent?: string;
  current_club?: string;
  joined_date?: string;
  gender?: string;
  headshot_url?: string;
  portrait_url?: string;
  full_body_url?: string;
  leagues_participated?: any[];
  titles_seasons?: any[];
  transfer_history?: any[];
  international_duty?: any[];
  match_stats?: any;
  ai_analysis?: any;
};
import PlayerCard from './PlayerCard';
import PlayerForm from './PlayerForm';
import PlayerDetailModal from './PlayerDetailModal';
import PlayerFilters from './PlayerFilters';
import PlayerRosterView from './PlayerRosterView';
import PlayerComparison from './PlayerComparison';
import BulkPlayerUpload from './BulkPlayerUpload';
import PlayerHistory from './PlayerHistory';

const PlayerManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<DatabasePlayer[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<DatabasePlayer | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<DatabasePlayer | null>(null);
  const [videoRequirements, setVideoRequirements] = useState<{ video_count: number } | null>(null);
  const [eligiblePlayers, setEligiblePlayers] = useState<DatabasePlayer[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'roster'>('cards');
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [teamSportType, setTeamSportType] = useState<string>('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState<DatabasePlayer | null>(null);
  const playerFormRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTeamId();
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchPlayers();
      fetchVideoRequirements();
    }
  }, [teamId]);

  useEffect(() => {
    console.log('🔄 PlayerManagement: Players updated, setting filtered players:', {
      totalPlayers: players.length,
      playerNames: players.map(p => p.full_name)
    });
    setFilteredPlayers(players);
  }, [players]);

  // Auto-scroll to player form when it becomes visible
  useEffect(() => {
    if (showAddForm && playerFormRef.current) {
      setTimeout(() => {
        playerFormRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 100); // Small delay to ensure the form is rendered
    }
  }, [showAddForm]);

  const fetchTeamId = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id, sport_type')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return;
      }

      if (data) {
        setTeamId(data.id);
        setTeamSportType(data.sport_type);
      }
    } catch (error) {
      console.error('Error fetching team:', error);
    }
  };

  const fetchPlayers = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamId)
        .order('full_name');

      if (error) {
        console.error('Error fetching players:', error);
        return;
      }

      setPlayers(data || []);

      // Filter eligible players for transfer pitches
      const eligible = (data || []).filter(player =>
        player.full_name &&
        player.position &&
        player.citizenship &&
        player.date_of_birth &&
        player.height &&
        player.weight &&
        player.bio &&
        player.market_value
      );

      setEligiblePlayers(eligible);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const fetchVideoRequirements = async () => {
    if (!teamId) return;

    try {
      const { data, error } = await supabase
        .from('video_requirements')
        .select('video_count')
        .eq('team_id', teamId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching video requirements:', error);
        return;
      }

      setVideoRequirements(data);
    } catch (error) {
      console.error('Error fetching video requirements:', error);
    }
  };

  const handleEditPlayer = (player: DatabasePlayer) => {
    setEditingPlayer(player);
    setShowAddForm(true);
  };

  const handleViewPlayer = (player: DatabasePlayer) => {
    setSelectedPlayer(player);
  };

  const resetForm = () => {
    setEditingPlayer(null);
    setShowAddForm(false);
  };

  const handlePlayerSaved = () => {
    fetchPlayers();
    resetForm();
  };

  const handleBulkUploadComplete = () => {
    fetchPlayers();
    setShowBulkUpload(false);
  };

  const handleBulkUploadClick = () => {
    setShowAddForm(false); // Close add player form
    setShowBulkUpload(true);
    // Smooth scroll to bulk upload section
    setTimeout(() => {
      const bulkUploadElement = document.getElementById('bulk-upload-section');
      if (bulkUploadElement) {
        bulkUploadElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleAddPlayerClick = () => {
    setShowBulkUpload(false); // Close bulk upload
    setShowAddForm(true);
    // Smooth scroll to add player form
    setTimeout(() => {
      if (playerFormRef.current) {
        playerFormRef.current.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  };

  const handleDeletePlayer = (player: DatabasePlayer) => {
    setPlayerToDelete(player);
    setShowDeleteConfirm(true);
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      console.log('Deleting player:', playerToDelete.full_name, 'ID:', playerToDelete.id);
      
      // Log activity before deletion
      const { PlayerActivityService } = await import('@/services/playerActivityService');
      const activityService = new PlayerActivityService(teamId);
      console.log('Logging player deletion activity...');
      await activityService.logPlayerDeleted(playerToDelete);
      console.log('Player deletion activity logged successfully');

      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerToDelete.id);

      if (error) throw error;

      console.log('Player deleted from database successfully');

      toast({
        title: "Player Deleted",
        description: `${playerToDelete.full_name} has been removed from the roster`,
      });

      fetchPlayers(); // Refresh the player list
      setShowDeleteConfirm(false);
      setPlayerToDelete(null);
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete player. Please try again.",
        variant: "destructive"
      });
    }
  };

  const cancelDeletePlayer = () => {
    setShowDeleteConfirm(false);
    setPlayerToDelete(null);
  };

  const handleExportPlayers = async (playersToExport: DatabasePlayer[]) => {
    try {
      // Create CSV content
      const headers = ['Name', 'Position', 'Age', 'Nationality', 'Height', 'Weight', 'Market Value', 'Contract Expiry'];
      const csvContent = [
        headers.join(','),
        ...playersToExport.map(player => [
          player.full_name || '',
          player.position || '',
          player.age || '',
          player.citizenship || '',
          player.height || '',
          player.weight || '',
          player.market_value || '',
          player.contract_expires ? new Date(player.contract_expires).toLocaleDateString() : ''
        ].join(','))
      ].join('\n');

      // Create and download file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `players_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      toast({
        title: "Export Successful",
        description: `Exported ${playersToExport.length} players to CSV`,
      });
    } catch (error) {
      console.error('Error exporting players:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export players",
        variant: "destructive"
      });
    }
  };

  const getPlayerCompletionStatus = (player: DatabasePlayer) => {
    const requiredFields = [
      'full_name', 'position', 'citizenship', 'date_of_birth',
      'height', 'weight', 'bio', 'market_value'
    ] as const;

    const completedFields = requiredFields.filter(field =>
      player[field] !== null && player[field] !== undefined && player[field] !== ''
    );

    return {
      completed: completedFields.length,
      total: requiredFields.length,
      isComplete: completedFields.length === requiredFields.length
    };
  };

  const canCreateTransferPitches = () => {
    const hasMinimumVideos = videoRequirements && videoRequirements.video_count >= 5;
    const hasEligiblePlayers = eligiblePlayers.length > 0;
    return hasMinimumVideos && hasEligiblePlayers;
  };

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-[3rem] space-y-6 max-w-7xl mx-auto bg-background min-h-screen">
      <div className="grid space-y-5">
        <div className='text-start'>
          <h1 className="font-polysans text-3xl font-bold text-white mb-2">
            Player Management
          </h1>
          <p className="text-gray-400 font-poppins">
            Manage your team's player roster with comprehensive profiles and advanced tools
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button
                variant="outline"
                className="text-white border-gray-600"
              >
                <Target className="w-4 h-4 mr-2" />
                Transfer Requirements
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle className="text-white font-polysans flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Transfer Timeline Readiness
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Video Requirements */}
                  <div className={`p-4 rounded-lg border ${videoRequirements && videoRequirements.video_count >= 5
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-red-500 bg-red-900/20'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Video className="h-5 w-5" />
                      <h3 className="font-polysans text-white">Team Videos</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Current:</span>
                        <span className="text-white">{videoRequirements?.video_count || 0}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Required:</span>
                        <span className="text-white">5</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${videoRequirements && videoRequirements.video_count >= 5
                            ? 'bg-green-500'
                            : 'bg-red-500'
                            }`}
                          style={{
                            width: `${Math.min((videoRequirements?.video_count || 0) / 5 * 100, 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Player Profiles */}
                  <div className={`p-4 rounded-lg border ${eligiblePlayers.length > 0
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-red-500 bg-red-900/20'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-5 w-5" />
                      <h3 className="font-polysans text-white">Complete Profiles</h3>
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Complete:</span>
                        <span className="text-white">{eligiblePlayers.length}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-white">{players.length}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${eligiblePlayers.length > 0 ? 'bg-green-500' : 'bg-red-500'
                            }`}
                          style={{
                            width: `${players.length > 0 ? (eligiblePlayers.length / players.length * 100) : 0}%`
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Overall Status */}
                  <div className={`p-4 rounded-lg border ${canCreateTransferPitches()
                    ? 'border-green-500 bg-green-900/20'
                    : 'border-yellow-500 bg-yellow-900/20'
                    }`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5" />
                      <h3 className="font-polysans text-white">Transfer Pitches</h3>
                    </div>
                    <div className="space-y-2">
                      <p className={`text-sm font-semibold ${canCreateTransferPitches() ? 'text-green-400' : 'text-yellow-400'
                        }`}>
                        {canCreateTransferPitches() ? 'Ready to Create' : 'Not Ready'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {canCreateTransferPitches()
                          ? 'You can now create transfer pitches for your players'
                          : 'Complete requirements to create transfer pitches'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {!canCreateTransferPitches() && (
                  <div className="bg-yellow-900/20 border border-yellow-700 p-4 rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-yellow-400 font-semibold text-sm mb-1">Requirements Not Met</p>
                        <ul className="text-yellow-300 text-sm space-y-1">
                          {(!videoRequirements || videoRequirements.video_count < 5) && (
                            <li>• Upload at least 5 team videos</li>
                          )}
                          {eligiblePlayers.length === 0 && (
                            <li>• Complete at least one player profile with all required fields</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button
            onClick={() => setShowComparison(true)}
            variant="outline"
            className="text-white border-gray-600"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Compare Players
          </Button>
          <Button
            onClick={handleBulkUploadClick}
            variant="outline"
            className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
          >
            <Download className="w-4 h-4 mr-2" />
            Bulk Upload
          </Button>
          <Button
            onClick={handleAddPlayerClick}
            className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Player
          </Button>
        </div>
      </div>

      {/* Tabs for Player Management Organization */}
      <Tabs defaultValue="roster" className="w-full">
        <TabsList className="grid w-full grid-cols-8 bg-gray-800">
          <TabsTrigger value="roster" className="text-white">
            <Users className="h-4 w-4 mr-1" />
            Roster & Squad
          </TabsTrigger>
          <TabsTrigger value="overview" className="text-white">
            <User className="h-4 w-4 mr-1" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="statistics" className="text-white">
            <Activity className="h-4 w-4 mr-1" />
            Statistics
          </TabsTrigger>
          <TabsTrigger value="videos" className="text-white">
            <Video className="h-4 w-4 mr-1" />
            Videos
          </TabsTrigger>
          <TabsTrigger value="awards" className="text-white">
            <Award className="h-4 w-4 mr-1" />
            Awards
          </TabsTrigger>
          <TabsTrigger value="medical" className="text-white">
            <Heart className="h-4 w-4 mr-1" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="notes" className="text-white">
            <FileText className="h-4 w-4 mr-1" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="history" className="text-white">
            <FileText className="h-4 w-4 mr-1" />
            History
          </TabsTrigger>
        </TabsList>

        {/* Roster & Squad Tab - Main roster management interface */}
        <TabsContent value="roster" className="space-y-4">
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Roster & Squad Management
              </CardTitle>
              <p className="text-gray-400 text-sm">
                Complete roster view with filtering, sorting, and quick actions for team admins
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Player Filters */}
              <PlayerFilters
                players={players}
                onFilteredPlayersChange={(filtered) => {
                  console.log('📥 PlayerManagement: Received filtered players:', {
                    filteredCount: filtered.length,
                    totalCount: players.length,
                    filteredNames: filtered.map(p => p.full_name)
                  });
                  setFilteredPlayers(filtered);
                }}
                onExportPlayers={handleExportPlayers}

              />

              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'outline'}
                  onClick={() => setViewMode('cards')}
                  className={viewMode === 'cards' ? 'bg-rosegold text-white' : 'text-white border-gray-600'}
                >
                  Card View
                </Button>
                <Button
                  variant={viewMode === 'roster' ? 'default' : 'outline'}
                  onClick={() => setViewMode('roster')}
                  className={viewMode === 'roster' ? 'bg-rosegold text-white' : 'text-white border-gray-600'}
                >
                  Table View
                </Button>
              </div>

              {showBulkUpload && (
                <div id="bulk-upload-section">
                  <BulkPlayerUpload
                    teamId={teamId}
                    sportType={teamSportType as any}
                    onUploadComplete={handleBulkUploadComplete}
                    onCancel={() => setShowBulkUpload(false)}
                  />
                </div>
              )}

              {showAddForm && (
                <div ref={playerFormRef}>
                  <PlayerForm
                    teamId={teamId}
                    player={editingPlayer}
                    onSave={handlePlayerSaved}
                    onCancel={resetForm}
                  />
                </div>
              )}

              {/* Player Display */}
              {viewMode === 'roster' ? (
                <PlayerRosterView
                  players={filteredPlayers}
                  onEditPlayer={handleEditPlayer}
                  onViewPlayer={handleViewPlayer}
                  onDeletePlayer={handleDeletePlayer}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                  {filteredPlayers.map((player) => {
                    const completionStatus = getPlayerCompletionStatus(player);
                    return (
                      <div key={player.id} className="relative">
                        <PlayerCard
                          player={player}
                          onEdit={handleEditPlayer}
                          onView={handleViewPlayer}
                          onDelete={handleDeletePlayer}
                        />
                        {/* Profile Completion Indicator */}
                        <div className="absolute top-2 right-2">
                          <div className={`w-3 h-3 rounded-full ${completionStatus.isComplete ? 'bg-green-500' : 'bg-yellow-500'
                            }`} title={`Profile ${completionStatus.completed}/${completionStatus.total} complete`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {filteredPlayers.length === 0 && !showAddForm && (
                <Card className="border-gray-700">
                  <CardContent className="p-12 text-center">
                    <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                    <h3 className="font-polysans text-xl font-semibold text-white mb-2">
                      {players.length === 0 ? 'No Players Added Yet' : 'No Players Match Your Filters'}
                    </h3>
                    <p className="text-gray-400 mb-6 font-poppins">
                      {players.length === 0
                        ? 'Start building your team by adding comprehensive player profiles'
                        : 'Try adjusting your filters to see more players'
                      }
                    </p>
                    {players.length === 0 && (
                      <Button
                        onClick={() => setShowAddForm(true)}
                        className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Player
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card className="border-0">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <User className="h-5 w-5" />
                Player Management Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-rosegold">{players.length}</p>
                  <p className="text-gray-400 text-sm">Total Players</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">{eligiblePlayers.length}</p>
                  <p className="text-gray-400 text-sm">Complete Profiles</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {players.filter(p => p.position).length}
                  </p>
                  <p className="text-gray-400 text-sm">Players with Positions</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statistics Tab */}
        <TabsContent value="statistics" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Team Statistics Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-rosegold">{players.length}</p>
                  <p className="text-gray-400 text-sm">Squad Size</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-green-400">
                    {players.reduce((acc, p) => acc + (p.market_value || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-gray-400 text-sm">Total Squad Value</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-blue-400">
                    {players.filter(p => p.age && p.age < 23).length}
                  </p>
                  <p className="text-gray-400 text-sm">Youth Players</p>
                </div>
                <div className="bg-gray-700 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-purple-400">
                    {players.filter(p => p.contract_expires && new Date(p.contract_expires) < new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)).length}
                  </p>
                  <p className="text-gray-400 text-sm">Expiring Contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Videos Tab */}
        <TabsContent value="videos" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Video className="h-5 w-5" />
                Player Videos Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Video className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Video management for individual players</p>
                <p className="text-gray-500 text-sm">Select a player to manage their videos</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Awards Tab */}
        <TabsContent value="awards" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Award className="h-5 w-5" />
                Team Awards & Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Award className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Track team and player achievements</p>
                <p className="text-gray-500 text-sm">Awards and honors will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Medical Tab */}
        <TabsContent value="medical" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <Heart className="h-5 w-5" />
                Medical & Fitness Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Heart className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Monitor player health and fitness</p>
                <p className="text-gray-500 text-sm">Medical records and fitness data will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Scouting Notes & Internal Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <FileText className="w-12 h-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400 mb-4">Internal team notes and scouting reports</p>
                <p className="text-gray-500 text-sm">Private notes and player evaluations will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4">
          <PlayerHistory teamId={teamId} />
        </TabsContent>
      </Tabs>

      {/* Player Comparison Modal */}
      <PlayerComparison
        players={players}
        isOpen={showComparison}
        onClose={() => setShowComparison(false)}
      />

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          onEdit={() => {
            setEditingPlayer(selectedPlayer);
            setSelectedPlayer(null);
            setShowAddForm(true);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="max-w-md bg-gray-800 border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-white font-polysans flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              Delete Player
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                Are you sure you want to delete this player?
              </h3>
              <p className="text-gray-300 mb-4">
                This will permanently delete <span className="font-semibold text-white">{playerToDelete?.full_name}</span> from your roster. 
                This action cannot be undone.
              </p>
              <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-3 mb-4">
                <p className="text-yellow-300 text-sm">
                  <strong>Note:</strong> Player activity history will be preserved for record keeping.
                </p>
              </div>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={cancelDeletePlayer}
                className="text-white border-gray-600 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDeletePlayer}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Player
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlayerManagement;
