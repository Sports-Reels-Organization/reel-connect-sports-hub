
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface MarketSnapshot {
  avgAskingPrice: number;
  avgMarketValue: number;
  activePitches: number;
  expiringPitches: number;
  trendingPositions: Array<{
    position: string;
    count: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  topRequestedPositions: Array<{
    position: string;
    requestCount: number;
  }>;
  expiredWithoutInterest: number;
}

export const useMarketSnapshot = () => {
  const { profile } = useAuth();
  const [snapshot, setSnapshot] = useState<MarketSnapshot>({
    avgAskingPrice: 0,
    avgMarketValue: 0,
    activePitches: 0,
    expiringPitches: 0,
    trendingPositions: [],
    topRequestedPositions: [],
    expiredWithoutInterest: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.user_type === 'team') {
      fetchMarketSnapshot();
    }
  }, [profile]);

  const fetchMarketSnapshot = async () => {
    if (!profile?.id) return;

    try {
      setLoading(true);

      // Get team's association
      const { data: teamData } = await supabase
        .from('teams')
        .select('member_association')
        .eq('profile_id', profile.id)
        .single();

      if (!teamData) return;

      // Get active pitches in same association
      const { data: pitchData } = await supabase
        .from('transfer_pitches')
        .select(`
          asking_price,
          expires_at,
          message_count,
          players!inner(position, market_value),
          teams!inner(member_association)
        `)
        .eq('status', 'active')
        .eq('teams.member_association', teamData.member_association)
        .gt('expires_at', new Date().toISOString());

      // Calculate metrics
      const activePitches = pitchData?.length || 0;
      const avgAskingPrice = pitchData && pitchData.length > 0
        ? pitchData.reduce((sum, p) => sum + (p.asking_price || 0), 0) / pitchData.length
        : 0;

      const avgMarketValue = pitchData && pitchData.length > 0
        ? pitchData.reduce((sum, p) => sum + (p.players?.market_value || 0), 0) / pitchData.length
        : 0;

      // Count expiring pitches (within 7 days)
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      
      const expiringPitches = pitchData?.filter(p => 
        new Date(p.expires_at) <= sevenDaysFromNow
      ).length || 0;

      // Get trending positions
      const positionCounts: Record<string, number> = {};
      pitchData?.forEach(p => {
        if (p.players?.position) {
          positionCounts[p.players.position] = (positionCounts[p.players.position] || 0) + 1;
        }
      });

      const trendingPositions = Object.entries(positionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([position, count]) => ({
          position,
          count,
          trend: 'stable' as const
        }));

      // Get agent request positions
      const { data: requestData } = await supabase
        .from('agent_requests')
        .select('position')
        .eq('is_public', true)
        .gt('expires_at', new Date().toISOString());

      const requestPositionCounts: Record<string, number> = {};
      requestData?.forEach(r => {
        if (r.position) {
          requestPositionCounts[r.position] = (requestPositionCounts[r.position] || 0) + 1;
        }
      });

      const topRequestedPositions = Object.entries(requestPositionCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([position, requestCount]) => ({
          position,
          requestCount
        }));

      // Calculate expired without interest
      const expiredWithoutInterest = pitchData?.filter(p => 
        p.message_count === 0
      ).length || 0;

      setSnapshot({
        avgAskingPrice,
        avgMarketValue,
        activePitches,
        expiringPitches,
        trendingPositions,
        topRequestedPositions,
        expiredWithoutInterest: Math.round((expiredWithoutInterest / activePitches) * 100) || 0
      });

    } catch (error) {
      console.error('Error fetching market snapshot:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    snapshot,
    loading,
    refreshSnapshot: fetchMarketSnapshot
  };
};
