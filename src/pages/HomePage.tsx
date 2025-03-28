
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      // Redirect authenticated users to feed, otherwise to login
      navigate(isAuthenticated ? '/feed' : '/login');
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">CendyGram</h1>
        <p className="text-gray-500 mb-4">Loading...</p>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cendy-primary mx-auto"></div>
      </div>
    </div>
  );
};

export default HomePage;
