import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';

const SimpleWalletTest: React.FC = () => {
  const { profile } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserData = async () => {
      if (!profile?.id) {
        setDebugInfo({ error: 'No profile ID' });
        setLoading(false);
        return;
      }

      const info: any = {
        profile: profile,
        userType: profile.user_type,
        profileId: profile.id
      };

      try {
        // Check if team exists
        if (profile.user_type === 'team') {
          const { data: teamData, error: teamError } = await supabase
            .from('teams')
            .select('*')
            .eq('profile_id', profile.id)
            .maybeSingle();
          
          info.teamData = teamData;
          info.teamError = teamError;

          if (!teamData && !teamError) {
            // Try to create team
            const { data: newTeam, error: createError } = await supabase
              .from('teams')
              .insert({
                profile_id: profile.id,
                team_name: profile.full_name || 'My Team',
                country: profile.country || 'United States',
                sport_type: 'football'
              })
              .select('*')
              .single();
            
            info.newTeam = newTeam;
            info.createError = createError;
          }
        }

        // Check if agent exists
        if (profile.user_type === 'agent') {
          const { data: agentData, error: agentError } = await supabase
            .from('agents')
            .select('*')
            .eq('profile_id', profile.id)
            .maybeSingle();
          
          info.agentData = agentData;
          info.agentError = agentError;

          if (!agentData && !agentError) {
            // Try to create agent with minimal data
            const { data: newAgent, error: createError } = await supabase
              .from('agents')
              .insert({
                profile_id: profile.id,
                agency_name: profile.full_name || 'My Agency'
                // Remove specialization to avoid enum issues
              })
              .select('*')
              .single();
            
            info.newAgent = newAgent;
            info.createError = createError;
          }
        }

      } catch (error) {
        info.exception = error;
      }

      setDebugInfo(info);
      setLoading(false);
    };

    checkUserData();
  }, [profile]);

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Simple Wallet Test</h1>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {debugInfo.teamData && (
          <div className="mt-6 p-6 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800">✅ Team Found</h3>
            <p>Team ID: {debugInfo.teamData.id}</p>
            <p>Team Name: {debugInfo.teamData.team_name}</p>
          </div>
        )}

        {debugInfo.agentData && (
          <div className="mt-6 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-800">✅ Agent Found</h3>
            <p>Agent ID: {debugInfo.agentData.id}</p>
            <p>Agency Name: {debugInfo.agentData.agency_name}</p>
          </div>
        )}

        {debugInfo.newTeam && (
          <div className="mt-6 p-6 bg-purple-50 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-800">🆕 Team Created</h3>
            <p>New Team ID: {debugInfo.newTeam.id}</p>
          </div>
        )}

        {debugInfo.newAgent && (
          <div className="mt-6 p-6 bg-indigo-50 rounded-lg">
            <h3 className="text-lg font-semibold text-indigo-800">🆕 Agent Created</h3>
            <p>New Agent ID: {debugInfo.newAgent.id}</p>
          </div>
        )}

        {(debugInfo.createError || debugInfo.teamError || debugInfo.agentError) && (
          <div className="mt-6 p-6 bg-red-50 rounded-lg">
            <h3 className="text-lg font-semibold text-red-800">❌ Errors</h3>
            {debugInfo.createError && <p>Create Error: {JSON.stringify(debugInfo.createError)}</p>}
            {debugInfo.teamError && <p>Team Error: {JSON.stringify(debugInfo.teamError)}</p>}
            {debugInfo.agentError && <p>Agent Error: {JSON.stringify(debugInfo.agentError)}</p>}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SimpleWalletTest;
