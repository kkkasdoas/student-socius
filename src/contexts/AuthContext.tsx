
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { toast } from 'sonner';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any, data: any }>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (userProfile: Partial<User>) => Promise<void>;
  refreshUserProfile: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  currentUser: null,
  session: null,
  login: async () => ({ error: null }),
  signUp: async () => ({ error: null, data: null }),
  loginWithGoogle: async () => {},
  loginWithMicrosoft: async () => {},
  logout: async () => {},
  updateUserProfile: async () => {},
  refreshUserProfile: async () => {},
  isLoading: true,
});

// Convert Supabase user data to our application User type
const mapToUser = async (sbUser: SupabaseUser): Promise<User | null> => {
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', sbUser.id)
      .single();

    if (error || !profile) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return {
      id: profile.id,
      displayName: profile.display_name,
      login_name: profile.login_name,
      bio: profile.bio,
      university: profile.university,
      verificationStatus: profile.verification_status,
      profilePictureUrl: profile.profile_picture_url,
      authProvider: profile.auth_provider,
      loginEmail: profile.login_email,
      blockStatus: profile.block_status,
      isDeleted: profile.is_deleted,
      createdAt: new Date(profile.created_at),
      updatedAt: new Date(profile.updated_at),
    };
  } catch (error) {
    console.error('Error mapping user profile:', error);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        
        if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        } else if (newSession?.user) {
          // Use setTimeout to prevent potential deadlocks
          setTimeout(() => {
            mapToUser(newSession.user).then(user => {
              setCurrentUser(user);
            });
          }, 0);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      
      if (currentSession?.user) {
        mapToUser(currentSession.user).then(user => {
          setCurrentUser(user);
        });
      }
      
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Login with email and password
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setIsLoading(false);
    return { error };
  };

  // Sign up with email and password
  const signUp = async (email: string, password: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    setIsLoading(false);
    return { data, error };
  };

  // Login with Google
  const loginWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/feed`,
      },
    });
  };

  // Login with Microsoft
  const loginWithMicrosoft = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/feed`,
      },
    });
  };

  // Logout
  const logout = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setIsLoading(false);
  };

  // Update user profile
  const updateUserProfile = async (userProfile: Partial<User>) => {
    if (!currentUser) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    try {
      // Convert from camelCase to snake_case for database
      const dbProfile: any = {};
      
      if (userProfile.displayName) dbProfile.display_name = userProfile.displayName;
      if (userProfile.bio !== undefined) dbProfile.bio = userProfile.bio;
      if (userProfile.university) dbProfile.university = userProfile.university;
      if (userProfile.profilePictureUrl) dbProfile.profile_picture_url = userProfile.profilePictureUrl;

      const { error } = await supabase
        .from('profiles')
        .update(dbProfile)
        .eq('id', currentUser.id);

      if (error) {
        throw error;
      }

      // Update the local user state
      await refreshUserProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  // Refresh user profile from database
  const refreshUserProfile = async () => {
    if (!session?.user) return;
    
    try {
      const user = await mapToUser(session.user);
      if (user) {
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const isAuthenticated = !!session && !!currentUser;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        session,
        login,
        signUp,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        updateUserProfile,
        refreshUserProfile,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
