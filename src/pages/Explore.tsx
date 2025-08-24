
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import AgentTimeline from '@/components/AgentTimeline';
import ExploreRequests from '@/components/ExploreRequests';
import ExploreOverview from '@/components/explore/ExploreOverview';
import ExploreFilters from '@/components/explore/ExploreFilters';
import MarketInsights from '@/components/explore/MarketInsights';
import { useEnhancedExplore } from '@/hooks/useEnhancedExplore';
import { useTransferRestrictions } from '@/hooks/useTransferRestrictions';
import { Clock, Search, BarChart3, Loader2, RefreshCw } from 'lucide-react';

const Explore = () => {
  const { profile } = useAuth();
  const { restrictions } = useTransferRestrictions();
  const [activeView, setActiveView] = useState<'dashboard' | 'timeline' | 'requests' | 'insights'>('dashboard');
  
  const {
    filters,
    setFilters,
    savedFilters,
    marketSnapshot,
    marketTrends,
    recentActivity,
    loading,
    saveFilter,
    loadFilter,
    deleteFilter,
    refetchData
  } = useEnhancedExplore();

  const handleViewActivePitches = () => {
    setActiveView('timeline');
  };

  const handleViewTrending = (position: string) => {
    setFilters({ ...filters, position });
    setActiveView('timeline');
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-rosegold" />
            <p className="text-gray-400">Loading market data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-[3rem]">
        {/* Header with navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-polysans text-white">Explore Market</h1>
            <Button
              onClick={refetchData}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          {/* View Toggle */}
          <div className="flex bg-gray-800 rounded-lg p-1">
            <Button
              size="sm"
              variant={activeView === 'dashboard' ? 'default' : 'ghost'}
              onClick={() => setActiveView('dashboard')}
              className={activeView === 'dashboard' ? 'bg-rosegold text-black' : 'text-gray-300 hover:text-white'}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Overview
            </Button>
            <Button
              size="sm"
              variant={activeView === 'timeline' ? 'default' : 'ghost'}
              onClick={() => setActiveView('timeline')}
              className={activeView === 'timeline' ? 'bg-rosegold text-black' : 'text-gray-300 hover:text-white'}
            >
              <Clock className="w-4 h-4 mr-1" />
              Pitches
            </Button>
            <Button
              size="sm"
              variant={activeView === 'requests' ? 'default' : 'ghost'}
              onClick={() => setActiveView('requests')}
              className={activeView === 'requests' ? 'bg-rosegold text-black' : 'text-gray-300 hover:text-white'}
            >
              <Search className="w-4 h-4 mr-1" />
              Requests
            </Button>
            <Button
              size="sm"
              variant={activeView === 'insights' ? 'default' : 'ghost'}
              onClick={() => setActiveView('insights')}
              className={activeView === 'insights' ? 'bg-rosegold text-black' : 'text-gray-300 hover:text-white'}
            >
              <BarChart3 className="w-4 h-4 mr-1" />
              Insights
            </Button>
          </div>
        </div>

        {/* Dashboard Overview */}
        {activeView === 'dashboard' && (
          <div className="space-y-6">
            <ExploreOverview
              marketSnapshot={marketSnapshot}
              onViewActivePitches={handleViewActivePitches}
              onViewTrending={handleViewTrending}
            />
            
            <MarketInsights
              trends={marketTrends}
              recentActivity={recentActivity}
              totalActivePitches={marketSnapshot.activePitches}
              totalActiveRequests={0} // TODO: Get from agent requests
              subscriptionTier={restrictions.subscriptionTier}
            />
          </div>
        )}

        {/* Enhanced Filters (show for timeline and requests) */}
        {(activeView === 'timeline' || activeView === 'requests') && (
          <ExploreFilters
            filters={filters}
            onFiltersChange={setFilters}
            savedFilters={savedFilters}
            onSaveFilter={saveFilter}
            onLoadFilter={loadFilter}
            onDeleteFilter={deleteFilter}
          />
        )}

        {/* Transfer Timeline */}
        {activeView === 'timeline' && <AgentTimeline />}

        {/* Explore Requests */}
        {activeView === 'requests' && <ExploreRequests />}

        {/* Market Insights */}
        {activeView === 'insights' && (
          <MarketInsights
            trends={marketTrends}
            recentActivity={recentActivity}
            totalActivePitches={marketSnapshot.activePitches}
            totalActiveRequests={0} // TODO: Get from agent requests
            subscriptionTier={restrictions.subscriptionTier}
          />
        )}

        {/* Original Tab System (fallback) */}
        {activeView === 'dashboard' && (
          <Tabs defaultValue="timeline" className="w-full mt-8">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Quick Browse
              </TabsTrigger>
              <TabsTrigger value="requests" className="flex items-center gap-2">
                <Search className="w-4 h-4" />
                Recent Requests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="timeline" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Show preview of recent pitches */}
                <AgentTimeline />
              </div>
            </TabsContent>

            <TabsContent value="requests" className="mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Show preview of recent requests */}
                <ExploreRequests />
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </Layout>
  );
};

export default Explore;
