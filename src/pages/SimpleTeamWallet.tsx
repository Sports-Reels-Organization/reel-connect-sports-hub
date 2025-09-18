import React from 'react';
import Layout from '@/components/Layout';

const SimpleTeamWallet: React.FC = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">🏦 Team Wallet</h1>
          
          <div className="bg-white p-8 rounded-lg shadow">
            <p className="text-lg text-gray-700">
              ✅ Team wallet page is loading successfully!
            </p>
            <p className="text-sm text-gray-600 mt-2">
              This confirms that the routing and basic page structure is working.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SimpleTeamWallet;
