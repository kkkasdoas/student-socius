
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowRight } from 'lucide-react';

const LoginScreen: React.FC = () => {
  const navigate = useNavigate();
  const { loginWithGoogle, loginWithMicrosoft, isAuthenticated } = useAuth();
  
  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/feed');
    }
  }, [isAuthenticated, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to CendyGram</h1>
          <p className="text-gray-600">Connect with students at your university</p>
        </div>
        
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
          <div className="space-y-4">
            <button
              onClick={loginWithGoogle}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="flex-1 text-center text-gray-700">Continue with Google</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
            
            <button
              onClick={loginWithMicrosoft}
              className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center justify-between w-full">
                <img src="https://www.microsoft.com/favicon.ico" alt="Microsoft" className="w-5 h-5" />
                <span className="flex-1 text-center text-gray-700">Continue with Microsoft</span>
                <ArrowRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-500">
            <p>By continuing, you agree to our</p>
            <div className="mt-1 space-x-1">
              <a href="/terms" className="text-cendy-primary hover:underline">Terms of Service</a>
              <span>and</span>
              <a href="/privacy-policy" className="text-cendy-primary hover:underline">Privacy Policy</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
