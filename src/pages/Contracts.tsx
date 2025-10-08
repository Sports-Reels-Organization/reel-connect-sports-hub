
import React from 'react';
import Layout from '@/components/Layout';
import SimplifiedContractWorkflow from '@/components/contracts/SimplifiedContractWorkflow';

const Contracts = () => {
  return (
    <Layout>
      <div className="p-[3rem]">
        <SimplifiedContractWorkflow />
      </div>
    </Layout>
  );
};

export default Contracts;
