
import React from 'react';
import Layout from '@/components/Layout';
import History from '@/components/History';

const HistoryPage = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-[#111111]">
        <History />
      </div>
    </Layout>
  );
};

export default HistoryPage;
