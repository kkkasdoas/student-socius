import React, { useState, useEffect, useCallback } from 'react';
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
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';

interface UserSettings {
  dark_mode: boolean;
  notification_preferences: {
    all_notifications: boolean;
    direct_messages: boolean;
    mentions: boolean;
    comments: boolean;
  };
  language: string;
}

const SettingsScreen: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const [darkMode, setDarkMode] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings>({
    dark_mode: false,
    notification_preferences: {
      all_notifications: true,
      direct_messages: true,
      mentions: true,
      comments: true,
    },
    language: 'english'
  });
  const navigate = useNavigate();
  
  // Fetch user settings from Supabase
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();
          
        if (error) {
          console.error('Error fetching user settings:', error);
          return;
        }
        
        if (data) {
          setSettings(data);
          setDarkMode(data.dark_mode);
          
          // Apply dark mode if enabled
          if (data.dark_mode) {
            document.documentElement.classList.add('dark');
          } else {
            document.documentElement.classList.remove('dark');
          }
        }
      } catch (error) {
        console.error('Error in fetchUserSettings:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserSettings();
  }, [currentUser]);
  
  // Update setting in Supabase and local state
  const updateSetting = useCallback(async (key: string, value: any) => {
    if (!currentUser) {
      toast.error('You must be logged in to change settings');
      return;
    }
    
    try {
      // Update setting in the database
      const { error } = await supabase
        .from('user_settings')
        .update({ [key]: value })
        .eq('user_id', currentUser.id);
        
      if (error) {
        throw error;
      }
      
      // Update local state
      setSettings(prev => ({
        ...prev,
        [key]: value
      }));
      
      return true;
    } catch (error) {
      console.error(`Error updating ${key}:`, error);
      toast.error(`Failed to update ${key.replace('_', ' ')}. Please try again.`);
      return false;
    }
  }, [currentUser]);
  
  const toggleDarkMode = async () => {
    const newValue = !darkMode;
    setDarkMode(newValue);
    
    // Update in database
    const success = await updateSetting('dark_mode', newValue);
    
    if (success) {
      // Apply dark mode to document
      if (newValue) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      
      toast.success(`${newValue ? 'Dark' : 'Light'} mode activated`, {
        description: `The app theme has been changed to ${newValue ? 'dark' : 'light'} mode.`
      });
    } else {
      // Revert UI state if API call failed
      setDarkMode(!newValue);
    }
  };
  
  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      await logout();
      setShowLogoutConfirm(false);
      navigate('/login');
      toast.success('You have been logged out');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [logout, navigate]);
  
  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white">Settings</h1>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
          </div>
        ) : (
          <>
            {/* Profile Section */}
            <div className="p-4 bg-white dark:bg-gray-800 mb-2 rounded-lg mx-2 mt-2 shadow-sm">
              <div 
                className="flex items-center cursor-pointer" 
                onClick={() => navigate(`/user/${currentUser?.id}`)}
              >
                <Avatar className="h-14 w-14 border border-gray-200 dark:border-gray-700">
                  <AvatarImage 
                    src={currentUser?.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                    alt={currentUser?.displayName || 'User'} 
                  />
                  <AvatarFallback>{currentUser?.displayName?.substring(0, 2) || 'U'}</AvatarFallback>
                </Avatar>
                
                <div className="ml-3 flex-1">
                  <h2 className="text-lg font-medium text-gray-800 dark:text-white">{currentUser?.displayName}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Profile settings, photos and more!
                  </p>
                </div>
                
                <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              </div>
            </div>
            
            {/* Settings Sections */}
            <div className="p-2">
              {/* Account & Preferences */}
              <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
                  subtitle={settings.language.charAt(0).toUpperCase() + settings.language.slice(1)}
                  onClick={() => navigate('/settings/language')}
                />
              </div>
              
              {/* Support & Info */}
              <div className="mb-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
                <SettingsItem 
                  icon={<LogOut className="w-5 h-5 text-red-500" />}
                  title="Log out"
                  titleClass="text-red-500"
                  onClick={() => setShowLogoutConfirm(true)}
                />
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* Logout Confirmation Dialog */}
      <Dialog open={showLogoutConfirm} onOpenChange={setShowLogoutConfirm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Log out</DialogTitle>
          <DialogDescription>
            Are you sure you want to log out of your account?
          </DialogDescription>
          <div className="flex justify-end space-x-2 mt-4">
            <Button variant="outline" onClick={() => setShowLogoutConfirm(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleLogout} disabled={isLoading}>
              {isLoading ? 'Logging out...' : 'Log out'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
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
      className={`flex items-center p-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 active:bg-gray-100 dark:active:bg-gray-600 transition-colors' : ''}`}
      onClick={onClick}
    >
      <div className="mr-3">
        {icon}
      </div>
      
      <div className="flex-1">
        <h4 className={`text-sm font-medium ${titleClass || 'text-gray-800 dark:text-white'}`}>{title}</h4>
        {subtitle && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitle}</p>
        )}
      </div>
      
      {toggle ? (
        <Switch
          checked={toggle.enabled}
          onCheckedChange={toggle.onChange}
          aria-label={`Toggle ${title}`}
        />
      ) : onClick ? (
        <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500" />
      ) : null}
    </div>
  );
};

export default SettingsScreen;
