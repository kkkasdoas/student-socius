import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

// Get allowed email domains from environment variables
const ALLOWED_EMAIL_DOMAINS = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS?.split(',') || ['student.tdtu.edu.vn'];

export type AuthProviderProps = {
  children: React.ReactNode;
};

export interface UserProfile {
  id: string;
  displayName: string;
  bio?: string;
  university?: string;
  verificationStatus: 'verified' | 'unverified';
  profilePictureUrl?: string;
  authProvider: 'google' | 'microsoft' | 'apple';
  loginEmail?: string;
  login_name?: string;
  blockStatus: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  setDisplayName: (name: string) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsDisplayName, setNeedsDisplayName] = useState<boolean>(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'microsoft' | 'apple' | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Function to check if an email domain is allowed
  const isEmailDomainAllowed = (email: string): boolean => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return ALLOWED_EMAIL_DOMAINS.includes(domain);
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setIsLoading(true);
        if (session?.user) {
          // Check email domain for verification status
          const userEmail = session.user.email;
          const shouldAutoVerify = userEmail ? isEmailDomainAllowed(userEmail) : false;
          
          // Get profile data
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching profile:', error);
            setCurrentUser(null);
          } else if (profile) {
            // If this is a first login and email domain is allowed, auto-verify
            if (shouldAutoVerify && profile.verification_status === 'unverified') {
              // Update verification status to verified
              const { error: updateError } = await supabase
                .from('profiles')
                .update({ verification_status: 'verified' })
                .eq('id', session.user.id);
                
              if (updateError) {
                console.error('Error updating verification status:', updateError);
              } else {
                // Fetch updated profile
                const { data: updatedProfile } = await supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', session.user.id)
                  .single();
                  
                if (updatedProfile) {
                  profile.verification_status = 'verified';
                }
              }
            }
            
            // Convert to our User type
            const userData: User = {
              id: profile.id,
              displayName: profile.display_name,
              bio: profile.bio || undefined,
              university: profile.university || undefined,
              verificationStatus: profile.verification_status as 'verified' | 'unverified',
              profilePictureUrl: profile.profile_picture_url || undefined,
              authProvider: profile.auth_provider as 'google' | 'microsoft' | 'apple',
              loginEmail: profile.login_email || undefined,
              login_name: profile.login_name || undefined,
              blockStatus: profile.block_status,
              isDeleted: profile.is_deleted,
              createdAt: new Date(profile.created_at),
              updatedAt: new Date(profile.updated_at)
            };
            
            setCurrentUser(userData);
          }
        } else {
          setCurrentUser(null);
        }
        
        setIsLoading(false);
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setIsLoading(false);
      }
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const isAuthenticated = !!currentUser;
  const isVerified = isAuthenticated && currentUser?.verificationStatus === 'verified';

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/feed`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const loginWithMicrosoft = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/feed`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Microsoft login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const loginWithApple = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/feed`
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Apple login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  const setDisplayName = async (name: string): Promise<void> => {
    if (!supabase.auth.getUser()) {
      toast.error("Not authenticated");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: name })
        .eq('id', (await supabase.auth.getUser()).data.user?.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();
      
      if (profile) {
        const userData: User = {
          id: profile.id,
          displayName: profile.display_name,
          bio: profile.bio || undefined,
          university: profile.university || undefined,
          verificationStatus: profile.verification_status as 'verified' | 'unverified',
          profilePictureUrl: profile.profile_picture_url || undefined,
          authProvider: profile.auth_provider as 'google' | 'microsoft' | 'apple',
          loginEmail: profile.login_email || undefined,
          login_name: profile.login_name || undefined,
          blockStatus: profile.block_status,
          isDeleted: profile.is_deleted,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        };
        
        setCurrentUser(userData);
      }
      
      setNeedsDisplayName(false);
      toast.success('Display name set successfully!');
    } catch (error) {
      console.error('Error setting display name:', error);
      toast.error('Failed to set display name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>): Promise<void> => {
    if (!currentUser) {
      toast.error("Not authenticated");
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Convert to snake_case for database
      const dbData: any = {};
      if (data.displayName) dbData.display_name = data.displayName;
      if (data.bio !== undefined) dbData.bio = data.bio;
      if (data.university !== undefined) dbData.university = data.university;
      if (data.profilePictureUrl !== undefined) dbData.profile_picture_url = data.profilePictureUrl;
      
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', currentUser.id);
      
      if (error) {
        throw error;
      }
      
      // Refresh user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .single();
      
      if (profile) {
        const userData: User = {
          id: profile.id,
          displayName: profile.display_name,
          bio: profile.bio || undefined,
          university: profile.university || undefined,
          verificationStatus: profile.verification_status as 'verified' | 'unverified',
          profilePictureUrl: profile.profile_picture_url || undefined,
          authProvider: profile.auth_provider as 'google' | 'microsoft' | 'apple',
          loginEmail: profile.login_email || undefined,
          login_name: profile.login_name || undefined,
          blockStatus: profile.block_status,
          isDeleted: profile.is_deleted,
          createdAt: new Date(profile.created_at),
          updatedAt: new Date(profile.updated_at)
        };
        
        setCurrentUser(userData);
      }
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  };

  // Create the value object only once when dependencies change
  const value = {
    currentUser,
    isLoading,
    isAuthenticated,
    isVerified,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    logout,
    setDisplayName,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {needsDisplayName ? (
        <DisplayNamePrompt setDisplayName={setDisplayName} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

interface DisplayNamePromptProps {
  setDisplayName: (name: string) => Promise<void>;
}

const DisplayNamePrompt: React.FC<DisplayNamePromptProps> = ({ setDisplayName }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate name
    if (name.length < 3) {
      setError('Display name must be at least 3 characters');
      return;
    }
    
    if (name.length > 20) {
      setError('Display name must be less than 20 characters');
      return;
    }
    
    if (!/[a-zA-Z]/.test(name)) {
      setError('Display name must contain at least one letter');
      return;
    }
    
    setIsSubmitting(true);
    try {
      await setDisplayName(name);
    } catch (error) {
      console.error('Error setting display name:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-2xl font-semibold mb-6 text-center">Choose a display name</h2>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError('');
              }}
              placeholder="Your display name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cendy-primary/50 text-lg"
              autoFocus
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <p className="mt-2 text-sm text-gray-500">Between 3-20 characters, must include at least one letter.</p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-cendy-primary text-white font-medium rounded-lg transition-all hover:bg-cendy-primary/90 disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Save'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
