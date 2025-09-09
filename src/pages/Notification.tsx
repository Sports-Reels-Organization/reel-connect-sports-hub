import Layout from '@/components/Layout';
import NotificationCenter from '@/components/NotificationCenter';
import React from 'react';

const Notification = () => {
    return (
        <Layout>
            <div className="space-y-6">
                <NotificationCenter />
            </div>
        </Layout>
    );
};

export default Notification;