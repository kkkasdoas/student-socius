
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { fetchUserById } from '@/utils/supabaseHelpers';
import { toast } from 'sonner';

export type AuthContextType = {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user data from Supabase
  const fetchCurrentUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const user = await fetchUserById(userId);
      setCurrentUser(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      setCurrentUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Check for session on load
  useEffect(() => {
    const checkSession = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          await fetchCurrentUser(session.user.id);
        } else {
          setCurrentUser(null);
        }
      } catch (error) {
        console.error('Error checking session:', error);
        setCurrentUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await fetchCurrentUser(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          setCurrentUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Sign in with Google
  const loginWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/feed'
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error logging in with Google:', error);
      toast.error('Failed to sign in with Google');
    }
  };

  // Sign in with Microsoft
  const loginWithMicrosoft = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: window.location.origin + '/feed'
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Error logging in with Microsoft:', error);
      toast.error('Failed to sign in with Microsoft');
    }
  };

  // Sign out
  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      setCurrentUser(null);
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  // Refresh user data
  const refreshUser = async () => {
    if (!currentUser) return;
    
    await fetchCurrentUser(currentUser.id);
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        refreshUser
      }}
    >
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
