
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCountries } from '@/hooks/useCountries';
import { useCountryCodes } from '@/hooks/useCountryCodes';
import { useSports } from '@/hooks/useSports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, User, Building, Globe, Trophy, CheckCircle } from 'lucide-react';

interface BasicInfo {
  full_name: string;
  email: string;
  country: string;
  phone: string;
  country_code: string;
}

interface AgentInfo {
  agency_name: string;
  specialization: string[];
  fifa_id?: string;
  license_number?: string;
}

interface TeamInfo {
  team_name: string;
  league: string;
  country: string;
  sport_type: string;
  founded_year?: string;
}

const OnboardingFlow = () => {
  const { user, profile, updateProfile } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { countries } = useCountries();
  const { countryCodes } = useCountryCodes();
  const { sports } = useSports();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<'agent' | 'team'>('team');

  const [basicInfo, setBasicInfo] = useState<BasicInfo>({
    full_name: '',
    email: '',
    country: '',
    phone: '',
    country_code: ''
  });

  const [agentInfo, setAgentInfo] = useState<AgentInfo>({
    agency_name: '',
    specialization: [],
    fifa_id: '',
    license_number: ''
  });

  const [teamInfo, setTeamInfo] = useState<TeamInfo>({
    team_name: '',
    league: '',
    country: '',
    sport_type: '',
    founded_year: ''
  });

  // Initialize user type and basic info from localStorage and user data
  useEffect(() => {
    // Get user type from localStorage (set during auth)
    const pendingUserType = localStorage.getItem('pending_user_type') as 'agent' | 'team' | null;
    if (pendingUserType) {
      console.log('Setting user type from localStorage:', pendingUserType);
      setUserType(pendingUserType);
    }

    // Initialize basic info from user data and profile
    if (user) {
      setBasicInfo(prev => ({
        ...prev,
        full_name: user.user_metadata?.full_name || profile?.full_name || '',
        email: user.email || profile?.email || ''
      }));
    }
  }, [user, profile]);

  const handleBasicInfoSubmit = async () => {
    if (!user || !basicInfo.full_name || !basicInfo.country) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create or update profile with basic info and user type
      const profileData = {
        user_id: user.id,
        full_name: basicInfo.full_name,
        email: basicInfo.email,
        country: basicInfo.country,
        phone: basicInfo.phone || null,
        country_code: basicInfo.country_code || null,
        user_type: userType,
        profile_completed: false
      };

      const { error } = await supabase
        .from('profiles')
        .upsert(profileData);

      if (error) throw error;

      // Clear the pending user type from localStorage
      localStorage.removeItem('pending_user_type');

      // Move to the appropriate next step based on user type
      if (userType === 'agent') {
        setCurrentStep(2); // Agent info step
      } else {
        setCurrentStep(3); // Team info step
      }

      toast({
        title: "Success",
        description: "Basic information saved successfully",
      });
    } catch (error) {
      console.error('Error saving basic info:', error);
      toast({
        title: "Error",
        description: "Failed to save basic information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAgentInfoSubmit = async () => {
    if (!user || !agentInfo.agency_name || agentInfo.specialization.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate football specialization requires FIFA ID
    if (agentInfo.specialization.includes('football') && !agentInfo.fifa_id) {
      toast({
        title: "Validation Error",
        description: "As a football agent, you must provide a FIFA ID",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create agent profile - using correct column names based on schema
      const { error: agentError } = await supabase
        .from('agents')
        .insert({
          profile_id: user.id,
          agency_name: agentInfo.agency_name,
          specialization: agentInfo.specialization as ("football" | "basketball" | "volleyball" | "tennis" | "rugby")[],
          fifa_id: agentInfo.fifa_id || null,
          license_number: agentInfo.license_number || null
        });

      if (agentError) throw agentError;

      setCurrentStep(4); // Final step
    } catch (error) {
      console.error('Error saving agent info:', error);
      toast({
        title: "Error",
        description: "Failed to save agent information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTeamInfoSubmit = async () => {
    if (!user || !teamInfo.team_name || !teamInfo.league || !teamInfo.country || !teamInfo.sport_type) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Create team profile - using correct column names based on schema
      const { error: teamError } = await supabase
        .from('teams')
        .insert({
          team_name: teamInfo.team_name,
          league: teamInfo.league,
          country: teamInfo.country,
          sport_type: teamInfo.sport_type as "football" | "basketball" | "volleyball" | "tennis" | "rugby",
          year_founded: teamInfo.founded_year ? parseInt(teamInfo.founded_year) : null,
          profile_id: user.id
        });

      if (teamError) throw teamError;

      setCurrentStep(4); // Final step
    } catch (error) {
      console.error('Error saving team info:', error);
      toast({
        title: "Error",
        description: "Failed to save team information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "User session not found",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Mark profile as completed
      const { error } = await updateProfile({
        profile_completed: true
      });

      if (error) throw error;

      toast({
        title: "Welcome!",
        description: "Your profile has been completed successfully",
      });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: "Failed to complete onboarding",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const renderBasicInfoStep = () => (
    <Card className="border-0 bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <User className="w-5 h-5" />
          Basic Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* User Type Display */}
        <div className="p-4 bg-card rounded-lg border">
          <Label className="text-sm text-gray-400">Selected Role</Label>
          <div className="flex items-center gap-2 mt-1">
            {userType === 'agent' ? (
              <>
                <Building className="w-4 h-4 text-rosegold" />
                <span className="text-white font-medium">Agent/Scout</span>
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4 text-rosegold" />
                <span className="text-white font-medium">Team Manager</span>
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Full Name *</Label>
          <Input
            value={basicInfo.full_name}
            onChange={(e) => setBasicInfo({ ...basicInfo, full_name: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Enter your full name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Email</Label>
          <Input
            value={basicInfo.email}
            onChange={(e) => setBasicInfo({ ...basicInfo, email: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Enter your email"
            type="email"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Country *</Label>
          <Select
            value={basicInfo.country}
            onValueChange={(value) => setBasicInfo({ ...basicInfo, country: value })}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select your country" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {countries.map((country) => (
                <SelectItem key={country.cca2} value={country.cca2} className="text-white">
                  {country.flag} {country.name.common}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2">
            <Label className="text-gray-300">Code</Label>
            <Select
              value={basicInfo.country_code}
              onValueChange={(value) => setBasicInfo({ ...basicInfo, country_code: value })}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="+1" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-600">
                {countryCodes.map((code) => (
                  <SelectItem key={code.code} value={code.code} className="text-white">
                    {code.flag} {code.code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-2">
            <Label className="text-gray-300">Phone Number</Label>
            <Input
              value={basicInfo.phone}
              onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter phone number"
            />
          </div>
        </div>

        <Button
          onClick={handleBasicInfoSubmit}
          disabled={loading || !basicInfo.full_name || !basicInfo.country}
          className="w-full bg-rosegold hover:bg-rosegold/90 text-white"
        >
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderAgentInfoStep = () => (
    <Card className="border-0 bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Building className="w-5 h-5" />
            Agent Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Agency Name *</Label>
          <Input
            value={agentInfo.agency_name}
            onChange={(e) => setAgentInfo({ ...agentInfo, agency_name: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Enter your agency name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Sports Specialization *</Label>
          <Select
            value={agentInfo.specialization[0] || ''}
            onValueChange={(value) => setAgentInfo({ ...agentInfo, specialization: [value] })}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select sports you specialize in" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {sports.map((sport) => (
                <SelectItem key={sport.value} value={sport.value} className="text-white">
                  {sport.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {agentInfo.specialization.includes('football') && (
          <div className="space-y-2">
            <Label className="text-gray-300">FIFA ID *</Label>
            <Input
              value={agentInfo.fifa_id}
              onChange={(e) => setAgentInfo({ ...agentInfo, fifa_id: e.target.value })}
              className="bg-gray-800 border-gray-600 text-white"
              placeholder="Enter your FIFA ID"
            />
            <p className="text-sm text-orange-400">
              Required for football agents to transfer players
            </p>
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-gray-300">License Number</Label>
          <Input
            value={agentInfo.license_number}
            onChange={(e) => setAgentInfo({ ...agentInfo, license_number: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Enter your license number"
          />
        </div>

        <Button
          onClick={handleAgentInfoSubmit}
          disabled={loading || !agentInfo.agency_name || agentInfo.specialization.length === 0}
          className="w-full bg-rosegold hover:bg-rosegold/90 text-white"
        >
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderTeamInfoStep = () => (
    <Card className="border-0 bg-background">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-white">
            <Trophy className="w-5 h-5" />
            Team Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrentStep(1)}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label className="text-gray-300">Team Name *</Label>
          <Input
            value={teamInfo.team_name}
            onChange={(e) => setTeamInfo({ ...teamInfo, team_name: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="Enter your team name"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Sport Type *</Label>
          <Select
            value={teamInfo.sport_type}
            onValueChange={(value) => setTeamInfo({ ...teamInfo, sport_type: value })}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select sport type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {sports.map((sport) => (
                <SelectItem key={sport.value} value={sport.value} className="text-white">
                  {sport.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">League/Competition *</Label>
          <Input
            value={teamInfo.league}
            onChange={(e) => setTeamInfo({ ...teamInfo, league: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="e.g., Premier League, Serie A, etc."
          />
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Country *</Label>
          <Select
            value={teamInfo.country}
            onValueChange={(value) => setTeamInfo({ ...teamInfo, country: value })}
          >
            <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
              <SelectValue placeholder="Select team's country" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-600">
              {countries.map((country) => (
                <SelectItem key={country.cca2} value={country.cca2} className="text-white">
                  {country.flag} {country.name.common}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-gray-300">Founded Year</Label>
          <Input
            value={teamInfo.founded_year}
            onChange={(e) => setTeamInfo({ ...teamInfo, founded_year: e.target.value })}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder="e.g., 1999"
            type="number"
          />
        </div>

        <Button
          onClick={handleTeamInfoSubmit}
          disabled={loading || !teamInfo.team_name || !teamInfo.league || !teamInfo.country || !teamInfo.sport_type}
          className="w-full bg-rosegold hover:bg-rosegold/90 text-white"
        >
          {loading ? 'Saving...' : 'Continue'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );

  const renderFinalStep = () => (
    <Card className="border-0 bg-background">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CheckCircle className="w-5 h-5 text-green-500" />
          Complete Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-8">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Profile Setup Complete!
          </h3>
          <p className="text-gray-400 mb-6">
            Your {userType === 'agent' ? 'agent' : 'team'} profile has been successfully created.
            You're now ready to access all platform features.
          </p>
          
          <div className="bg-card p-4 rounded-lg mb-6">
            <h4 className="text-white font-medium mb-2">What's Next?</h4>
            <ul className="text-sm text-gray-400 text-left space-y-1">
              {userType === 'agent' ? (
                <>
                  <li>• Browse and scout players</li>
                  <li>• Create your shortlist</li>
                  <li>• Message players (if licensed)</li>
                  <li>• Generate contracts</li>
                </>
              ) : (
                <>
                  <li>• Add your players to the platform</li>
                  <li>• Upload player videos and stats</li>
                  <li>• Receive messages from scouts</li>
                  <li>• Manage transfer requests</li>
                </>
              )}
            </ul>
          </div>

          <Button
            onClick={handleFinalSubmit}
            disabled={loading}
            className="w-full bg-rosegold hover:bg-rosegold/90 text-white"
            size="lg"
          >
            {loading ? 'Setting up...' : 'Enter Platform'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto"></div>
          <p className="text-gray-400 mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              Step {currentStep} of 4
            </span>
            <span className="text-sm text-gray-400">
              {Math.round((currentStep / 4) * 100)}% Complete
            </span>
          </div>
          <div className="w-full bg-gray-800 rounded-full h-2">
            <div
              className="bg-rosegold h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && renderBasicInfoStep()}
        {currentStep === 2 && userType === 'agent' && renderAgentInfoStep()}
        {currentStep === 3 && userType === 'team' && renderTeamInfoStep()}
        {currentStep === 4 && renderFinalStep()}
      </div>
    </div>
  );
};

export default OnboardingFlow;
