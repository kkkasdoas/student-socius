
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Settings } from 'lucide-react';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);
  
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide navbar
        setVisible(false);
      } else {
        // Scrolling up - show navbar
        setVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <div 
      className={`fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-cendy-border flex items-center justify-around shadow-md z-10 transition-transform duration-300 ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <NavButton 
        icon={<Home className="w-6 h-6" />} 
        label="Home" 
        active={isActive('/')}
        onClick={() => navigate('/')}
      />
      
      <NavButton 
        icon={<MessageCircle className="w-6 h-6" />} 
        label="Messages" 
        active={location.pathname.startsWith('/messages')}
        onClick={() => navigate('/messages')}
      />
      
      <NavButton 
        icon={<Settings className="w-6 h-6" />} 
        label="Settings" 
        active={location.pathname === '/settings'}
        onClick={() => navigate('/settings')}
      />
    </div>
  );
};

interface NavButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}

const NavButton: React.FC<NavButtonProps> = ({ icon, label, active, onClick }) => {
  return (
    <button 
      className={`flex flex-col items-center justify-center w-1/3 h-full transition-colors ${
        active ? 'text-cendy-primary' : 'text-gray-500'
      }`}
      onClick={onClick}
    >
      <div className="relative">
        {icon}
        {active && (
          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-cendy-primary rounded-full" />
        )}
      </div>
      <span className="text-xs mt-1 font-medium">{label}</span>
    </button>
  );
};

export default BottomNav;
