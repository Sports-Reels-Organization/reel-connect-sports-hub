
import React from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { User } from 'lucide-react';

const Profile = () => {
  return (
    <Layout>
      <div className="space-y-6 p-[3rem]">
        <div className='text-start'>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-rosegold font-poppins">
            Manage your account and profile information
          </p>
        </div>

        <Card className="bg-white/5 border-0">
          <CardContent className="p-12 text-center">
            <User className="h-12 w-12 text-rosegold mx-auto mb-4" />
            <h3 className="text-xl font-polysans text-white mb-2">Profile Management Coming Soon</h3>
            <p className="text-gray-400 font-poppins">
              Comprehensive profile management features are under development. You'll be able to update your information, upload photos, and manage verification status.
            </p>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Profile;
