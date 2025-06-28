import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  user_id: string;
  user_type: 'team' | 'agent';
  full_name: string;
  email: string;
  country_code?: string;
  phone?: string;
  country?: string;
  is_verified: boolean;
  profile_completed: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setUser(session?.user ?? null);
        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        console.log('Auth state changed:', event, session?.user?.id);
        setUser(session?.user ?? null);

        if (session?.user) {
          if (event === 'SIGNED_IN') {
            const pendingUserType = localStorage.getItem('pending_user_type');
            console.log('Pending user type during SIGNED_IN:', pendingUserType);

            if (pendingUserType) {
              try {
                // Update user metadata with the selected user type
                const { error } = await supabase.auth.updateUser({
                  data: { user_type: pendingUserType }
                });

                if (error) {
                  console.error('Error updating user metadata:', error);
                } else {
                  console.log('User metadata updated with user_type:', pendingUserType);
                }
              } catch (error) {
                console.error('Error updating user metadata:', error);
              }
            }
          }

          // Fetch profile after a short delay to allow metadata to update
          setTimeout(() => fetchProfile(session.user.id), 500);
        } else {
          setProfile(null);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user ID:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        if (error.code === 'PGRST116') { // Profile not found
          console.log('Profile not found, creating new profile...');
          await createProfile(userId);
          return;
        }
        throw error;
      }
      console.log('Profile fetched successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const createProfile = async (userId: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (!user.data.user) throw new Error('No authenticated user');

      // Get the pending user type from localStorage
      let pendingUserType = localStorage.getItem('pending_user_type');
      console.log('Creating profile with user type:', pendingUserType);

      // Validate user type
      if (!pendingUserType || (pendingUserType !== 'team' && pendingUserType !== 'agent')) {
        console.warn('Invalid or missing user type, defaulting to team');
        pendingUserType = 'team';
      }

      // Create the profile
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: user.data.user.user_metadata?.full_name ||
            user.data.user.user_metadata?.name ||
            'New User',
          email: user.data.user.email || '',
          user_type: pendingUserType as 'team' | 'agent',
          profile_completed: false,
          is_verified: false
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        throw error;
      }

      console.log('Profile created successfully with type:', data.user_type);
      setProfile(data);

      // Clean up localStorage
      localStorage.removeItem('pending_user_type');
    } catch (error) {
      console.error('Error creating profile:', error);
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');
    if (!profile) throw new Error('No profile found');

    try {
      console.log('Updating profile with data:', updates);
      console.log('User ID:', user.id);
      console.log('Profile ID:', profile.id);

      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Database error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signInWithGoogle,
      signOut,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};