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
import { useSports } from '@/hooks/useSports';

const countries = [
  'Nigeria', 'Ghana', 'Kenya', 'South Africa', 'Egypt', 'Morocco', 'Algeria', 'Tunisia',
  'United Kingdom', 'Germany', 'France', 'Spain', 'Italy', 'Brazil', 'Argentina', 'USA'
];

const OnboardingFlow = () => {
  const { profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { sports, loading: sportsLoading } = useSports();
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
    if (!basicInfo.full_name || !basicInfo.country) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      await updateProfile({
        ...basicInfo,
        profile_completed: false
      });
      setStep(2);
      toast({
        title: "Success",
        description: "Basic information saved successfully",
      });
    } catch (error) {
      console.error('Error updating basic info:', error);
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
    if (profile?.user_type === 'team' && (!teamInfo.team_name || !teamInfo.sport_type)) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    if (profile?.user_type === 'agent' && !agentInfo.agency_name) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

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

        if (error) {
          console.error('Error creating team profile:', error);
          throw error;
        }
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

        if (error) {
          console.error('Error creating agent profile:', error);
          throw error;
        }
      }

      // Mark profile as completed
      await updateProfile({ profile_completed: true });

      toast({
        title: "Welcome to Sports Reels!",
        description: "Your profile has been created successfully.",
      });
    } catch (error) {
      console.error('Final submit error:', error);
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
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated sports background elements */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-bright-pink rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-rosegold rounded-full animate-bounce"></div>
        <div className="absolute bottom-32 left-40 w-28 h-28 bg-bright-pink rounded-full animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-20 h-20 bg-rosegold rounded-full animate-bounce"></div>
      </div>

      <Card className="w-full max-w-2xl bg-white/10 backdrop-blur-lg border-rosegold/30 shadow-2xl relative z-10">
        <CardHeader className="text-center pb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-gradient-to-r from-bright-pink to-rosegold rounded-full flex items-center justify-center">
              <span className="text-2xl">⚽</span>
            </div>
          </div>
          <CardTitle className="font-polysans text-3xl text-white mb-2">
            {step === 1 ? 'Basic Information' : `${profile?.user_type === 'team' ? 'Team' : 'Agent'} Profile`}
          </CardTitle>
          <div className="w-32 h-1 bg-gradient-to-r from-bright-pink to-rosegold mx-auto rounded-full"></div>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          {step === 1 ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="full_name" className="text-white font-medium">Full Name</Label>
                  <InfoTooltip content="Your full name as it appears on official documents" />
                </div>
                <Input
                  id="full_name"
                  value={basicInfo.full_name}
                  onChange={(e) => setBasicInfo({ ...basicInfo, full_name: e.target.value })}
                  className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                  placeholder="Enter your full name"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="phone" className="text-white font-medium">Phone Number</Label>
                  <InfoTooltip content="Your contact phone number for important notifications" />
                </div>
                <Input
                  id="phone"
                  value={basicInfo.phone}
                  onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                  className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                  placeholder="Enter your phone number"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="country" className="text-white font-medium">Country</Label>
                  <InfoTooltip content="Your primary country of operation" />
                </div>
                <Select value={basicInfo.country} onValueChange={(value) => setBasicInfo({ ...basicInfo, country: value })}>
                  <SelectTrigger className="bg-white/5 border-rosegold/30 text-white focus:border-bright-pink">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-rosegold/30">
                    {countries.map((country) => (
                      <SelectItem key={country} value={country} className="text-white hover:bg-rosegold/20">
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleBasicInfoSubmit}
                disabled={loading || !basicInfo.full_name || !basicInfo.country}
                className="w-full bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/90 hover:to-rosegold/90 text-white font-poppins font-medium py-6 text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                {loading ? 'Saving...' : 'Continue'}
              </Button>
            </>
          ) : profile?.user_type === 'team' ? (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="team_name" className="text-white font-medium">Team Name</Label>
                  <InfoTooltip content="Official name of your football club or team" />
                </div>
                <Input
                  id="team_name"
                  value={teamInfo.team_name}
                  onChange={(e) => setTeamInfo({ ...teamInfo, team_name: e.target.value })}
                  className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                  placeholder="Enter your team name"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label className="text-white font-medium">Sport</Label>
                  <InfoTooltip content="Primary sport your team competes in" />
                </div>
                <Select 
                  value={teamInfo.sport_type} 
                  onValueChange={(value) => setTeamInfo({ ...teamInfo, sport_type: value })}
                  disabled={sportsLoading}
                >
                  <SelectTrigger className="bg-white/5 border-rosegold/30 text-white focus:border-bright-pink">
                    <SelectValue placeholder={sportsLoading ? "Loading sports..." : "Select sport"} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-900 border-rosegold/30">
                    {sports.map((sport) => (
                      <SelectItem key={sport.id} value={sport.value} className="text-white hover:bg-rosegold/20">
                        {sport.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="year_founded" className="text-white font-medium">Year Founded</Label>
                  <Input
                    id="year_founded"
                    type="number"
                    value={teamInfo.year_founded}
                    onChange={(e) => setTeamInfo({ ...teamInfo, year_founded: e.target.value })}
                    className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                    placeholder="e.g. 1990"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="league" className="text-white font-medium">League</Label>
                  <Input
                    id="league"
                    value={teamInfo.league}
                    onChange={(e) => setTeamInfo({ ...teamInfo, league: e.target.value })}
                    placeholder="e.g. NPFL, Premier League"
                    className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="description" className="text-white font-medium">Team Description</Label>
                  <InfoTooltip content="Brief description of your team's history and achievements" />
                </div>
                <Textarea
                  id="description"
                  value={teamInfo.description}
                  onChange={(e) => setTeamInfo({ ...teamInfo, description: e.target.value })}
                  className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins resize-none"
                  placeholder="Tell us about your team..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleFinalSubmit}
                disabled={loading || !teamInfo.team_name || !teamInfo.sport_type}
                className="w-full bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/90 hover:to-rosegold/90 text-white font-poppins font-medium py-6 text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
              >
                {loading ? 'Creating Profile...' : 'Complete Setup'}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="agency_name" className="text-white font-medium">Agency Name</Label>
                  <InfoTooltip content="Name of your sports agency or your professional name" />
                </div>
                <Input
                  id="agency_name"
                  value={agentInfo.agency_name}
                  onChange={(e) => setAgentInfo({ ...agentInfo, agency_name: e.target.value })}
                  className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                  placeholder="Enter your agency name"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="fifa_id" className="text-white font-medium">FIFA ID (Optional)</Label>
                    <InfoTooltip content="Your official FIFA agent ID if you're licensed for football" />
                  </div>
                  <Input
                    id="fifa_id"
                    value={agentInfo.fifa_id}
                    onChange={(e) => setAgentInfo({ ...agentInfo, fifa_id: e.target.value })}
                    className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                    placeholder="FIFA ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="license_number" className="text-white font-medium">License Number</Label>
                  <Input
                    id="license_number"
                    value={agentInfo.license_number}
                    onChange={(e) => setAgentInfo({ ...agentInfo, license_number: e.target.value })}
                    className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins"
                    placeholder="License number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="bio" className="text-white font-medium">Professional Bio</Label>
                  <InfoTooltip content="Brief description of your experience and specializations" />
                </div>
                <Textarea
                  id="bio"
                  value={agentInfo.bio}
                  onChange={(e) => setAgentInfo({ ...agentInfo, bio: e.target.value })}
                  className="bg-white/5 border-rosegold/30 text-white placeholder-gray-400 focus:border-bright-pink font-poppins resize-none"
                  placeholder="Tell us about your professional experience..."
                  rows={3}
                />
              </div>

              <Button
                onClick={handleFinalSubmit}
                disabled={loading || !agentInfo.agency_name}
                className="w-full bg-gradient-to-r from-bright-pink to-rosegold hover:from-bright-pink/90 hover:to-rosegold/90 text-white font-poppins font-medium py-6 text-lg shadow-lg transition-all duration-300 transform hover:scale-105"
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
