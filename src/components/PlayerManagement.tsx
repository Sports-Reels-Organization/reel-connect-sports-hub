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
import { Plus, Edit, Users, Upload, Camera, User } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

// Use the database type for fetched players
type DatabasePlayer = Tables<'players'>;

// Form interface for managing form state (keeping strings for form inputs)
interface PlayerForm {
  full_name: string;
  gender: 'male' | 'female' | 'other';
  height: string;
  weight: string;
  position: string;
  citizenship: string;
  date_of_birth: string;
  jersey_number: string;
  fifa_id: string;
  market_value: string;
  bio: string;
  place_of_birth: string;
  foot: string;
  player_agent: string;
  current_club: string;
  joined_date: string;
  contract_expires: string;
  photo_url: string;
}

const positions = [
  'Goalkeeper', 'Centre-Back', 'Left-Back', 'Right-Back', 'Defensive Midfielder',
  'Central Midfielder', 'Attacking Midfielder', 'Left Winger', 'Right Winger',
  'Centre-Forward', 'Striker'
];

const countries = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Algeria', 'Tunisia',
  'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Brazil', 'Argentina', 'USA',
  'Cameroon', 'Ivory Coast', 'Senegal', 'Mali', 'Burkina Faso', 'Guinea', 'Zambia', 'Zimbabwe'
];

const leagues = [
  'NLO', 'NNL', 'NPFL', 'N-YOUTH LEAGUE', 'TCC', 'FEDERATION CUP', 'FA CUP',
  'CAF Champions League', 'CAF Confederation Cup', 'AFCON', 'World Cup', 'Premier League',
  'La Liga', 'Serie A', 'Bundesliga', 'Ligue 1'
];

