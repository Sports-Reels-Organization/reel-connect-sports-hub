
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import InfoTooltip from '@/components/InfoTooltip';

const countries = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Algeria', 'Tunisia',
  'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Brazil', 'Argentina', 'USA'
];

const sports = [
  { value: 'football', label: 'Football ⚽' },
  { value: 'basketball', label: 'Basketball 🏀' },
  { value: 'volleyball', label: 'Volleyball 🏐' },
  { value: 'tennis', label: 'Tennis 🎾' },
  { value: 'rugby', label: 'Rugby 🏈' }
];

const OnboardingFlow = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Form data
  const [basicInfo, setBasicInfo] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    country: profile?.country || ''
  });

  const [teamInfo, setTeamInfo] = useState({
    team_name: '',
    sport_type: '',
    year_founded: '',
    league: '',
    member_association: '',
    description: ''
  });

  const [agentInfo, setAgentInfo] = useState({
    agency_name: '',
    fifa_id: '',
    license_number: '',
    specialization: [] as string[],
    bio: '',
    website: ''
  });

  const handleBasicInfoSubmit = async () => {
    setLoading(true);
    try {
      await updateProfile({
        ...basicInfo,
        profile_completed: false
      });
      setStep(2);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update basic information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setLoading(true);
    try {
      // Create team or agent specific profile
      if (profile?.user_type === 'team') {
        const { error } = await supabase
          .from('teams')
          .insert({
            profile_id: profile.id,
            team_name: teamInfo.team_name,
            sport_type: teamInfo.sport_type as 'football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby',
            year_founded: teamInfo.year_founded ? parseInt(teamInfo.year_founded) : null,
            country: basicInfo.country,
            league: teamInfo.league,
            member_association: teamInfo.member_association,
            description: teamInfo.description
          });
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agents')
          .insert({
            profile_id: profile.id,
            agency_name: agentInfo.agency_name,
            fifa_id: agentInfo.fifa_id,
            license_number: agentInfo.license_number,
            specialization: agentInfo.specialization as ('football' | 'basketball' | 'volleyball' | 'tennis' | 'rugby')[],
            bio: agentInfo.bio,
            website: agentInfo.website
          });
        
        if (error) throw error;
      }

      // Mark profile as completed
      await updateProfile({ profile_completed: true });

      toast({
        title: "Welcome to Sports Reels!",
        description: "Your profile has been created successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to complete profile setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl bg-white">
        <CardHeader className="text-center">
          <CardTitle className="font-polysans text-2xl text-black">
            {step === 1 ? 'Basic Information' : `${profile?.user_type === 'team' ? 'Team' : 'Agent'} Profile`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <InfoTooltip content="Your full name as it appears on official documents" />
                </div>
                <Input
                  id="full_name"
                  value={basicInfo.full_name}
                  onChange={(e) => setBasicInfo({...basicInfo, full_name: e.target.value})}
                  className="font-poppins"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <InfoTooltip content="Your contact phone number for important notifications" />
                </div>
                <Input
                  id="phone"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({...basicInfo, phone: e.target.value})}
                  className="font-poppins"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="country">Country</Label>
                  <InfoTooltip content="Your primary country of operation" />
                </div>
                <Select value={basicInfo.country} onValueChange={(value) => setBasicInfo({...basicInfo, country: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleBasicInfoSubmit}
                disabled={loading || !basicInfo.full_name || !basicInfo.country}
                className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </>
          ) : profile?.user_type === 'team' ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="team_name">Team Name</Label>
                  <InfoTooltip content="Official name of your football club or team" />
                </div>
                <Input
                  id="team_name"
                  value={teamInfo.team_name}
                  onChange={(e) => setTeamInfo({...teamInfo, team_name: e.target.value})}
                  className="font-poppins"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label>Sport</Label>
                  <InfoTooltip content="Primary sport your team competes in" />
                </div>
                <Select value={teamInfo.sport_type} onValueChange={(value) => setTeamInfo({...teamInfo, sport_type: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select sport" />
                  </SelectTrigger>
                  <SelectContent>
                    {sports.map((sport) => (
                      <SelectItem key={sport.value} value={sport.value}>{sport.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year_founded">Year Founded</Label>
                  <Input
                    id="year_founded"
                    type="number"
                    value={teamInfo.year_founded}
                    onChange={(e) => setTeamInfo({...teamInfo, year_founded: e.target.value})}
                    className="font-poppins"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="league">League</Label>
                  <Input
                    id="league"
                    value={teamInfo.league}
                    onChange={(e) => setTeamInfo({...teamInfo, league: e.target.value})}
                    placeholder="e.g. NPFL, Premier League"
                    className="font-poppins"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description">Team Description</Label>
                  <InfoTooltip content="Brief description of your team's history and achievements" />
                </div>
                <Textarea
                  id="description"
                  value={teamInfo.description}
                  onChange={(e) => setTeamInfo({...teamInfo, description: e.target.value})}
                  className="font-poppins"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleFinalSubmit}
                disabled={loading || !teamInfo.team_name || !teamInfo.sport_type}
                className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="agency_name">Agency Name</Label>
                  <InfoTooltip content="Name of your sports agency or your professional name" />
                </div>
                <Input
                  id="agency_name"
                  value={agentInfo.agency_name}
                  onChange={(e) => setAgentInfo({...agentInfo, agency_name: e.target.value})}
                  className="font-poppins"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fifa_id">FIFA ID (Optional)</Label>
                    <InfoTooltip content="Your official FIFA agent ID if you're licensed for football" />
                  </div>
                  <Input
                    id="fifa_id"
                    value={agentInfo.fifa_id}
                    onChange={(e) => setAgentInfo({...agentInfo, fifa_id: e.target.value})}
                    className="font-poppins"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number">License Number</Label>
                  <Input
                    id="license_number"
                    value={agentInfo.license_number}
                    onChange={(e) => setAgentInfo({...agentInfo, license_number: e.target.value})}
                    className="font-poppins"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bio">Professional Bio</Label>
                  <InfoTooltip content="Brief description of your experience and specializations" />
                </div>
                <Textarea
                  id="bio"
                  value={agentInfo.bio}
                  onChange={(e) => setAgentInfo({...agentInfo, bio: e.target.value})}
                  className="font-poppins"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleFinalSubmit}
                disabled={loading || !agentInfo.agency_name}
                className="w-full bg-bright-pink hover:bg-bright-pink/90 text-white font-poppins"
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OnboardingFlow;
