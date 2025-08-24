
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AgentExplore from '@/components/AgentExplore';
import { TeamExploreHub } from '@/components/team-explore/TeamExploreHub';

const Explore = () => {
  const { profile } = useAuth();

  return (
    <Layout>
      {profile?.user_type === 'agent' ? (
        <AgentExplore />
      ) : profile?.user_type === 'team' ? (
        <TeamExploreHub />
      ) : (
        <div className="min-h-screen bg-background p-6">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-4">Explore</h2>
            <p className="text-gray-400">Please complete your profile setup to access explore features.</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Explore;
