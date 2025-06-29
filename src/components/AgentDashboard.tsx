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
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';

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

  // Fetch dashboard statistics
  useEffect(() => {
    if (profile?.user_id) {
      fetchDashboardStats();
    }
  }, [profile]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      console.log('Fetching agent dashboard stats for profile:', profile);

      // Get agent ID first
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('id, agency_name')
        .eq('profile_id', profile?.id)
        .single();

      console.log('Agent data:', agent, 'Agent error:', agentError);

      if (agentError || !agent) {
        console.error('Error fetching agent:', agentError);
        setLoading(false);
        return;
      }

      const agentId = agent.id;
      console.log('Using agent ID:', agentId);

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
      const { data: allShortlistedPitches, error: allShortlistedPitchesError } = await supabase
        .from('shortlist')
        .select(`
          id,
          transfer_pitches!inner(
            id,
            status,
            team_id
          )
        `)
        .eq('agent_id', agentId)
        .eq('transfer_pitches.status', 'active');

      console.log('All shortlisted active pitches for agent:', allShortlistedPitches, 'Error:', allShortlistedPitchesError);

      // Count active pitches by getting the data and counting manually
      const activePitchesCount = allShortlistedPitches?.length || 0;
      console.log('Active pitches count:', activePitchesCount);

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
        description: "Failed to load dashboard statistics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Test function to add sample data
  const addTestData = async () => {
    try {
      console.log('Adding test agent data...');

      // Get agent ID
      const { data: agent } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile?.id)
        .single();

      if (!agent) {
        console.error('No agent found');
        return;
      }

      // Add a test agent request
      const { data: request, error: requestError } = await supabase
        .from('agent_requests')
        .insert({
          agent_id: agent.id,
          title: 'Test Request',
          description: 'Looking for a forward player',
          sport_type: 'football',
          position: 'Forward',
          budget_min: 500000,
          budget_max: 2000000,
          transfer_type: 'permanent'
        })
        .select()
        .single();

      console.log('Added request:', request, 'Error:', requestError);

      // Get a team and player to create a shortlist entry
      const { data: team } = await supabase
        .from('teams')
        .select('id')
        .limit(1)
        .single();

      if (team) {
        const { data: player } = await supabase
          .from('players')
          .insert({
            team_id: team.id,
            full_name: 'Test Player for Agent',
            gender: 'male',
            position: 'Forward',
            citizenship: 'USA'
          })
          .select()
          .single();

        if (player) {
          const { data: pitch } = await supabase
            .from('transfer_pitches')
            .insert({
              team_id: team.id,
              player_id: player.id,
              transfer_type: 'permanent',
              asking_price: 1000000,
              status: 'active'
            })
            .select()
            .single();

          if (pitch) {
            const { data: shortlist, error: shortlistError } = await supabase
              .from('shortlist')
              .insert({
                agent_id: agent.id,
                player_id: player.id,
                pitch_id: pitch.id,
                notes: 'Test shortlist entry'
              })
              .select()
              .single();

            console.log('Added shortlist:', shortlist, 'Error:', shortlistError);
          }
        }
      }

      // Refresh stats
      fetchDashboardStats();

    } catch (error) {
      console.error('Error adding test data:', error);
    }
  };

  if (profile?.user_type !== 'agent') {
    return null;
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

          {/* Temporary test button */}
          <div className="mt-4">
            <Button onClick={addTestData} variant="outline" size="sm">
              Add Test Data
            </Button>
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
              <CardTitle className="text-white font-polysans">Transfer Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Target className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                  Transfer Timeline
                </h3>
                <p className="text-gray-400 font-poppins">
                  Track transfer activities and negotiations here.
                </p>
              </div>
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
    </div>
  );
};

export default AgentDashboard;