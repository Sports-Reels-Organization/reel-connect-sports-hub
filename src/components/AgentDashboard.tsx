import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AgentProfile from '@/components/AgentProfile';
import AgentShortlist from '@/components/AgentShortlist';
import AgentExplore from '@/components/AgentExplore';
import {
  User,
  Heart,
  Search,
  BarChart3,
  Users,
  Target,
  MessageSquare,
  Eye,
  TrendingUp,
  FileText,
  Star,
  Calendar,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useMessages } from '@/hooks/useMessages';
import { MessageModal } from '@/components/MessageModal';
import { TransferPitch } from '@/types/tranfer';

const AgentDashboard = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalRequests: 0,
    activePitches: 0,
    shortlistedPlayers: 0,
    newMessages: 0
  });
  const [loading, setLoading] = useState(true);
  const [timelineData, setTimelineData] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [messageReceiver, setMessageReceiver] = useState<{
    id: string;
    name: string;
    type: 'agent' | 'team';
  } | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [selectedPitch, setSelectedPitch] = useState<any>(null);

  console.log('AgentDashboard render - profile:', profile, 'loading:', loading);

  // Fetch dashboard statistics
  useEffect(() => {
    console.log('AgentDashboard useEffect - profile?.user_id:', profile?.user_id);
    if (profile?.user_id) {
      fetchDashboardStats();
    } else {
      console.log('No profile user_id, setting loading to false');
      setLoading(false);
    }
  }, [profile]);

  // Fetch timeline data when timeline tab is active
  useEffect(() => {
    console.log('Timeline useEffect - activeTab:', activeTab, 'profile?.user_id:', profile?.user_id);
    if (activeTab === 'timeline' && profile?.user_id) {
      fetchTimelineData();
    }
  }, [activeTab, profile]);

  const createAgentIfNotExists = async () => {
    if (!profile?.id) return;

    try {
      // Check if agent already exists
      const { data: existingAgent } = await supabase
        .from('agents')
        .select('id, agency_name')
        .eq('profile_id', profile.id)
        .single();

      if (existingAgent) {
        console.log('Agent already exists:', existingAgent.id);
        return existingAgent;
      }

      // Create new agent
      const { data: newAgent, error } = await supabase
        .from('agents')
        .insert({
          profile_id: profile.id,
          agency_name: profile.full_name || 'Agent Agency',
          bio: 'Professional sports agent',
          specialization: ['football', 'basketball'],
          verified: false,
          fifa_id: null,
          license_number: null,
          website: null
        })
        .select('id, agency_name')
        .single();

      if (error) throw error;

      console.log('Created new agent:', newAgent);
      return newAgent;
    } catch (error) {
      console.error('Error creating agent:', error);
      throw error;
    }
  };

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('=== Starting fetchDashboardStats ===');
      console.log('Profile data:', profile);
      console.log('Profile ID:', profile?.id);
      console.log('Profile user_id:', profile?.user_id);

      // Test basic profile access first
      console.log('Testing basic profile access...');
      const { data: profileTest, error: profileTestError } = await supabase
        .from('profiles')
        .select('id, user_id, user_type, profile_completed, is_verified')
        .eq('user_id', profile?.user_id)
        .single();

      console.log('Profile test result:', { profileTest, profileTestError });

      if (profileTestError) {
        console.error('Profile access failed:', profileTestError);
        toast({
          title: "Profile Access Error",
          description: `Cannot access profile: ${profileTestError.message}`,
          variant: "destructive"
        });
        setLoading(false);
        return;
      }

      // Get agent ID first
      let { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, agency_name')
        .eq('profile_id', profile?.id)
        .single();

      console.log('Agent query result:', { agent, agentError });

      if (agentError) {
        console.error('Agent query error details:', agentError);

        // If agent doesn't exist, try to create one
        if (agentError.code === 'PGRST116') {
          console.log('Agent not found, creating new agent record...');
          try {
            agent = await createAgentIfNotExists();
            if (!agent) {
              console.error('Failed to create agent');
              setLoading(false);
              return;
            }
          } catch (createError) {
            console.error('Failed to create agent:', createError);
            toast({
              title: "Agent Creation Error",
              description: `Failed to create agent profile: ${createError.message}`,
              variant: "destructive"
            });
            setLoading(false);
            return;
          }
        } else {
          console.error('Error fetching agent:', agentError);
          toast({
            title: "Agent Access Error",
            description: `Cannot access agent data: ${agentError.message}`,
            variant: "destructive"
          });
          setLoading(false);
          return;
        }
      }

      const agentId = agent.id;
      console.log('Using agent ID:', agentId);

      // Test basic table access
      console.log('Testing basic table access...');

      // Test teams table
      const { data: teamsTest, error: teamsTestError } = await supabase
        .from('teams')
        .select('count')
        .limit(1);
      console.log('Teams table test:', { teamsTest, teamsTestError });

      // Test players table
      const { data: playersTest, error: playersTestError } = await supabase
        .from('players')
        .select('count')
        .limit(1);
      console.log('Players table test:', { playersTest, playersTestError });

      // Test transfer_pitches table
      const { data: pitchesTest, error: pitchesTestError } = await supabase
        .from('transfer_pitches')
        .select('count')
        .limit(1);
      console.log('Transfer pitches table test:', { pitchesTest, pitchesTestError });

      // Fetch total requests count - check all requests first
      const { data: allRequests, error: allRequestsError } = await supabase
        .from('agent_requests')
        .select('id, title, agent_id')
        .eq('agent_id', agentId);

      console.log('All requests for agent:', allRequests, 'Error:', allRequestsError);

      const { count: requestsCount, error: requestsError } = await supabase
        .from('agent_requests')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      console.log('Total requests count:', requestsCount, 'Error:', requestsError);

      // Fetch active pitches count - agents see pitches through shortlist
      const { count: activePitchesCount, error: pitchesError } = await supabase
        .from('transfer_pitches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      console.log('Active pitches count:', activePitchesCount, 'Error:', pitchesError);

      // Fetch shortlisted players count - check all shortlisted players first
      const { data: allShortlisted, error: allShortlistedError } = await supabase
        .from('shortlist')
        .select('id, player_id, agent_id')
        .eq('agent_id', agentId);

      console.log('All shortlisted players for agent:', allShortlisted, 'Error:', allShortlistedError);

      const { count: shortlistedCount, error: shortlistedError } = await supabase
        .from('shortlist')
        .select('*', { count: 'exact', head: true })
        .eq('agent_id', agentId);

      console.log('Shortlisted players count:', shortlistedCount, 'Error:', shortlistedError);

      // Fetch new messages count - check all messages first
      const { data: allMessages, error: allMessagesError } = await supabase
        .from('messages')
        .select('id, receiver_id, status')
        .eq('receiver_id', profile?.id);

      console.log('All messages for profile:', allMessages, 'Error:', allMessagesError);

      const { count: messagesCount, error: messagesError } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profile?.id)
        .eq('status', 'sent');

      console.log('New messages count:', messagesCount, 'Error:', messagesError);

      setStats({
        totalRequests: requestsCount || 0,
        activePitches: activePitchesCount,
        shortlistedPlayers: shortlistedCount || 0,
        newMessages: messagesCount || 0
      });

      console.log('Final agent stats:', {
        totalRequests: requestsCount || 0,
        activePitches: activePitchesCount,
        shortlistedPlayers: shortlistedCount || 0,
        newMessages: messagesCount || 0
      });

    } catch (error) {
      console.error('Error fetching agent dashboard stats:', error);
      toast({
        title: "Error",
        description: `Failed to load dashboard statistics: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTimelineData = async () => {
    try {
      setTimelineLoading(true);
      console.log('=== Starting fetchTimelineData ===');
      console.log('Profile data:', profile);

      // First, let's test a simple query to see if we can access transfer_pitches at all
      console.log('Testing basic transfer_pitches access...');
      const { data: testPitches, error: testError } = await supabase
        .from('transfer_pitches')
        .select('id, status, expires_at')
        .limit(5);

      console.log('Basic transfer_pitches test result:', { testPitches, testError });

      if (testError) {
        console.error('Basic transfer_pitches access failed:', testError);
        toast({
          title: "Error",
          description: "Cannot access transfer pitches - check permissions",
          variant: "destructive"
        });
        setTimelineLoading(false);
        return;
      }

      // Use the same query structure as Timeline page
      let query = supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(
            id,
            full_name,
            position,
            citizenship,
            headshot_url,
            photo_url,
            jersey_number,
            date_of_birth,
            bio,
            market_value,
            height,
            weight
          ),
          teams!inner(
            team_name,
            country,
            logo_url,
            member_association
          )
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      const { data: transferPitches, error: pitchesError } = await query;

      console.log('Transfer pitches query result:', { transferPitches, pitchesError });

      if (pitchesError) {
        console.error('Transfer pitches query error:', pitchesError);
        toast({
          title: "Error",
          description: "Failed to load transfer pitches",
          variant: "destructive"
        });
        setTimelineLoading(false);
        return;
      }

      console.log('Transfer pitches found:', transferPitches?.length || 0);

      // Format timeline data from transfer pitches
      const timeline = [];

      if (transferPitches && transferPitches.length > 0) {
        // Process the data similar to Timeline page
        const processedData = await Promise.all(transferPitches.map(async (pitch) => {
          // Calculate age
          const age = pitch.players.date_of_birth
            ? new Date().getFullYear() - new Date(pitch.players.date_of_birth).getFullYear()
            : undefined;

          // Handle tagged_videos - ensure it's an array of strings
          const taggedVideos = Array.isArray(pitch.tagged_videos)
            ? pitch.tagged_videos as string[]
            : pitch.tagged_videos
              ? [pitch.tagged_videos as string]
              : [];

          // Fetch video details for tagged videos
          let tagged_video_details = [];
          if (taggedVideos.length > 0) {
            const { data: videoData } = await supabase
              .from('videos')
              .select('id, title, thumbnail_url, duration')
              .in('id', taggedVideos);

            tagged_video_details = videoData || [];
          }

          return {
            id: `pitch-${pitch.id}`,
            type: 'transfer_pitch',
            title: `${pitch.players.full_name} - ${pitch.teams.team_name}`,
            description: pitch.description || `${pitch.players.full_name} (${pitch.players.position}) is available for transfer`,
            player: pitch.players.full_name,
            playerId: pitch.players.id,
            position: pitch.players.position,
            citizenship: pitch.players.citizenship,
            team: pitch.teams.team_name,
            country: pitch.teams.country,
            askingPrice: pitch.asking_price ? `${pitch.asking_price.toLocaleString()} ${pitch.currency || 'USD'}` : 'Price on request',
            marketValue: pitch.players.market_value ? `${pitch.players.market_value.toLocaleString()} USD` : 'Not specified',
            transferType: pitch.transfer_type,
            status: pitch.status,
            date: new Date(pitch.created_at),
            expiresAt: pitch.expires_at ? new Date(pitch.expires_at) : null,
            playerAge: age,
            playerHeight: pitch.players.height,
            playerWeight: pitch.players.weight,
            signOnBonus: pitch.sign_on_bonus ? `${pitch.sign_on_bonus.toLocaleString()} ${pitch.currency || 'USD'}` : null,
            performanceBonus: pitch.performance_bonus ? `${pitch.performance_bonus.toLocaleString()} ${pitch.currency || 'USD'}` : null,
            playerSalary: pitch.player_salary ? `${pitch.player_salary.toLocaleString()} ${pitch.currency || 'USD'}` : null,
            relocationSupport: pitch.relocation_support ? `${pitch.relocation_support.toLocaleString()} ${pitch.currency || 'USD'}` : null,
            loanFee: pitch.loan_fee ? `${pitch.loan_fee.toLocaleString()} ${pitch.currency || 'USD'}` : null,
            loanWithOption: pitch.loan_with_option,
            loanWithObligation: pitch.loan_with_obligation,
            taggedVideos: taggedVideos,
            contractDetails: pitch.contract_details,
            isInternational: pitch.is_international,
            tierLevel: pitch.tier_level,
            serviceChargeRate: pitch.service_charge_rate,
            playerBio: pitch.players.bio,
            jerseyNumber: pitch.players.jersey_number,
            memberAssociation: pitch.teams.member_association,
            taggedVideoDetails: tagged_video_details
          };
        }));

        timeline.push(...processedData);
      }

      // Sort timeline by date (newest first)
      timeline.sort((a, b) => b.date - a.date);

      setTimelineData(timeline);
      console.log('Final transfer timeline data:', timeline);

    } catch (error) {
      console.error('Error fetching transfer timeline data:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer timeline data",
        variant: "destructive"
      });
    } finally {
      setTimelineLoading(false);
    }
  };

  const handleShortlistPlayer = async (item) => {
    try {
      // Get agent ID first
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (agentError || !agent) {
        console.error('Error fetching agent:', agentError);
        toast({
          title: "Error",
          description: "Failed to identify agent profile",
          variant: "destructive"
        });
        return;
      }

      // Extract pitch ID from the item ID
      const pitchId = item.id.replace('pitch-', '');

      // Add to shortlist
      const { data: shortlistEntry, error: shortlistError } = await supabase
        .from('shortlist')
        .insert({
          agent_id: agent.id,
          player_id: item.playerId, // We need to add this to the timeline data
          pitch_id: pitchId,
          notes: `Added from timeline - ${item.player} (${item.position})`
        })
        .select()
        .single();

      if (shortlistError) {
        console.error('Error adding to shortlist:', shortlistError);
        toast({
          title: "Error",
          description: "Failed to add player to shortlist",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: `${item.player} added to shortlist!`,
      });

      // Refresh stats to update shortlist count
      fetchDashboardStats();

    } catch (error) {
      console.error('Error shortlisting player:', error);
      toast({
        title: "Error",
        description: "Failed to add player to shortlist",
        variant: "destructive"
      });
    }
  };

  const handleSendMessage = async (pitch: TransferPitch) => {
    if (!profile?.id) {
      toast({
        title: "Authentication Required",
        description: "Please log in to send messages",
        variant: "destructive"
      });
      return;
    }

    try {
      // Determine the receiver based on user type
      let receiverId: string;
      let receiverName: string;
      let receiverType: 'agent' | 'team';

      if (profile.user_type === 'agent') {
        // Agent is messaging the team that owns the player
        // Get the team's profile_id from the teams table using the team_name
        const { data: teamData, error: teamError } = await supabase
          .from('teams')
          .select(`
            profile_id,
            profiles!inner(
              id,
              full_name
            )
          `)
          .eq('team_name', pitch.teams.team_name)
          .single();

        if (teamError || !teamData) {
          throw new Error('Could not find team information');
        }

        receiverId = teamData.profiles.id;
        receiverName = teamData.profiles.full_name || pitch.teams.team_name;
        receiverType = 'team';
      } else {
        toast({
          title: "Information",
          description: "Teams can respond to messages from agents. Agents will contact you if they're interested in your players.",
        });
        return;
      }

      setMessageReceiver({
        id: receiverId,
        name: receiverName,
        type: receiverType
      });
      setShowMessageModal(true);
    } catch (error) {
      console.error('Error setting up message:', error);
      toast({
        title: "Error",
        description: "Failed to open messaging. Please try again.",
        variant: "destructive"
      });
    }
  };

  if (profile?.user_type !== 'agent') {
    return null;
  }

  // Show loading state while profile is loading
  if (loading) {
    return (
      <div className="space-y-6 p-[3rem]">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold mx-auto mb-4"></div>
          <h3 className="text-xl font-polysans font-semibold text-white mb-2">
            Loading Agent Dashboard
          </h3>
          <p className="text-gray-400 font-poppins">
            Please wait while we load your dashboard...
          </p>
        </div>
      </div>
    );
  }

  // Check if profile is completed
  if (!profile?.profile_completed) {
    return (
      <div className="space-y-6 p-[3rem]">
        <div className="text-center py-12">
          <User className="w-16 h-16 mx-auto mb-4 text-gray-500" />
          <h3 className="text-xl font-polysans font-semibold text-white mb-2">
            Complete Your Profile Setup
          </h3>
          <p className="text-gray-400 font-poppins mb-4">
            Please complete your agent profile setup to access the dashboard.
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-rosegold hover:bg-rosegold/90"
          >
            Continue Setup
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-[3rem]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Agent Dashboard
          </h1>
          <p className="text-gray-400 font-poppins">
            Welcome back, {profile?.full_name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 bg-card border-0">
          <TabsTrigger
            value="overview"
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="profile"
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger
            value="timeline"
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger
            value="shortlist"
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <Heart className="w-4 h-4 mr-2" />
            Shortlist
          </TabsTrigger>
          <TabsTrigger
            value="explore"
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Explore
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Requests
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.totalRequests}</div>
                <p className="text-xs text-muted-foreground">
                  Active agent requests
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Pitches
                </CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.activePitches}</div>
                <p className="text-xs text-muted-foreground">
                  Shortlisted active pitches
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Shortlisted Players
                </CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.shortlistedPlayers}</div>
                <p className="text-xs text-muted-foreground">
                  Players in shortlist
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  New Messages
                </CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : stats.newMessages}</div>
                <p className="text-xs text-muted-foreground">
                  Unread messages
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setActiveTab('explore')}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-0 bg-background transition-colors text-white"
                >
                  <Search className="h-6 w-6" />
                  <span className="font-polysans">Explore Players</span>
                </button>
                <button
                  onClick={() => setActiveTab('shortlist')}
                  className="h-20 flex flex-col items-center justify-center gap-2  border-0 bg-background transition-colors text-white"
                >
                  <Heart className="h-6 w-6" />
                  <span className="font-polysans">View Shortlist</span>
                </button>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="h-20 flex flex-col items-center justify-center gap-2 border-0 rounded-lg bg-background transition-colors text-white"
                >
                  <Target className="h-6 w-6" />
                  <span className="font-polysans">Transfer Timeline</span>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6">
          <AgentProfile />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white font-polysans">Transfer Timeline</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {timelineData.length} Active Pitches
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {timelineLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto mb-4"></div>
                  <p className="text-gray-400 font-poppins">Loading timeline...</p>
                </div>
              ) : timelineData.length > 0 ? (
                <div className="space-y-4">
                  {timelineData.map((item) => (
                    <div key={item.id} className="border border-gray-700 rounded-lg p-4 hover:border-rosegold/50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {item.type === 'transfer_pitch' && <Target className="w-5 h-5 text-orange-500" />}
                          <h3 className="font-polysans font-semibold text-white">{item.title}</h3>
                          {item.verified && <Badge variant="secondary" className="text-xs">Verified</Badge>}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant={item.status === 'active' ? 'default' : item.status === 'completed' ? 'secondary' : 'destructive'}
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                          <span className="text-xs text-gray-400">
                            {item.date.toLocaleDateString()}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-6 px-2 text-xs"
                            onClick={() => handleShortlistPlayer(item)}
                          >
                            <Heart className="w-3 h-3 mr-1" />
                            Shortlist
                          </Button>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm mb-3">{item.description}</p>

                      <div className="flex flex-wrap gap-2 text-xs">
                        {item.sport && (
                          <Badge variant="outline" className="text-xs">
                            {item.sport}
                          </Badge>
                        )}
                        {item.position && (
                          <Badge variant="outline" className="text-xs">
                            {item.position}
                          </Badge>
                        )}
                        {item.transferType && (
                          <Badge variant="outline" className="text-xs">
                            {item.transferType}
                          </Badge>
                        )}
                        {item.league && (
                          <Badge variant="outline" className="text-xs">
                            {item.league}
                          </Badge>
                        )}
                        {item.tierLevel && (
                          <Badge variant="outline" className="text-xs">
                            {item.tierLevel}
                          </Badge>
                        )}
                        {item.isInternational && (
                          <Badge variant="outline" className="text-xs">
                            International
                          </Badge>
                        )}
                        {item.askingPrice && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            <span>Asking: {item.askingPrice}</span>
                          </div>
                        )}
                        {item.marketValue && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            <span>Market: {item.marketValue}</span>
                          </div>
                        )}
                        {item.playerSalary && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            <span>Salary: {item.playerSalary}</span>
                          </div>
                        )}
                        {item.signOnBonus && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            <span>Sign-on: {item.signOnBonus}</span>
                          </div>
                        )}
                        {item.performanceBonus && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            <span>Performance: {item.performanceBonus}</span>
                          </div>
                        )}
                        {item.loanFee && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <DollarSign className="w-3 h-3" />
                            <span>Loan Fee: {item.loanFee}</span>
                          </div>
                        )}
                        {item.expiresAt && (
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="w-3 h-3" />
                            <span>Expires {item.expiresAt.toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {item.type === 'transfer_pitch' && (
                        <div className="mt-2 pt-2 border-t border-gray-700">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-400">
                            <div>
                              <span className="font-medium">Team:</span> {item.team} ({item.country})
                            </div>
                            {item.playerAge && (
                              <div>
                                <span className="font-medium">Age:</span> {item.playerAge}
                              </div>
                            )}
                            {item.playerHeight && (
                              <div>
                                <span className="font-medium">Height:</span> {item.playerHeight}cm
                              </div>
                            )}
                            {item.playerWeight && (
                              <div>
                                <span className="font-medium">Weight:</span> {item.playerWeight}kg
                              </div>
                            )}
                            {item.jerseyNumber && (
                              <div>
                                <span className="font-medium">Jersey:</span> #{item.jerseyNumber}
                              </div>
                            )}
                            {item.fifaId && (
                              <div>
                                <span className="font-medium">FIFA ID:</span> {item.fifaId}
                              </div>
                            )}
                            {item.yearFounded && (
                              <div>
                                <span className="font-medium">Founded:</span> {item.yearFounded}
                              </div>
                            )}
                            {item.memberAssociation && (
                              <div>
                                <span className="font-medium">Association:</span> {item.memberAssociation}
                              </div>
                            )}
                            {item.loanWithOption && (
                              <div>
                                <span className="font-medium">Loan:</span> With Option
                              </div>
                            )}
                            {item.loanWithObligation && (
                              <div>
                                <span className="font-medium">Loan:</span> With Obligation
                              </div>
                            )}
                            {item.relocationSupport && (
                              <div>
                                <span className="font-medium">Relocation:</span> {item.relocationSupport}
                              </div>
                            )}
                            {item.serviceChargeRate && (
                              <div>
                                <span className="font-medium">Service Fee:</span> {item.serviceChargeRate}%
                              </div>
                            )}
                          </div>
                          {item.playerBio && (
                            <div className="mt-2 text-xs text-gray-400">
                              <span className="font-medium">Bio:</span> {item.playerBio}
                            </div>
                          )}
                          {item.titles && item.titles.length > 0 && (
                            <div className="mt-2 text-xs text-gray-400">
                              <span className="font-medium">Titles:</span> {item.titles.join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                    No Active Transfer Pitches
                  </h3>
                  <p className="text-gray-400 font-poppins mb-4">
                    There are currently no active transfer pitches available. Check back later for new opportunities.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortlist" className="space-y-6">
          <AgentShortlist />
        </TabsContent>

        <TabsContent value="explore" className="space-y-6">
          <AgentExplore />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans">Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-gray-400 font-poppins">
                Advanced analytics and insights about your scouting activities, player performance analysis, and market trends will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Message Modal */}
      {showMessageModal && selectedPitch && (
        <MessageModal
          isOpen={showMessageModal}
          onClose={() => {
            setShowMessageModal(false);
            setSelectedPitch(null);
          }}
          pitchId={selectedPitch?.id}
          receiverId={selectedPitch?.team_id}
          receiverName={selectedPitch?.team_name || 'Unknown Team'}
          receiverType="team"
          pitchTitle={selectedPitch?.description}
          currentUserId={profile?.id || ''}
          playerName={selectedPitch?.player_name || 'Unknown Player'}
        />
      )}
    </div>
  );
};

export default AgentDashboard;
