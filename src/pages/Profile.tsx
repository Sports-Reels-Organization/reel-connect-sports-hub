
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import AgentProfileForm from '@/components/AgentProfileForm';
import TeamProfileSetup from '@/components/TeamProfileSetup';
import { ShortlistManager } from '@/components/ShortlistManager';
import { User, Heart, Bell, Settings, Users, Building } from 'lucide-react';

const Profile = () => {
  const { profile } = useAuth();

  return (
    <Layout>
      <div className="space-y-6 p-[3rem]">
        <div className='text-start'>
          <h1 className="text-3xl font-polysans font-bold text-white mb-2">
            Profile Settings
          </h1>
          <p className="text-gray-500 font-poppins">
            Manage your account and profile information
          </p>
        </div>

        {profile?.user_type === 'agent' ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Agent Profile
              </TabsTrigger>
              <TabsTrigger value="shortlist" className="flex items-center gap-2">
                <Heart className="w-4 h-4" />
                My Shortlist
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <AgentProfileForm />
            </TabsContent>

            <TabsContent value="shortlist" className="mt-6">
              <Card>
                <CardContent className="p-6">
                  <ShortlistManager showFullList={true} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rosegold">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Notification preferences coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : profile?.user_type === 'team' ? (
          <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                Team Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="mt-6">
              <TeamProfileSetup />
            </TabsContent>

            <TabsContent value="notifications" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-rosegold">
                    <Bell className="w-5 h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400">Notification preferences coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="bg-white/5 border-0">
            <CardContent className="p-12 text-center">
              <User className="h-12 w-12 text-rosegold mx-auto mb-4" />
              <h3 className="text-xl font-polysans text-white mb-2">Profile Management</h3>
              <p className="text-gray-400 font-poppins">
                Please complete your account setup to access profile management features.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Profile;
