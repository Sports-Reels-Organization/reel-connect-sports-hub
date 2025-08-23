
import React from 'react';
import Layout from '@/components/Layout';
import EnhancedVideoManagement from '@/components/EnhancedVideoManagement';
import EnhancedTeamVideoManagement from '@/components/EnhancedTeamVideoManagement';
import { useAuth } from '@/contexts/AuthContext';

const Videos = () => {
  const { profile } = useAuth();

  return (
    <Layout>
      <div className="p-[3rem]">
        {profile?.user_type === 'team' ? (
          <EnhancedTeamVideoManagement />
        ) : (
          <EnhancedVideoManagement />
        )}
      </div>
    </Layout>
  );
};

export default Videos;
