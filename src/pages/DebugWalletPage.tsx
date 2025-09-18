import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';

const DebugWalletPage: React.FC = () => {
  const { profile, user } = useAuth();

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🔍 Wallet Debug Information</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* User Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">User Information</h2>
              <div className="space-y-2 text-sm">
                <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
                <p><strong>Email:</strong> {user?.email || 'Not available'}</p>
                <p><strong>Authenticated:</strong> {user ? '✅ Yes' : '❌ No'}</p>
              </div>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
              <div className="space-y-2 text-sm">
                <p><strong>Profile ID:</strong> {profile?.id || 'Not available'}</p>
                <p><strong>Full Name:</strong> {profile?.full_name || 'Not available'}</p>
                <p><strong>User Type:</strong> {profile?.user_type || 'Not available'}</p>
                <p><strong>Profile Completed:</strong> {profile?.profile_completed ? '✅ Yes' : '❌ No'}</p>
                <p><strong>Country:</strong> {profile?.country || 'Not available'}</p>
              </div>
            </div>

            {/* Raw Data */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Raw Profile Data</h2>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">
                {JSON.stringify(profile, null, 2)}
              </pre>
            </div>

            {/* Wallet Access Test */}
            <div className="md:col-span-2 bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Wallet Access Test</h2>
              <div className="space-y-4">
                {profile?.user_type === 'team' && (
                  <div className="p-4 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-800">✅ You should have access to Team Wallet</p>
                    <p className="text-sm text-green-600 mt-1">
                      The system will look for a team record with profile_id: {profile.id}
                    </p>
                  </div>
                )}
                
                {profile?.user_type === 'agent' && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-800">✅ You should have access to Agent Payment History</p>
                    <p className="text-sm text-blue-600 mt-1">
                      The system will look for an agent record with profile_id: {profile.id}
                    </p>
                  </div>
                )}

                {!profile?.user_type && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-800">❌ No user type detected</p>
                    <p className="text-sm text-red-600 mt-1">
                      You may need to complete your profile setup.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DebugWalletPage;
