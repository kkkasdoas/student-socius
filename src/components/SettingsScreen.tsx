
import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, Shield, Bell, Moon, Sun, HelpCircle, 
  LogOut, ChevronRight, Users, Mail, Edit
} from 'lucide-react';

const SettingsScreen: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // In a real app, this would apply dark mode
  };
  
  return (
    <div className="flex flex-col h-full bg-cendy-bg">
      {/* Header */}
      <div className="p-4 bg-white border-b border-cendy-border">
        <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
      </div>
      
      {/* Profile Section */}
      <div className="p-4 bg-white mb-3">
        <div className="flex items-center">
          <img 
            src={currentUser?.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
            alt="Profile" 
            className="w-16 h-16 rounded-full object-cover border border-gray-200"
          />
          <div className="ml-3 flex-1">
            <h2 className="text-lg font-medium text-gray-800">{currentUser?.displayName}</h2>
            <p className="text-sm text-gray-500">
              {currentUser?.university || 'Unverified User'}
              {currentUser?.verificationStatus === 'verified' && (
                <span className="ml-1 text-xs inline-flex items-center text-cendy-primary">
                  • Verified <span className="ml-0.5">✓</span>
                </span>
              )}
            </p>
          </div>
          <button 
            className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            onClick={() => navigate('/edit-profile')}
          >
            <Edit className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
      
      {/* Settings Sections */}
      <div className="flex-1 overflow-y-auto">
        {/* Account Section */}
        <div className="mb-3 bg-white">
          <h3 className="px-4 pt-3 pb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Account
          </h3>
          
          <SettingsItem 
            icon={<User className="w-5 h-5 text-blue-500" />}
            title="Profile"
            subtitle="Edit your profile information"
            onClick={() => navigate('/edit-profile')}
          />
          
          <SettingsItem 
            icon={<Shield className="w-5 h-5 text-green-500" />}
            title="Privacy"
            subtitle="Manage your privacy settings"
          />
          
          <SettingsItem 
            icon={<Bell className="w-5 h-5 text-purple-500" />}
            title="Notifications"
            subtitle="Customize your notification preferences"
          />
          
          <SettingsItem 
            icon={<Mail className="w-5 h-5 text-red-500" />}
            title="Connected Email"
            subtitle={currentUser?.loginEmail || 'No email connected'}
            showBadge={currentUser?.verificationStatus === 'verified'}
          />
        </div>
        
        {/* Preferences Section */}
        <div className="mb-3 bg-white">
          <h3 className="px-4 pt-3 pb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Preferences
          </h3>
          
          <SettingsItem 
            icon={darkMode ? 
              <Moon className="w-5 h-5 text-indigo-500" /> : 
              <Sun className="w-5 h-5 text-yellow-500" />
            }
            title="Dark Mode"
            toggle={{
              enabled: darkMode,
              onChange: toggleDarkMode
            }}
          />
          
          <SettingsItem 
            icon={<Users className="w-5 h-5 text-cyan-500" />}
            title="Connected Schools"
            subtitle={currentUser?.university || 'Not connected to any school'}
          />
        </div>
        
        {/* Support Section */}
        <div className="mb-3 bg-white">
          <h3 className="px-4 pt-3 pb-1 text-xs font-medium text-gray-500 uppercase tracking-wider">
            Support
          </h3>
          
          <SettingsItem 
            icon={<HelpCircle className="w-5 h-5 text-orange-500" />}
            title="Help & Support"
            subtitle="Get help with using Cendy"
          />
        </div>
        
        {/* Logout Button */}
        <div className="p-4">
          <button 
            onClick={logout}
            className="w-full py-3 bg-red-500/10 text-red-600 font-medium rounded-lg flex items-center justify-center hover:bg-red-500/20 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
};

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  showBadge?: boolean;
  toggle?: {
    enabled: boolean;
    onChange: () => void;
  };
  onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ 
  icon, title, subtitle, showBadge, toggle, onClick
}) => {
  return (
    <div 
      className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="mr-3">
        {icon}
      </div>
      
      <div className="flex-1">
        <h4 className="text-sm font-medium text-gray-800">{title}</h4>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      
      {showBadge && (
        <div className="bg-cendy-primary/10 text-cendy-primary text-xs font-medium px-2 py-0.5 rounded-full">
          Verified
        </div>
      )}
      
      {toggle ? (
        <div 
          className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
            toggle.enabled ? 'bg-cendy-primary' : 'bg-gray-300'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            toggle.onChange();
          }}
        >
          <div 
            className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
              toggle.enabled ? 'translate-x-5' : 'translate-x-0'
            }`} 
          />
        </div>
      ) : onClick ? (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      ) : (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      )}
    </div>
  );
};

export default SettingsScreen;
