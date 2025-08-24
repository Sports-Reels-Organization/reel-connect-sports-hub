
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Target,
  AlertCircle,
  BarChart3,
  Clock,
  Globe
} from 'lucide-react';

interface MarketStats {
  avgAskingPriceInAssociation: number;
  topRequestedPositions: Array<{
    position: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  expiredPitchesRate: number;
  trendingRequests: Array<{
    title: string;
    demand: 'high' | 'medium' | 'low';
  }>;
  totalActivePitches: number;
  totalActiveRequests: number;
}

interface TeamMarketSnapshotProps {
  subscriptionTier: string;
  memberAssociation: string;
}

const TeamMarketSnapshot: React.FC<TeamMarketSnapshotProps> = ({ 
  subscriptionTier, 
  memberAssociation 
}) => {
  const { profile } = useAuth();
  const [marketStats, setMarketStats] = useState<MarketStats>({
    avgAskingPriceInAssociation: 0,
    topRequestedPositions: [],
    expiredPitchesRate: 0,
    trendingRequests: [],
    totalActivePitches: 0,
    totalActiveRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMarketSnapshot();
  }, [memberAssociation]);

  const fetchMarketSnapshot = async () => {
    try {
      setLoading(true);

      // Get total active pitches
      const { count: activePitchesCount } = await supabase
        .from('transfer_pitches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString());

      // Get total active requests
      const { count: activeRequestsCount } = await supabase
        .from('agent_requests')
        .select('*', { count: 'exact', head: true })
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString());

      // Get average asking price in association (for basic tier)
      let avgAskingPrice = 0;
      if (subscriptionTier === 'basic') {
        const { data: associationPitches } = await supabase
          .from('transfer_pitches')
          .select(`
            asking_price,
            teams!inner(member_association)
          `)
          .eq('status', 'active')
          .eq('teams.member_association', memberAssociation)
          .not('asking_price', 'is', null);

        if (associationPitches && associationPitches.length > 0) {
          const totalPrice = associationPitches.reduce((sum, pitch) => sum + (pitch.asking_price || 0), 0);
          avgAskingPrice = totalPrice / associationPitches.length;
        }
      } else {
        // Premium/Enterprise can see global average
        const { data: globalPitches } = await supabase
          .from('transfer_pitches')
          .select('asking_price')
          .eq('status', 'active')
          .not('asking_price', 'is', null);

        if (globalPitches && globalPitches.length > 0) {
          const totalPrice = globalPitches.reduce((sum, pitch) => sum + (pitch.asking_price || 0), 0);
          avgAskingPrice = totalPrice / globalPitches.length;
        }
      }

      // Get top requested positions
      const { data: requestsData } = await supabase
        .from('agent_requests')
        .select('position')
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .not('position', 'is', null);

      const positionCounts: Record<string, number> = {};
      requestsData?.forEach(request => {
        if (request.position) {
          positionCounts[request.position] = (positionCounts[request.position] || 0) + 1;
        }
      });

      const topPositions = Object.entries(positionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([position, count]) => ({
          position,
          count,
          trend: 'stable' as const // TODO: Calculate actual trend
        }));

      // Calculate expired pitches rate (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: totalPitchesLast30Days } = await supabase
        .from('transfer_pitches')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: expiredPitchesLast30Days } = await supabase
        .from('transfer_pitches')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'expired')
        .gte('created_at', thirtyDaysAgo.toISOString());

      const expiredRate = totalPitchesLast30Days && totalPitchesLast30Days > 0
        ? (expiredPitchesLast30Days || 0) / totalPitchesLast30Days * 100
        : 0;

      // Get trending requests (high activity)
      const { data: trendingData } = await supabase
        .from('agent_requests')
        .select(`
          title,
          tagged_players
        `)
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(5);

      const trending = trendingData?.map(request => ({
        title: request.title,
        demand: (request.tagged_players?.length || 0) > 5 ? 'high' as const :
                (request.tagged_players?.length || 0) > 2 ? 'medium' as const : 'low' as const
      })) || [];

      setMarketStats({
        avgAskingPriceInAssociation: avgAskingPrice,
        topRequestedPositions: topPositions,
        expiredPitchesRate: expiredRate,
        trendingRequests: trending,
        totalActivePitches: activePitchesCount || 0,
        totalActiveRequests: activeRequestsCount || 0
      });

    } catch (error) {
      console.error('Error fetching market snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-500" />;
      default: return <span className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const getDemandColor = (demand: 'high' | 'medium' | 'low') => {
    switch (demand) {
      case 'high': return 'text-red-400 bg-red-500/10 border-red-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20';
      case 'low': return 'text-green-400 bg-green-500/10 border-green-500/20';
    }
  };

  if (loading) {
    return (
      <Card className="border-gray-700 animate-pulse">
        <CardHeader>
          <div className="h-6 bg-gray-700 rounded w-1/3"></div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-700 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white font-polysans">
          <BarChart3 className="w-5 h-5" />
          Market Snapshot
          {subscriptionTier === 'basic' && (
            <Badge variant="outline" className="text-yellow-400 border-yellow-500/20">
              {memberAssociation} Only
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-400">
                Avg Price {subscriptionTier === 'basic' ? `(${memberAssociation})` : '(Global)'}
              </span>
            </div>
            <p className="text-2xl font-bold text-white">
              {formatCurrency(marketStats.avgAskingPriceInAssociation)}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-400">Active Pitches</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {marketStats.totalActivePitches.toLocaleString()}
            </p>
          </div>

          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-purple-500" />
              <span className="text-sm text-gray-400">Agent Requests</span>
            </div>
            <p className="text-2xl font-bold text-white">
              {marketStats.totalActiveRequests.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Top Requested Positions */}
        <div>
          <h4 className="text-white font-medium mb-3">Top 5 Most Requested Positions This Week</h4>
          <div className="space-y-2">
            {marketStats.topRequestedPositions.map((position, index) => (
              <div 
                key={position.position}
                className="flex items-center justify-between p-3 bg-gray-800 rounded"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-rosegold border-rosegold">
                    #{index + 1}
                  </Badge>
                  <span className="text-white font-medium">{position.position}</span>
                  {getTrendIcon(position.trend)}
                </div>
                <span className="text-gray-300">{position.count} requests</span>
              </div>
            ))}
          </div>
        </div>

        {/* Supply/Demand Gap */}
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span className="text-white font-medium">Supply/Demand Analysis</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Pitches expiring without interest</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">{marketStats.expiredPitchesRate.toFixed(1)}%</span>
              <Badge 
                variant="outline" 
                className={
                  marketStats.expiredPitchesRate > 70 ? 'text-red-400 border-red-500/20' :
                  marketStats.expiredPitchesRate > 40 ? 'text-yellow-400 border-yellow-500/20' :
                  'text-green-400 border-green-500/20'
                }
              >
                {marketStats.expiredPitchesRate > 70 ? 'High' :
                 marketStats.expiredPitchesRate > 40 ? 'Medium' : 'Low'}
              </Badge>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">Last 30 days</p>
        </div>

        {/* Trending Requests */}
        <div>
          <h4 className="text-white font-medium mb-3">Trending Agent Requests</h4>
          <div className="space-y-2">
            {marketStats.trendingRequests.slice(0, 3).map((request, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-800 rounded"
              >
                <span className="text-white text-sm truncate flex-1">{request.title}</span>
                <Badge variant="outline" className={getDemandColor(request.demand)}>
                  {request.demand} demand
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade Prompt for Basic Users */}
        {subscriptionTier === 'basic' && (
          <div className="bg-gradient-to-r from-rosegold/10 to-yellow-500/10 border border-rosegold/20 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Globe className="w-6 h-6 text-rosegold" />
              <div className="flex-1">
                <h4 className="text-white font-medium">Unlock Global Market Insights</h4>
                <p className="text-gray-400 text-sm">
                  Upgrade to Premium to view international market data and access worldwide opportunities.
                </p>
              </div>
              <Button className="bg-rosegold text-black hover:bg-rosegold/90">
                <TrendingUp className="w-4 h-4 mr-2" />
                Upgrade
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TeamMarketSnapshot;
