
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Search, Users, FileText, MessageSquare, BarChart3 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import AgentRequestsExplore from './AgentRequestsExplore';
import AgentTransferTimeline from './AgentTransferTimeline';
import AgentMarketInsights from './AgentMarketInsights';
import UnifiedCommunicationHub from '../communication/UnifiedCommunicationHub';
import SimplifiedContractWorkflow from '../contracts/SimplifiedContractWorkflow';
import TransferPerformanceAnalytics from '../analytics/TransferPerformanceAnalytics';

interface AgentExploreHubProps {
  initialSearch?: string;
}

export const AgentExploreHub: React.FC<AgentExploreHubProps> = ({ initialSearch }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['timeline', 'requests', 'communication', 'contracts', 'insights', 'analytics'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 font-polysans">Agent Explore Hub</h1>
          <p className="text-gray-400">
            Discover opportunities, connect with teams, and stay ahead of the market
          </p>
        </div>

        {/* Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 border-0">
            <TabsTrigger
              value="timeline"
              className="flex items-center gap-2 text-white data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <TrendingUp className="w-4 h-4" />
              Transfer Timeline
            </TabsTrigger>
            <TabsTrigger
              value="requests"
              className="flex items-center gap-2 text-white data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              Agent Requests
            </TabsTrigger>
            <TabsTrigger
              value="communication"
              className="flex items-center gap-2 text-white data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <MessageSquare className="w-4 h-4" />
              Communication
            </TabsTrigger>
            <TabsTrigger
              value="contracts"
              className="flex items-center gap-2 text-white data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <FileText className="w-4 h-4" />
              Contracts
            </TabsTrigger>
            <TabsTrigger
              value="insights"
              className="flex items-center gap-2 text-white data-[state=active]:bg-rosegold data-[state=active]:text-white"
            >
              <Search className="w-4 h-4" />
              Market Insights
            </TabsTrigger>

          </TabsList>

          {/* Transfer Timeline Tab */}
          <TabsContent value="timeline" className="mt-6">
            <AgentTransferTimeline />
          </TabsContent>

          {/* Agent Requests Tab */}
          <TabsContent value="requests" className="mt-6">
            <AgentRequestsExplore initialSearch={initialSearch} />
          </TabsContent>

          {/* Communication Tab */}
          <TabsContent value="communication" className="mt-6">
            <UnifiedCommunicationHub />
          </TabsContent>

          {/* Contracts Tab */}
          <TabsContent value="contracts" className="mt-6">
            <SimplifiedContractWorkflow />
          </TabsContent>

          {/* Market Insights Tab */}
          <TabsContent value="insights" className="mt-6">
            <AgentMarketInsights />
          </TabsContent>


        </Tabs>
      </div>
    </div>
  );
};
