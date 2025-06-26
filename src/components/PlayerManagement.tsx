
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Plus, Users } from 'lucide-react';
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

  useEffect(() => {
    fetchTeamId();
  }, [profile]);

  useEffect(() => {
    if (teamId) {
      fetchPlayers();
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
    } catch (error) {
      console.error('Error fetching players:', error);
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

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
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

      {showAddForm && (
        <PlayerForm
          teamId={teamId}
          editingPlayer={editingPlayer}
          onPlayerSaved={handlePlayerSaved}
          onCancel={resetForm}
        />
      )}

      <div className="grid  grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {players.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            onEdit={handleEditPlayer}
            onView={handleViewPlayer}

          />
        ))}
      </div>

      {players.length === 0 && !showAddForm && (
        <Card className=" border-gray-700">
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
