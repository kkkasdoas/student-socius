
import React from 'react';
import BottomNav from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  hideNav?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, hideNav = false }) => {
  const { currentUser } = useAuth();
  const isAuthenticated = !!currentUser;
  
  return (
    <div className="flex flex-col min-h-screen bg-cendy-bg">
      <main className={`flex-1 overflow-hidden ${isAuthenticated && !hideNav ? 'pb-16' : ''}`}>
        {children}
      </main>
      
      {isAuthenticated && !hideNav && <BottomNav />}
    </div>
  );
};

export default Layout;
