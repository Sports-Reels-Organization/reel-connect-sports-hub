
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  Bookmark, 
  BarChart3, 
  Bot,
  AlertCircle,
  Clock,
  Target
} from 'lucide-react';
import { AgentRequestsExplore } from './AgentRequestsExplore';
import { AgentMarketInsights } from './AgentMarketInsights';
import { AgentSavedViews } from './AgentSavedViews';
import { AgentRequestAnalytics } from './AgentRequestAnalytics';

interface AgentExploreHubProps {
  initialSearch?: string;
}

export const AgentExploreHub: React.FC<AgentExploreHubProps> = ({ initialSearch = '' }) => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');
  const [dashboardData, setDashboardData] = useState({
    expiringRequests: 0,
    totalRequests: 0,
    totalViews: 0,
    averageEngagement: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, [profile]);

  const fetchDashboardData = async () => {
    if (!profile?.user_type || profile.user_type !== 'agent') return;

    try {
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      // Use placeholder data for now since the new tables might not be synchronized yet
      setDashboardData({
        expiringRequests: 2,
        totalRequests: 8,
        totalViews: 156,
        averageEngagement: 4.2
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set placeholder data on error
      setDashboardData({
        expiringRequests: 0,
        totalRequests: 0,
        totalViews: 0,
        averageEngagement: 0
      });
    }
  };

  if (profile?.user_type !== 'agent') {
    return (
      <Card className="border-destructive">
        <CardContent className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Access Restricted</h3>
          <p className="text-muted-foreground">This section is only available for registered agents.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboardData.expiringRequests}</p>
                <p className="text-sm text-muted-foreground">Expiring Soon</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Target className="w-8 h-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboardData.totalRequests}</p>
                <p className="text-sm text-muted-foreground">Active Requests</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboardData.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-foreground">{dashboardData.averageEngagement.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="requests" className="flex items-center gap-2">
            <Search className="w-4 h-4" />
            Requests Feed
          </TabsTrigger>
          <TabsTrigger value="market" className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            Market Insights
          </TabsTrigger>
          <TabsTrigger value="saved" className="flex items-center gap-2">
            <Bookmark className="w-4 h-4" />
            Saved Views
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="ai-scout" className="flex items-center gap-2">
            <Bot className="w-4 h-4" />
            AI Scout
          </TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="mt-6">
          <AgentRequestsExplore initialSearch={initialSearch} />
        </TabsContent>

        <TabsContent value="market" className="mt-6">
          <AgentMarketInsights />
        </TabsContent>

        <TabsContent value="saved" className="mt-6">
          <AgentSavedViews />
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <AgentRequestAnalytics />
        </TabsContent>

        <TabsContent value="ai-scout" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-6 h-6 text-primary" />
                AI Scout - Coming Soon
              </CardTitle>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Bot className="w-20 h-20 text-muted-foreground mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-foreground mb-4">
                AI-Powered Scouting Assistant
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Our AI Scout will analyze player data, match patterns to your requests, 
                and suggest the best transfer targets based on your scouting preferences.
              </p>
              <Badge variant="secondary" className="px-4 py-2">
                Coming Soon
              </Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentExploreHub;
