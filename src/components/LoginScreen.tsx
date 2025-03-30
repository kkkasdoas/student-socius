import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronDown, ChevronUp, Mail, Apple } from 'lucide-react';

// Get allowed email domains from environment variables
const ALLOWED_EMAIL_DOMAINS = import.meta.env.VITE_ALLOWED_EMAIL_DOMAINS?.split(',') || ['student.tdtu.edu.vn'];

const LoginScreen: React.FC = () => {
  const { loginWithGoogle, loginWithMicrosoft, loginWithApple, isLoading } = useAuth();
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [allowedDomains, setAllowedDomains] = useState<string[]>(ALLOWED_EMAIL_DOMAINS);
  
  // Format domains for display
  const formattedDomains = allowedDomains.map(domain => `@${domain}`).join(', ');
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-6">
      <div className="w-full max-w-md flex flex-col items-center">
        {/* Logo and Welcome */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-cendy-primary tracking-tight mb-2">Cendy</h1>
          <h2 className="text-xl text-gray-700 mb-4">The College Connection App</h2>
          <p className="text-sm text-gray-500 mb-6 max-w-sm">
            Connect with verified college students in a safe and private environment
          </p>
        </div>
        
        {/* Login Options */}
        <div className="w-full space-y-3 mb-8">
          {/* Google */}
          <button
            onClick={loginWithGoogle}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-6 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M12 5.9c1.5 0 2.9.6 3.9 1.6l2.8-2.8C17.1 3.1 14.7 2 12 2 8.1 2 4.8 4.2 3.2 7.4l3.3 2.6C7.5 7.4 9.6 5.9 12 5.9z"
              />
              <path
                fill="#4285F4"
                d="M21.8 12.1c0-.8-.1-1.6-.2-2.2H12v4.4h5.6c-.3 1.4-1.1 2.5-2.2 3.2l3.4 2.7c1.9-1.8 3-4.6 3-7.9z"
              />
              <path
                fill="#FBBC05"
                d="M6.5 14c-.4-1-.5-2-.5-3s.1-2 .5-3l-3.3-2.6C2.1 7.2 1.5 9.5 1.5 11.9c0 2.4.6 4.7 1.7 6.5l3.3-2.6z"
              />
              <path
                fill="#34A853"
                d="M12 22c2.8 0 5.1-1 6.8-2.6l-3.4-2.7c-1 .7-2.2 1.2-3.4 1.2-2.4 0-4.5-1.6-5.2-3.8l-3.3 2.6C5.2 19.7 8.4 22 12 22z"
              />
            </svg>
            Continue with Google
          </button>
          
          {/* Microsoft */}
          <button
            onClick={loginWithMicrosoft}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-6 bg-white border border-gray-300 rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#F35325" d="M1 1h10v10H1z" />
              <path fill="#81BC06" d="M13 1h10v10H13z" />
              <path fill="#05A6F0" d="M1 13h10v10H1z" />
              <path fill="#FFBA08" d="M13 13h10v10H13z" />
            </svg>
            Continue with Microsoft
          </button>
          
          {/* Apple */}
          <button
            onClick={loginWithApple}
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-6 bg-black text-white rounded-lg shadow-sm hover:shadow-md transition-all"
          >
            <Apple className="w-5 h-5 mr-3" />
            Continue with Apple
          </button>
        </div>
        
        {/* Info Section */}
        <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setInfoExpanded(!infoExpanded)}
            className="w-full flex items-center justify-between p-4 text-left"
          >
            <div className="flex items-center text-gray-700">
              <Mail className="w-5 h-5 mr-3 text-cendy-primary" />
              <span className="font-medium">About verification</span>
            </div>
            {infoExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
          
          {infoExpanded && (
            <div className="p-4 pt-0 bg-gray-50 text-sm text-gray-600 space-y-2 animate-fade-in">
              <p>
                <strong>Google & Microsoft logins:</strong> Must use a student email ({formattedDomains}) for full access.
              </p>
              <p>
                <strong>Apple login:</strong> Creates an unverified account with limited access.
              </p>
              <p>
                Verified accounts can post, send messages, and join chat rooms.
              </p>
            </div>
          )}
        </div>
        
        {/* Terms */}
        <p className="text-xs text-gray-500 mt-8 text-center max-w-xs">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default LoginScreen;
