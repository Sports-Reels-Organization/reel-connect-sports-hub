
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useDataChangeNotification } from '@/hooks/useDataChangeNotification';
import { FifaIdIntegration } from '@/components/FifaIdIntegration';
import { Upload, User, Save, AlertCircle } from 'lucide-react';

interface Player {
  id?: string;
  full_name: string;
  gender: 'male' | 'female';
  position: string;
  citizenship: string;
  place_of_birth: string;
  date_of_birth: string;
  height: number;
  weight: number;
  foot: string;
  player_agent: string;
  fifa_id: string;
  current_club: string;
  joined_date: string;
  contract_expires: string;
  jersey_number: number;
  market_value: number;
  bio: string;
  photo_url: string;
  leagues_participated: string[];
  titles_seasons: string[];
  transfer_history: any;
  international_duty: any;
  match_stats: any;
}

interface PlayerFormProps {
  player?: Player;
  teamId: string;
  onSave?: (player: Player) => void;
  onCancel?: () => void;
}

export const EnhancedPlayerForm: React.FC<PlayerFormProps> = ({
  player,
  teamId,
  onSave,
  onCancel
}) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { sendChangeNotification } = useDataChangeNotification();
  
  const [formData, setFormData] = useState<Player>({
    full_name: '',
    gender: 'male',
    position: '',
    citizenship: '',
    place_of_birth: '',
    date_of_birth: '',
    height: 0,
    weight: 0,
    foot: '',
    player_agent: '',
    fifa_id: '',
    current_club: '',
    joined_date: '',
    contract_expires: '',
    jersey_number: 0,
    market_value: 0,
    bio: '',
    photo_url: '',
    leagues_participated: [],
    titles_seasons: [],
    transfer_history: {},
    international_duty: {},
    match_stats: {}
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (player) {
      setFormData(player);
    }
  }, [player]);

  const handleInputChange = (field: keyof Player, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${profile?.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('player-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('player-photos')
        .getPublicUrl(filePath);

      setFormData(prev => ({
        ...prev,
        photo_url: publicUrl
      }));

      toast({
        title: "Success",
        description: "Player photo uploaded successfully"
      });
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Error",
        description: "Failed to upload photo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'full_name', 'position', 'citizenship', 'date_of_birth',
      'height', 'weight', 'bio', 'market_value'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof Player]) {
        toast({
          title: "Validation Error",
          description: `${field.replace('_', ' ')} is required`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);

      const playerData = {
        ...formData,
        team_id: teamId,
        age: calculateAge(formData.date_of_birth)
      };

      let savedPlayer;

      if (formData.id) {
        // Update existing player
        const { data, error } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', formData.id)
          .select()
          .single();

        if (error) throw error;
        savedPlayer = data;

        // Send change notification
        if (profile) {
          await sendChangeNotification({
            userId: profile.user_id,
            email: profile.email,
            changeType: 'Updated',
            entityType: 'player',
            entityName: formData.full_name
          });
        }

        toast({
          title: "Success",
          description: "Player updated successfully"
        });
      } else {
        // Create new player
        const { data, error } = await supabase
          .from('players')
          .insert(playerData)
          .select()
          .single();

        if (error) throw error;
        savedPlayer = data;

        // Send change notification
        if (profile) {
          await sendChangeNotification({
            userId: profile.user_id,
            email: profile.email,
            changeType: 'Created',
            entityType: 'player',
            entityName: formData.full_name
          });
        }

        toast({
          title: "Success",
          description: "Player created successfully"
        });
      }

      if (onSave) {
        onSave(savedPlayer);
      }
    } catch (error) {
      console.error('Error saving player:', error);
      toast({
        title: "Error",
        description: "Failed to save player",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <User className="w-5 h-5" />
          {player ? 'Edit Player' : 'Add Player'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name" className="text-white">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => handleInputChange('full_name', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="Enter player's full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender" className="text-white">Gender *</Label>
            <Select value={formData.gender} onValueChange={(value: 'male' | 'female') => handleInputChange('gender', value)}>
              <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position" className="text-white">Position *</Label>
            <Input
              id="position"
              value={formData.position}
              onChange={(e) => handleInputChange('position', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="e.g., Forward, Midfielder"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="citizenship" className="text-white">Citizenship *</Label>
            <Input
              id="citizenship"
              value={formData.citizenship}
              onChange={(e) => handleInputChange('citizenship', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="Player's nationality"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="place_of_birth" className="text-white">Place of Birth</Label>
            <Input
              id="place_of_birth"
              value={formData.place_of_birth}
              onChange={(e) => handleInputChange('place_of_birth', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="City, Country"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_birth" className="text-white">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height" className="text-white">Height (cm) *</Label>
            <Input
              id="height"
              type="number"
              value={formData.height || ''}
              onChange={(e) => handleInputChange('height', parseInt(e.target.value) || 0)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="180"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight" className="text-white">Weight (kg) *</Label>
            <Input
              id="weight"
              type="number"
              value={formData.weight || ''}
              onChange={(e) => handleInputChange('weight', parseInt(e.target.value) || 0)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="75"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="foot" className="text-white">Preferred Foot</Label>
            <Select value={formData.foot} onValueChange={(value) => handleInputChange('foot', value)}>
              <SelectTrigger className="bg-gray-700 text-white border-gray-600">
                <SelectValue placeholder="Select preferred foot" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                <SelectItem value="right">Right</SelectItem>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="jersey_number" className="text-white">Jersey Number</Label>
            <Input
              id="jersey_number"
              type="number"
              value={formData.jersey_number || ''}
              onChange={(e) => handleInputChange('jersey_number', parseInt(e.target.value) || 0)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="10"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="market_value" className="text-white">Market Value (USD) *</Label>
            <Input
              id="market_value"
              type="number"
              value={formData.market_value || ''}
              onChange={(e) => handleInputChange('market_value', parseInt(e.target.value) || 0)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="100000"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="player_agent" className="text-white">Player Agent</Label>
            <Input
              id="player_agent"
              value={formData.player_agent}
              onChange={(e) => handleInputChange('player_agent', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="Agent name"
            />
          </div>
        </div>

        {/* FIFA ID Integration */}
        <div className="space-y-2">
          <Label className="text-white">FIFA ID</Label>
          <FifaIdIntegration
            currentFifaId={formData.fifa_id}
            playerName={formData.full_name}
            onFifaIdChange={(fifaId) => handleInputChange('fifa_id', fifaId)}
          />
        </div>

        {/* Club Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="current_club" className="text-white">Current Club</Label>
            <Input
              id="current_club"
              value={formData.current_club}
              onChange={(e) => handleInputChange('current_club', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
              placeholder="Club name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="joined_date" className="text-white">Joined Date</Label>
            <Input
              id="joined_date"
              type="date"
              value={formData.joined_date}
              onChange={(e) => handleInputChange('joined_date', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="contract_expires" className="text-white">Contract Expires</Label>
            <Input
              id="contract_expires"
              type="date"
              value={formData.contract_expires}
              onChange={(e) => handleInputChange('contract_expires', e.target.value)}
              className="bg-gray-700 text-white border-gray-600"
            />
          </div>
        </div>

        {/* Player Photo */}
        <div className="space-y-2">
          <Label className="text-white">Player Photo</Label>
          <div className="flex items-center gap-4">
            {formData.photo_url && (
              <img
                src={formData.photo_url}
                alt="Player"
                className="w-20 h-20 object-cover rounded-full"
              />
            )}
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                id="photo-upload"
              />
              <Label
                htmlFor="photo-upload"
                className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
              >
                <Upload className="w-4 h-4" />
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </Label>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio" className="text-white">Biography *</Label>
          <Textarea
            id="bio"
            value={formData.bio}
            onChange={(e) => handleInputChange('bio', e.target.value)}
            className="bg-gray-700 text-white border-gray-600 min-h-[100px]"
            placeholder="Brief description of the player..."
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-rosegold hover:bg-rosegold/90 text-white flex-1"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Player'}
          </Button>
          {onCancel && (
            <Button
              onClick={onCancel}
              variant="outline"
              className="border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
