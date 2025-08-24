
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  user_type: 'agent' | 'team';
  profile_completed?: boolean;
  country?: string;
  phone?: string;
  country_code?: string;
  is_verified?: boolean;
  role?: 'admin' | 'user';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, userData: any) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
  checkAdminRole: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Initializing auth...');
    
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        
        setUser(session?.user ?? null);
        
        if (session?.user) {
          console.log('User session found, fetching profile for:', session.user.id);
          // Fetch user profile with a small delay to ensure database consistency
          setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 200);
        } else {
          console.log('No session, clearing profile and setting loading to false');
          setProfile(null);
          setIsAdmin(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      console.log('Initial session check - Session found:', !!session, 'Error:', error);
      if (error) {
        console.error('Error getting session:', error);
        setLoading(false);
        return;
      }
      
      if (!session) {
        console.log('No initial session found, setting loading to false');
        setLoading(false);
      }
      // If session exists, the onAuthStateChange will handle it
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const createOrFetchProfile = async (userId: string, userData: any = {}) => {
    try {
      console.log('Creating or fetching profile for user:', userId, 'with data:', userData);
      
      // First, try to fetch existing profile
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        console.error('Error fetching existing profile:', fetchError);
        return null;
      }

      if (existingProfile) {
        console.log('Profile already exists:', existingProfile);
        return existingProfile;
      }

      // If no existing profile, create a new one
      const profileData = {
        user_id: userId,
        full_name: userData?.full_name || userData?.name || 'New User',
        email: userData?.email || '',
        user_type: userData?.user_type === 'agent' ? 'agent' as const : 'team' as const,
        profile_completed: false
      };

      const { data, error } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('Error creating profile:', error);
        // If error is due to duplicate key (profile already exists), try fetching it
        if (error.code === '23505') {
          console.log('Profile already exists (duplicate key), fetching existing profile...');
          const { data: retryFetch } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .single();
          return retryFetch;
        }
        return null;
      }

      console.log('Profile created successfully:', data);
      return data;
    } catch (error) {
      console.error('Exception in createOrFetchProfile:', error);
      return null;
    }
  };

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Starting profile fetch for user:', userId);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      console.log('Profile fetch result - Data:', data, 'Error:', error);

      if (error) {
        console.error('Unexpected error fetching profile:', error);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      } else if (!data) {
        console.log('No profile found, creating one...');
        // Get user data to create profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const newProfile = await createOrFetchProfile(userId, {
            email: user.email,
            full_name: user.user_metadata?.full_name || user.user_metadata?.name,
            user_type: 'team' // Default to team, user can change in onboarding
          });
          
          if (newProfile) {
            console.log('Profile created/fetched successfully, setting profile data');
            setProfile(newProfile);
            setIsAdmin(newProfile.role === 'admin');
          } else {
            console.log('Failed to create/fetch profile');
            setProfile(null);
            setIsAdmin(false);
          }
        }
        setLoading(false);
      } else {
        console.log('Profile fetched successfully:', data);
        setProfile(data);
        setIsAdmin(data.role === 'admin');
        setLoading(false);
      }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
    }
  };

  const checkAdminRole = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('is_admin');
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      setIsAdmin(data || false);
      return data || false;
    } catch (error) {
      console.error('Error in checkAdminRole:', error);
      return false;
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Sign Up Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      if (data.user && !data.session) {
        toast({
          title: "Check your email",
          description: "Please check your email and click the confirmation link to complete your registration.",
        });
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error in signUp:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast({
          title: "Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Error in signIn:', error);
      return { error };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`
        }
      });

      if (error) {
        toast({
          title: "Google Sign In Error",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
    } catch (error: any) {
      console.error('Error in signInWithGoogle:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        toast({
          title: "Sign Out Error",
          description: error.message,
          variant: "destructive"
        });
      }
    } catch (error: any) {
      console.error('Error in signOut:', error);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return { error: 'No user logged in' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        toast({
          title: "Profile Update Error",
          description: error.message,
          variant: "destructive"
        });
        return { error };
      }

      setProfile(data);
      // Update admin status if role was changed
      if (updates.role !== undefined) {
        setIsAdmin(data.role === 'admin');
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });

      return { error: null };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error };
    }
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
    checkAdminRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
