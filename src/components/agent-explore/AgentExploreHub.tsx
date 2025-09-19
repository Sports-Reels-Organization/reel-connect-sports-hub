
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
import { useNotificationCounts } from '@/hooks/useNotificationCounts';
import { useNotificationToasts } from '@/hooks/useNotificationToasts';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useAutoMarkNotificationsRead } from '@/hooks/useAutoMarkNotificationsRead';

interface AgentExploreHubProps {
  initialSearch?: string;
}

export const AgentExploreHub: React.FC<AgentExploreHubProps> = ({ initialSearch }) => {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('timeline');
  const { counts } = useNotificationCounts();
  const { profile } = useAuth();
  const { toast } = useToast();
  
  // Auto-mark ALL notifications as read when communication tab is viewed
  useAutoMarkNotificationsRead(activeTab === 'communication');
  
  // Set up toast notifications for incoming alerts
  useNotificationToasts();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['timeline', 'requests', 'communication', 'contracts', 'insights', 'analytics'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Listen for workflow updates for immediate agent updates
  useEffect(() => {
    if (!profile?.user_id || profile.user_type !== 'agent') return;

    console.log('🎯 AGENT: Setting up workflow listeners');

    const handleWorkflowUpdate = (event: CustomEvent) => {
      const { type, teamName, playerName } = event.detail;
      
      console.log('⚡ AGENT: Workflow update received:', type);
      
      if (type === 'team_started_negotiation') {
        toast({
          title: "🚀 Negotiation Started!",
          description: `${teamName} is ready to start negotiations with you`,
          duration: 5000,
        });
      } else if (type === 'contract_created') {
        toast({
          title: "📄 Contract Created!",
          description: `${teamName} has created a contract for ${playerName}`,
          duration: 5000,
        });
      }
    };

    const handleContractCreated = (event: CustomEvent) => {
      const { agentId, pitchId, playerName, teamName } = event.detail;
      
      console.log('⚡ AGENT: Contract created event received:', {
        agentId, pitchId, playerName, teamName
      });
      
      // Force page refresh or navigation to update UI
      if (window.location.pathname.includes('/agent-explore')) {
        console.log('🔄 AGENT: Refreshing page to update contract status');
        window.location.reload();
      }
    };

    window.addEventListener('workflowUpdate', handleWorkflowUpdate as EventListener);
    window.addEventListener('contractCreated', handleContractCreated as EventListener);

    return () => {
      console.log('🧹 AGENT: Cleaning up workflow listeners');
      window.removeEventListener('workflowUpdate', handleWorkflowUpdate as EventListener);
      window.removeEventListener('contractCreated', handleContractCreated as EventListener);
    };
  }, [profile?.user_id, profile?.user_type, toast]);

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
              className="flex items-center gap-2 text-white data-[state=active]:bg-rosegold data-[state=active]:text-white relative"
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
