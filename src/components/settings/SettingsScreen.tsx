
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  User, Bell, Moon, Sun, HelpCircle, 
  LogOut, ChevronRight, Globe, ShieldAlert, 
  Info, FileText, Mail
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const SettingsScreen: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const navigate = useNavigate();
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    toast.success(`${darkMode ? 'Light' : 'Dark'} mode activated`, {
      description: `The app theme has been changed to ${darkMode ? 'light' : 'dark'} mode.`
    });
    // In a real app, this would apply dark mode to the document
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="p-4 bg-white border-b border-gray-200 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800">Settings</h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Profile Section */}
        <div className="p-4 bg-white mb-2 rounded-lg mx-2 mt-2 shadow-sm">
          <div 
            className="flex items-center cursor-pointer" 
            onClick={() => navigate(`/user/${currentUser?.id}`)}
          >
            <Avatar className="h-14 w-14 border border-gray-200">
              <AvatarImage 
                src={currentUser?.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                alt={currentUser?.displayName || 'User'} 
              />
              <AvatarFallback>{currentUser?.displayName?.substring(0, 2) || 'U'}</AvatarFallback>
            </Avatar>
            
            <div className="ml-3 flex-1">
              <h2 className="text-lg font-medium text-gray-800">{currentUser?.displayName}</h2>
              <p className="text-sm text-gray-500">
                Profile settings, photos and more!
              </p>
            </div>
            
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </div>
        
        {/* Settings Sections */}
        <div className="p-2">
          {/* Account & Preferences */}
          <div className="mb-3 bg-white rounded-lg shadow-sm overflow-hidden">
            <SettingsItem 
              icon={<Bell className="w-5 h-5 text-red-500" />}
              title="Notifications"
              onClick={() => navigate('/settings/notifications')}
            />
            
            <SettingsItem 
              icon={darkMode ? 
                <Moon className="w-5 h-5 text-indigo-500" /> : 
                <Sun className="w-5 h-5 text-amber-500" />
              }
              title="Night Mode"
              toggle={{
                enabled: darkMode,
                onChange: toggleDarkMode
              }}
            />
            
            <SettingsItem 
              icon={<ShieldAlert className="w-5 h-5 text-gray-500" />}
              title="Blocked Users"
              onClick={() => navigate('/settings/blocked-users')}
            />
            
            <SettingsItem 
              icon={<Globe className="w-5 h-5 text-blue-500" />}
              title="Language"
              onClick={() => navigate('/settings/language')}
            />
          </div>
          
          {/* Support & Info */}
          <div className="mb-3 bg-white rounded-lg shadow-sm overflow-hidden">
            <SettingsItem 
              icon={<HelpCircle className="w-5 h-5 text-blue-500" />}
              title="FAQ"
              onClick={() => navigate('/faq')}
            />
            
            <SettingsItem 
              icon={<Mail className="w-5 h-5 text-green-500" />}
              title="Contact us"
              onClick={() => navigate('/contact')}
            />
            
            <SettingsItem 
              icon={<Info className="w-5 h-5 text-gray-500" />}
              title="Privacy Policy"
              onClick={() => navigate('/privacy-policy')}
            />
            
            <SettingsItem 
              icon={<FileText className="w-5 h-5 text-gray-500" />}
              title="Terms of Service"
              onClick={() => navigate('/terms')}
            />
          </div>
          
          {/* Logout */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <SettingsItem 
              icon={<LogOut className="w-5 h-5 text-red-500" />}
              title="Log out"
              titleClass="text-red-500"
              onClick={() => {
                logout();
                navigate('/login');
                toast.success('You have been logged out');
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

interface SettingsItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  titleClass?: string;
  toggle?: {
    enabled: boolean;
    onChange: () => void;
  };
  onClick?: () => void;
}

const SettingsItem: React.FC<SettingsItemProps> = ({ 
  icon, title, subtitle, titleClass, toggle, onClick
}) => {
  return (
    <div 
      className={`flex items-center p-4 border-b border-gray-100 last:border-b-0 ${onClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
      onClick={onClick}
    >
      <div className="mr-3">
        {icon}
      </div>
      
      <div className="flex-1">
        <h4 className={`text-sm font-medium ${titleClass || 'text-gray-800'}`}>{title}</h4>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      
      {toggle ? (
        <Switch
          checked={toggle.enabled}
          onCheckedChange={toggle.onChange}
        />
      ) : onClick ? (
        <ChevronRight className="w-5 h-5 text-gray-400" />
      ) : null}
    </div>
  );
};

export default SettingsScreen;
