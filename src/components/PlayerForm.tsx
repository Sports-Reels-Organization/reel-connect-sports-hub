import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSports } from '@/hooks/useSports';
import { useCountries } from '@/hooks/useCountries';
import PlayerMediaManager from './PlayerMediaManager';
import { User, Calendar, MapPin, Users, Award, FileText, Upload } from 'lucide-react';

interface PlayerFormProps {
  playerId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface PlayerData {
  id?: string;
  full_name: string;
  position: string;
  date_of_birth?: string;
  country?: string;
  team_id?: string | null;
  height?: number;
  weight?: number;
  preferred_foot?: 'left' | 'right';
  jersey_number?: number;
  biography?: string;
  achievements?: string;
  photo_url?: string;
  sport_id?: string;
}

const PlayerForm = ({ playerId, onSuccess, onCancel }: PlayerFormProps) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { sports } = useSports();
  const { countries } = useCountries();

  const [loading, setLoading] = useState(false);
  const [playerData, setPlayerData] = useState<PlayerData>({
    full_name: '',
    position: '',
  });

  useEffect(() => {
    if (playerId) {
      fetchPlayer();
    }
  }, [playerId]);

  const fetchPlayer = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single();

      if (error) throw error;
      setPlayerData(data);
    } catch (error: any) {
      console.error('Error fetching player:', error);
      toast({
        title: "Error",
        description: "Failed to load player data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPlayerData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get team ID
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) {
        throw new Error('Team not found');
      }

      const payload = {
        ...playerData,
        team_id: teamData.id,
      };

      if (playerId) {
        // Update existing player
        const { error } = await supabase
          .from('players')
          .update(payload)
          .eq('id', playerId);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Player updated successfully",
        });
      } else {
        // Create new player
        const { error } = await supabase
          .from('players')
          .insert(payload);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Player added successfully",
        });
      }

      onSuccess?.();

    } catch (error: any) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: "Failed to save player data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <User className="w-5 h-5 text-bright-pink" />
            {playerId ? 'Edit Player' : 'Add New Player'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="full_name" className="text-gray-300">Full Name</Label>
            <Input
              type="text"
              id="full_name"
              name="full_name"
              value={playerData.full_name || ''}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="position" className="text-gray-300">Position</Label>
            <Input
              type="text"
              id="position"
              name="position"
              value={playerData.position || ''}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="sport" className="text-gray-300">Sport</Label>
            <Select value={playerData.sport_id || ''} onValueChange={(value) => setPlayerData(prev => ({ ...prev, sport_id: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {sports.map((sport) => (
                  <SelectItem key={sport.id} value={sport.id}>
                    {sport.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="date_of_birth" className="text-gray-300">Date of Birth</Label>
            <Input
              type="date"
              id="date_of_birth"
              name="date_of_birth"
              value={playerData.date_of_birth || ''}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="country" className="text-gray-300">Country</Label>
            <Select value={playerData.country || ''} onValueChange={(value) => setPlayerData(prev => ({ ...prev, country: value }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select a country" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.name}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height" className="text-gray-300">Height (cm)</Label>
              <Input
                type="number"
                id="height"
                name="height"
                value={playerData.height || ''}
                onChange={handleChange}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>

            <div>
              <Label htmlFor="weight" className="text-gray-300">Weight (kg)</Label>
              <Input
                type="number"
                id="weight"
                name="weight"
                value={playerData.weight || ''}
                onChange={handleChange}
                className="bg-gray-700 border-gray-600 text-white"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="preferred_foot" className="text-gray-300">Preferred Foot</Label>
            <Select value={playerData.preferred_foot || ''} onValueChange={(value) => setPlayerData(prev => ({ ...prev, preferred_foot: value as 'left' | 'right' }))}>
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                <SelectValue placeholder="Select foot" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="right">Right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="jersey_number" className="text-gray-300">Jersey Number</Label>
            <Input
              type="number"
              id="jersey_number"
              name="jersey_number"
              value={playerData.jersey_number || ''}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="biography" className="text-gray-300">Biography</Label>
            <Textarea
              id="biography"
              name="biography"
              value={playerData.biography || ''}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>

          <div>
            <Label htmlFor="achievements" className="text-gray-300">Achievements</Label>
            <Textarea
              id="achievements"
              name="achievements"
              value={playerData.achievements || ''}
              onChange={handleChange}
              className="bg-gray-700 border-gray-600 text-white"
            />
          </div>
        </CardContent>
      </Card>

      {/* Media Manager - only show for existing players */}
      {playerId && (
        <PlayerMediaManager 
          playerId={playerId}
          onMediaUpdate={() => {
            // Refresh player data if needed
          }}
        />
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 bg-bright-pink hover:bg-bright-pink/90"
        >
          {loading ? 'Saving...' : playerId ? 'Update Player' : 'Add Player'}
        </Button>
        
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-gray-600"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default PlayerForm;
