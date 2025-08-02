
import React from 'react';
import Layout from '@/components/Layout';
import ContractManagement from '@/components/ContractManagement';

const Contracts = () => {
  return (
    <Layout>
      <div className="p-[3rem]">
        <ContractManagement />
      </div>
    </Layout>
  );
};

export default Contracts;
