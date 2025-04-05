import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  useEffect(() => {
    // Set up a timeout to prevent getting stuck on loading
    const timer = setTimeout(() => {
      console.log("Loading timeout reached in Index page");
      setLoadingTimeout(true);
    }, 3000); // 3 second timeout

    return () => clearTimeout(timer);
  }, []);
  
  useEffect(() => {
    // Add console logs for debugging
    console.log("Index page loaded");
    console.log("Auth state:", { isLoading, isAuthenticated, hasUser: !!currentUser });
    
    // Only redirect after loading is complete or timeout is reached
    if (!isLoading || loadingTimeout) {
      if (isAuthenticated && currentUser) {
        console.log("User is authenticated, redirecting to home");
        navigate('/home');
      } else {
        console.log("User is not authenticated, redirecting to login");
        navigate('/login');
      }
    }
  }, [navigate, currentUser, isLoading, isAuthenticated, loadingTimeout]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4 text-indigo-600 animate-pulse">Cendy</h1>
        <p className="text-xl text-gray-600">Loading...</p>
      </div>
    </div>
  );
};

export default Index;
