
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useSports } from '@/hooks/useSports';
import { useCountries } from '@/hooks/useCountries';
import { useCountryCodes } from '@/hooks/useCountryCodes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AllowedSportType, requiresFifaId, isAllowedSportType } from '@/services/sportsService';
import { ArrowLeft, User, Building, Users } from 'lucide-react';

const OnboardingFlow = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const { sports, loading: sportsLoading } = useSports();
  const { countries, loading: countriesLoading, error: countriesError } = useCountries();
  const { countryCodes, loading: countryCodesLoading } = useCountryCodes();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Add state for role selection
  const [selectedRole, setSelectedRole] = useState<'team' | 'agent'>(profile?.user_type || 'team');

  // Form data
  const [basicInfo, setBasicInfo] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    country: profile?.country || '',
    country_code: profile?.country_code || '+91'
  });

  const [teamInfo, setTeamInfo] = useState({
    team_name: '',
    sport_type: 'football' as AllowedSportType,
    year_founded: '',
    league: '',
    member_association: '',
    description: ''
  });

  const [agentInfo, setAgentInfo] = useState({
    agency_name: '',
    fifa_id: '',
    license_number: '',
    specialization: 'football' as AllowedSportType,
    bio: '',
    website: ''
  });

  // Add function to handle role change
  const handleRoleChange = async (newRole: 'team' | 'agent') => {
    if (!profile) return;

    setLoading(true);
    try {
      await updateProfile({
        user_type: newRole,
        profile_completed: false // Reset completion status when changing roles
      });
      setSelectedRole(newRole);
      toast({
        title: "Role Updated",
        description: `Your role has been changed to ${newRole === 'team' ? 'Team Manager' : 'Sports Agent'}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Calculate total steps based on selected role
  const totalSteps = selectedRole === 'team' ? 2 : 2;

  // Update basic info state when profile changes - only on initial load
  useEffect(() => {
    if (profile && !basicInfo.full_name) {
      setBasicInfo({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        country: profile.country || '',
        country_code: profile.country_code || '+91'
      });
    }
  }, [profile, basicInfo.full_name]);

  // Get country code based on selected country
  const getCountryCode = (countryName: string) => {
    const countryData = countryCodes.find(c => c.country === countryName);
    return countryData ? countryData.code : '+91';
  };

  // Update country code when country changes
  const handleCountryChange = (value: string) => {
    const newCountryCode = getCountryCode(value);
    setBasicInfo({
      ...basicInfo,
      country: value,
      country_code: newCountryCode
    });
  };

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
        full_name: basicInfo.full_name,
        phone: basicInfo.phone,
        country: basicInfo.country,
        country_code: basicInfo.country_code,
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
        description: error instanceof Error ? error.message : "Failed to update basic information",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    // Check if user and profile are available
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "User not authenticated. Please sign in again.",
        variant: "destructive"
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Profile Error",
        description: "Profile not loaded. Please refresh the page and try again.",
        variant: "destructive"
      });
      return;
    }

    if (profile.user_type === 'team') {
      if (!teamInfo.team_name || !basicInfo.country || !teamInfo.sport_type) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required team fields",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!agentInfo.agency_name || !agentInfo.specialization) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required agency fields",
          variant: "destructive"
        });
        return;
      }
      if (requiresFifaId(agentInfo.specialization) && !agentInfo.fifa_id) {
        toast({
          title: "Validation Error",
          description: "As a football agent, you must provide a FIFA ID",
          variant: "destructive"
        });
        return;
      }
    }

    setLoading(true);
    try {
      if (profile.user_type === 'team') {
        const { error } = await supabase
          .from('teams')
          .upsert({
            profile_id: profile.id,
            team_name: teamInfo.team_name,
            sport_type: teamInfo.sport_type,
            year_founded: teamInfo.year_founded ? parseInt(teamInfo.year_founded) : null,
            country: basicInfo.country,
            league: teamInfo.league || null,
            member_association: teamInfo.member_association || null,
            description: teamInfo.description || null
          }, { onConflict: 'profile_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('agents')
          .upsert({
            profile_id: profile.id,
            agency_name: agentInfo.agency_name,
            fifa_id: requiresFifaId(agentInfo.specialization) ? agentInfo.fifa_id : null,
            license_number: agentInfo.license_number || null,
            specialization: Array.isArray(agentInfo.specialization)
              ? agentInfo.specialization
              : [agentInfo.specialization],
            bio: agentInfo.bio || null,
            website: agentInfo.website || null
          }, { onConflict: 'profile_id' });
        if (error) throw error;
      }

      await updateProfile({ profile_completed: true });

      toast({
        title: "Profile Setup Complete!",
        description: "Your profile has been successfully created",
      });
    } catch (error: any) {
      console.error('Error completing onboarding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to complete profile setup",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Show loading state if user or profile is not available
  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img
            src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
            alt="Sports Reels"
            className="w-[100px] h-[100px] mx-auto mb-4 animate-pulse"
          />
          <p className="text-white">Loading your profile...</p>
        </div>
      </div>
    );
  }

  const currentUserType = selectedRole;

  const steps = [
    {
      id: 1,
      title: "Your personal details",
      subtitle: "Personal details of user",
      icon: User,
      completed: step > 1
    },
    {
      id: 2,
      title: currentUserType === 'team' ? "Your team details" : "Your agency details",
      subtitle: currentUserType === 'team' ? "Team's basic information" : "Agency's basic information",
      icon: currentUserType === 'team' ? Users : Building,
      completed: false
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <div className="w-96 onboarding-sidebar bg-sidebar-border text-white p-8 flex flex-col relative">
        {/* Logo */}
        <div className="flex items-center mb-12">
          <img src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" alt="Sports Reels" className="w-8 h-8 mr-3" />
          <span className="text-xl font-bold text-white">Sports Reels</span>
        </div>

        {/* Role Selection */}
        <div className="mb-8 p-4 bg-white/5 rounded-lg border border-white/10">
          <Label className="text-sm font-medium text-gray-300 mb-3 block">I am a...</Label>
          <Select
            value={selectedRole}
            onValueChange={(value: 'team' | 'agent') => handleRoleChange(value)}
          >
            <SelectTrigger className="bg-white/10 border-white/20 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-white/20">
              <SelectItem value="team" className="text-white hover:bg-white/10">
                Team Manager
              </SelectItem>
              <SelectItem value="agent" className="text-white hover:bg-white/10">
                Sports Agent
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Steps */}
        <div className="space-y-8 flex-1">
          {steps.map((stepItem, index) => (
            <div key={stepItem.id} className="flex items-start">
              <div className="flex-shrink-0 mr-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stepItem.completed
                  ? 'bg-white text-white'
                  : step === stepItem.id
                    ? 'bg-rosegold text-white'
                    : 'bg-rosegold text-white'
                  }`}>
                  {stepItem.completed ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <stepItem.icon className="w-5 h-5" />
                  )}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h3 className={`text-lg font-medium ${step === stepItem.id ? 'text-white' : 'text-white'
                  }`}>
                  {stepItem.title}
                </h3>
                <p className={`text-sm mt-1 ${step === stepItem.id ? 'text-gray-500' : 'text-gray-500'
                  }`}>
                  {stepItem.subtitle}
                </p>
              </div>
              {index < steps.length - 1 && (
                <div className="absolute left-12 mt-12 w-px h-8 bg-red-500"></div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-auto">
          <p className="text-white text-sm">All rights reserved @Sports Reels</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 text-white onboarding-content p-8 flex items-center justify-center">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm">Step {step}/{totalSteps}</p>
            </div>
            <h1 className="text-3xl font-bold text-rosegold mb-2">
              {step === 1 ? 'Basic Info' : currentUserType === 'team' ? 'Team Details' : 'Agency Details'}
            </h1>
            <p className=" text-gray-400">
              {step === 1
                ? 'Tell us a bit about yourself to get started with your new Sports Reels account.'
                : `Provide your ${currentUserType === 'team' ? 'team' : 'agency'} information to complete your profile.`
              }
            </p>
          </div>

          {/* Form Content */}
          <div className="space-y-6">
            {step === 1 ? (
              <>
                <div className="space-y-2 text-start">
                  <Label htmlFor="full_name" className="text-gray-500  font-medium">Full name</Label>
                  <Input
                    id="full_name"
                    value={basicInfo.full_name}
                    onChange={(e) => setBasicInfo({ ...basicInfo, full_name: e.target.value })}
                    placeholder="enter fullname...."
                    className=" border-0 outline-none"
                  />
                </div>

                <div className="space-y-2 text-start">
                  <Label htmlFor="email" className="text-gray-500 font-medium">Email</Label>
                  <Input
                    id="email"
                    value={profile.email || ''}
                    disabled
                    className="border-0 outline-none"
                  />
                </div>
                <div className="space-y-2 text-start">
                  <Label htmlFor="country" className="text-gray-500 font-medium">Country</Label>
                  <Select
                    value={basicInfo.country}
                    onValueChange={handleCountryChange}
                  >
                    <SelectTrigger className="bg-white border-0 outline-none">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60  z-50">
                      {countries.map((country) => (
                        <SelectItem key={country.cca2} value={country.name.common}>
                          <div className="flex border-0 outline-none items-center gap-2">
                            {country.flag && (
                              <span className="text-sm">{country.flag}</span>
                            )}
                            <span>{country.name.common}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {countriesError && (
                    <p className="text-sm text-red-600">{countriesError}</p>
                  )}
                </div>
                <div className="space-y-2 text-start">
                  <Label htmlFor="phone" className="text-gray-500 font-medium">Mobile number</Label>
                  <div className="flex">
                    <Select
                      value={basicInfo.country_code}
                      onValueChange={(value) => setBasicInfo({ ...basicInfo, country_code: value })}
                    >
                      <SelectTrigger className="w-32 border-0 outline-none rounded-r-none border-r-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-white max-h-60 z-50">
                        {countryCodes.map((item, index) => (
                          <SelectItem key={`${item.code}-${index}-${item.country}`} value={item.code}>
                            <div className="flex items-center gap-2">
                              {item.flag && (
                                <span className="text-sm">{item.flag}</span>
                              )}
                              <span>{item.code}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      value={basicInfo.phone}
                      onChange={(e) => setBasicInfo({ ...basicInfo, phone: e.target.value })}
                      placeholder="8976765451"
                      className="border-0 outline-none"
                    />
                  </div>
                </div>
              </>
            ) : currentUserType === 'team' ? (
              <>
                <div className="space-y-2 text-start">
                  <Label htmlFor="team_name" className="text-gray-500 font-medium">Team Name *</Label>
                  <Input
                    id="team_name"
                    value={teamInfo.team_name}
                    onChange={(e) => setTeamInfo({ ...teamInfo, team_name: e.target.value })}
                    placeholder="Enter your team name"
                    className="outline-none border-0"
                  />
                </div>

                <div className="space-y-2 text-start">
                  <Label className="text-gray-500 font-medium">Sport *</Label>
                  <Select
                    value={teamInfo.sport_type}
                    onValueChange={(value) => {
                      if (isAllowedSportType(value)) {
                        setTeamInfo({ ...teamInfo, sport_type: value });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white border-0">
                      <SelectValue placeholder="Select sport" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {sports
                        .filter(sport => isAllowedSportType(sport.value))
                        .map((sport) => (
                          <SelectItem
                            key={sport.id}
                            value={sport.value as AllowedSportType}
                          >
                            {sport.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="year_founded" className="text-gray-700 font-medium">Year Founded</Label>
                    <Input
                      id="year_founded"
                      type="number"
                      value={teamInfo.year_founded}
                      onChange={(e) => setTeamInfo({ ...teamInfo, year_founded: e.target.value })}
                      placeholder="e.g. 1990"
                      className="bg-white border-gray-300"
                    />
                  </div>
                  <div className="space-y-2 text-start">
                    <Label htmlFor="league" className="text-gray-700 font-medium">League</Label>
                    <Input
                      id="league"
                      value={teamInfo.league}
                      onChange={(e) => setTeamInfo({ ...teamInfo, league: e.target.value })}
                      placeholder="e.g. NPFL, Premier League"
                      className="outline-none border-0"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-start">
                  <Label htmlFor="description" className="text-gray-700 font-medium">Team Description</Label>
                  <Textarea
                    id="description"
                    value={teamInfo.description}
                    onChange={(e) => setTeamInfo({ ...teamInfo, description: e.target.value })}
                    placeholder="Tell us about your team..."
                    rows={3}
                    className="outline-none border-0"
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2 text-start">
                  <Label htmlFor="agency_name" className="text-gray-500 font-medium">Agency Name *</Label>
                  <Input
                    id="agency_name"
                    value={agentInfo.agency_name}
                    onChange={(e) => setAgentInfo({ ...agentInfo, agency_name: e.target.value })}
                    placeholder="Enter your agency name"
                    className="outline-none border-0"
                  />
                </div>

                <div className="space-y-2 text-start">
                  <Label className="text-gray-500 font-medium">Sports Specialization *</Label>
                  <Select
                    value={agentInfo.specialization}
                    onValueChange={(value) => {
                      if (isAllowedSportType(value)) {
                        setAgentInfo({ ...agentInfo, specialization: value });
                      }
                    }}
                  >
                    <SelectTrigger className="bg-white outline-none border-0">
                      <SelectValue placeholder="Select your specialization" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {sports
                        .filter(sport => isAllowedSportType(sport.value))
                        .map((sport) => (
                          <SelectItem
                            key={sport.id}
                            value={sport.value as AllowedSportType}
                          >
                            {sport.label}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  {requiresFifaId(agentInfo.specialization) && (
                    <p className="text-sm text-red-600 mt-1">
                      FIFA ID required for football agents
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 text-start">
                    <Label htmlFor="fifa_id" className="text-gray-500 font-medium">
                      FIFA ID {requiresFifaId(agentInfo.specialization) && '*'}
                    </Label>
                    <Input
                      id="fifa_id"
                      value={agentInfo.fifa_id}
                      onChange={(e) => setAgentInfo({ ...agentInfo, fifa_id: e.target.value })}
                      placeholder="FIFA ID"
                      className="outline-none border-0"
                    />
                  </div>
                  <div className="space-y-2 text-start">
                    <Label htmlFor="license_number" className="text-gray-500 font-medium">License Number</Label>
                    <Input
                      id="license_number"
                      value={agentInfo.license_number}
                      onChange={(e) => setAgentInfo({ ...agentInfo, license_number: e.target.value })}
                      placeholder="License number"
                      className="outline-none border-0"
                    />
                  </div>
                </div>

                <div className="space-y-2 text-start">
                  <Label htmlFor="bio" className="text-gray-500 font-medium">Professional Bio</Label>
                  <Textarea
                    id="bio"
                    value={agentInfo.bio}
                    onChange={(e) => setAgentInfo({ ...agentInfo, bio: e.target.value })}
                    placeholder="Tell us about your professional experience..."
                    rows={3}
                    className="outline-none border-0"
                  />
                </div>

                <div className="space-y-2 text-start">
                  <Label htmlFor="website" className="text-gray-500 font-medium">Website</Label>
                  <Input
                    id="website"
                    value={agentInfo.website}
                    onChange={(e) => setAgentInfo({ ...agentInfo, website: e.target.value })}
                    placeholder="https://your-website.com"
                    className="outline-none border-0"
                  />
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between mt-8">
            {step > 1 ? (
              <Button
                variant="outline"
                onClick={() => setStep(step - 1)}
                className="flex items-center gap-2 outline-none border-0 "
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            ) : (
              <div></div>
            )}

            <Button
              onClick={step === 1 ? handleBasicInfoSubmit : handleFinalSubmit}
              disabled={loading || (step === 1 && (!basicInfo.full_name || !basicInfo.country))}
              className=" px-8"
            >
              {step === totalSteps ? 'Complete Setup' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
