
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import OnboardingFlow from '@/components/OnboardingFlow';
import TeamProfileSetup from '@/components/TeamProfileSetup';
import PlayerManagement from '@/components/PlayerManagement';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img
            src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png"
            alt="Sports Reels"
            className="w-[100px] h-[100px] mx-auto mb-4 animate-pulse"
          />
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  if (!profile?.profile_completed) {
    return <OnboardingFlow />;
  }

  // For teams, check if they need to complete additional setup
  if (profile?.user_type === 'team') {
    // You can add logic here to check if team profile is complete
    // For now, we'll show the dashboard with the team profile setup options
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
