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
    Plus,
    Building,
    FileText,
    Download,
    Eye,
    Reply,
    Clock,
    Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import TeamProfileSetup from './TeamProfileSetup';
import PlayerManagement from './PlayerManagement';
import VideoManagement from './VideoManagement';
import CreateTransferPitch from './CreateTransferPitch';
import { MessageModal } from './MessageModal';
import { format } from 'date-fns';

const TeamDashboard = () => {
    const { profile } = useAuth();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('overview');
    const [showCreatePitch, setShowCreatePitch] = useState(false);
    const [messages, setMessages] = useState([]);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
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

    // Fetch messages when messages tab is active
    useEffect(() => {
        if (activeTab === 'messages' && profile?.id) {
            fetchMessages();
        }
    }, [activeTab, profile]);

    const fetchDashboardStats = async () => {
        try {
            setLoading(true);
            console.log('Fetching dashboard stats for profile:', profile);

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

            // Test basic table access
            console.log('Testing basic table access...');
            
            // Test players table
            const { data: playersTest, error: playersTestError } = await supabase
                .from('players')
                .select('count')
                .limit(1);
            console.log('Players table test:', { playersTest, playersTestError });

            // Test videos table
            const { data: videosTest, error: videosTestError } = await supabase
                .from('videos')
                .select('count')
                .limit(1);
            console.log('Videos table test:', { videosTest, videosTestError });

            // Test transfer_pitches table
            const { data: pitchesTest, error: pitchesTestError } = await supabase
                .from('transfer_pitches')
                .select('count')
                .limit(1);
            console.log('Transfer pitches table test:', { pitchesTest, pitchesTestError });

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

    const fetchMessages = async () => {
        try {
            setMessagesLoading(true);
            
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender_profile:profiles!messages_sender_id_fkey(
                        full_name,
                        user_type
                    ),
                    receiver_profile:profiles!messages_receiver_id_fkey(
                        full_name,
                        user_type
                    )
                `)
                .eq('receiver_id', profile?.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching messages:', error);
                toast({
                    title: "Error",
                    description: "Failed to load messages",
                    variant: "destructive"
                });
            } else {
                setMessages(data || []);
            }
        } catch (error) {
            console.error('Error in fetchMessages:', error);
        } finally {
            setMessagesLoading(false);
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

    const handleReplyToMessage = (message) => {
        setSelectedMessage(message);
        setShowMessageModal(true);
    };

    const markMessageAsRead = async (messageId) => {
        try {
            const { error } = await supabase
                .from('messages')
                .update({ status: 'read' })
                .eq('id', messageId);

            if (error) {
                console.error('Error marking message as read:', error);
            } else {
                // Update local state
                setMessages(prev => 
                    prev.map(msg => 
                        msg.id === messageId ? { ...msg, status: 'read' } : msg
                    )
                );
            }
        } catch (error) {
            console.error('Error in markMessageAsRead:', error);
        }
    };

    const handleDownloadContract = async (fileUrl, fileName) => {
        try {
            const response = await fetch(fileUrl);
            if (!response.ok) {
                throw new Error('Failed to fetch contract file');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Download Started",
                description: "Contract download has started",
            });
        } catch (error) {
            console.error('Error downloading contract:', error);
            toast({
                title: "Download Failed",
                description: "Failed to download contract",
                variant: "destructive"
            });
        }
    };

    const formatMessageTime = (timestamp) => {
        return format(new Date(timestamp), 'MMM dd, yyyy HH:mm');
    };

    if (profile?.user_type !== 'team') {
        return null;
    }

    // Show loading state while profile is loading
    if (loading) {
        return (
            <div className="space-y-6 p-[3rem]">
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rosegold mx-auto mb-4"></div>
                    <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                        Loading Team Dashboard
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
                    <TabsTrigger
                        value="messages"
                        className="data-[state=active]:bg-muted data-[state=active]:text-white"
                    >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Messages
                        {stats.newMessages > 0 && (
                            <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                                {stats.newMessages}
                            </Badge>
                        )}
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

                <TabsContent value="messages" className="space-y-4">
                    <Card className="bg-white/5 border-0">
                        <CardHeader>
                            <CardTitle className="text-white font-polysans flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-rosegold" />
                                Messages from Agents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {messagesLoading ? (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rosegold mx-auto mb-2"></div>
                                    <p className="text-gray-400">Loading messages...</p>
                                </div>
                            ) : messages.length === 0 ? (
                                <div className="text-center py-8">
                                    <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-600" />
                                    <h3 className="text-lg font-polysans text-white mb-2">No Messages Yet</h3>
                                    <p className="text-gray-400">Agents will contact you when they're interested in your players.</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((message) => (
                                        <Card 
                                            key={message.id} 
                                            className={`bg-gray-800 border-gray-700 cursor-pointer hover:bg-gray-700 transition-colors ${
                                                message.status !== 'read' ? 'border-l-4 border-l-rosegold' : ''
                                            }`}
                                            onClick={() => {
                                                if (message.status !== 'read') {
                                                    markMessageAsRead(message.id);
                                                }
                                                handleReplyToMessage(message);
                                            }}
                                        >
                                            <CardContent className="p-4">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <User className="h-4 w-4 text-blue-400" />
                                                            <span className="font-polysans font-semibold text-white">
                                                                {message.sender_profile?.full_name || 'Unknown Agent'}
                                                            </span>
                                                            {message.status !== 'read' && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    New
                                                                </Badge>
                                                            )}
                                                            <div className="flex items-center gap-1 ml-auto">
                                                                {message.status === 'read' ? (
                                                                    <Check className="h-3 w-3 text-green-400" />
                                                                ) : (
                                                                    <Clock className="h-3 w-3 text-gray-400" />
                                                                )}
                                                            </div>
                                                        </div>
                                                        
                                                        <p className="text-gray-300 text-sm mb-2 line-clamp-2">
                                                            {message.content}
                                                        </p>

                                                        <div className="flex items-center justify-between">
                                                            <div className="text-xs text-gray-500">
                                                                {formatMessageTime(message.created_at)}
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                              {/* Contract file - temporarily disabled until database migration
                                                              {message.contract_file_url && (
                                                                <Button
                                                                  variant="outline"
                                                                  size="sm"
                                                                  onClick={() => window.open(message.contract_file_url, '_blank')}
                                                                  className="h-6 px-2 text-xs"
                                                                >
                                                                  <FileText className="h-3 w-3 mr-1" />
                                                                  View Contract
                                                                </Button>
                                                              )}
                                                              */}
                                                              <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleReplyToMessage(message)}
                                                                className="h-6 px-2 text-xs"
                                                              >
                                                                <Reply className="h-3 w-3 mr-1" />
                                                                Reply
                                                              </Button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            )}
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

            {/* Message Modal */}
            {showMessageModal && selectedMessage && (
                <MessageModal
                    isOpen={showMessageModal}
                    onClose={() => {
                        setShowMessageModal(false);
                        setSelectedMessage(null);
                    }}
                    currentUserId={profile?.id || ''}
                    receiverId={selectedMessage.sender_id}
                    receiverName={selectedMessage.sender_profile?.full_name || 'Unknown Agent'}
                    receiverType="agent"
                    pitchTitle={selectedMessage.subject}
                />
            )}
        </div>
    );
};

export default TeamDashboard; 