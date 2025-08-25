
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { BarChart3, Eye, MessageSquare, Target, TrendingUp, Clock } from 'lucide-react';

export const AgentRequestAnalytics: React.FC = () => {
  const { profile } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalRequests: 0,
    totalViews: 0,
    totalInteractions: 0,
    avgEngagement: 0,
    topPerformingRequest: null as any,
    recentRequests: [] as any[]
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [profile]);

  const fetchAnalytics = async () => {
    if (!profile?.user_type || profile.user_type !== 'agent') return;

    try {
      setLoading(true);
      
      // Get agent ID
      const { data: agentData } = await supabase
        .from('agents')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!agentData) return;

      // Get request analytics
      const { data: requests } = await supabase
        .from('agent_requests')
        .select('*')
        .eq('agent_id', agentData.id)
        .order('created_at', { ascending: false });

      if (requests) {
        const totalViews = requests.reduce((sum, req) => sum + (req.view_count || 0), 0);
        const totalInteractions = requests.reduce((sum, req) => sum + (req.interaction_count || 0), 0);
        
        const topPerformingRequest = requests.reduce((top, current) => {
          const currentScore = (current.view_count || 0) + (current.interaction_count || 0) * 2;
          const topScore = (top?.view_count || 0) + (top?.interaction_count || 0) * 2;
          return currentScore > topScore ? current : top;
        }, null);

        setAnalytics({
          totalRequests: requests.length,
          totalViews,
          totalInteractions,
          avgEngagement: requests.length ? totalInteractions / requests.length : 0,
          topPerformingRequest,
          recentRequests: requests.slice(0, 5)
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Requests</p>
                <p className="text-2xl font-bold">{analytics.totalRequests}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Views</p>
                <p className="text-2xl font-bold">{analytics.totalViews}</p>
              </div>
              <Eye className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Interactions</p>
                <p className="text-2xl font-bold">{analytics.totalInteractions}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Engagement</p>
                <p className="text-2xl font-bold">{analytics.avgEngagement.toFixed(1)}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Request */}
        {analytics.topPerformingRequest && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Top Performing Request
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium">{analytics.topPerformingRequest.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {analytics.topPerformingRequest.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">
                      {analytics.topPerformingRequest.view_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Views</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">
                      {analytics.topPerformingRequest.interaction_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Interactions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-500">
                      {analytics.topPerformingRequest.shortlist_count || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">Shortlisted</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Requests Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Requests Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.recentRequests.map((request, index) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{request.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <div className="text-center">
                      <p className="font-medium">{request.view_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Views</p>
                    </div>
                    <div className="text-center">
                      <p className="font-medium">{request.interaction_count || 0}</p>
                      <p className="text-xs text-muted-foreground">Interactions</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips & Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Increase Visibility</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Use specific, descriptive titles</li>
                <li>• Include budget ranges to attract serious inquiries</li>
                <li>• Tag relevant players to boost engagement</li>
                <li>• Post during peak hours (9-11 AM, 2-4 PM)</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Improve Engagement</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Respond quickly to messages</li>
                <li>• Update deal stages regularly</li>
                <li>• Provide detailed requirements</li>
                <li>• Follow up on shortlisted players</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentRequestAnalytics;