const PlayerManagement: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [players, setPlayers] = useState<DatabasePlayer[]>([]);
  const [teamId, setTeamId] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<DatabasePlayer | null>(null);
  const [playerForm, setPlayerForm] = useState<PlayerForm>({
    full_name: '',
    gender: 'male',
    height: '',
    weight: '',
    position: '',
    citizenship: '',
    date_of_birth: '',
    jersey_number: '',
    fifa_id: '',
    market_value: '',
    bio: '',
    place_of_birth: '',
    foot: '',
    player_agent: '',
    current_club: '',
    joined_date: '',
    contract_expires: '',
    photo_url: ''
  });

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

  const handlePhotoUpload = async (file: File, playerId?: string) => {
    if (!file) return null;

    setUploadingPhoto(true);
    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${playerId || Date.now()}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload Error",
        description: error.message,
        variant: "destructive"
      });
      return null;
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSavePlayer = async () => {
    if (!teamId) return;

    if (!playerForm.full_name || !playerForm.position || !playerForm.citizenship) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields (Name, Position, Citizenship)",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const playerData = {
        team_id: teamId,
        full_name: playerForm.full_name,
        gender: playerForm.gender as 'male' | 'female' | 'other',
        height: playerForm.height ? parseInt(playerForm.height) : null,
        weight: playerForm.weight ? parseInt(playerForm.weight) : null,
        position: playerForm.position,
        citizenship: playerForm.citizenship,
        date_of_birth: playerForm.date_of_birth || null,
        jersey_number: playerForm.jersey_number ? parseInt(playerForm.jersey_number) : null,
        fifa_id: playerForm.fifa_id || null,
        market_value: playerForm.market_value ? parseFloat(playerForm.market_value) : null,
        bio: playerForm.bio || null,
        place_of_birth: playerForm.place_of_birth || null,
        foot: playerForm.foot || null,
        player_agent: playerForm.player_agent || null,
        current_club: playerForm.current_club || null,
        joined_date: playerForm.joined_date || null,
        contract_expires: playerForm.contract_expires || null,
        photo_url: playerForm.photo_url || null
      };

      if (editingPlayer?.id) {
        const { error } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', editingPlayer.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Player updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('players')
          .insert(playerData);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Player added successfully",
        });
      }

      resetForm();
      fetchPlayers();

    } catch (error) {
      console.error('Error saving player:', error);
      toast({
        title: "Error",
        description: "Failed to save player",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditPlayer = (player: DatabasePlayer) => {
    setPlayerForm({
      full_name: player.full_name || '',
      gender: player.gender || 'male',
      height: player.height?.toString() || '',
      weight: player.weight?.toString() || '',
      position: player.position || '',
      citizenship: player.citizenship || '',
      date_of_birth: player.date_of_birth || '',
      jersey_number: player.jersey_number?.toString() || '',
      fifa_id: player.fifa_id || '',
      market_value: player.market_value?.toString() || '',
      bio: player.bio || '',
      place_of_birth: player.place_of_birth || '',
      foot: player.foot || '',
      player_agent: player.player_agent || '',
      current_club: player.current_club || '',
      joined_date: player.joined_date || '',
      contract_expires: player.contract_expires || '',
      photo_url: player.photo_url || ''
    });
    setEditingPlayer(player);
    setShowAddForm(true);
  };

  const resetForm = () => {
    setPlayerForm({
      full_name: '',
      gender: 'male',
      height: '',
      weight: '',
      position: '',
      citizenship: '',
      date_of_birth: '',
      jersey_number: '',
      fifa_id: '',
      market_value: '',
      bio: '',
      place_of_birth: '',
      foot: '',
      player_agent: '',
      current_club: '',
      joined_date: '',
      contract_expires: '',
      photo_url: ''
    });
    setEditingPlayer(null);
    setShowAddForm(false);
  };

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto bg-background min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-polysans text-3xl font-bold text-white mb-2">
            Player Management
          </h1>
          <p className="text-gray-400">
            Manage your team's player roster and comprehensive information
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-rosegold hover:bg-rosegold/90 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Player
        </Button>
      </div>

      {/* Add/Edit Player Form */}
      {showAddForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-polysans text-white">
              {editingPlayer ? 'Edit Player' : 'Add New Player'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Photo Upload Section */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                {playerForm.photo_url ? (
                  <img
                    src={playerForm.photo_url}
                    alt="Player photo"
                    className="w-32 h-32 rounded-full object-cover border-4 border-rosegold"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-700 flex items-center justify-center border-4 border-gray-600">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <label className="absolute bottom-0 right-0 bg-rosegold hover:bg-rosegold/90 rounded-full p-2 cursor-pointer">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const photoUrl = await handlePhotoUpload(file, editingPlayer?.id);
                        if (photoUrl) {
                          setPlayerForm(prev => ({ ...prev, photo_url: photoUrl }));
                        }
                      }
                    }}
                    disabled={uploadingPhoto}
                  />
                </label>
                {uploadingPhoto && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-white animate-spin" />
                  </div>
                )}
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-white">Full Name *</Label>
                <Input
                  id="full_name"
                  value={playerForm.full_name}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="Player's full name"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Gender *</Label>
                <Select 
                  value={playerForm.gender} 
                  onValueChange={(value: 'male' | 'female' | 'other') => setPlayerForm(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="male" className="text-white">Male</SelectItem>
                    <SelectItem value="female" className="text-white">Female</SelectItem>
                    <SelectItem value="other" className="text-white">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Position *</Label>
                <Select 
                  value={playerForm.position} 
                  onValueChange={(value) => setPlayerForm(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {positions.map((position) => (
                      <SelectItem key={position} value={position} className="text-white">
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-white">Citizenship *</Label>
                <Select 
                  value={playerForm.citizenship} 
                  onValueChange={(value) => setPlayerForm(prev => ({ ...prev, citizenship: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue placeholder="Select citizenship" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country} className="text-white">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="place_of_birth" className="text-white">Place of Birth</Label>
                <Input
                  id="place_of_birth"
                  value={playerForm.place_of_birth}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, place_of_birth: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., Lagos, Nigeria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_of_birth" className="text-white">Date of Birth</Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={playerForm.date_of_birth}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="bg-background border-border text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="jersey_number" className="text-white">Jersey Number</Label>
                <Input
                  id="jersey_number"
                  type="number"
                  value={playerForm.jersey_number}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, jersey_number: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., 10"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="height" className="text-white">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  value={playerForm.height}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, height: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., 180"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="weight" className="text-white">Weight (kg)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={playerForm.weight}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, weight: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., 75"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-white">Preferred Foot</Label>
                <Select 
                  value={playerForm.foot} 
                  onValueChange={(value) => setPlayerForm(prev => ({ ...prev, foot: value }))}
                >
                  <SelectTrigger className="bg-background border-border text-white">
                    <SelectValue placeholder="Select foot" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="left" className="text-white">Left</SelectItem>
                    <SelectItem value="right" className="text-white">Right</SelectItem>
                    <SelectItem value="both" className="text-white">Both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_club" className="text-white">Current Club</Label>
                <Input
                  id="current_club"
                  value={playerForm.current_club}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, current_club: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="Current club name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="joined_date" className="text-white">Joined Date</Label>
                <Input
                  id="joined_date"
                  type="date"
                  value={playerForm.joined_date}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, joined_date: e.target.value }))}
                  className="bg-background border-border text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contract_expires" className="text-white">Contract Expires</Label>
                <Input
                  id="contract_expires"
                  type="date"
                  value={playerForm.contract_expires}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, contract_expires: e.target.value }))}
                  className="bg-background border-border text-white"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="player_agent" className="text-white">Player Agent</Label>
                <Input
                  id="player_agent"
                  value={playerForm.player_agent}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, player_agent: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="Agent name or agency"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fifa_id" className="text-white">FIFA ID</Label>
                <Input
                  id="fifa_id"
                  value={playerForm.fifa_id}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, fifa_id: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="FIFA identification number"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="market_value" className="text-white">Market Value (USD)</Label>
                <Input
                  id="market_value"
                  type="number"
                  value={playerForm.market_value}
                  onChange={(e) => setPlayerForm(prev => ({ ...prev, market_value: e.target.value }))}
                  className="bg-background border-border text-white"
                  placeholder="e.g., 500000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio" className="text-white">Player Bio</Label>
              <Textarea
                id="bio"
                value={playerForm.bio}
                onChange={(e) => setPlayerForm(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-background border-border text-white resize-none"
                placeholder="Brief description of the player..."
                rows={3}
              />
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleSavePlayer}
                disabled={loading}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                {loading ? 'Saving...' : (editingPlayer ? 'Update Player' : 'Add Player')}
              </Button>
              <Button
                onClick={resetForm}
                variant="outline"
                className="border-gray-500 text-gray-400 hover:bg-gray-500 hover:text-white"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Players List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {players.map((player) => (
          <Card key={player.id} className="bg-card border-border hover:border-rosegold/50 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-700">
                    {player.photo_url ? (
                      <img
                        src={player.photo_url}
                        alt={player.full_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-polysans font-semibold text-white mb-1">
                      {player.full_name}
                    </h3>
                    <p className="text-sm text-gray-400">{player.position}</p>
                    {player.jersey_number && (
                      <p className="text-sm text-rosegold">#{player.jersey_number}</p>
                    )}
                  </div>
                </div>
                <Button
                  onClick={() => handleEditPlayer(player)}
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-white"
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Citizenship:</span>
                  <span className="text-white">{player.citizenship}</span>
                </div>
                {player.height && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Height:</span>
                    <span className="text-white">{player.height}cm</span>
                  </div>
                )}
                {player.date_of_birth && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">DOB:</span>
                    <span className="text-white">{new Date(player.date_of_birth).toLocaleDateString()}</span>
                  </div>
                )}
                {player.foot && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Foot:</span>
                    <span className="text-white">{player.foot}</span>
                  </div>
                )}
                {player.current_club && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Club:</span>
                    <span className="text-white">{player.current_club}</span>
                  </div>
                )}
                {player.market_value && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Value:</span>
                    <span className="text-white">${player.market_value?.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {player.bio && (
                <p className="text-sm text-gray-300 mt-3 line-clamp-2">
                  {player.bio}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {players.length === 0 && !showAddForm && (
        <Card className="bg-card border-border">
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="font-polysans text-xl font-semibold text-white mb-2">
              No Players Added Yet
            </h3>
            <p className="text-gray-400 mb-6">
              Start building your team by adding comprehensive player profiles
            </p>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-rosegold hover:bg-rosegold/90 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Player
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerManagement;
