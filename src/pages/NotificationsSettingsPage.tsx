
import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Switch } from '@/components/ui/switch';
import Layout from '@/components/Layout';
import { toast } from 'sonner';

const NotificationsSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    muteAll: false,
    privateChats: true,
    chatrooms: true
  });

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => {
      // If turning on specific notifications, make sure muteAll is off
      if (key !== 'muteAll' && !prev[key] && prev.muteAll) {
        toast.info("Turned off 'Mute All' to enable specific notifications");
        return { ...prev, [key]: !prev[key], muteAll: false };
      }
      
      // If turning on muteAll, turn off all specific notifications
      if (key === 'muteAll' && !prev.muteAll) {
        toast.info("All notification types have been muted");
        return { muteAll: true, privateChats: false, chatrooms: false };
      }
      
      return { ...prev, [key]: !prev[key] };
    });
  };

  return (
    <Layout hideNav>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center sticky top-0 z-10">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 mr-2"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Notifications</h1>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {/* General */}
          <div className="bg-white rounded-lg shadow-sm mb-3">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">General</p>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Mute All Notifications</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Turn off all notifications from the app
                </p>
              </div>
              <Switch 
                checked={settings.muteAll} 
                onCheckedChange={() => handleToggle('muteAll')}
              />
            </div>
          </div>
          
          {/* Message Notifications */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-3 border-b border-gray-100">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Message Notifications
              </p>
            </div>
            
            <div className="p-4 flex items-center justify-between border-b border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-800">Private Chats</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get notified for direct messages
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">
                  {settings.privateChats ? 'On' : 'Off'}
                </span>
                <Switch 
                  checked={settings.privateChats} 
                  onCheckedChange={() => handleToggle('privateChats')}
                  disabled={settings.muteAll}
                />
              </div>
            </div>
            
            <div className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">Chatrooms</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Get notified for group conversations
                </p>
              </div>
              <div className="flex items-center">
                <span className="text-xs text-gray-500 mr-2">
                  {settings.chatrooms ? 'On' : 'Off'}
                </span>
                <Switch 
                  checked={settings.chatrooms} 
                  onCheckedChange={() => handleToggle('chatrooms')}
                  disabled={settings.muteAll}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default NotificationsSettingsPage;
