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
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Search, Calendar, MapPin, Trophy, User } from 'lucide-react';
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
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

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
      fetchPlayers();
    }
  }, [profile]);

  const fetchPlayers = async () => {
    try {
      // Get team data first
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!teamData) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('team_id', teamData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: "Error",
        description: "Failed to fetch players",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      // Get team data
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!teamData) throw new Error('Team not found');

      const playerData = {
        team_id: teamData.id,
        full_name: playerForm.full_name,
        gender: playerForm.gender as 'male' | 'female' | 'other',
        date_of_birth: playerForm.date_of_birth || null,
        height: playerForm.height ? parseInt(playerForm.height) : null,
        weight: playerForm.weight ? parseInt(playerForm.weight) : null,
        position: playerForm.position,
        jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
        citizenship: playerForm.citizenship,
        fifa_id: playerForm.fifa_id || null,
        bio: playerForm.bio || null
      };

      if (editingPlayer) {
        const { error } = await supabase
          .from('players')
          .update({
            full_name: playerForm.full_name,
            gender: playerForm.gender as 'male' | 'female' | 'other',
            date_of_birth: playerForm.date_of_birth || null,
            height: playerForm.height ? parseInt(playerForm.height) : null,
            weight: playerForm.weight ? parseInt(playerForm.weight) : null,
            position: playerForm.position,
            jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
            citizenship: playerForm.citizenship,
            fifa_id: playerForm.fifa_id || null,
            bio: playerForm.bio || null
          })
          .eq('id', editingPlayer.id);

        if (error) throw error;

        toast({
          title: "Player Updated",
          description: "Player information has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('players')
          .insert(playerData);

        if (error) throw error;

        toast({
          title: "Player Added",
          description: "New player has been added successfully",
        });
      }

      setShowAddForm(false);
      setEditingPlayer(null);
      resetForm();
      fetchPlayers();
    } catch (error) {
      console.error('Error saving player:', error);
      toast({
        title: "Error",
        description: "Failed to save player information",
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

  const handleEdit = (player: Player) => {
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
    setShowAddForm(true);
  };

  const filteredPlayers = players.filter(player =>
    player.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    player.citizenship.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (profile?.user_type !== 'team') {
    return (
      <Layout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <Trophy className="h-16 w-16 text-rosegold mx-auto mb-4" />
            <h2 className="text-2xl font-polysans text-white mb-2">Team Access Only</h2>
            <p className="text-gray-400 font-poppins">This section is only available for team accounts.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Players Management
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-rosegold font-poppins">
              Manage your team's player roster
            </p>
            <InfoTooltip content="Add, edit, and manage your team's players. Complete player profiles are required for transfer pitches." />
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 border-rosegold/30 text-white placeholder:text-gray-400"
              />
            </div>
          </div>
          <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
            <DialogTrigger asChild>
              <Button
                onClick={() => {
                  resetForm();
                  setEditingPlayer(null);
                }}
                className="bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Player
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl bg-white">
              <DialogHeader>
                <DialogTitle className="font-polysans">
                  {editingPlayer ? 'Edit Player' : 'Add New Player'}
                </DialogTitle>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                {/* Player form fields */}
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={playerForm.full_name}
                    onChange={(e) => setPlayerForm({ ...playerForm, full_name: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={playerForm.gender} onValueChange={(value) => setPlayerForm({ ...playerForm, gender: value })}>
                    <SelectTrigger className="bg-gray-100">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    type="date"
                    id="date_of_birth"
                    value={playerForm.date_of_birth}
                    onChange={(e) => setPlayerForm({ ...playerForm, date_of_birth: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    type="number"
                    id="height"
                    value={playerForm.height}
                    onChange={(e) => setPlayerForm({ ...playerForm, height: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (kg)</Label>
                  <Input
                    type="number"
                    id="weight"
                    value={playerForm.weight}
                    onChange={(e) => setPlayerForm({ ...playerForm, weight: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={playerForm.position}
                    onChange={(e) => setPlayerForm({ ...playerForm, position: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="jersey_number">Jersey Number</Label>
                  <Input
                    type="number"
                    id="jersey_number"
                    value={playerForm.jersey_number}
                    onChange={(e) => setPlayerForm({ ...playerForm, jersey_number: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="citizenship">Citizenship</Label>
                  <Input
                    id="citizenship"
                    value={playerForm.citizenship}
                    onChange={(e) => setPlayerForm({ ...playerForm, citizenship: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fifa_id">FIFA ID</Label>
                  <Input
                    id="fifa_id"
                    value={playerForm.fifa_id}
                    onChange={(e) => setPlayerForm({ ...playerForm, fifa_id: e.target.value })}
                    className="font-poppins"
                  />
                </div>

                <div className="col-span-2 space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={playerForm.bio}
                    onChange={(e) => setPlayerForm({ ...playerForm, bio: e.target.value })}
                    className="font-poppins"
                    rows={3}
                  />
                </div>
                
                <div className="col-span-2 flex gap-2 pt-4">
                  <Button
                    onClick={handleSubmit}
                    disabled={!playerForm.full_name || !playerForm.gender || !playerForm.position || !playerForm.citizenship}
                    className="bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
                  >
                    {editingPlayer ? 'Update Player' : 'Add Player'}
                  </Button>
                  <Button
                    onClick={() => setShowAddForm(false)}
                    variant="outline"
                    className="border-rosegold text-rosegold hover:bg-rosegold hover:text-white font-poppins"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

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
          ) : filteredPlayers.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <User className="h-12 w-12 text-rosegold mx-auto mb-4" />
              <h3 className="text-xl font-polysans text-white mb-2">No Players Found</h3>
              <p className="text-gray-400 font-poppins">
                {searchTerm ? 'No players match your search criteria.' : 'Start by adding your first player to the roster.'}
              </p>
            </div>
          ) : (
            filteredPlayers.map((player) => (
              <Card key={player.id} className="bg-white/5 border-rosegold/20 hover:border-rosegold/40 transition-colors">
                <CardContent className="p-6">
                  {/* Player card content */}
                  <div className="space-y-4">
                    {/* Player Info */}
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
                        <h3 className="font-polysans font-bold text-white text-lg">
                          {player.full_name}
                        </h3>
                        <p className="text-rosegold font-poppins">
                          {player.position}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <MapPin className="h-3 w-3" />
                          {player.citizenship}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEdit(player)}
                        variant="ghost"
                        size="icon"
                      >
                        <Edit className="h-4 w-4 text-rosegold" />
                      </Button>
                    </div>

                    {/* Player Details */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-white">
                        <User className="h-4 w-4 text-rosegold" />
                        <span className="font-poppins">
                          Gender: {player.gender}
                        </span>
                      </div>
                      {player.date_of_birth && (
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Calendar className="h-4 w-4 text-rosegold" />
                          <span className="font-poppins">
                            Born: {player.date_of_birth}
                          </span>
                        </div>
                      )}
                      {player.jersey_number && (
                        <div className="flex items-center gap-2 text-sm text-white">
                          <Badge variant="secondary">
                            #{player.jersey_number}
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Bio */}
                    {player.bio && (
                      <p className="text-sm text-gray-300 font-poppins line-clamp-2">
                        {player.bio}
                      </p>
                    )}

                    {/* Timing */}
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created: {player.created_at}
                      </div>
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
