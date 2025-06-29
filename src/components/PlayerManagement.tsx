
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users, Target, AlertCircle, Video } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';
import PlayerCard from './PlayerCard';
import PlayerForm from './PlayerForm';
import PlayerDetailModal from './PlayerDetailModal';

type DatabasePlayer = Tables<'players'>;

const PlayerManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<DatabasePlayer | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<DatabasePlayer | null>(null);
  const [videoRequirements, setVideoRequirements] = useState<{ video_count: number } | null>(null);
  const [eligiblePlayers, setEligiblePlayers] = useState<DatabasePlayer[]>([]);

  useEffect(() => {
    fetchTeamId();
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchPlayers();
      fetchVideoRequirements();
    }
  }, [teamId]);

  const fetchTeamId = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (error) {
        console.error('Error fetching team:', error);
        return;
      }

      if (data) {
        setTeamId(data.id);
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
      <div className="flex items-center justify-between">
        <div className='text-start'>
          <h1 className="font-polysans text-3xl font-bold text-white mb-2">
            Player Management
          </h1>
          <p className="text-gray-400 font-poppins">
            Manage your team's player roster with comprehensive profiles
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Player
        </Button>
      </div>

      {/* Transfer Pitch Requirements Status */}
      <Card className="border-gray-700 bg-gradient-to-r from-blue-900/20 to-purple-900/20">
        <CardHeader>
          <CardTitle className="text-white font-polysans flex items-center gap-2">
            <Target className="h-5 w-5" />
            Transfer Timeline Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
        </CardContent>
      </Card>

      {showAddForm && (
        <PlayerForm
          teamId={teamId}
          player={editingPlayer}
          onSave={handlePlayerSaved}
          onCancel={resetForm}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map((player) => {
          const completionStatus = getPlayerCompletionStatus(player);
          return (
            <div key={player.id} className="relative">
              <PlayerCard
                player={player}
                onEdit={handleEditPlayer}
                onView={handleViewPlayer}
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

      {players.length === 0 && !showAddForm && (
        <Card className="border-gray-700">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="font-polysans text-xl font-semibold text-white mb-2">
              No Players Added Yet
            </h3>
            <p className="text-gray-400 mb-6 font-poppins">
              Start building your team by adding comprehensive player profiles
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Player
            </Button>
          </CardContent>
        </Card>
      )}

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
    </div>
  );
};

export default PlayerManagement;
