
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Users, Edit, Trash2, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import InfoTooltip from '@/components/InfoTooltip';

interface Player {
  id: string;
  full_name: string;
  photo_url?: string;
  gender: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  position: string;
  jersey_number?: number;
  citizenship: string;
  fifa_id?: string;
  bio?: string;
  market_value?: number;
  created_at: string;
}

const Players = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [teamInfo, setTeamInfo] = useState<any>(null);

  // Player form state
  const [playerForm, setPlayerForm] = useState({
    full_name: '',
    gender: '',
    date_of_birth: '',
    height: '',
    weight: '',
    position: '',
    jersey_number: '',
    citizenship: '',
    fifa_id: '',
    bio: ''
  });

  useEffect(() => {
    if (profile?.user_type === 'team') {
      fetchTeamAndPlayers();
    }
  }, [profile]);

  const fetchTeamAndPlayers = async () => {
    try {
      // First get team info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('profile_id', profile!.id)
        .single();

      if (teamError) throw teamError;
      setTeamInfo(teamData);

      // Then get players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamData.id)
        .order('jersey_number', { ascending: true, nullsLast: true });

      if (playersError) throw playersError;
      setPlayers(playersData || []);
    } catch (error) {
      console.error('Error fetching team and players:', error);
      toast({
        title: "Error",
        description: "Failed to load team data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlayer = async () => {
    if (!teamInfo) return;

    try {
      const playerData = {
        team_id: teamInfo.id,
        full_name: playerForm.full_name,
        gender: playerForm.gender,
        date_of_birth: playerForm.date_of_birth || null,
        height: playerForm.height ? parseInt(playerForm.height) : null,
        weight: playerForm.weight ? parseInt(playerForm.weight) : null,
        position: playerForm.position,
        jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
        citizenship: playerForm.citizenship,
        fifa_id: playerForm.fifa_id || null,
        bio: playerForm.bio || null
      };

      const { error } = await supabase
        .from('players')
        .insert(playerData);

      if (error) throw error;

      toast({
        title: "Player Added",
        description: `${playerForm.full_name} has been added to your team`,
      });

      resetForm();
      setIsDialogOpen(false);
      fetchTeamAndPlayers();
    } catch (error) {
      console.error('Error creating player:', error);
      toast({
        title: "Error",
        description: "Failed to add player",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePlayer = async () => {
    if (!editingPlayer) return;

    try {
      const playerData = {
        full_name: playerForm.full_name,
        gender: playerForm.gender,
        date_of_birth: playerForm.date_of_birth || null,
        height: playerForm.height ? parseInt(playerForm.height) : null,
        weight: playerForm.weight ? parseInt(playerForm.weight) : null,
        position: playerForm.position,
        jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
        citizenship: playerForm.citizenship,
        fifa_id: playerForm.fifa_id || null,
        bio: playerForm.bio || null
      };

      const { error } = await supabase
        .from('players')
        .update(playerData)
        .eq('id', editingPlayer.id);

      if (error) throw error;

      toast({
        title: "Player Updated",
        description: `${playerForm.full_name}'s profile has been updated`,
      });

      resetForm();
      setIsDialogOpen(false);
      setEditingPlayer(null);
      fetchTeamAndPlayers();
    } catch (error) {
      console.error('Error updating player:', error);
      toast({
        title: "Error",
        description: "Failed to update player",
        variant: "destructive"
      });
    }
  };

  const handleDeletePlayer = async (playerId: string, playerName: string) => {
    if (!confirm(`Are you sure you want to remove ${playerName} from your team?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', playerId);

      if (error) throw error;

      toast({
        title: "Player Removed",
        description: `${playerName} has been removed from your team`,
      });

      fetchTeamAndPlayers();
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: "Error",
        description: "Failed to remove player",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setPlayerForm({
      full_name: '',
      gender: '',
      date_of_birth: '',
      height: '',
      weight: '',
      position: '',
      jersey_number: '',
      citizenship: '',
      fifa_id: '',
      bio: ''
    });
  };

  const openEditDialog = (player: Player) => {
    setEditingPlayer(player);
    setPlayerForm({
      full_name: player.full_name,
      gender: player.gender,
      date_of_birth: player.date_of_birth || '',
      height: player.height?.toString() || '',
      weight: player.weight?.toString() || '',
      position: player.position,
      jersey_number: player.jersey_number?.toString() || '',
      citizenship: player.citizenship,
      fifa_id: player.fifa_id || '',
      bio: player.bio || ''
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingPlayer(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (profile?.user_type !== 'team') {
    return (
      <Layout>
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-rosegold mx-auto mb-4" />
          <h3 className="text-xl font-polysans text-white mb-2">Access Restricted</h3>
          <p className="text-gray-400 font-poppins">
            Only team accounts can manage players.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-polysans font-bold text-white mb-2">
              Team Players
            </h1>
            <div className="flex items-center gap-2">
              <p className="text-rosegold font-poppins">
                Manage your team roster and player profiles
              </p>
              <InfoTooltip content="Add and manage your players here. Complete player profiles are required for transfer pitches." />
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={openCreateDialog}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-polysans text-xl">
                  {editingPlayer ? 'Edit Player' : 'Add New Player'}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <InfoTooltip content="Player's complete legal name" />
                    </div>
                    <Input
                      id="full_name"
                      value={playerForm.full_name}
                      onChange={(e) => setPlayerForm({...playerForm, full_name: e.target.value})}
                      className="font-poppins"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <Select value={playerForm.gender} onValueChange={(value) => setPlayerForm({...playerForm, gender: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={playerForm.date_of_birth}
                      onChange={(e) => setPlayerForm({...playerForm, date_of_birth: e.target.value})}
                      className="font-poppins"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="height">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      value={playerForm.height}
                      onChange={(e) => setPlayerForm({...playerForm, height: e.target.value})}
                      className="font-poppins"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="weight">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={playerForm.weight}
                      onChange={(e) => setPlayerForm({...playerForm, weight: e.target.value})}
                      className="font-poppins"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="position">Position</Label>
                      <InfoTooltip content="Primary playing position (e.g., Striker, Midfielder, Defender)" />
                    </div>
                    <Input
                      id="position"
                      value={playerForm.position}
                      onChange={(e) => setPlayerForm({...playerForm, position: e.target.value})}
                      placeholder="e.g. Striker, Goalkeeper"
                      className="font-poppins"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="jersey_number">Jersey Number</Label>
                    <Input
                      id="jersey_number"
                      type="number"
                      value={playerForm.jersey_number}
                      onChange={(e) => setPlayerForm({...playerForm, jersey_number: e.target.value})}
                      className="font-poppins"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="citizenship">Citizenship</Label>
                      <InfoTooltip content="Player's nationality/citizenship" />
                    </div>
                    <Input
                      id="citizenship"
                      value={playerForm.citizenship}
                      onChange={(e) => setPlayerForm({...playerForm, citizenship: e.target.value})}
                      placeholder="e.g. Nigerian, Brazilian"
                      className="font-poppins"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="fifa_id">FIFA ID (Optional)</Label>
                      <InfoTooltip content="Official FIFA player ID for football players" />
                    </div>
                    <Input
                      id="fifa_id"
                      value={playerForm.fifa_id}
                      onChange={(e) => setPlayerForm({...playerForm, fifa_id: e.target.value})}
                      className="font-poppins"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="bio">Player Bio</Label>
                    <InfoTooltip content="Brief description of player's style, achievements, and characteristics" />
                  </div>
                  <Textarea
                    id="bio"
                    value={playerForm.bio}
                    onChange={(e) => setPlayerForm({...playerForm, bio: e.target.value})}
                    placeholder="Player's playing style, achievements, and characteristics..."
                    className="font-poppins h-20"
                  />
                </div>

                <Button 
                  onClick={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
                  disabled={!playerForm.full_name || !playerForm.position || !playerForm.citizenship || !playerForm.gender}
                  className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                >
                  {editingPlayer ? 'Update Player' : 'Add Player'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Team Info */}
        {teamInfo && (
          <Card className="bg-white/5 border-rosegold/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-rosegold/20 rounded-full flex items-center justify-center">
                  {teamInfo.logo_url ? (
                    <img 
                      src={teamInfo.logo_url} 
                      alt={teamInfo.team_name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-rosegold font-polysans font-bold text-xl">
                      {teamInfo.team_name.charAt(0)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="font-polysans font-bold text-xl text-white">
                    {teamInfo.team_name}
                  </h2>
                  <p className="text-rosegold font-poppins">
                    {teamInfo.sport_type.charAt(0).toUpperCase() + teamInfo.sport_type.slice(1)} • {teamInfo.country}
                  </p>
                  <p className="text-gray-400 font-poppins text-sm">
                    {players.length} player{players.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Players Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-white/5 border-rosegold/20 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-64 bg-gray-700 rounded"></div>
                </CardContent>
              </Card>
            ))
          ) : players.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <Users className="h-12 w-12 text-rosegold mx-auto mb-4" />
              <h3 className="text-xl font-polysans text-white mb-2">No Players Yet</h3>
              <p className="text-gray-400 font-poppins mb-4">
                Start building your team by adding your first player
              </p>
              <Button 
                onClick={openCreateDialog}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Player
              </Button>
            </div>
          ) : (
            players.map((player) => (
              <Card key={player.id} className="bg-white/5 border-rosegold/20 hover:border-rosegold/40 transition-colors">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Player Header */}
                    <div className="flex items-start gap-4">
                      <div className="w-16 h-16 bg-rosegold/20 rounded-full flex items-center justify-center">
                        {player.photo_url ? (
                          <img 
                            src={player.photo_url} 
                            alt={player.full_name}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          <span className="text-rosegold font-polysans font-bold text-lg">
                            {player.full_name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-polysans font-bold text-white text-lg">
                              {player.full_name}
                            </h3>
                            <p className="text-rosegold font-poppins">
                              {player.position}
                            </p>
                            {player.jersey_number && (
                              <Badge variant="outline" className="text-bright-pink border-bright-pink mt-1">
                                #{player.jersey_number}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(player)}
                              className="text-rosegold hover:text-white hover:bg-rosegold/20"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeletePlayer(player.id, player.full_name)}
                              className="text-red-400 hover:text-white hover:bg-red-500/20"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Player Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-gray-300">
                        <MapPin className="h-3 w-3" />
                        <span className="font-poppins">{player.citizenship}</span>
                      </div>
                      
                      {player.date_of_birth && (
                        <div className="flex items-center gap-2 text-gray-300">
                          <Calendar className="h-3 w-3" />
                          <span className="font-poppins">
                            {calculateAge(player.date_of_birth)} years old
                          </span>
                        </div>
                      )}

                      {(player.height || player.weight) && (
                        <div className="text-gray-300 font-poppins">
                          {player.height && `${player.height}cm`}
                          {player.height && player.weight && ' • '}
                          {player.weight && `${player.weight}kg`}
                        </div>
                      )}

                      {player.market_value && (
                        <div className="flex items-center gap-2 text-bright-pink font-polysans font-bold">
                          <TrendingUp className="h-3 w-3" />
                          {formatCurrency(player.market_value)}
                        </div>
                      )}

                      {player.fifa_id && (
                        <div className="text-xs text-gray-400 font-poppins">
                          FIFA ID: {player.fifa_id}
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {player.bio && (
                      <p className="text-sm text-gray-300 font-poppins line-clamp-2">
                        {player.bio}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins"
                      >
                        View Stats
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                      >
                        Pitch Player
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Players;
