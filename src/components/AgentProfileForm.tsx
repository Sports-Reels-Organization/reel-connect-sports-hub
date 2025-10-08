
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Upload, Building2, Calendar, Globe, Award, FileImage } from 'lucide-react';
import { useSportData } from '@/hooks/useSportData';
import { AssociationSelect } from '@/components/ui/AssociationSelect';

interface AgentProfileFormProps {
  onProfileComplete?: () => void;
}

export const AgentProfileForm: React.FC<AgentProfileFormProps> = ({ onProfileComplete }) => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [agentData, setAgentData] = useState({
    agency_name: '',
    bio: '',
    fifa_id: '',
    license_number: '',
    website: '',
    logo_url: '',
    year_founded: '',
    member_association: '',
    specialization: [] as string[]
  });

  const sportTypes = ['football', 'basketball', 'volleyball', 'tennis', 'rugby'];

  // Get sport-specific data for associations (use first specialization or default to football)
  const primarySport = agentData.specialization.length > 0 ? agentData.specialization[0] : 'football';
  const sportData = useSportData(primarySport, 'male');

  useEffect(() => {
    if (profile?.user_type === 'agent') {
      fetchAgentData();
    }
  }, [profile]);

  const fetchAgentData = async () => {
    if (!profile) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('profile_id', profile.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setAgentData({
          agency_name: data.agency_name || '',
          bio: data.bio || '',
          fifa_id: data.fifa_id || '',
          license_number: data.license_number || '',
          website: data.website || '',
          logo_url: (data as any).logo_url || '',
          year_founded: (data as any).year_founded?.toString() || '',
          member_association: (data as any).member_association || '',
          specialization: data.specialization || []
        });
      }
    } catch (error) {
      console.error('Error fetching agent data:', error);
      toast({
        title: "Error",
        description: "Failed to load agent profile",
        variant: "destructive"
      });
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !profile) return;

    setLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('player-photos')
        .upload(`agent-logos/${fileName}`, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('player-photos')
        .getPublicUrl(`agent-logos/${fileName}`);

      setAgentData(prev => ({ ...prev, logo_url: urlData.publicUrl }));

      toast({
        title: "Success",
        description: "Logo uploaded successfully",
      });
    } catch (error) {
      console.error('Logo upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload logo",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    // Validation for football agents
    if (agentData.specialization.includes('football') && !agentData.fifa_id) {
      toast({
        title: "FIFA ID Required",
        description: "FIFA ID is required for football agents",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const dataToSave: any = {
        profile_id: profile.id,
        agency_name: agentData.agency_name,
        bio: agentData.bio,
        fifa_id: agentData.fifa_id || null,
        license_number: agentData.license_number || null,
        website: agentData.website || null,
        specialization: agentData.specialization as any
      };

      // Add the new fields as raw data since they're not in the TypeScript types yet
      if (agentData.logo_url) dataToSave.logo_url = agentData.logo_url;
      if (agentData.year_founded) dataToSave.year_founded = parseInt(agentData.year_founded);
      if (agentData.member_association) dataToSave.member_association = agentData.member_association;

      const { error } = await supabase
        .from('agents')
        .upsert(dataToSave, { onConflict: 'profile_id' });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Agent profile updated successfully",
      });

      if (onProfileComplete) {
        onProfileComplete();
      }
    } catch (error) {
      console.error('Error saving agent profile:', error);
      toast({
        title: "Error",
        description: "Failed to save agent profile",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (profile?.user_type !== 'agent') {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-500">This form is only available for agent accounts.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl border-0 mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 ">

          Agent Profile Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Agency Logo */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileImage className="w-4 h-4" />
              Agency Logo
            </Label>
            <div className="flex items-center gap-4">
              {agentData.logo_url && (
                <img
                  src={agentData.logo_url}
                  alt="Agency Logo"
                  className="w-20 h-20 object-cover rounded-lg border"
                />
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="max-w-xs"
                />
                <p className="text-sm text-gray-500 mt-1">Upload your agency logo</p>
              </div>
            </div>
          </div>

          {/* Agency Name */}
          <div className="space-y-2">
            <Label htmlFor="agency_name">Agency Name *</Label>
            <Input
              id="agency_name"
              value={agentData.agency_name}
              onChange={(e) => setAgentData(prev => ({ ...prev, agency_name: e.target.value }))}
              placeholder="Enter your agency name"
              required
            />
          </div>

          {/* Sport Specialization */}
          <div className="space-y-2">
            <Label>Sport Specialization *</Label>
            <Select
              value={agentData.specialization[0] || ''}
              onValueChange={(value) => setAgentData(prev => ({ ...prev, specialization: [value] }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your sport specialization" />
              </SelectTrigger>
              <SelectContent>
                {sportTypes.map(sport => (
                  <SelectItem key={sport} value={sport}>
                    {sport.charAt(0).toUpperCase() + sport.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* FIFA ID - Required for football */}
          {agentData.specialization.includes('football') && (
            <div className="space-y-2">
              <Label htmlFor="fifa_id" className="flex items-center gap-2">
                <Award className="w-4 h-4" />
                FIFA Licensed ID *
              </Label>
              <Input
                id="fifa_id"
                value={agentData.fifa_id}
                onChange={(e) => setAgentData(prev => ({ ...prev, fifa_id: e.target.value }))}
                placeholder="Enter your FIFA ID"
                required
              />
              <p className="text-sm text-red-400">FIFA ID is required for football agents to message players and offer contracts</p>
            </div>
          )}

          {/* License Number */}
          <div className="space-y-2">
            <Label htmlFor="license_number">License Number</Label>
            <Input
              id="license_number"
              value={agentData.license_number}
              onChange={(e) => setAgentData(prev => ({ ...prev, license_number: e.target.value }))}
              placeholder="Enter your license number"
            />
          </div>

          {/* Member Association */}
          <div className="space-y-2">
            <Label htmlFor="member_association">Member Association</Label>
            <AssociationSelect
              value={agentData.member_association}
              onValueChange={(value) => setAgentData(prev => ({ ...prev, member_association: value }))}
              associations={sportData.associations}
              placeholder="Select association"
            />
          </div>

          {/* Year Founded */}
          <div className="space-y-2">
            <Label htmlFor="year_founded" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Year Founded
            </Label>
            <Input
              id="year_founded"
              type="number"
              min="1900"
              max={new Date().getFullYear()}
              value={agentData.year_founded}
              onChange={(e) => setAgentData(prev => ({ ...prev, year_founded: e.target.value }))}
              placeholder="Enter founding year"
            />
          </div>

          {/* Website */}
          <div className="space-y-2">
            <Label htmlFor="website" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Website
            </Label>
            <Input
              id="website"
              type="url"
              value={agentData.website}
              onChange={(e) => setAgentData(prev => ({ ...prev, website: e.target.value }))}
              placeholder="https://yourwebsite.com"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea
              id="bio"
              value={agentData.bio}
              onChange={(e) => setAgentData(prev => ({ ...prev, bio: e.target.value }))}
              placeholder="Tell us about your agency and experience..."
              rows={4}
            />
          </div>

          <Button
            type="submit"
            disabled={loading || !agentData.agency_name}
            className="w-full bg-rosegold hover:bg-rosegold/90"
          >
            {loading ? (
              <>
                <Upload className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Agent Profile'
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AgentProfileForm;
