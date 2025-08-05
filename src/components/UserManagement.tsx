
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'team' | 'agent';
  created_at: string;
  profile_completed: boolean;
  is_verified: boolean;
}

const UserManagement = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUsers, setDeletingUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load user profiles');
    } finally {
      setLoading(false);
    }
  };

  const deleteUserCompletely = async (userId: string, userName: string) => {
    setDeletingUsers(prev => new Set(prev).add(userId));
    
    try {
      // Call the database function to safely delete the user
      const { data, error } = await supabase.rpc('delete_user_completely', {
        user_uuid: userId
      });

      if (error) throw error;

      if (data) {
        toast.success(`User "${userName}" has been completely deleted`);
        // Remove the user from the local state
        setProfiles(prev => prev.filter(profile => profile.user_id !== userId));
      } else {
        throw new Error('Deletion function returned false');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(`Failed to delete user "${userName}". Please check the console for details.`);
    } finally {
      setDeletingUsers(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">User Management</h1>
        <Button onClick={fetchProfiles} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="grid gap-4">
        {profiles.map((profile) => (
          <Card key={profile.id} className="w-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{profile.full_name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant={profile.user_type === 'team' ? 'default' : 'secondary'}>
                    {profile.user_type}
                  </Badge>
                  {profile.is_verified && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">Email: {profile.email}</p>
              <p className="text-sm text-muted-foreground">
                User ID: {profile.user_id}
              </p>
              <p className="text-sm text-muted-foreground">
                Created: {new Date(profile.created_at).toLocaleDateString()}
              </p>
              <p className="text-sm text-muted-foreground">
                Profile Status: {profile.profile_completed ? 'Complete' : 'Incomplete'}
              </p>

              <div className="flex justify-end pt-2">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingUsers.has(profile.user_id)}
                    >
                      {deletingUsers.has(profile.user_id) ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete User
                        </>
                      )}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Delete User Completely
                      </AlertDialogTitle>
                      <AlertDialogDescription className="space-y-2">
                        <p>
                          Are you sure you want to permanently delete <strong>{profile.full_name}</strong>?
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This action will remove:
                        </p>
                        <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                          <li>• User authentication account</li>
                          <li>• Profile and all personal data</li>
                          <li>• All teams, players, and videos</li>
                          <li>• All messages and conversations</li>
                          <li>• All transfer pitches and contracts</li>
                          <li>• All related records and files</li>
                        </ul>
                        <p className="text-red-600 font-medium">
                          This action cannot be undone!
                        </p>
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteUserCompletely(profile.user_id, profile.full_name)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        Yes, Delete Permanently
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <p className="text-muted-foreground">No user profiles found.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManagement;
