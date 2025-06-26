
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Video, MessageSquare, FileText, Plus, TrendingUp, Calendar, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalPlayers: number;
  totalVideos: number;
  totalMessages: number;
  activePitches: number;
}

interface RecentActivity {
  type: 'player' | 'video' | 'message' | 'pitch';
  title: string;
  description: string;
  date: string;
  id: string;
}

const Dashboard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalPlayers: 0,
    totalVideos: 0,
    totalMessages: 0,
    activePitches: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchDashboardData();
    }
  }, [profile]);

  const fetchDashboardData = async () => {
    try {
      if (profile?.user_type === 'team') {
        await fetchTeamDashboard();
      } else if (profile?.user_type === 'agent') {
        await fetchAgentDashboard();
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamDashboard = async () => {
    // Get team ID
    const { data: teamData } = await supabase
      .from('teams')
      .select('id')
      .eq('profile_id', profile?.id)
      .single();

    if (!teamData) return;

    // Fetch stats
    const [playersRes, videosRes, pitchesRes, messagesRes] = await Promise.all([
      supabase.from('players').select('id', { count: 'exact' }).eq('team_id', teamData.id),
      supabase.from('videos').select('id', { count: 'exact' }).eq('team_id', teamData.id),
      supabase.from('transfer_pitches').select('id', { count: 'exact' }).eq('team_id', teamData.id).eq('status', 'active'),
      supabase.from('player_messages').select('id', { count: 'exact' }).eq('receiver_id', profile?.id)
    ]);

    setStats({
      totalPlayers: playersRes.count || 0,
      totalVideos: videosRes.count || 0,
      activePitches: pitchesRes.count || 0,
      totalMessages: messagesRes.count || 0
    });

    // Fetch recent activity
    const { data: recentPlayers } = await supabase
      .from('players')
      .select('id, full_name, created_at')
      .eq('team_id', teamData.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const { data: recentVideos } = await supabase
      .from('videos')
      .select('id, title, created_at')
      .eq('team_id', teamData.id)
      .order('created_at', { ascending: false })
      .limit(3);

    const activity: RecentActivity[] = [];

    recentPlayers?.forEach(player => {
      activity.push({
        type: 'player',
        title: 'New Player Added',
        description: player.full_name,
        date: player.created_at,
        id: player.id
      });
    });

    recentVideos?.forEach(video => {
      activity.push({
        type: 'video',
        title: 'Video Uploaded',
        description: video.title,
        date: video.created_at,
        id: video.id
      });
    });

    setRecentActivity(activity.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5));
  };

  const fetchAgentDashboard = async () => {
    // Get agent ID
    const { data: agentData } = await supabase
      .from('agents')
      .select('id')
      .eq('profile_id', profile?.id)
      .single();

    if (!agentData) return;

    // Fetch stats for agents
    const [requestsRes, messagesRes] = await Promise.all([
      supabase.from('agent_requests').select('id', { count: 'exact' }).eq('agent_id', agentData.id),
      supabase.from('player_messages').select('id', { count: 'exact' }).eq('sender_id', profile?.id)
    ]);

    setStats({
      totalPlayers: 0,
      totalVideos: 0,
      activePitches: requestsRes.count || 0,
      totalMessages: messagesRes.count || 0
    });

    // Fetch recent activity for agents
    const { data: recentRequests } = await supabase
      .from('agent_requests')
      .select('id, title, created_at')
      .eq('agent_id', agentData.id)
      .order('created_at', { ascending: false })
      .limit(5);

    const activity: RecentActivity[] = [];

    recentRequests?.forEach(request => {
      activity.push({
        type: 'pitch',
        title: 'Request Created',
        description: request.title,
        date: request.created_at,
        id: request.id
      });
    });

    setRecentActivity(activity);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return '1 day ago';
    return `${diffInDays} days ago`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'player': return <Users className="w-4 h-4 text-rosegold" />;
      case 'video': return <Video className="w-4 h-4 text-bright-pink" />;
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-400" />;
      case 'pitch': return <Target className="w-4 h-4 text-green-400" />;
      default: return <Calendar className="w-4 h-4 text-gray-400" />;
    }
  };

  const quickActions = profile?.user_type === 'team' ? [
    {
      title: 'Add Player',
      description: 'Register a new player',
      icon: <Users className="w-6 h-6" />,
      action: () => navigate('/players'),
      color: 'bg-rosegold hover:bg-rosegold/90'
    },
    {
      title: 'Upload Video',
      description: 'Add match highlights',
      icon: <Video className="w-6 h-6" />,
      action: () => navigate('/videos'),
      color: 'bg-bright-pink hover:bg-bright-pink/90'
    },
    {
      title: 'Create Pitch',
      description: 'Post transfer opportunity',
      icon: <FileText className="w-6 h-6" />,
      action: () => navigate('/timeline'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'View Messages',
      description: 'Check inquiries',
      icon: <MessageSquare className="w-6 h-6" />,
      action: () => navigate('/messages'),
      color: 'bg-green-500 hover:bg-green-600'
    }
  ] : [
    {
      title: 'Explore Requests',
      description: 'Find opportunities',
      icon: <Target className="w-6 h-6" />,
      action: () => navigate('/explore'),
      color: 'bg-rosegold hover:bg-rosegold/90'
    },
    {
      title: 'Create Request',
      description: 'Post what you need',
      icon: <Plus className="w-6 h-6" />,
      action: () => navigate('/explore'),
      color: 'bg-bright-pink hover:bg-bright-pink/90'
    },
    {
      title: 'Browse Timeline',
      description: 'View available players',
      icon: <Users className="w-6 h-6" />,
      action: () => navigate('/timeline'),
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Messages',
      description: 'Manage conversations',
      icon: <MessageSquare className="w-6 h-6" />,
      action: () => navigate('/messages'),
      color: 'bg-green-500 hover:bg-green-600'
    }
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen  bg-background">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl  font-polysans font-bold text-white mb-[1rem]">
            Welcome, {profile?.full_name}
          </h1>
          <p className="text-gray-400 font-poppins">
            {profile?.user_type === 'team' ? 'Manage your team and players' : 'Discover new opportunities'}
          </p>
        </div>
        <Badge variant="outline" className="text-rosegold border-rosegold capitalize">
          {profile?.user_type}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {profile?.user_type === 'team' ? (
          <>
            <Card className="border-0 ">
              <CardHeader className="flex  flex-row items-center justify-between space-y-0 pb-2 ">
                <CardTitle className="text-sm font-medium text-gray-400">Total Players</CardTitle>
                <Users className="h-4 w-4 text-rosegold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalPlayers}</div>
                <p className="text-xs text-gray-400">Registered in your team</p>
              </CardContent>
            </Card>

            <Card className="border-0 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Videos</CardTitle>
                <Video className="h-4 w-4 text-bright-pink" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalVideos}</div>
                <p className="text-xs text-gray-400">Uploaded content</p>
              </CardContent>
            </Card>

            <Card className="border-0 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Pitches</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.activePitches}</div>
                <p className="text-xs text-gray-400">Transfer opportunities</p>
              </CardContent>
            </Card>

            <Card className=" border-0 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Messages</CardTitle>
                <MessageSquare className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent >
                <div className="text-2xl font-bold text-white">{stats.totalMessages}</div>
                <p className="text-xs text-gray-400">Total conversations</p>
              </CardContent>
            </Card>
          </>
        ) : (
          <>
            <Card className=" border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Active Requests</CardTitle>
                <Target className="h-4 w-4 text-rosegold" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.activePitches}</div>
                <p className="text-xs text-gray-400">Posted by you</p>
              </CardContent>
            </Card>

            <Card className=" border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Messages Sent</CardTitle>
                <MessageSquare className="h-4 w-4 text-bright-pink" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{stats.totalMessages}</div>
                <p className="text-xs text-gray-400">Player inquiries</p>
              </CardContent>
            </Card>

            <Card className=" border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Opportunities</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">-</div>
                <p className="text-xs text-gray-400">Available in timeline</p>
              </CardContent>
            </Card>

            <Card className=" border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Responses</CardTitle>
                <Users className="h-4 w-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">-</div>
                <p className="text-xs text-gray-400">To your requests</p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className=" border-0 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white font-polysans">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.action}
                  className={`${action.color} text-white flex flex-col items-center justify-center h-20 text-center`}
                >
                  {action.icon}
                  <span className="text-sm font-medium mt-1">{action.title}</span>
                  <span className="text-xs opacity-80">{action.description}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className=" border-0 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white font-polysans">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gray-700 rounded"></div>
                    <div className="flex-1 space-y-1">
                      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {activity.title}
                      </p>
                      <p className="text-sm text-gray-400 truncate">
                        {activity.description}
                      </p>
                    </div>
                    <div className="flex-shrink-0">
                      <span className="text-xs text-gray-500">
                        {formatTimeAgo(activity.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <Calendar className="w-12 h-12 mx-auto text-gray-500 mb-3" />
                <p className="text-gray-400 text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div >
  );
};

export default Dashboard;
