
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Target, Clock, AlertTriangle } from 'lucide-react';
import { useMarketSnapshot } from '@/hooks/useMarketSnapshot';

const MarketSnapshotWidget = () => {
  const { snapshot, loading } = useMarketSnapshot();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <Card className="border-gray-700">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-700 rounded w-1/3"></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-gray-700 rounded"></div>
              <div className="h-16 bg-gray-700 rounded"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-gray-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Target className="w-5 h-5 text-rosegold" />
          Market Snapshot
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-rosegold">
              {formatCurrency(snapshot.avgAskingPrice)}
            </div>
            <div className="text-xs text-gray-400">Avg Asking Price</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">
              {snapshot.activePitches}
            </div>
            <div className="text-xs text-gray-400">Active Pitches</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">
              {snapshot.expiringPitches}
            </div>
            <div className="text-xs text-gray-400">Expiring Soon</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {snapshot.expiredWithoutInterest}%
            </div>
            <div className="text-xs text-gray-400">Expired w/o Interest</div>
          </div>
        </div>

        {/* Trending Positions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            Top 5 Most Pitched Positions
          </h4>
          <div className="space-y-2">
            {snapshot.trendingPositions.slice(0, 5).map((position, index) => (
              <div key={position.position} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300 w-4">#{index + 1}</span>
                  <span className="text-sm text-white">{position.position}</span>
                  {position.trend === 'up' && <TrendingUp className="w-3 h-3 text-green-400" />}
                  {position.trend === 'down' && <TrendingDown className="w-3 h-3 text-red-400" />}
                </div>
                <Badge variant="outline" className="text-gray-400 border-gray-600">
                  {position.count} pitches
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Most Requested Positions */}
        {snapshot.topRequestedPositions.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              Most Requested This Week
            </h4>
            <div className="space-y-2">
              {snapshot.topRequestedPositions.slice(0, 5).map((position, index) => (
                <div key={position.position} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300 w-4">#{index + 1}</span>
                    <span className="text-sm text-white">{position.position}</span>
                  </div>
                  <Badge variant="outline" className="text-purple-400 border-purple-400">
                    {position.requestCount} requests
                  </Badge>
                </div>
              ))}
            </div>
            {snapshot.topRequestedPositions.length > 0 && (
              <div className="bg-purple-900/20 border border-purple-500/30 rounded p-3 mt-3">
                <div className="flex items-center gap-2 text-purple-400 text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  High demand for {snapshot.topRequestedPositions[0]?.position}s - consider pitching players in this position
                </div>
              </div>
            )}
          </div>
        )}

        {/* Supply/Demand Insights */}
        <div className="bg-gray-800/50 rounded p-3 space-y-2">
          <h4 className="font-semibold text-white text-sm">Market Insights</h4>
          <div className="text-xs text-gray-400 space-y-1">
            <div>• {snapshot.activePitches} active pitches in your association</div>
            <div>• {snapshot.expiringPitches} expiring within 7 days</div>
            <div>• {snapshot.expiredWithoutInterest}% of pitches expire without agent interest</div>
            {snapshot.avgAskingPrice > snapshot.avgMarketValue && (
              <div className="text-yellow-400">
                • Asking prices are {Math.round(((snapshot.avgAskingPrice - snapshot.avgMarketValue) / snapshot.avgMarketValue) * 100)}% above market value
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MarketSnapshotWidget;
