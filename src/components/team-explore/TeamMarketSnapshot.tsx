
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Clock, 
  MapPin,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Crown
} from 'lucide-react';

interface MarketStats {
  averageAskingPrice: number;
  averageMarketValue: number;
  totalActivePitches: number;
  expiringSoonCount: number;
  topPositions: Array<{ position: string; count: number }>;
  recentActivity: Array<{
    type: 'pitch_created' | 'request_posted' | 'pitch_expired';
    description: string;
    timestamp: string;
  }>;
}

interface TeamMarketSnapshotProps {
  subscriptionTier: string;
  memberAssociation: string;
}

const TeamMarketSnapshot: React.FC<TeamMarketSnapshotProps> = ({ 
  subscriptionTier, 
  memberAssociation 
}) => {
  const [stats, setStats] = useState<MarketStats>({
    averageAskingPrice: 0,
    averageMarketValue: 0,
    totalActivePitches: 0,
    expiringSoonCount: 0,
    topPositions: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketStats();
  }, [subscriptionTier, memberAssociation]);

  const fetchMarketStats = async () => {
    try {
      setLoading(true);

      // Get active transfer pitches with player info
      const { data: pitches } = await supabase
        .from('transfer_pitches')
        .select(`
          *,
          players!inner(position, market_value),
          teams!inner(member_association, subscription_tier)
        `)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      if (!pitches) {
        setLoading(false);
        return;
      }

      // Filter pitches based on subscription tier
      const accessiblePitches = pitches.filter(pitch => {
        const pitchTeam = pitch.teams;
        
        // Basic tier: only domestic pitches
        if (subscriptionTier === 'basic') {
          return !pitch.is_international && pitchTeam.member_association === memberAssociation;
        }
        
        // Premium/Enterprise: all pitches
        return true;
      });

      // Calculate stats
      const totalPitches = accessiblePitches.length;
      const avgAskingPrice = totalPitches > 0 
        ? accessiblePitches.reduce((sum, p) => sum + (p.asking_price || 0), 0) / totalPitches 
        : 0;
      const avgMarketValue = totalPitches > 0
        ? accessiblePitches.reduce((sum, p) => sum + (p.players.market_value || 0), 0) / totalPitches
        : 0;

      // Count expiring soon (within 7 days)
      const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const expiringSoon = accessiblePitches.filter(p => 
        new Date(p.expires_at) <= sevenDaysFromNow
      ).length;

      // Get top positions
      const positionCounts = accessiblePitches.reduce((acc, p) => {
        const position = p.players.position;
        acc[position] = (acc[position] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topPositions = Object.entries(positionCounts)
        .map(([position, count]) => ({ position, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get recent agent requests for activity
      const { data: recentRequests } = await supabase
        .from('agent_requests')
        .select('title, created_at')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(3);

      const recentActivity = [
        ...(recentRequests || []).map(req => ({
          type: 'request_posted' as const,
          description: `New agent request: ${req.title}`,
          timestamp: req.created_at
        })),
        // Add more activity types as needed
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
       .slice(0, 5);

      setStats({
        averageAskingPrice: avgAskingPrice,
        averageMarketValue: avgMarketValue,
        totalActivePitches: totalPitches,
        expiringSoonCount: expiringSoon,
        topPositions,
        recentActivity
      });

    } catch (error) {
      console.error('Error fetching market stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const priceChangePercentage = stats.averageMarketValue > 0 
    ? ((stats.averageAskingPrice - stats.averageMarketValue) / stats.averageMarketValue) * 100
    : 0;

  const isPriceAboveMarket = priceChangePercentage > 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-gray-700 animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-700 rounded w-3/4"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Subscription Tier Notice */}
      {subscriptionTier === 'basic' && (
        <Card className="border-yellow-500/20 bg-yellow-500/5">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Crown className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="text-yellow-500 font-medium">Basic Tier - Domestic Market Only</h4>
                <p className="text-yellow-200 text-sm mt-1">
                  Showing pitches from {memberAssociation} only. 
                  <Button variant="link" className="text-yellow-400 p-0 ml-1 h-auto">
                    Upgrade to Premium
                  </Button> to access international transfers.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Asking Price */}
        <Card className="border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Average Asking Price</p>
                <p className="text-2xl font-bold text-white">
                  ${stats.averageAskingPrice.toLocaleString()}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {isPriceAboveMarket ? (
                    <ArrowUpRight className="w-4 h-4 text-red-400" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4 text-green-400" />
                  )}
                  <span className={`text-sm ${isPriceAboveMarket ? 'text-red-400' : 'text-green-400'}`}>
                    {Math.abs(priceChangePercentage).toFixed(1)}% vs market value
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-rosegold" />
            </div>
          </CardContent>
        </Card>

        {/* Active Pitches */}
        <Card className="border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Pitches</p>
                <p className="text-2xl font-bold text-white">{stats.totalActivePitches}</p>
                <p className="text-green-400 text-sm mt-1">
                  {subscriptionTier === 'basic' ? 'Domestic only' : 'Global market'}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card className="border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Expiring Soon</p>
                <p className="text-2xl font-bold text-white">{stats.expiringSoonCount}</p>
                <p className="text-yellow-400 text-sm mt-1">Next 7 days</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        {/* Market Trend */}
        <Card className="border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Market Trend</p>
                <p className="text-2xl font-bold text-white">
                  {isPriceAboveMarket ? 'Seller' : 'Buyer'}
                </p>
                <p className="text-gray-400 text-sm mt-1">Market favors</p>
              </div>
              {isPriceAboveMarket ? (
                <TrendingUp className="w-8 h-8 text-green-400" />
              ) : (
                <TrendingDown className="w-8 h-8 text-red-400" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Positions */}
        <Card className="border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Target className="w-5 h-5" />
              Most Requested Positions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topPositions.length > 0 ? (
                stats.topPositions.map((item, index) => (
                  <div key={item.position} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                        index === 0 ? 'bg-rosegold text-black' : 
                        index === 1 ? 'bg-gray-600 text-white' :
                        'bg-gray-700 text-gray-300'
                      }`}>
                        {index + 1}
                      </div>
                      <span className="text-white">{item.position}</span>
                    </div>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">
                      {item.count} pitches
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No position data available</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Activity className="w-5 h-5" />
              Recent Market Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'pitch_created' ? 'bg-green-400' :
                      activity.type === 'request_posted' ? 'bg-blue-400' :
                      'bg-red-400'
                    }`} />
                    <div className="flex-1">
                      <p className="text-white text-sm">{activity.description}</p>
                      <p className="text-gray-400 text-xs">
                        {new Date(activity.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Insights */}
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <MapPin className="w-5 h-5" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-blue-500/10 rounded-lg p-4 mb-2">
                <DollarSign className="w-8 h-8 text-blue-400 mx-auto" />
              </div>
              <h4 className="text-white font-medium">Price vs Value</h4>
              <p className="text-gray-400 text-sm mt-1">
                {isPriceAboveMarket 
                  ? 'Asking prices are above market value. Good time to sell.' 
                  : 'Asking prices are below market value. Potential bargains available.'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-500/10 rounded-lg p-4 mb-2">
                <Clock className="w-8 h-8 text-yellow-400 mx-auto" />
              </div>
              <h4 className="text-white font-medium">Urgency Level</h4>
              <p className="text-gray-400 text-sm mt-1">
                {stats.expiringSoonCount > 5 
                  ? 'High urgency - Many pitches expiring soon.'
                  : 'Normal activity - Standard market pace.'
                }
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-500/10 rounded-lg p-4 mb-2">
                <Users className="w-8 h-8 text-green-400 mx-auto" />
              </div>
              <h4 className="text-white font-medium">Market Activity</h4>
              <p className="text-gray-400 text-sm mt-1">
                {stats.totalActivePitches > 20 
                  ? 'High activity - Competitive market conditions.'
                  : stats.totalActivePitches > 10
                    ? 'Moderate activity - Balanced market.'
                    : 'Low activity - Limited options available.'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamMarketSnapshot;
