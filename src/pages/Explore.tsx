
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import AgentExplore from '@/components/AgentExplore';
import TeamExploreHub from '@/components/team-explore/TeamExploreHub';
import { useSearchParams } from 'react-router-dom';

const Explore = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get('search');

  // Pass search query to child components
  const exploreProps = searchQuery ? { initialSearch: searchQuery } : {};

  if (profile?.user_type === 'agent') {
    return (
      <Layout>
        <AgentExplore {...exploreProps} />
      </Layout>
    );
  }

  return (
    <Layout>
      <TeamExploreHub {...exploreProps} />
    </Layout>
  );
};

export default Explore;
