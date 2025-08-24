
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Timeline, Search, Target, Settings } from 'lucide-react';
import TransferTimeline from './TransferTimeline';
import CreatePitchFlow from './CreatePitchFlow';
import AgentRequestsExplore from './AgentRequestsExplore';
import MarketSnapshotWidget from './MarketSnapshotWidget';
import { useTransferRestrictions } from '@/hooks/useTransferRestrictions';

const TeamExploreHub = () => {
  const [showCreatePitch, setShowCreatePitch] = useState(false);
  const { restrictions } = useTransferRestrictions();

  return (
    <div className="space-y-6 bg-background min-h-screen p-6">
      <Card className="border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-rosegold" />
              Team Transfer Hub
            </div>
            <div className="flex gap-2">
              <Dialog open={showCreatePitch} onOpenChange={setShowCreatePitch}>
                <DialogTrigger asChild>
                  <Button className="bg-rosegold hover:bg-rosegold/90 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Pitch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-gray-900 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Transfer Pitch</DialogTitle>
                  </DialogHeader>
                  <CreatePitchFlow onClose={() => setShowCreatePitch(false)} />
                </DialogContent>
              </Dialog>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
            <div className="lg:col-span-3">
              <Tabs defaultValue="timeline" className="w-full">
                <TabsList className="grid w-full grid-cols-3 bg-gray-800">
                  <TabsTrigger 
                    value="timeline" 
                    className="data-[state=active]:bg-rosegold data-[state=active]:text-white text-gray-300"
                  >
                    <Timeline className="w-4 h-4 mr-2" />
                    Transfer Timeline
                  </TabsTrigger>
                  <TabsTrigger 
                    value="explore" 
                    className="data-[state=active]:bg-rosegold data-[state=active]:text-white text-gray-300"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    Explore Requests
                  </TabsTrigger>
                  <TabsTrigger 
                    value="squad" 
                    className="data-[state=active]:bg-rosegold data-[state=active]:text-white text-gray-300"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Squad Management
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="timeline" className="mt-6">
                  <TransferTimeline />
                </TabsContent>

                <TabsContent value="explore" className="mt-6">
                  <AgentRequestsExplore />
                </TabsContent>

                <TabsContent value="squad" className="mt-6">
                  <Card className="border-gray-700">
                    <CardContent className="p-6 text-center">
                      <div className="text-gray-400">
                        <Settings className="w-16 h-16 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Squad Management
                        </h3>
                        <p>
                          Set player availability, transfer preferences, and manage your squad for incoming requests.
                        </p>
                        <Button className="mt-4 bg-rosegold hover:bg-rosegold/90 text-white">
                          Manage Squad Availability
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Market Snapshot Sidebar */}
            <div className="lg:col-span-1">
              <MarketSnapshotWidget />
            </div>
          </div>

          {/* Team Restrictions Info */}
          {restrictions && (
            <Card className="border-gray-700 mt-4">
              <CardContent className="p-4">
                <div className="text-sm text-gray-400">
                  <div className="flex items-center justify-between mb-2">
                    <span>Subscription Tier:</span>
                    <span className="text-white font-medium capitalize">{restrictions.subscriptionTier}</span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Pitches Used This Month:</span>
                    <span className="text-white font-medium">
                      {restrictions.pitchesUsedThisMonth}/{restrictions.maxPitchesPerMonth}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span>Video Requirement Met:</span>
                    <span className={`font-medium ${restrictions.hasVideoRequirement ? 'text-green-400' : 'text-red-400'}`}>
                      {restrictions.hasVideoRequirement ? 'Yes' : 'No (5 required)'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Can Create International Pitches:</span>
                    <span className={`font-medium ${restrictions.canViewInternational ? 'text-green-400' : 'text-red-400'}`}>
                      {restrictions.canViewInternational ? 'Yes' : 'Premium/Enterprise Only'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TeamExploreHub;
