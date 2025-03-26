
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { mockUsers } from '@/utils/mockData';
import { toast } from 'sonner';

export type AuthProviderProps = {
  children: React.ReactNode;
};

export type AuthContextType = {
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isVerified: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithMicrosoft: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => void;
  setDisplayName: (name: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [needsDisplayName, setNeedsDisplayName] = useState<boolean>(false);
  const [authProvider, setAuthProvider] = useState<'google' | 'microsoft' | 'apple' | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  useEffect(() => {
    // Check if user is already logged in (from localStorage in this mock)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
    
    setIsLoading(false);
  }, []);

  const isAuthenticated = !!currentUser;
  const isVerified = isAuthenticated && currentUser?.verificationStatus === 'verified';

  const loginWithGoogle = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll simulate login with a Google email
      const mockEmail = 'user@student.tdtu.edu.vn'; // Allowed domain
      
      // Check if email domain is allowed
      if (mockEmail.endsWith('@student.tdtu.edu.vn')) {
        setNeedsDisplayName(true);
        setAuthProvider('google');
        setUserEmail(mockEmail);
        
        toast.success('Login successful. Please set your display name.');
      } else {
        toast.error('Please log in with your student email address.');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMicrosoft = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For demo, we'll simulate login with a Microsoft email
      const mockEmail = 'user@student.tdtu.edu.vn'; // Allowed domain
      
      // Check if email domain is allowed
      if (mockEmail.endsWith('@student.tdtu.edu.vn')) {
        setNeedsDisplayName(true);
        setAuthProvider('microsoft');
        setUserEmail(mockEmail);
        
        toast.success('Login successful. Please set your display name.');
      } else {
        toast.error('Please log in with your student email address.');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithApple = async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // For Apple, we automatically generate a random name and login
      const randomUser = mockUsers.find(u => u.authProvider === 'apple');
      
      if (randomUser) {
        setCurrentUser(randomUser);
        localStorage.setItem('currentUser', JSON.stringify(randomUser));
        toast.success('Logged in successfully!');
      } else {
        // Create a new unverified user
        const newUser: User = {
          id: `user-${Date.now()}`,
          displayName: `AppleUser${Math.floor(Math.random() * 10000)}`,
          verificationStatus: 'unverified',
          authProvider: 'apple',
          blockStatus: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        setCurrentUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        toast.success('Logged in successfully!');
      }
    } catch (error) {
      toast.error('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const setDisplayName = async (name: string): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // In a real app, we would send this to the backend
      const newUser: User = {
        id: `user-${Date.now()}`,
        displayName: name,
        university: 'TDTU University', // Based on email domain
        verificationStatus: 'verified',
        authProvider: authProvider!,
        loginEmail: userEmail,
        blockStatus: false,
        isDeleted: false,
        profilePictureUrl: `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 70)}`,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      setCurrentUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      setNeedsDisplayName(false);
      
      toast.success('Display name set successfully!');
    } catch (error) {
      toast.error('Failed to set display name. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = (): void => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    toast.success('Logged out successfully');
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
    setDisplayName
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
