
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getCurrentUser, updateUserProfile as updateUserProfileHelper } from '@/utils/supabaseHelpers';

type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  signUp: (email: string, password: string) => Promise<{
    success: boolean;
    error?: string;
  }>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<User>) => Promise<User | null>;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithApple: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({ success: false, error: 'Not implemented' }),
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  logout: async () => {},
  updateUserProfile: async () => null,
  loginWithGoogle: async () => {},
  loginWithMicrosoft: async () => {},
  loginWithApple: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isAuthenticated = !!currentUser;

  // Fetch user profile on mount and session change
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            try {
              const user = await getCurrentUser();
              setCurrentUser(user);
            } catch (error) {
              console.error('Error fetching user profile:', error);
            } finally {
              setIsLoading(false);
            }
          }, 0);
        } else {
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch user profile
        getCurrentUser().then(user => {
          setCurrentUser(user);
          setIsLoading(false);
        }).catch(error => {
          console.error('Error fetching existing user profile:', error);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        return { success: false, error: error.message };
      }

      const user = await getCurrentUser();
      setCurrentUser(user);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('Sign up error:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sign up error:', error.message);
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/feed',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });

      if (error) {
        console.error('Google login error:', error.message);
      }
    } catch (error: any) {
      console.error('Google login error:', error);
    }
  };

  const loginWithMicrosoft = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin + '/feed',
        }
      });

      if (error) {
        console.error('Microsoft login error:', error.message);
      }
    } catch (error: any) {
      console.error('Microsoft login error:', error);
    }
  };

  const loginWithApple = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: window.location.origin + '/feed',
        }
      });

      if (error) {
        console.error('Apple login error:', error.message);
      }
    } catch (error: any) {
      console.error('Apple login error:', error);
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setCurrentUser(null);
  };

  const updateUserProfile = async (updates: Partial<User>) => {
    if (!currentUser) return null;
    
    const updatedUser = await updateUserProfileHelper(currentUser.id, updates);
    if (updatedUser) {
      setCurrentUser(updatedUser);
    }
    return updatedUser;
  };

  return (
    <AuthContext.Provider value={{ 
      currentUser, 
      isLoading, 
      isAuthenticated,
      login, 
      signUp, 
      logout, 
      updateUserProfile,
      loginWithGoogle,
      loginWithMicrosoft,
      loginWithApple
    }}>
      {children}
    </AuthContext.Provider>
  );
};
