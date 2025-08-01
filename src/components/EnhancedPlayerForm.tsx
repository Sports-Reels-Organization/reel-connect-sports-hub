
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Upload, User, Calendar, MapPin, Trophy, FileText, Camera } from 'lucide-react';

type DatabasePlayer = Tables<'players'>;

interface EnhancedPlayerFormProps {
  teamId: string;
  player?: DatabasePlayer | null;
  onSave: () => void;
  onCancel: () => void;
}

const EnhancedPlayerForm: React.FC<EnhancedPlayerFormProps> = ({
  teamId,
  player,
  onSave,
  onCancel
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    // Basic Information
    full_name: '',
    position: '',
    gender: 'male' as 'male' | 'female',
    date_of_birth: '',
    citizenship: '',
    place_of_birth: '',
    height: '',
    weight: '',
    jersey_number: '',
    
    // Professional Information
    foot: '',
    player_agent: '',
    current_club: '',
    joined_date: '',
    contract_expires: '',
    market_value: '',
    fifa_id: '',
    
    // Profile Information
    bio: '',
    photo_url: '',
    headshot_url: '',
    portrait_url: '',
    full_body_url: '',
    
    // Career Information
    leagues_participated: [] as string[],
    titles_seasons: [] as string[],
    transfer_history: null as any,
    international_duty: null as any,
    match_stats: null as any
  });

  const [countries, setCountries] = useState<string[]>([]);
  const [positions, setPositions] = useState<string[]>([]);

  useEffect(() => {
    fetchCountries();
    fetchPositions();
    
    if (player) {
      setFormData({
        full_name: player.full_name || '',
        position: player.position || '',
        gender: player.gender || 'male',
        date_of_birth: player.date_of_birth || '',
        citizenship: player.citizenship || '',
        place_of_birth: player.place_of_birth || '',
        height: player.height?.toString() || '',
        weight: player.weight?.toString() || '',
        jersey_number: player.jersey_number?.toString() || '',
        foot: player.foot || '',
        player_agent: player.player_agent || '',
        current_club: player.current_club || '',
        joined_date: player.joined_date || '',
        contract_expires: player.contract_expires || '',
        market_value: player.market_value?.toString() || '',
        fifa_id: player.fifa_id || '',
        bio: player.bio || '',
        photo_url: player.photo_url || '',
        headshot_url: player.headshot_url || '',
        portrait_url: player.portrait_url || '',
        full_body_url: player.full_body_url || '',
        leagues_participated: player.leagues_participated || [],
        titles_seasons: player.titles_seasons || [],
        transfer_history: player.transfer_history,
        international_duty: player.international_duty,
        match_stats: player.match_stats
      });
    }
  }, [player]);

  const fetchCountries = async () => {
    // You can implement a countries API or use a static list
    const commonCountries = [
      'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
      'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
      'Denmark', 'Egypt', 'England', 'Finland', 'France', 'Germany', 'Ghana',
      'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Italy', 'Japan', 'Kenya',
      'Mexico', 'Morocco', 'Netherlands', 'Nigeria', 'Norway', 'Pakistan', 'Poland',
      'Portugal', 'Russia', 'Saudi Arabia', 'Scotland', 'South Africa', 'Spain',
      'Sweden', 'Switzerland', 'Turkey', 'Ukraine', 'United States', 'Wales'
    ];
    setCountries(commonCountries);
  };

  const fetchPositions = async () => {
    const footballPositions = [
      'Goalkeeper',
      'Centre Back', 'Left Back', 'Right Back', 'Left Wing Back', 'Right Wing Back',
      'Defensive Midfielder', 'Central Midfielder', 'Attacking Midfielder',
      'Left Midfielder', 'Right Midfielder', 'Left Winger', 'Right Winger',
      'Centre Forward', 'Left Wing Forward', 'Right Wing Forward', 'Striker', 'False 9'
    ];
    setPositions(footballPositions);
  };

  const uploadPlayerPhoto = async (file: File, photoType: 'photo' | 'headshot' | 'portrait' | 'full_body'): Promise<string> => {
    try {
      const timestamp = Date.now();
      const fileName = `${teamId}_${timestamp}_${photoType}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      const { data, error } = await supabase.storage
        .from('player-photos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw new Error(`Failed to upload ${photoType}: ${error.message}`);
      }

      const { data: publicData } = supabase.storage
        .from('player-photos')
        .getPublicUrl(fileName);

      return publicData?.publicUrl || '';
    } catch (error) {
      console.error(`Error uploading ${photoType}:`, error);
      throw error;
    }
  };

  const handleFileUpload = async (file: File, photoType: 'photo' | 'headshot' | 'portrait' | 'full_body') => {
    if (!file) return;

    try {
      setLoading(true);
      const photoUrl = await uploadPlayerPhoto(file, photoType);
      
      setFormData(prev => ({
        ...prev,
        [`${photoType}_url`]: photoUrl
      }));

      toast({
        title: "Photo Uploaded",
        description: `${photoType.charAt(0).toUpperCase() + photoType.slice(1)} photo uploaded successfully.`,
      });
    } catch (error: any) {
      toast({
        title: "Upload Failed",
        description: error.message || `Failed to upload ${photoType} photo.`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: string): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const validateForm = (): boolean => {
    const requiredFields = [
      'full_name', 'position', 'citizenship', 'date_of_birth',
      'height', 'weight', 'bio', 'market_value'
    ];

    for (const field of requiredFields) {
      if (!formData[field as keyof typeof formData]) {
        toast({
          title: "Validation Error",
          description: `${field.replace('_', ' ')} is required for transfer pitch eligibility.`,
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const playerData = {
        team_id: teamId,
        full_name: formData.full_name.trim(),
        position: formData.position,
        gender: formData.gender,
        date_of_birth: formData.date_of_birth || null,
        age: formData.date_of_birth ? calculateAge(formData.date_of_birth) : null,
        citizenship: formData.citizenship,
        place_of_birth: formData.place_of_birth.trim() || null,
        height: formData.height ? parseInt(formData.height) : null,
        weight: formData.weight ? parseInt(formData.weight) : null,
        jersey_number: formData.jersey_number ? parseInt(formData.jersey_number) : null,
        foot: formData.foot || null,
        player_agent: formData.player_agent.trim() || null,
        current_club: formData.current_club.trim() || null,
        joined_date: formData.joined_date || null,
        contract_expires: formData.contract_expires || null,
        market_value: formData.market_value ? parseFloat(formData.market_value) : null,
        fifa_id: formData.fifa_id.trim() || null,
        bio: formData.bio.trim(),
        photo_url: formData.photo_url || null,
        headshot_url: formData.headshot_url || null,
        portrait_url: formData.portrait_url || null,
        full_body_url: formData.full_body_url || null,
        leagues_participated: formData.leagues_participated,
        titles_seasons: formData.titles_seasons,
        transfer_history: formData.transfer_history,
        international_duty: formData.international_duty,
        match_stats: formData.match_stats
      };

      if (player) {
        const { error } = await supabase
          .from('players')
          .update(playerData)
          .eq('id', player.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('players')
          .insert(playerData);

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: `Player ${player ? 'updated' : 'created'} successfully.`,
      });

      onSave();
    } catch (error: any) {
      console.error('Error saving player:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save player information.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto bg-[#1a1a1a] border-rosegold/20">
      <CardHeader>
        <CardTitle className="text-white font-polysans text-2xl flex items-center gap-2">
          <User className="w-6 h-6" />
          {player ? 'Edit Player' : 'Add New Player'}
        </CardTitle>
        <p className="text-gray-400 font-poppins">
          Complete all required fields to enable transfer pitch eligibility
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-6">
            <h3 className="text-white font-polysans text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="full_name" className="text-white font-polysans">
                  Full Name *
                </Label>
                <Input
                  id="full_name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="position" className="text-white font-polysans">
                  Position *
                </Label>
                <Select 
                  value={formData.position} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, position: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select position..." />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position} value={position}>
                        {position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="gender" className="text-white font-polysans">
                  Gender
                </Label>
                <Select 
                  value={formData.gender} 
                  onValueChange={(value: 'male' | 'female') => setFormData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="date_of_birth" className="text-white font-polysans">
                  Date of Birth *
                </Label>
                <Input
                  id="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
                {formData.date_of_birth && (
                  <p className="text-sm text-gray-400">
                    Age: {calculateAge(formData.date_of_birth)} years
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Physical & Geographic Information */}
          <div className="space-y-6">
            <h3 className="text-white font-polysans text-lg flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Physical & Geographic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-3">
                <Label htmlFor="height" className="text-white font-polysans">
                  Height (cm) *
                </Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="180"
                  value={formData.height}
                  onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="weight" className="text-white font-polysans">
                  Weight (kg) *
                </Label>
                <Input
                  id="weight"
                  type="number"
                  placeholder="75"
                  value={formData.weight}
                  onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="jersey_number" className="text-white font-polysans">
                  Jersey Number
                </Label>
                <Input
                  id="jersey_number"
                  type="number"
                  placeholder="10"
                  min="1"
                  max="99"
                  value={formData.jersey_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, jersey_number: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="citizenship" className="text-white font-polysans">
                  Citizenship *
                </Label>
                <Select 
                  value={formData.citizenship} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, citizenship: value }))}
                >
                  <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                    <SelectValue placeholder="Select country..." />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label htmlFor="place_of_birth" className="text-white font-polysans">
                  Place of Birth
                </Label>
                <Input
                  id="place_of_birth"
                  type="text"
                  placeholder="London, England"
                  value={formData.place_of_birth}
                  onChange={(e) => setFormData(prev => ({ ...prev, place_of_birth: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="foot" className="text-white font-polysans">
                Preferred Foot (Football)
              </Label>
              <Select 
                value={formData.foot} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, foot: value }))}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Select preferred foot..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Left">Left</SelectItem>
                  <SelectItem value="Right">Right</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-6">
            <h3 className="text-white font-polysans text-lg flex items-center gap-2">
              <Trophy className="w-5 h-5" />
              Professional Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="player_agent" className="text-white font-polysans">
                  Player Agent
                </Label>
                <Input
                  id="player_agent"
                  type="text"
                  placeholder="Agent Name"
                  value={formData.player_agent}
                  onChange={(e) => setFormData(prev => ({ ...prev, player_agent: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="fifa_id" className="text-white font-polysans">
                  FIFA ID (Football)
                </Label>
                <Input
                  id="fifa_id"
                  type="text"
                  placeholder="FIFA Player ID"
                  value={formData.fifa_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, fifa_id: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="current_club" className="text-white font-polysans">
                  Current Club
                </Label>
                <Input
                  id="current_club"
                  type="text"
                  placeholder="Club Name"
                  value={formData.current_club}
                  onChange={(e) => setFormData(prev => ({ ...prev, current_club: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="market_value" className="text-white font-polysans">
                  Market Value (USD) *
                </Label>
                <Input
                  id="market_value"
                  type="number"
                  placeholder="50000"
                  value={formData.market_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, market_value: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                  required
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="joined_date" className="text-white font-polysans">
                  Joined Date
                </Label>
                <Input
                  id="joined_date"
                  type="date"
                  value={formData.joined_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, joined_date: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>

              <div className="space-y-3">
                <Label htmlFor="contract_expires" className="text-white font-polysans">
                  Contract Expires
                </Label>
                <Input
                  id="contract_expires"
                  type="date"
                  value={formData.contract_expires}
                  onChange={(e) => setFormData(prev => ({ ...prev, contract_expires: e.target.value }))}
                  className="bg-gray-800 border-gray-600 text-white"
                />
              </div>
            </div>
          </div>

          {/* Biography */}
          <div className="space-y-6">
            <h3 className="text-white font-polysans text-lg flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Biography & Description
            </h3>
            
            <div className="space-y-3">
              <Label htmlFor="bio" className="text-white font-polysans">
                Player Biography *
              </Label>
              <Textarea
                id="bio"
                placeholder="Describe the player's playing style, achievements, and career highlights..."
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                className="bg-gray-800 border-gray-600 text-white min-h-[120px]"
                required
              />
            </div>
          </div>

          {/* Photo Uploads */}
          <div className="space-y-6">
            <h3 className="text-white font-polysans text-lg flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Player Photos
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'photo', label: 'General Photo' },
                { key: 'headshot', label: 'Headshot' },
                { key: 'portrait', label: 'Portrait' },
                { key: 'full_body', label: 'Full Body' }
              ].map(({ key, label }) => (
                <div key={key} className="space-y-3">
                  <Label className="text-white font-polysans">{label}</Label>
                  <div className="border-2 border-dashed border-rosegold/30 rounded-lg p-4 text-center">
                    {formData[`${key}_url` as keyof typeof formData] ? (
                      <div className="space-y-3">
                        <img
                          src={formData[`${key}_url` as keyof typeof formData] as string}
                          alt={label}
                          className="w-20 h-20 mx-auto rounded-lg object-cover"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setFormData(prev => ({ ...prev, [`${key}_url`]: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Upload className="w-8 h-8 mx-auto text-gray-400" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                handleFileUpload(file, key as 'photo' | 'headshot' | 'portrait' | 'full_body');
                              }
                            };
                            input.click();
                          }}
                        >
                          Upload {label}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-6 border-t border-gray-700">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-rosegold hover:bg-rosegold/90 text-black font-polysans"
            >
              {loading ? 'Saving...' : (player ? 'Update Player' : 'Add Player')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default EnhancedPlayerForm;
