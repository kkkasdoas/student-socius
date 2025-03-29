
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { getCurrentUser, updateUserProfile as updateUserProfileHelper } from '@/utils/supabaseHelpers';

type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
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
};

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isLoading: true,
  login: async () => ({ success: false, error: 'Not implemented' }),
  signUp: async () => ({ success: false, error: 'Not implemented' }),
  logout: async () => {},
  updateUserProfile: async () => null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile on mount and session change
  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (session?.user) {
          // Fetch user profile
          setTimeout(async () => {
            const user = await getCurrentUser();
            setCurrentUser(user);
            setIsLoading(false);
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
    <AuthContext.Provider value={{ currentUser, isLoading, login, signUp, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
