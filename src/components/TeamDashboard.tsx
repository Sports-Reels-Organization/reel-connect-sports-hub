import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
    Users,
    Video,
    Target,
    Search,
    BarChart3,
    User,
    MessageSquare,
    Upload,
    Plus
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TeamProfileSetup from './TeamProfileSetup';
import PlayerManagement from './PlayerManagement';
import VideoManagement from './VideoManagement';
import CreateTransferPitch from './CreateTransferPitch';

const TeamDashboard = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreatePitch, setShowCreatePitch] = useState(false);
    const [stats, setStats] = useState({
        totalPlayers: 0,
        totalVideos: 0,
        activePitches: 0,
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
            console.log('Fetching dashboard stats for profile:', profile);

            // Get team ID first
            const { data: team, error: teamError } = await supabase
                .from('teams')
                .select('id, team_name')
                .eq('profile_id', profile?.id)
                .single();

            console.log('Team data:', team, 'Team error:', teamError);

            if (teamError) {
                console.error('Error fetching team:', teamError);
                toast({
                    title: "Team Access Error",
                    description: `Cannot access team data: ${teamError.message}`,
                    variant: "destructive"
                });
                setLoading(false);
                return;
            }

            const teamId = team.id;
            console.log('Using team ID:', teamId);

            // Fetch players count - check all players first
            const { data: allPlayers, error: allPlayersError } = await supabase
                .from('players')
                .select('id, full_name, team_id')
                .eq('team_id', teamId);

            console.log('All players for team:', allPlayers, 'Error:', allPlayersError);

            const { count: playersCount, error: playersError } = await supabase
                .from('players')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId);

            console.log('Players count:', playersCount, 'Error:', playersError);

            // Fetch videos count - check all videos first
            const { data: allVideos, error: allVideosError } = await supabase
                .from('videos')
                .select('id, title, team_id')
                .eq('team_id', teamId);

            console.log('All videos for team:', allVideos, 'Error:', allVideosError);

            const { count: videosCount, error: videosError } = await supabase
                .from('videos')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId);

            console.log('Videos count:', videosCount, 'Error:', videosError);

            // Fetch active pitches count - check all pitches first
            const { data: allPitches, error: allPitchesError } = await supabase
                .from('transfer_pitches')
                .select('id, status, team_id')
                .eq('team_id', teamId);

            console.log('All pitches for team:', allPitches, 'Error:', allPitchesError);

            const { count: pitchesCount, error: pitchesError } = await supabase
                .from('transfer_pitches')
                .select('*', { count: 'exact', head: true })
                .eq('team_id', teamId)
                .eq('status', 'active');

            console.log('Active pitches count:', pitchesCount, 'Error:', pitchesError);

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
                totalPlayers: playersCount || 0,
                totalVideos: videosCount || 0,
                activePitches: pitchesCount || 0,
                newMessages: messagesCount || 0
            });

            console.log('Final stats:', {
                totalPlayers: playersCount || 0,
                totalVideos: videosCount || 0,
                activePitches: pitchesCount || 0,
                newMessages: messagesCount || 0
            });

        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            toast({
                title: "Error",
                description: `Failed to load dashboard statistics: ${error.message}`,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePitchCreated = () => {
        setShowCreatePitch(false);
        toast({
            title: "Success",
            description: "Transfer pitch created successfully!",
        });
        // Refresh stats after creating a pitch
        fetchDashboardStats();
    };

    if (profile?.user_type !== 'team') {
        return null;
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
                        Please complete your team profile setup to access the dashboard.
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
                        Team Dashboard
                    </h1>
                    <p className="text-gray-400 font-poppins">
                        Welcome back, {profile?.full_name}
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreatePitch(true)}
                    className="bg-rosegold hover:bg-rosegold/90 text-white font-polysans"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Transfer Pitch
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-6 bg-card border-0">
                    <TabsTrigger
                        value="overview"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger
                        value="profile"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <User className="w-4 h-4 mr-2" />
                        Team Profile
                    </TabsTrigger>
                    <TabsTrigger
                        value="players"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <Users className="w-4 h-4 mr-2" />
                        Players
                    </TabsTrigger>
                    <TabsTrigger
                        value="videos"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <Video className="w-4 h-4 mr-2" />
                        Videos
                    </TabsTrigger>
                    <TabsTrigger
                        value="timeline"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <Target className="w-4 h-4 mr-2" />
                        Timeline
                    </TabsTrigger>
                    <TabsTrigger
                        value="explore"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <Search className="w-4 h-4 mr-2" />
                        Explore
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card className='bg-gradient-to-tr  from-purple-700/60 to-purple-600 border-0'>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Players
                                </CardTitle>
                                <Users className="h-4 w-4 text-purple-900" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.totalPlayers}</div>
                                <p className="text-xs text-white">
                                    Players in your team
                                </p>
                            </CardContent>
                        </Card>
                        <Card className='bg-gradient-to-tr  from-blue-700/60 to-blue-600 border-0'>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Total Videos
                                </CardTitle>
                                <Video className="h-4 w-4 text-blue-900" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.totalVideos}</div>
                                <p className="text-xs text-white">
                                    Videos uploaded
                                </p>
                            </CardContent>
                        </Card>
                        <Card className=' bg-gradient-to-tr  from-orange-700/60 to-orange-600 border-0'>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    Active Pitches
                                </CardTitle>
                                <Target className="h-4 w-4 text-orange-900" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.activePitches}</div>
                                <p className="text-xs text-white">
                                    Active transfer pitches
                                </p>
                            </CardContent>
                        </Card>
                        <Card className='  bg-gradient-to-tr  from-green-700/60 to-green-600 border-0'>
                            <CardHeader className="flex flex-row items-center justify-between  space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    New Messages
                                </CardTitle>
                                <MessageSquare className="h-4 w-4 text-green-900" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{loading ? '...' : stats.newMessages}</div>
                                <p className="text-xs text-white">
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
                                <Button
                                    onClick={() => setActiveTab('players')}
                                    variant="outline"
                                    className="h-20 flex flex-col items-center justify-center gap-2 border-gray-600 hover:border-rosegold"
                                >
                                    <Users className="h-6 w-6" />
                                    <span className="font-polysans">Manage Players</span>
                                </Button>
                                <Button
                                    onClick={() => setActiveTab('videos')}
                                    variant="outline"
                                    className="h-20 flex flex-col items-center justify-center gap-2 border-gray-600 hover:border-rosegold"
                                >
                                    <Upload className="h-6 w-6" />
                                    <span className="font-polysans">Upload Videos</span>
                                </Button>
                                <Button
                                    onClick={() => setShowCreatePitch(true)}
                                    variant="outline"
                                    className="h-20 flex flex-col items-center justify-center gap-2 border-gray-600 hover:border-rosegold"
                                >
                                    <Target className="h-6 w-6" />
                                    <span className="font-polysans">Create Pitch</span>
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="profile" className="space-y-6">
                    <TeamProfileSetup />
                </TabsContent>

                <TabsContent value="players" className="space-y-6">
                    <PlayerManagement />
                </TabsContent>

                <TabsContent value="videos" className="space-y-6">
                    <VideoManagement />
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
                                    Track your transfer activities and negotiations here.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="explore" className="space-y-6">
                    <Card className="border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-white font-polysans">Explore Players</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <Search className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                                <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                                    Explore Players
                                </h3>
                                <p className="text-gray-400 font-poppins">
                                    Discover talented players and create transfer requests.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Create Transfer Pitch Modal */}
            {showCreatePitch && (
                <CreateTransferPitch
                    isOpen={showCreatePitch}
                    onClose={() => setShowCreatePitch(false)}
                    onPitchCreated={handlePitchCreated}
                />
            )}
        </div>
    );
};

export default TeamDashboard; 