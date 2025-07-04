
import React from 'react';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { AgentTimeline } from '@/components/AgentTimeline';
import ExploreRequests from '@/components/ExploreRequests';
import { Clock, Search } from 'lucide-react';

const Explore = () => {
  const { profile } = useAuth();

  return (
    <Layout>
      <div className="space-y-6 p-[3rem]">
        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="timeline" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Transfer Timeline
            </TabsTrigger>
            <TabsTrigger value="requests" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Explore Requests
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timeline" className="mt-6">
            <AgentTimeline />
          </TabsContent>
          
          <TabsContent value="requests" className="mt-6">
            <ExploreRequests />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default Explore;
