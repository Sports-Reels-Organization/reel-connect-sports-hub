import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Camera, Upload, User } from 'lucide-react';
import { Tables } from '@/integrations/supabase/types';

type DatabasePlayer = Tables<'players'>;

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
  headshot_url: string;
  portrait_url: string;
  full_body_url: string;
}

interface PlayerFormProps {
  teamId: string;
  editingPlayer: DatabasePlayer | null;
  onPlayerSaved: () => void;
  onCancel: () => void;
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

const PlayerFormComponent: React.FC<PlayerFormProps> = ({
  teamId,
  editingPlayer,
  onPlayerSaved,
  onCancel
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState<string | null>(null);
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
    headshot_url: '',
    portrait_url: '',
    full_body_url: ''
  });

  useEffect(() => {
    if (editingPlayer) {
      setPlayerForm({
        full_name: editingPlayer.full_name || '',
        gender: editingPlayer.gender || 'male',
        height: editingPlayer.height?.toString() || '',
        weight: editingPlayer.weight?.toString() || '',
        position: editingPlayer.position || '',
        citizenship: editingPlayer.citizenship || '',
        date_of_birth: editingPlayer.date_of_birth || '',
        jersey_number: editingPlayer.jersey_number?.toString() || '',
        fifa_id: editingPlayer.fifa_id || '',
        market_value: editingPlayer.market_value?.toString() || '',
        bio: editingPlayer.bio || '',
        place_of_birth: editingPlayer.place_of_birth || '',
        foot: editingPlayer.foot || '',
        player_agent: editingPlayer.player_agent || '',
        current_club: editingPlayer.current_club || '',
        joined_date: editingPlayer.joined_date || '',
        contract_expires: editingPlayer.contract_expires || '',
        headshot_url: editingPlayer.headshot_url || editingPlayer.photo_url || '',
        portrait_url: editingPlayer.portrait_url || '',
        full_body_url: editingPlayer.full_body_url || ''
      });
    }
  }, [editingPlayer]);

  const handlePhotoUpload = async (file: File, photoType: 'headshot' | 'portrait' | 'full_body') => {
    if (!file) return null;

    setUploadingPhoto(photoType);
    try {
      if (!file.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }

      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image size must be less than 5MB');
      }

      const fileExt = file.name.split('.').pop();
      const fileName = `${teamId}/${editingPlayer?.id || Date.now()}_${photoType}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from('player-photos')
        .getPublicUrl(fileName);

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
      setUploadingPhoto(null);
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
        headshot_url: playerForm.headshot_url || null,
        portrait_url: playerForm.portrait_url || null,
        full_body_url: playerForm.full_body_url || null
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

      onPlayerSaved();
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

  const PhotoUploadSection = ({ 
    type, 
    label, 
    description, 
    url 
  }: { 
    type: 'headshot' | 'portrait' | 'full_body'; 
    label: string; 
    description: string; 
    url: string;
  }) => (
    <div className="text-center space-y-2">
      <Label className="text-white font-polysans">{label}</Label>
      <p className="text-xs text-gray-400 font-poppins">{description}</p>
      <div className="relative mx-auto w-24 h-24">
        {url ? (
          <img
            src={url}
            alt={label}
            className="w-full h-full rounded-lg object-cover border-2 border-rosegold"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-gray-700 flex items-center justify-center border-2 border-gray-600">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <label className="absolute bottom-0 right-0 bg-rosegold hover:bg-rosegold/90 rounded-full p-1 cursor-pointer">
          <Camera className="w-3 h-3 text-white" />
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) {
                const photoUrl = await handlePhotoUpload(file, type);
                if (photoUrl) {
                  setPlayerForm(prev => ({ ...prev, [`${type}_url`]: photoUrl }));
                }
              }
            }}
            disabled={uploadingPhoto === type}
          />
        </label>
        {uploadingPhoto === type && (
          <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
            <Upload className="w-6 h-6 text-white animate-spin" />
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="font-polysans text-white">
          {editingPlayer ? 'Edit Player' : 'Add New Player'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Photo Upload Section */}
        <div className="grid grid-cols-3 gap-6 p-4 bg-gray-900 rounded-lg">
          <PhotoUploadSection
            type="headshot"
            label="Headshot"
            description="Face photo for profile display"
            url={playerForm.headshot_url}
          />
          <PhotoUploadSection
            type="portrait"
            label="Portrait"
            description="Head to waist level photo"
            url={playerForm.portrait_url}
          />
          <PhotoUploadSection
            type="full_body"
            label="Full Body"
            description="Head to foot level photo"
            url={playerForm.full_body_url}
          />
        </div>

        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white">Full Name *</Label>
            <Input
              id="full_name"
              value={playerForm.full_name}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, full_name: e.target.value }))}
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="Player's full name"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Gender *</Label>
            <Select 
              value={playerForm.gender} 
              onValueChange={(value: 'male' | 'female' | 'other') => setPlayerForm(prev => ({ ...prev, gender: value }))}
            >
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
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
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Select position" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
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
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Select citizenship" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
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
              className="bg-gray-900 border-gray-600 text-white"
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
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="jersey_number" className="text-white">Jersey Number</Label>
            <Input
              id="jersey_number"
              type="number"
              value={playerForm.jersey_number}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, jersey_number: e.target.value }))}
              className="bg-gray-900 border-gray-600 text-white"
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
              className="bg-gray-900 border-gray-600 text-white"
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
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="e.g., 75"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-white">Preferred Foot</Label>
            <Select 
              value={playerForm.foot} 
              onValueChange={(value) => setPlayerForm(prev => ({ ...prev, foot: value }))}
            >
              <SelectTrigger className="bg-gray-900 border-gray-600 text-white">
                <SelectValue placeholder="Select foot" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
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
              className="bg-gray-900 border-gray-600 text-white"
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
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_expires" className="text-white">Contract Expires</Label>
            <Input
              id="contract_expires"
              type="date"
              value={playerForm.contract_expires}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, contract_expires: e.target.value }))}
              className="bg-gray-900 border-gray-600 text-white"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player_agent" className="text-white">Player Agent</Label>
            <Input
              id="player_agent"
              value={playerForm.player_agent}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, player_agent: e.target.value }))}
              className="bg-gray-900 border-gray-600 text-white"
              placeholder="Agent name or agency"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fifa_id" className="text-white">FIFA ID</Label>
            <Input
              id="fifa_id"
              value={playerForm.fifa_id}
              onChange={(e) => setPlayerForm(prev => ({ ...prev, fifa_id: e.target.value }))}
              className="bg-gray-900 border-gray-600 text-white"
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
              className="bg-gray-900 border-gray-600 text-white"
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
            className="bg-gray-900 border-gray-600 text-white resize-none"
            placeholder="Brief description of the player..."
            rows={3}
          />
        </div>

        <div className="flex gap-4">
          <Button
            onClick={handleSavePlayer}
            disabled={loading}
            className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
          >
            {loading ? 'Saving...' : (editingPlayer ? 'Update Player' : 'Add Player')}
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlayerFormComponent;
