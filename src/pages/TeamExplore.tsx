
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useTransferRestrictions } from '@/hooks/useTransferRestrictions';
import CreatePitchModal from '@/components/team-explore/CreatePitchModal';
import TeamPitchTimeline from '@/components/team-explore/TeamPitchTimeline';
import AgentRequestsExplore from '@/components/team-explore/AgentRequestsExplore';
import TeamMarketSnapshot from '@/components/team-explore/TeamMarketSnapshot';
import { 
  TrendingUp, 
  Search, 
  BarChart3, 
  Loader2, 
  RefreshCw, 
  Plus,
  Target,
  Users
} from 'lucide-react';

const TeamExplore = () => {
  const { profile } = useAuth();
  const { restrictions, loading: restrictionsLoading } = useTransferRestrictions();
  
  const [activeTab, setActiveTab] = useState('pitches');
  const [showCreatePitchModal, setShowCreatePitchModal] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handlePitchCreated = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (restrictionsLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-rosegold" />
            <p className="text-gray-400">Loading team data...</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Redirect non-team users
  if (profile?.user_type !== 'team') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h2 className="text-2xl font-bold text-white mb-2">Team Access Only</h2>
            <p className="text-gray-400">This page is only available for team accounts.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-[3rem]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-polysans text-white">Team Explore</h1>
            <Button
              onClick={handleRefresh}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowCreatePitchModal(true)}
              className="bg-rosegold text-black hover:bg-rosegold/90"
              disabled={!restrictions.canCreatePitch}
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Pitch
            </Button>
          </div>
        </div>

        {/* Requirements Check */}
        {!restrictions.canCreatePitch && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Target className="w-6 h-6 text-yellow-500 mt-0.5" />
              <div>
                <h3 className="text-white font-medium mb-1">Complete Setup Required</h3>
                <div className="text-sm text-yellow-200 space-y-1">
                  {!restrictions.hasVideoRequirement && (
                    <p>• Upload at least 5 tagged videos</p>
                  )}
                  {restrictions.pitchesUsedThisMonth >= restrictions.maxPitchesPerMonth && (
                    <p>• Monthly pitch limit reached ({restrictions.maxPitchesPerMonth})</p>
                  )}
                  {!profile?.is_verified && (
                    <p>• Team profile must be verified</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Market Snapshot */}
        <TeamMarketSnapshot 
          subscriptionTier={restrictions.subscriptionTier}
          memberAssociation={restrictions.memberAssociation}
          key={`snapshot-${refreshKey}`}
        />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pitches" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Your Pitches
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Agent Requests
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Market Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pitches" className="mt-6">
            <TeamPitchTimeline 
              onCreatePitch={() => setShowCreatePitchModal(true)}
              key={`pitches-${refreshKey}`}
            />
          </TabsContent>

          <TabsContent value="requests" className="mt-6">
            <AgentRequestsExplore 
              subscriptionTier={restrictions.subscriptionTier}
              memberAssociation={restrictions.memberAssociation}
              key={`requests-${refreshKey}`}
            />
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="space-y-6">
              <TeamMarketSnapshot 
                subscriptionTier={restrictions.subscriptionTier}
                memberAssociation={restrictions.memberAssociation}
                key={`analytics-${refreshKey}`}
              />
              
              {/* Additional analytics components can go here */}
              <div className="text-center py-12">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <h3 className="text-xl font-medium text-white mb-2">Advanced Analytics</h3>
                <p className="text-gray-400">
                  Detailed market analysis and performance insights coming soon.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Create Pitch Modal */}
        <CreatePitchModal
          isOpen={showCreatePitchModal}
          onClose={() => setShowCreatePitchModal(false)}
          onSuccess={handlePitchCreated}
        />
      </div>
    </Layout>
  );
};

export default TeamExplore;
