import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '@/types';
import { Session } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";

// Get allowed email domains from environment variables
const ALLOWED_EMAIL_DOMAINS = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS?.split(',') || ['student.tdtu.edu.vn'];

// Edge Function URL
const EDGE_FUNCTION_URL = 'https://qvjuxusvepjufcxdxswd.supabase.co/functions/v1/check-email-domain';

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
  session: Session | null;
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
  const [session, setSession] = useState<Session | null>(null);
  const [domainVerificationFailed, setDomainVerificationFailed] = useState<boolean>(false);

  // Function to check domain using Edge Function
  const verifyEmailDomain = async (email: string): Promise<boolean> => {
    try {
      console.log("Verifying email domain via Edge Function:", email);
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log("Domain verification result:", result);
      return result.isVerified;
    } catch (error) {
      console.error("Error verifying email domain:", error);
      // Fallback to local verification if Edge Function fails
      const domain = email.split('@')[1];
      return ALLOWED_EMAIL_DOMAINS.includes(domain);
    }
  };

  // Function to check if an email domain is allowed
  const isEmailDomainAllowed = (email: string): boolean => {
    if (!email) return false;
    const domain = email.split('@')[1];
    return ALLOWED_EMAIL_DOMAINS.includes(domain);
  };

  useEffect(() => {
    // Set a safety timeout to prevent indefinite loading
    const safetyTimeout = setTimeout(() => {
      if (isLoading) {
        console.log("Safety timeout triggered - forcing loading state to false");
        setIsLoading(false);
      }
    }, 5000); // 5 second safety timeout

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setIsLoading(true);
        console.log("Auth state changed:", event);
        
        setSession(newSession);
        
        if (newSession?.user) {
          console.log("Session user found:", newSession.user.email);
          
          // Check email domain for verification status using Edge Function
          const userEmail = newSession.user.email;
          let shouldAutoVerify = false;
          
          if (userEmail) {
            try {
              // Use Edge Function for domain verification
              shouldAutoVerify = await verifyEmailDomain(userEmail);
              
              // If domain is not verified, sign the user out
              if (!shouldAutoVerify && event === 'SIGNED_IN') {
                console.log("Email domain not verified, signing out user");
                setDomainVerificationFailed(true);
                await supabase.auth.signOut();
                toast.error("Please log in with your student email address.");
                setIsLoading(false);
                return;
              }
            } catch (error) {
              console.error("Error in domain verification:", error);
              // Fallback to local verification
              shouldAutoVerify = isEmailDomainAllowed(userEmail);
            }
          }
          
          try {
            // Get profile data
            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', newSession.user.id)
              .single();
            
            if (error) {
              console.error('Error fetching profile:', error);
              
              // Check if this is because profile doesn't exist yet (first login)
              if (error.code === 'PGRST116') { // Record not found
                console.log("Profile not found, creating new profile...");
                
                // Create a new profile
                const { data: newProfile, error: createError } = await supabase
                  .from('profiles')
                  .insert({
                    id: newSession.user.id,
                    auth_provider: 'google',
                    login_email: newSession.user.email,
                    verification_status: shouldAutoVerify ? 'verified' : 'unverified'
                  })
                  .select('*')
                  .single();
                  
                if (createError) {
                  console.error('Error creating new profile:', createError);
                  setCurrentUser(null);
                } else if (newProfile) {
                  // Convert to our User type
                  const userData: User = {
                    id: newProfile.id,
                    displayName: newProfile.display_name || '',
                    bio: newProfile.bio || undefined,
                    university: newProfile.university || undefined,
                    verificationStatus: newProfile.verification_status as 'verified' | 'unverified',
                    profilePictureUrl: newProfile.profile_picture_url || undefined,
                    authProvider: newProfile.auth_provider as 'google' | 'microsoft' | 'apple',
                    loginEmail: newProfile.login_email || undefined,
                    login_name: newProfile.login_name || undefined,
                    blockStatus: newProfile.block_status,
                    isDeleted: newProfile.is_deleted,
                    createdAt: new Date(newProfile.created_at),
                    updatedAt: new Date(newProfile.updated_at)
                  };
                  
                  setCurrentUser(userData);
                  
                  // Store university in session storage for global access
                  if (userData.university) {
                    sessionStorage.setItem('userUniversity', userData.university);
                  }
                  
                  // Show display name prompt if needed
                  if (!newProfile.display_name || newProfile.display_name === 'user') {
                    setNeedsDisplayName(true);
                  }
                }
              } else {
                setCurrentUser(null);
              }
            } else if (profile) {
              // If this is a first login and email domain is allowed, auto-verify
              if (shouldAutoVerify && profile.verification_status === 'unverified') {
                // Update verification status to verified
                const { error: updateError } = await supabase
                  .from('profiles')
                  .update({ verification_status: 'verified' })
                  .eq('id', newSession.user.id);
                
                if (updateError) {
                  console.error('Error updating verification status:', updateError);
                } else {
                  // Fetch updated profile
                  const { data: updatedProfile } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', newSession.user.id)
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
              
              // Store university in session storage for global access
              if (userData.university) {
                sessionStorage.setItem('userUniversity', userData.university);
              }
              
              // Check if display_name is 'user' which needs to be updated
              if (profile.display_name === 'user') {
                console.log("Default display name detected, prompting user to update");
                setNeedsDisplayName(true);
              }
            }
          } catch (err) {
            console.error("Unexpected error in auth state change handler:", err);
            setCurrentUser(null);
          } finally {
            // Always set loading to false, even if errors occur
            setIsLoading(false);
          }
        } else {
          console.log("No session user found, setting current user to null");
          setCurrentUser(null);
          setIsLoading(false);
        }
      }
    );
    
    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session ? "Session exists" : "No session");
      if (!session) {
        setIsLoading(false);
      }
    }).catch(err => {
      console.error("Error getting initial session:", err);
      setIsLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimeout);
    };
  }, []);

  const isAuthenticated = !!currentUser;
  const isVerified = isAuthenticated && currentUser?.verificationStatus === 'verified';

  const loginWithGoogle = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setDomainVerificationFailed(false);
      console.log("Starting Google login process...");
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
          queryParams: {
            access_type: 'offline',
            prompt: 'select_account',
          }
        }
      });
      
      if (error) {
        console.error("Google OAuth error:", error);
        throw error;
      }

      console.log("OAuth response:", data);
      
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Login failed. Please try again.');
      setIsLoading(false);
    }
  }, []);

  const loginWithMicrosoft = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setDomainVerificationFailed(false);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/home`
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
  }, []);

  const loginWithApple = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setDomainVerificationFailed(false);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: `${window.location.origin}/home`
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
  }, []);

  const setDisplayName = useCallback(async (name: string): Promise<void> => {
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
  }, []);

  const updateUserProfile = useCallback(async (data: Partial<UserProfile>): Promise<void> => {
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
        
        // Update university in session storage if it changed
        if (data.university !== undefined) {
          sessionStorage.setItem('userUniversity', data.university || '');
        }
        
        toast.success('Profile updated successfully!');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  const logout = useCallback(async (): Promise<void> => {
    try {
      await supabase.auth.signOut();
      setCurrentUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to log out. Please try again.');
    }
  }, []);

  // Memoize the reset verification callback
  const handleResetVerificationState = useCallback(() => {
    setDomainVerificationFailed(false);
  }, []);

  // Use useMemo to prevent unnecessary re-renders of context consumers
  const authContextValue = React.useMemo(() => ({
    currentUser,
    isLoading,
    isAuthenticated,
    isVerified,
    session,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    logout,
    setDisplayName,
    updateUserProfile
  }), [
    currentUser,
    isLoading,
    isAuthenticated,
    isVerified,
    session,
    loginWithGoogle,
    loginWithMicrosoft,
    loginWithApple,
    logout,
    setDisplayName,
    updateUserProfile
  ]);

  return (
    <AuthContext.Provider value={authContextValue}>
      {domainVerificationFailed ? (
        <DomainVerificationFailedModal resetVerificationState={handleResetVerificationState} />
      ) : needsDisplayName ? (
        <DisplayNamePrompt setDisplayName={setDisplayName} currentUser={currentUser} />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

interface DisplayNamePromptProps {
  setDisplayName: (name: string) => Promise<void>;
  currentUser: User | null;
}

const DisplayNamePrompt: React.FC<DisplayNamePromptProps> = React.memo(({ setDisplayName, currentUser }) => {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  
  // Get provider name for friendly message
  const getProviderName = () => {
    if (!currentUser) return 'social account';
    
    switch (currentUser.authProvider) {
      case 'google':
        return 'Google account';
      case 'microsoft':
        return 'Microsoft account';
      case 'apple':
        return 'Apple account';
      default:
        return 'social account';
    }
  };

  useEffect(() => {
    // Generate initial suggestions based on login info
    if (currentUser) {
      const suggestedNames: string[] = [];
      
      // If we have a login_name, add it
      if (currentUser.login_name && currentUser.login_name !== 'user') {
        suggestedNames.push(currentUser.login_name);
      }
      
      // If we have an email, extract a name suggestion
      if (currentUser.loginEmail) {
        const emailName = currentUser.loginEmail.split('@')[0];
        // Remove numbers and special chars, capitalize first letter
        const cleanName = emailName
          .replace(/[0-9._]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ')
          .trim();
          
        if (cleanName && cleanName !== 'User' && !suggestedNames.includes(cleanName)) {
          suggestedNames.push(cleanName);
        }
      }
      
      setSuggestions(suggestedNames);
      
      // Pre-fill with first valid suggestion if any
      if (suggestedNames.length > 0 && !name) {
        setName(suggestedNames[0]);
      }
    }
  }, [currentUser, name]);

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
      // Successfully set display name, no need to update state as the parent component will handle this
    } catch (error) {
      console.error('Error setting display name:', error);
      setError('Failed to save. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Memoize handler to prevent re-renders
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError('');
  }, []);

  // Memoize suggestion handler
  const useSuggestion = useCallback((suggestion: string) => {
    setName(suggestion);
    setError('');
  }, []);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-2xl font-semibold mb-2 text-center">Welcome to Cendy!</h2>
        <p className="text-gray-600 text-center mb-6">
          You're signed in with your {getProviderName()}. Please choose a display name to continue.
        </p>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              Your Display Name
            </label>
            <input
              type="text"
              id="displayName"
              value={name}
              onChange={handleNameChange}
              placeholder="Your display name"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cendy-primary/50 text-lg"
              autoFocus
            />
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => useSuggestion(suggestion)}
                    className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 py-1 px-2 rounded-full transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
            
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            <p className="mt-2 text-sm text-gray-500">This is how other users will see you in the app. Between 3-20 characters, must include at least one letter.</p>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 px-6 bg-cendy-primary text-white font-medium rounded-lg transition-all hover:bg-cendy-primary/90 disabled:opacity-70"
          >
            {isSubmitting ? 'Saving...' : 'Continue to Cendy'}
          </button>
        </form>
      </div>
    </div>
  );
});

interface DomainVerificationFailedModalProps {
  resetVerificationState: () => void;
}

const DomainVerificationFailedModal: React.FC<DomainVerificationFailedModalProps> = React.memo(({ resetVerificationState }) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-scale-in">
        <h2 className="text-2xl font-semibold mb-4 text-center">Domain Verification Failed</h2>
        
        <div className="mb-6">
          <p className="text-center text-gray-700 mb-4">
            Please log in with your student email address.
          </p>
          <p className="text-sm text-gray-500">
            Your email domain is not in our verified domains list. You must use a verified student email address to access the app.
          </p>
        </div>
        
        <button
          onClick={resetVerificationState}
          className="w-full py-3 px-6 bg-cendy-primary text-white font-medium rounded-lg transition-all hover:bg-cendy-primary/90"
        >
          Try Again
        </button>
      </div>
    </div>
  );
});

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
