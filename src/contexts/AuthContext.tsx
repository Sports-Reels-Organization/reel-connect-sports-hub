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
          
          // Get the pending user type from localStorage
          const pendingUserType = localStorage.getItem('pending_user_type');
          console.log('Pending user type from localStorage:', pendingUserType);
          
          // Fetch user profile with a small delay to ensure database consistency
          setTimeout(() => {
            fetchUserProfile(session.user.id, {
              full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'New User',
              email: session.user.email || '',
              user_type: pendingUserType === 'agent' ? 'agent' : 'team' // Use selected type or default to team
            });
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

    // Safety timeout to prevent infinite loading - only run once
    const safetyTimeout = setTimeout(() => {
      console.warn('Safety timeout triggered, checking if still loading...');
      // Use a callback to get current loading state without dependency
      setLoading(currentLoading => {
        if (currentLoading) {
          console.warn('Forcing loading to false due to safety timeout');
          return false;
        }
        return currentLoading;
      });
    }, 15000); // 15 seconds

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []); // Remove loading dependency to prevent infinite loop

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
        user_type: userData?.user_type || 'team', // Use provided user_type or default to team
        profile_completed: false
      };
      
      console.log('Creating profile with user type:', profileData.user_type);

      console.log('Attempting to create profile with data:', profileData);

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

  const fetchUserProfile = async (userId: string, userData?: any) => {
    try {
      console.log('Starting profile fetch for user:', userId);
      setLoading(true);
      
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000); // 10 second timeout
      });
      
      // Try to fetch profile with retries to handle potential trigger delays
      let data = null;
      let error = null;
      let retryCount = 0;
      const maxRetries = 3;
      
      const fetchWithRetries = async (): Promise<{ data: any; error: any; retryCount: number }> => {
        while (retryCount < maxRetries && !data) {
          if (retryCount > 0) {
            console.log(`Retry ${retryCount} for profile fetch...`);
            // Wait a bit longer between retries
            await new Promise(resolve => setTimeout(resolve, 500 * retryCount));
          }
          
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          data = result.data;
          error = result.error;
          
          if (data) {
            console.log('Profile found on attempt', retryCount + 1);
            break;
          }
          
          retryCount++;
        }
        return { data, error, retryCount };
      };
      
      // Race between fetch and timeout
      const result = await Promise.race([fetchWithRetries(), timeoutPromise]) as { data: any; error: any; retryCount: number };
      const { data: profileData, error: profileError, retryCount: finalRetryCount } = result;

      console.log('Profile fetch result - Data:', profileData, 'Error:', profileError, 'Retries:', finalRetryCount);

      if (profileError) {
        console.error('Unexpected error fetching profile:', profileError);
        setProfile(null);
        setIsAdmin(false);
        setLoading(false);
      } else if (!profileData) {
        console.log('No profile found after retries, creating new profile...');
        // Create a new profile for the user
        const newProfile = await createOrFetchProfile(userId, userData || {
          full_name: 'New User',
          email: '',
          user_type: 'team'
        });
        
        if (newProfile) {
          console.log('New profile created successfully:', newProfile);
          // Check if profile already exists to prevent duplicate updates
          setProfile(prevProfile => {
            if (prevProfile && prevProfile.user_id === newProfile.user_id) {
              console.log('Profile already exists, skipping duplicate update');
              return prevProfile;
            }
            return newProfile;
          });
          setIsAdmin(newProfile.role === 'admin');
          
          // Clean up localStorage after successful profile creation
          localStorage.removeItem('pending_user_type');
          console.log('Cleaned up pending_user_type from localStorage');
        } else {
          console.error('Failed to create profile for user');
          // Try one more time with a different approach
          console.log('Attempting alternative profile creation...');
          try {
            const { data: directInsert, error: directError } = await supabase
              .from('profiles')
              .insert({
                user_id: userId,
                full_name: userData?.full_name || 'New User',
                email: userData?.email || '',
                user_type: userData?.user_type || 'team',
                profile_completed: false
              })
              .select()
              .single();
            
            if (directInsert && !directError) {
              console.log('Profile created via direct insert:', directInsert);
              setProfile(prevProfile => {
                if (prevProfile && prevProfile.user_id === directInsert.user_id) {
                  console.log('Profile already exists, skipping duplicate update');
                  return prevProfile;
                }
                return directInsert;
              });
              setIsAdmin(directInsert.role === 'admin');
              
              // Clean up localStorage after successful profile creation
              localStorage.removeItem('pending_user_type');
              console.log('Cleaned up pending_user_type from localStorage');
            } else {
              console.error('Direct insert also failed:', directError);
              setProfile(null);
              setIsAdmin(false);
            }
          } catch (directException) {
            console.error('Exception in direct insert:', directException);
            setProfile(null);
            setIsAdmin(false);
          }
        }
        setLoading(false);
              } else {
          console.log('Profile fetched successfully:', profileData);
          setProfile(prevProfile => {
            if (prevProfile && prevProfile.user_id === profileData.user_id) {
              console.log('Profile already exists, skipping duplicate update');
              return prevProfile;
            }
            return profileData;
          });
          setIsAdmin(profileData.role === 'admin');
          
          // Clean up localStorage if profile was fetched successfully
          if (localStorage.getItem('pending_user_type')) {
            localStorage.removeItem('pending_user_type');
            console.log('Cleaned up pending_user_type from localStorage after profile fetch');
          }
          
          setLoading(false);
        }
    } catch (error) {
      console.error('Exception in fetchUserProfile:', error);
      // If it's a timeout, try to create profile as fallback
      if (error instanceof Error && error.message === 'Profile fetch timeout') {
        console.log('Profile fetch timed out, attempting to create profile...');
        try {
          const newProfile = await createOrFetchProfile(userId, userData || {
            full_name: 'New User',
            email: '',
            user_type: 'team'
          });
          
          if (newProfile) {
            console.log('Profile created after timeout:', newProfile);
            setProfile(newProfile);
            setIsAdmin(newProfile.role === 'admin');
            
            // Clean up localStorage after successful profile creation
            localStorage.removeItem('pending_user_type');
            console.log('Cleaned up pending_user_type from localStorage');
          } else {
            console.error('Failed to create profile after timeout');
            // Try one more time with a different approach
            console.log('Attempting alternative profile creation after timeout...');
            try {
              const { data: directInsert, error: directError } = await supabase
                .from('profiles')
                .insert({
                  user_id: userId,
                  full_name: userData?.full_name || 'New User',
                  email: userData?.email || '',
                  user_type: userData?.user_type || 'team',
                  profile_completed: false
                })
                .select()
                .single();
              
              if (directInsert && !directError) {
                console.log('Profile created via direct insert after timeout:', directInsert);
                setProfile(prevProfile => {
                  if (prevProfile && prevProfile.user_id === directInsert.user_id) {
                    console.log('Profile already exists, skipping duplicate update');
                    return prevProfile;
                  }
                  return directInsert;
                });
                setIsAdmin(directInsert.role === 'admin');
                
                // Clean up localStorage after successful profile creation
                localStorage.removeItem('pending_user_type');
                console.log('Cleaned up pending_user_type from localStorage');
              } else {
                console.error('Direct insert also failed after timeout:', directError);
                setProfile(null);
                setIsAdmin(false);
              }
            } catch (directException) {
              console.error('Exception in direct insert after timeout:', directException);
              setProfile(null);
              setIsAdmin(false);
            }
          }
        } catch (createError) {
          console.error('Failed to create profile after timeout:', createError);
          setProfile(null);
          setIsAdmin(false);
        }
      } else {
        setProfile(null);
        setIsAdmin(false);
      }
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

      // Only update profile if data actually changed to prevent unnecessary re-renders
      setProfile(prevProfile => {
        if (JSON.stringify(prevProfile) === JSON.stringify(data)) {
          console.log('Profile unchanged, skipping update to prevent re-render');
          return prevProfile; // Return same reference if no actual changes
        }
        console.log('Profile updated, new data:', data);
        return data;
      });
      
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
