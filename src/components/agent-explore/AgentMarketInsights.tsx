
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { TrendingUp, TrendingDown, DollarSign, Users, Globe, Target } from 'lucide-react';

export const AgentMarketInsights: React.FC = () => {
  const [insights, setInsights] = useState({
    avgAskingPrice: 0,
    totalRequests: 0,
    trendingPositions: [],
    regionalActivity: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketInsights();
  }, []);

  const fetchMarketInsights = async () => {
    try {
      setLoading(true);

      // Get basic stats
      const { data: requestsData } = await supabase
        .from('agent_requests')
        .select('budget_min, budget_max, position, country, created_at')
        .eq('is_public', true)
        .gte('expires_at', new Date().toISOString());

      const totalRequests = requestsData?.length || 0;
      const avgAskingPrice = requestsData?.reduce((sum, req) => {
        const avg = ((req.budget_min || 0) + (req.budget_max || 0)) / 2;
        return sum + avg;
      }, 0) / totalRequests || 0;

      // Get trending positions
      const positionCounts: Record<string, number> = {};
      requestsData?.forEach(req => {
        if (req.position) {
          positionCounts[req.position] = (positionCounts[req.position] || 0) + 1;
        }
      });

      const trendingPositions = Object.entries(positionCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([position, count]) => ({ position, count }));

      // Get regional activity
      const countryCounts: Record<string, number> = {};
      requestsData?.forEach(req => {
        if (req.country) {
          countryCounts[req.country] = (countryCounts[req.country] || 0) + 1;
        }
      });

      const regionalActivity = Object.entries(countryCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([country, count]) => ({ country, count }));

      setInsights({
        avgAskingPrice,
        totalRequests,
        trendingPositions,
        regionalActivity,
        recentActivity: requestsData?.slice(-10) || []
      });
    } catch (error) {
      console.error('Error fetching market insights:', error);
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
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg. Budget Range</p>
                <p className="text-2xl font-bold">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'USD',
                    minimumFractionDigits: 0
                  }).format(insights.avgAskingPrice)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Requests</p>
                <p className="text-2xl font-bold">{insights.totalRequests}</p>
              </div>
              <Target className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Market Activity</p>
                <p className="text-2xl font-bold flex items-center gap-1">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  High
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trending Positions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Most Requested Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.trendingPositions.map((item: any, index) => (
                <div key={item.position} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <span className="font-medium">{item.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count} requests</span>
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Regional Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Regional Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {insights.regionalActivity.map((item: any, index) => (
                <div key={item.country} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                      <span className="text-sm font-medium">{index + 1}</span>
                    </div>
                    <span className="font-medium">{item.country}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{item.count} requests</span>
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full"
                        style={{ 
                          width: `${(item.count / insights.totalRequests) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Market Trends & Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="font-medium">Key Insights</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Midfielder positions are in highest demand this month</li>
                <li>• Average budget ranges have increased by 15% vs last quarter</li>
                <li>• European leagues show the most activity</li>
                <li>• Permanent transfers preferred over loans (70% vs 30%)</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <h4 className="font-medium">Recommendations</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Post requests during weekdays for better visibility</li>
                <li>• Include specific passport requirements to attract relevant responses</li>
                <li>• Consider budget flexibility for competitive positions</li>
                <li>• Tag relevant players to increase engagement</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AgentMarketInsights;
