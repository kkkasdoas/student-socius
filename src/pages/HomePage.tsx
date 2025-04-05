import React, { useEffect } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChannelType } from '@/types';
import { 
  MessageSquare, Users, Globe, Megaphone, 
  Flame, MicIcon, ChevronRight
} from 'lucide-react';

const ChannelCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick: () => void;
}> = ({ title, description, icon, color, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="flex items-center p-4 rounded-xl hover:bg-gray-50 cursor-pointer transition-all"
    >
      <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center mr-4 flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="font-semibold text-gray-800">{title}</h2>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
      <ChevronRight className="w-5 h-5 text-gray-400" />
    </div>
  );
};

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const university = currentUser?.university || 'TDTU University'; // Default for demo
  
  // Track university in session state when component mounts
  useEffect(() => {
    if (university) {
      console.log("Tracking university in session state:", university);
      sessionStorage.setItem('userUniversity', university);
    }
  }, [university]);
  
  const handleChannelSelect = (channelType: ChannelType) => {
    // Store the selected channel in session storage
    sessionStorage.setItem('selectedChannel', channelType);
    navigate('/feed');
  };

  return (
    <Layout>
      <div className="flex flex-col p-4 pb-20">
        {/* University display */}
        <div className="mb-6 bg-purple-50 p-4 rounded-xl">
          <h2 className="text-lg font-medium text-purple-800">Your University</h2>
          <p className="text-purple-700">{university}</p>
        </div>

        <h1 className="text-xl font-bold mb-4">Channels</h1>
        
        <div className="space-y-2 mb-6">
          <ChannelCard 
            title="Campus General"
            description={`Your university's student community`}
            icon={<MessageSquare className="w-6 h-6 text-white" />}
            color="bg-purple-500"
            onClick={() => handleChannelSelect('CampusGeneral')}
          />
          
          <ChannelCard 
            title="Campus Community"
            description={`Connect fellow students at your university`}
            icon={<Users className="w-6 h-6 text-white" />}
            color="bg-purple-700"
            onClick={() => handleChannelSelect('CampusCommunity')}
          />
          
          <ChannelCard 
            title="Forum"
            description="Nationwide student community."
            icon={<Globe className="w-6 h-6 text-white" />}
            color="bg-blue-500"
            onClick={() => handleChannelSelect('Forum')}
          />
          
          <ChannelCard 
            title="Community"
            description="Connect students from universities across the country"
            icon={<Megaphone className="w-6 h-6 text-white" />}
            color="bg-blue-700"
            onClick={() => handleChannelSelect('Community')}
          />
        </div>

        <h1 className="text-xl font-bold mb-4">Others</h1>
        
        <div className="space-y-2">
          <ChannelCard 
            title="Events"
            description="Special connection event, join us!"
            icon={<Flame className="w-6 h-6 text-white" />}
            color="bg-orange-500"
            onClick={() => {}}
          />
          
          <ChannelCard 
            title="Random Chat"
            description="Chat now with strangers"
            icon={<MessageSquare className="w-6 h-6 text-white" />}
            color="bg-teal-500"
            onClick={() => {}}
          />
          
          <ChannelCard 
            title="Random Voice Chat"
            description="Voice chat with strangers."
            icon={<MicIcon className="w-6 h-6 text-white" />}
            color="bg-indigo-500"
            onClick={() => {}}
          />
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
