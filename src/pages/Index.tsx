
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthForm from '@/components/AuthForm';
import Layout from '@/components/Layout';
import Dashboard from '@/components/Dashboard';

const Index = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/lovable-uploads/41a57d3e-b9e8-41da-b5d5-bd65db3af6ba.png" 
            alt="Sports Reels" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-white font-poppins">Loading Sports Reels...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return (
    <Layout>
      <Dashboard />
    </Layout>
  );
};

export default Index;
