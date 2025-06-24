
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  UserPlus,
  TrendingUp,
  MessageCircle,
  Search,
  Bookmark,
  AlertCircle,
  CheckCircle2,
  Clock,
  Trophy,
  Settings,
  Video
} from 'lucide-react';
import InfoTooltip from './InfoTooltip';

const Dashboard: React.FC = () => {
  const { profile } = useAuth();

  const teamStats = [
    { label: 'Active Players', value: '23', icon: Users, color: 'text-blue-400' },
    { label: 'Videos Uploaded', value: '5', icon: Video, color: 'text-green-400' },
    { label: 'Transfer Pitches', value: '3', icon: TrendingUp, color: 'text-rosegold' },
    { label: 'Unread Messages', value: '7', icon: MessageCircle, color: 'text-orange-400' },
  ];

  const agentStats = [
    { label: 'Shortlisted Players', value: '12', icon: Bookmark, color: 'text-blue-400' },
    { label: 'Active Searches', value: '3', icon: Search, color: 'text-green-400' },
    { label: 'Unread Messages', value: '7', icon: MessageCircle, color: 'text-orange-400' },
    { label: 'Profile Completion', value: '80%', icon: CheckCircle2, color: 'text-rosegold' },
  ];

  const stats = profile?.user_type === 'team' ? teamStats : agentStats;

  const recentActivity = [
    {
      type: 'player_added',
      message: 'New player profile created: Marcus Johnson',
      time: '2 hours ago',
      icon: UserPlus,
      color: 'text-green-400'
    },
    {
      type: 'message_received',
      message: 'New message from Chelsea FC Academy',
      time: '5 hours ago',
      icon: MessageCircle,
      color: 'text-blue-400'
    },
    {
      type: 'pitch_expired',
      message: 'Transfer pitch for Sarah Williams expired',
      time: '1 day ago',
      icon: Clock,
      color: 'text-orange-400'
    },
  ];

  return (
    <div className="p-6 space-y-6 min-h-screen bg-background">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-rosegold to-bright-pink rounded-xl p-6 text-white">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-polysans text-2xl font-bold mb-2">
              Welcome back, {profile?.full_name}!
            </h1>
            <p className="opacity-90 mb-4">
              {profile?.user_type === 'team'
                ? 'Manage your team, players, and transfers all in one place.'
                : 'Discover talent, manage your shortlist, and connect with teams.'}
            </p>
            {!profile?.profile_completed && (
              <div className="flex items-center gap-2 bg-white/20 rounded-lg p-3 mb-4">
                <AlertCircle className="w-5 h-5" />
                <span className="text-sm">Complete your profile to unlock all features</span>
                <Button size="sm" variant="secondary" className="ml-auto">
                  Complete Profile
                </Button>
              </div>
            )}
          </div>
          <Trophy className="w-12 h-12 opacity-60" />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <Card key={index} className="bg-card border-border hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-white">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-polysans flex items-center gap-2 text-white">
              Quick Actions
              <InfoTooltip content="Common tasks you can perform quickly from your dashboard" />
            </CardTitle>
            <CardDescription className="text-gray-400">
              {profile?.user_type === 'team'
                ? 'Manage your team and players efficiently'
                : 'Discover and connect with talent'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {profile?.user_type === 'team' ? (
              <>
                <Button className="w-full justify-start bg-rosegold hover:bg-rosegold/90 text-white" size="lg">
                  <Settings className="w-5 h-5 mr-3" />
                  Complete Team Profile
                </Button>
                <Button className="w-full justify-start bg-card border-border text-white hover:bg-muted" variant="outline" size="lg">
                  <UserPlus className="w-5 h-5 mr-3" />
                  Add New Player
                </Button>
                <Button className="w-full justify-start bg-card border-border text-white hover:bg-muted" variant="outline" size="lg">
                  <Video className="w-5 h-5 mr-3" />
                  Upload Videos
                </Button>
                <Button className="w-full justify-start bg-card border-border text-white hover:bg-muted" variant="outline" size="lg">
                  <TrendingUp className="w-5 h-5 mr-3" />
                  Create Transfer Pitch
                </Button>
              </>
            ) : (
              <>
                <Button className="w-full justify-start bg-rosegold hover:bg-rosegold/90 text-white" size="lg">
                  <Search className="w-5 h-5 mr-3" />
                  Search Players
                </Button>
                <Button className="w-full justify-start bg-card border-border text-white hover:bg-muted" variant="outline" size="lg">
                  <Bookmark className="w-5 h-5 mr-3" />
                  View Shortlist
                </Button>
                <Button className="w-full justify-start bg-card border-border text-white hover:bg-muted" variant="outline" size="lg">
                  <MessageCircle className="w-5 h-5 mr-3" />
                  Send Message
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="font-polysans flex items-center gap-2 text-white">
              Recent Activity
              <InfoTooltip content="Your latest activities and updates on the platform" />
            </CardTitle>
            <CardDescription className="text-gray-400">Stay updated with your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
                  <activity.icon className={`w-5 h-5 mt-0.5 ${activity.color}`} />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white mb-1">
                      {activity.message}
                    </p>
                    <p className="text-xs text-gray-400">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requirements for Teams */}
      {profile?.user_type === 'team' && (
        <Card className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border-orange-500/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-polysans font-semibold text-orange-400 text-lg mb-2">Complete Your Team Setup</h3>
                <p className="text-orange-300 mb-3">
                  To access all platform features and post transfer pitches, you need:
                </p>
                <ul className="text-orange-300 space-y-1 mb-4">
                  <li>• Complete team profile information</li>
                  <li>• Add at least one player with full details</li>
                  <li>• Upload minimum 5 team/player videos</li>
                  <li>• Verify your team with required documentation</li>
                </ul>
                <Badge variant="outline" className="border-orange-500 text-orange-400">
                  Required for Transfer Timeline Access
                </Badge>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                Complete Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Notice */}
      <Card className="border-bright-pink/20 bg-gradient-to-r from-bright-pink/5 to-rosegold/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-polysans font-semibold text-lg mb-2 text-white">Unlock Premium Features</h3>
              <p className="text-gray-300 mb-3">
                Get unlimited transfers, advanced analytics, and priority support
              </p>
              <ul className="text-sm text-gray-400 space-y-1">
                <li>• Unlimited transfer pitches</li>
                <li>• International transfer access</li>
                <li>• AI-powered market value analysis</li>
                <li>• Advanced player search filters</li>
                <li>• Priority customer support</li>
              </ul>
            </div>
            <Button className="bg-bright-pink hover:bg-bright-pink/90 text-white">
              Upgrade Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
