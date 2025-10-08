import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { LeagueSelect } from '@/components/ui/LeagueSelect';
import { AssociationSelect } from '@/components/ui/AssociationSelect';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useSportData, getSportDisplayName, getSportIcon, getAvailableSports } from '@/hooks/useSportData';
import { Upload, Users, Trophy, Video, Plus, X, Camera, FileImage } from 'lucide-react';
import InfoTooltip from './InfoTooltip';
import imageCompression from 'browser-image-compression';



interface TeamData {
  team_name: string;
  sport_type: string;
  member_association: string;
  year_founded: string;
  country: string;
  league: string;
  description: string;
  logo_url: string;
  titles: string[];
}

const TeamProfileSetup: React.FC = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [teamData, setTeamData] = useState<TeamData>({
    team_name: '',
    sport_type: '',
    member_association: '',
    year_founded: '',
    country: '',
    league: '',
    description: '',
    logo_url: '',
    titles: []
  });
  const [currentPlayers, setCurrentPlayers] = useState(0);
  const [uploadedVideos, setUploadedVideos] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  // Get available sports and sport-specific data
  const availableSports = getAvailableSports();
  const sportData = useSportData(teamData.sport_type, 'male'); // Teams are typically male-focused for titles

  useEffect(() => {
    fetchTeamData();
    fetchPlayerCount();
    fetchVideoCount();
  }, [profile]);

  const fetchTeamData = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching team data:', error);
        return;
      }

      if (data) {
        setTeamData({
          team_name: data.team_name || '',
          sport_type: data.sport_type || '',
          member_association: data.member_association || '',
          year_founded: data.year_founded?.toString() || '',
          country: data.country || '',
          league: data.league || '',
          description: data.description || '',
          logo_url: data.logo_url || '',
          titles: data.titles || []
        });
        checkProfileCompletion(data);
      }
    } catch (error) {
      console.error('Error fetching team data:', error);
    }
  };

  const fetchPlayerCount = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamData) {
        const { count } = await supabase
          .from('players')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', teamData.id);

        setCurrentPlayers(count || 0);
      }
    } catch (error) {
      console.error('Error fetching player count:', error);
    }
  };

  const fetchVideoCount = async () => {
    if (!profile?.id) return;

    try {
      const { data: teamData } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (teamData) {
        const { count } = await supabase
          .from('videos')
          .select('*', { count: 'exact', head: true })
          .eq('team_id', teamData.id);

        setUploadedVideos(count || 0);
      }
    } catch (error) {
      console.error('Error fetching video count:', error);
    }
  };

  const compressAndConvertToBase64 = async (file: File): Promise<string> => {
    try {
      // Compression options
      const options = {
        maxSizeMB: 0.5, // Maximum size 0.5MB
        maxWidthOrHeight: 400, // Maximum dimension 400px
        useWebWorker: true,
        fileType: 'image/jpeg'
      };

      // Compress the image
      const compressedFile = await imageCompression(file, options);

      // Convert to base64
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedFile);
      });
    } catch (error) {
      console.error('Error compressing image:', error);
      throw error;
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Please select an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (5MB limit before compression)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive"
      });
      return;
    }

    setLogoUploading(true);
    try {
      // Compress and convert to base64
      const base64Logo = await compressAndConvertToBase64(file);

      // Update team data with base64 logo
      setTeamData(prev => ({ ...prev, logo_url: base64Logo }));

      toast({
        title: "Success",
        description: "Team logo uploaded and compressed successfully",
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLogoUploading(false);
      // Clear the input
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const removeLogo = () => {
    setTeamData(prev => ({ ...prev, logo_url: '' }));
    if (logoInputRef.current) {
      logoInputRef.current.value = '';
    }
  };

  const checkProfileCompletion = (data: any) => {
    const requiredFields = ['team_name', 'sport_type', 'country', 'league'];
    const isComplete = requiredFields.every(field => data[field]);
    setIsComplete(isComplete && currentPlayers > 0 && uploadedVideos >= 5);
  };

  const handleSave = async () => {
    if (!profile?.id) return;

    if (!teamData.team_name || !teamData.sport_type || !teamData.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const { data: existingTeam } = await supabase
        .from('teams')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      const teamPayload = {
        profile_id: profile.id,
        team_name: teamData.team_name,
        sport_type: teamData.sport_type as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby',
        member_association: teamData.member_association,
        year_founded: teamData.year_founded ? parseInt(teamData.year_founded) : null,
        country: teamData.country,
        league: teamData.league,
        description: teamData.description,
        logo_url: teamData.logo_url,
        titles: teamData.titles
      };

      if (existingTeam) {
        const { error } = await supabase
          .from('teams')
          .update(teamPayload)
          .eq('id', existingTeam.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('teams')
          .insert(teamPayload);

        if (error) throw error;
      }

      await fetchPlayerCount();
      await fetchVideoCount();
      checkProfileCompletion(teamPayload);

      toast({
        title: "Success",
        description: "Team profile saved successfully",
      });

    } catch (error) {
      console.error('Error saving team data:', error);
      toast({
        title: "Error",
        description: "Failed to save team profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addTitle = () => {
    if (newTitle.trim() && !teamData.titles.includes(newTitle.trim())) {
      setTeamData(prev => ({
        ...prev,
        titles: [...prev.titles, newTitle.trim()]
      }));
      setNewTitle('');
    }
  };

  const updateTitle = (index: number, value: string) => {
    setTeamData(prev => ({
      ...prev,
      titles: prev.titles.map((title, i) => i === index ? value : title)
    }));
  };

  const removeTitle = (index: number) => {
    setTeamData(prev => ({
      ...prev,
      titles: prev.titles.filter((_, i) => i !== index)
    }));
  };

  if (profile?.user_type !== 'team') {
    return null;
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-polysans text-3xl font-bold text-white mb-2">
          Team Profile Setup
        </h1>
        <p className="text-gray-400 mb-4">
          Complete your team profile to access all platform features
        </p>

        {/* Sport Display */}
        {teamData.sport_type && (
          <div className="flex items-center justify-center gap-2 mb-6">
            <span className="text-2xl">{getSportIcon(teamData.sport_type)}</span>
            <Badge variant="outline" className="text-rosegold border-rosegold">
              {getSportDisplayName(teamData.sport_type)} Team
            </Badge>
          </div>
        )}

        {/* Progress Indicators */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-rosegold" />
              <p className="text-sm font-medium text-gray-300">Current Players</p>
              <p className="text-2xl font-bold text-white">{currentPlayers}</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Video className="w-8 h-8 mx-auto mb-2 text-bright-pink" />
              <p className="text-sm font-medium text-gray-300">Videos Uploaded</p>
              <p className="text-2xl font-bold text-white">{uploadedVideos}</p>
              <p className="text-xs text-gray-500">Min. 5 required</p>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4 text-center">
              <Trophy className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-sm font-medium text-gray-300">Profile Status</p>
              <p className={`text-sm font-medium ${isComplete ? 'text-green-400' : 'text-orange-400'}`}>
                {isComplete ? 'Complete' : 'Incomplete'}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Information Form */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="font-polysans text-white flex items-center gap-2">
            Team Information
            <InfoTooltip content="Complete all required fields to enable platform features" />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Logo Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <FileImage className="w-5 h-5 text-rosegold" />
              <Label className="text-white text-lg font-semibold">Team Logo</Label>
              <Badge variant="outline" className="text-gray-400 border-gray-600 text-xs">
                Recommended
              </Badge>
            </div>

            <div className="flex items-center gap-6">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                {teamData.logo_url ? (
                  <div className="relative group">
                    <img
                      src={teamData.logo_url}
                      alt="Team Logo"
                      className="w-24 h-24 object-cover rounded-lg border-2 border-gray-600"
                    />
                    <button
                      onClick={removeLogo}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-500" />
                  </div>
                )}
              </div>

              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={logoUploading}
                  className="mb-2"
                >
                  {logoUploading ? (
                    <>
                      <Upload className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      {teamData.logo_url ? 'Change Logo' : 'Upload Logo'}
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-400">
                  Recommended: Square image, max 5MB. Will be compressed to 400x400px.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="team_name" className="text-white">Team Name *</Label>
              <Input
                id="team_name"
                value={teamData.team_name}
                onChange={(e) => setTeamData(prev => ({ ...prev, team_name: e.target.value }))}
                className="bg-background border-border text-white"
                placeholder="Enter team name"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Sport Type *</Label>
              <Select
                value={teamData.sport_type}
                onValueChange={(value) => setTeamData(prev => ({ ...prev, sport_type: value }))}
              >
                <SelectTrigger className="bg-background border-border text-white">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {availableSports.map((sport) => (
                    <SelectItem key={sport} value={sport} className="text-white">
                      <span className="flex items-center gap-2">
                        <span>{getSportIcon(sport)}</span>
                        {getSportDisplayName(sport)}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Country *</Label>
              <CountrySelect
                value={teamData.country}
                onValueChange={(value) => setTeamData(prev => ({ ...prev, country: value }))}
                placeholder="Select country"
                triggerClassName="bg-background border-border text-white"
                contentClassName="bg-card border-border"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">League/Competition *</Label>
              <LeagueSelect
                value={teamData.league}
                onValueChange={(value) => setTeamData(prev => ({ ...prev, league: value }))}
                leagues={sportData.leagues}
                placeholder="Select league"
                triggerClassName="bg-background border-border text-white"
                contentClassName="bg-card border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="year_founded" className="text-white">Year Founded</Label>
              <Input
                id="year_founded"
                type="number"
                value={teamData.year_founded}
                onChange={(e) => setTeamData(prev => ({ ...prev, year_founded: e.target.value }))}
                className="bg-background border-border text-white"
                placeholder="e.g., 1990"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member_association" className="text-white">Member Association</Label>
              <AssociationSelect
                value={teamData.member_association}
                onValueChange={(value) => setTeamData(prev => ({ ...prev, member_association: value }))}
                associations={sportData.associations}
                placeholder="Select association"
                triggerClassName="bg-background border-border text-white"
                contentClassName="bg-card border-border"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-white">Team Description</Label>
            <Textarea
              id="description"
              value={teamData.description}
              onChange={(e) => setTeamData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-background border-border text-white resize-none"
              placeholder="Brief description of your team's history and achievements"
              rows={3}
            />
          </div>

          {/* Enhanced Titles Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-rosegold" />
              <Label className="text-white text-lg font-semibold">Titles and Achievements</Label>
            </div>

            {/* Add New Title */}
            <div className="flex gap-2">
              <Select value={newTitle} onValueChange={setNewTitle}>
                <SelectTrigger className="bg-background border-border text-white flex-1">
                  <SelectValue placeholder="Select from suggested titles or type custom" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {sportData.titles.map((title) => (
                    <SelectItem key={title} value={title} className="text-white">
                      {title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-background border-border text-white flex-1"
                placeholder="Or type a custom title..."
              />
              <Button
                type="button"
                onClick={addTitle}
                disabled={!newTitle.trim()}
                className="bg-rosegold hover:bg-rosegold/90 text-white"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {/* Sport-specific suggestions info */}
            {teamData.sport_type && sportData.titles.length > 0 && (
              <div className="text-sm text-gray-400">
                <p>Suggested titles for {getSportDisplayName(teamData.sport_type)}:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {sportData.titles.slice(0, 3).map((title, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="text-xs cursor-pointer hover:bg-rosegold hover:text-white"
                      onClick={() => setNewTitle(title)}
                    >
                      {title}
                    </Badge>
                  ))}
                  {sportData.titles.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{sportData.titles.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Current Titles */}
            {teamData.titles.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white text-sm font-medium">Current Titles ({teamData.titles.length})</Label>
                <div className="space-y-2">
                  {teamData.titles.map((title, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-800 rounded-lg">
                      <Trophy className="w-4 h-4 text-rosegold flex-shrink-0" />
                      <Input
                        value={title}
                        onChange={(e) => updateTitle(index, e.target.value)}
                        className="bg-transparent border-0 text-white flex-1"
                        placeholder="Title name"
                      />
                      <Button
                        type="button"
                        onClick={() => removeTitle(index)}
                        variant="ghost"
                        size="sm"
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty state */}
            {teamData.titles.length === 0 && (
              <div className="text-center py-6 text-gray-400">
                <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No titles added yet. Add your team's achievements and titles above.</p>
              </div>
            )}
          </div>

          <Button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-rosegold hover:bg-rosegold/90 text-white"
          >
            {loading ? 'Saving...' : 'Save Team Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Requirements Notice */}
      {!isComplete && (
        <Card className="bg-orange-500/10 border-orange-500/30">
          <CardContent className="p-6">
            <h3 className="font-polysans font-semibold text-orange-400 mb-2">
              Complete Your Profile
            </h3>
            <p className="text-orange-300 mb-4">
              To access all platform features, you need to:
            </p>
            <ul className="text-orange-300 space-y-2">
              <li>• Complete team information (required fields marked with *)</li>
              <li>• Add at least one player to your team</li>
              <li>• Upload at least 5 videos</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TeamProfileSetup;
