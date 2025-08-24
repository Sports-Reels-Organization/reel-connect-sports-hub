
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Search, BarChart3 } from 'lucide-react';
import TransferTimeline from './TransferTimeline';
import CreatePitchFlow from './CreatePitchFlow';
import AgentRequestsExplore from './AgentRequestsExplore';
import MarketSnapshotWidget from './MarketSnapshotWidget';

export const TeamExploreHub = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Team Explore Hub</h1>
          <p className="text-gray-400">Manage your transfer timeline, explore opportunities, and track market trends</p>
        </div>

        {/* Market Snapshot Widget */}
        <MarketSnapshotWidget />

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-gray-800 border-gray-600">
            <TabsTrigger 
              value="timeline" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              Transfer Timeline
            </TabsTrigger>
            <TabsTrigger 
              value="create" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <Users className="w-4 h-4" />
              Create Pitch
            </TabsTrigger>
            <TabsTrigger 
              value="explore" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <Search className="w-4 h-4" />
              Explore Requests
            </TabsTrigger>
            <TabsTrigger 
              value="analytics" 
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6">
            <TransferTimeline />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <CreatePitchFlow />
          </TabsContent>

          <TabsContent value="explore" className="mt-6">
            <AgentRequestsExplore />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="border-gray-600">
              <CardHeader>
                <CardTitle className="text-white">Analytics Dashboard</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                  <h3 className="text-xl font-semibold text-white mb-2">
                    Analytics Coming Soon
                  </h3>
                  <p className="text-gray-400">
                    Detailed analytics and insights will be available here.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TeamExploreHub;
