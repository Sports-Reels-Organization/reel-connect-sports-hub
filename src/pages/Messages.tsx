
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { MessageSquare } from 'lucide-react';

const Messages = () => {
  return (
    <Layout>
      <div className="space-y-6 bg-background">
        <div>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Messages
          </h1>
          <p className="text-rosegold font-poppins">
            Communicate with teams and agents about transfer opportunities
          </p>
        </div>

        <Card className="bg-white/5 border-rosegold/20">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-12 w-12 text-rosegold mx-auto mb-4" />
            <h3 className="text-xl font-polysans text-white mb-2">Messages Coming Soon</h3>
            <p className="text-gray-400 font-poppins">
              In-app messaging system is under development. You'll be able to communicate directly with other users about transfer opportunities.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Messages;
