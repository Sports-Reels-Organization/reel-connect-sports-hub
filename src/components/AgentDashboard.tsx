
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AgentProfile from '@/components/AgentProfile';
import AgentShortlist from '@/components/AgentShortlist';
import AgentExplore from '@/components/AgentExplore';
import { User, Heart, Search, Timeline, BarChart3 } from 'lucide-react';

const AgentDashboard = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Agent Dashboard
          </h1>
          <p className="text-gray-400 font-poppins">
            Welcome back, {profile?.full_name}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800 border-gray-700">
          <TabsTrigger 
            value="profile" 
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <User className="w-4 h-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger 
            value="timeline" 
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <Timeline className="w-4 h-4 mr-2" />
            Timeline
          </TabsTrigger>
          <TabsTrigger 
            value="shortlist" 
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <Heart className="w-4 h-4 mr-2" />
            Shortlist
          </TabsTrigger>
          <TabsTrigger 
            value="explore" 
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <Search className="w-4 h-4 mr-2" />
            Explore
          </TabsTrigger>
          <TabsTrigger 
            value="analytics" 
            className="data-[state=active]:bg-rosegold data-[state=active]:text-white"
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <AgentProfile />
        </TabsContent>

        <TabsContent value="timeline" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans">Transfer Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-400">
                The transfer timeline shows all active player pitches. Navigate to the Timeline page to view and interact with player transfers.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shortlist" className="space-y-6">
          <AgentShortlist />
        </TabsContent>

        <TabsContent value="explore" className="space-y-6">
          <AgentExplore />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card className="border-gray-700">
            <CardHeader>
              <CardTitle className="text-white font-polysans">Analytics Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-500" />
              <h3 className="text-xl font-polysans font-semibold text-white mb-2">
                Analytics Coming Soon
              </h3>
              <p className="text-gray-400 font-poppins">
                Advanced analytics and insights about your scouting activities, player performance analysis, and market trends will be available here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AgentDashboard;
