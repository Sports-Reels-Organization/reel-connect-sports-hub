
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AgentDashboard from '@/components/AgentDashboard';
import TeamDashboard from '@/components/TeamDashboard';
import { PageFallback } from '@/components/PageFallback';

const Dashboard = () => {
  const { profile, loading } = useAuth();

  console.log('Dashboard render - profile:', profile, 'loading:', loading);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <PageFallback 
        title="Profile Required" 
        description="Please complete your profile setup to access the dashboard."
      />
    );
  }

  // Show agent dashboard for agents
  if (profile.user_type === 'agent') {
    return <AgentDashboard />;
  }

  // Show team dashboard for teams  
  if (profile.user_type === 'team') {
    return <TeamDashboard />;
  }

  // Fallback for unknown user types
  return (
    <PageFallback 
      title="Invalid User Type" 
      description="Your account type is not recognized. Please contact support."
    />
  );
};

export default Dashboard;
