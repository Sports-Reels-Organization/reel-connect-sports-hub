
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Search, MessageSquare, FileText } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import TransferTimeline from './TransferTimeline';
import StreamlinedPitchCreation from './StreamlinedPitchCreation';
import { AgentRequestsExplore } from './AgentRequestsExplore';
import MarketSnapshotWidget from './MarketSnapshotWidget';
import ExpiringSoonWidget from './ExpiringSoonWidget';
import UnifiedCommunicationHub from '../communication/UnifiedCommunicationHub';
import SimplifiedContractWorkflow from '../contracts/SimplifiedContractWorkflow';
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useAutoMarkNotificationsRead } from '@/hooks/useAutoMarkNotificationsRead';
import { useNotificationToasts } from '@/hooks/useNotificationToasts';

interface TeamExploreHubProps {
  initialSearch?: string;
}

export const TeamExploreHub = ({ initialSearch }: TeamExploreHubProps) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('timeline');
  const { counts } = useNotificationCounts();

  // Auto-mark ALL notifications as read when communication tab is viewed
  useAutoMarkNotificationsRead(activeTab === 'communication');

  // Set up toast notifications for incoming alerts
  useNotificationToasts();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['timeline', 'create', 'explore', 'communication', 'contracts', 'squad', 'analytics'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handlePitchCreated = () => {
    setActiveTab('timeline');
  };

  return (
    <div className="min-h-screen  p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">Team Explore Hub</h1>
          <p className="text-gray-400">Manage your transfer timeline, explore opportunities, and track market trends</p>
        </div>

        {/* Top Widgets Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <MarketSnapshotWidget />
          <ExpiringSoonWidget />
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full border-0">
          <TabsList className="grid w-full grid-cols-5 border-0">
            <TabsTrigger
              value="timeline"
              className="flex items-center gap-2 border-0 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4 border-0" />
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
              value="communication"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white relative"
            >
              <MessageSquare className="w-4 h-4" />
              Communication
              {counts.total > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs font-bold min-w-[20px] animate-pulse"
                >
                  {counts.total > 99 ? '99+' : counts.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="flex items-center gap-2 text-gray-300 data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              Contracts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="mt-6 ">
            <TransferTimeline />
          </TabsContent>

          <TabsContent value="create" className="mt-6">
            <StreamlinedPitchCreation onPitchCreated={handlePitchCreated} />
          </TabsContent>

          <TabsContent value="explore" className="mt-6">
            <AgentRequestsExplore initialSearch={initialSearch} />
          </TabsContent>

          <TabsContent value="communication" className="mt-6">
            <UnifiedCommunicationHub />
          </TabsContent>

          <TabsContent value="contracts" className="mt-6">
            <SimplifiedContractWorkflow />
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
};

export default TeamExploreHub;
