
import React from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ChannelType } from '@/types';

const ChannelCard: React.FC<{
  title: string;
  description: string;
  color: string;
  onClick: () => void;
}> = ({ title, description, color, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`p-5 rounded-xl ${color} text-white flex flex-col h-36 cursor-pointer transition-transform hover:scale-98 active:scale-95`}
    >
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="mt-2 text-sm opacity-90">{description}</p>
    </div>
  );
};

const HomePage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const university = currentUser?.university || 'TDTU University'; // Default for demo
  
  const handleChannelSelect = (channelType: ChannelType) => {
    // Store the selected channel in session storage
    sessionStorage.setItem('selectedChannel', channelType);
    navigate('/feed');
  };

  return (
    <Layout>
      <div className="flex flex-col p-4">
        <h1 className="text-2xl font-bold mb-6">Channels</h1>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ChannelCard 
            title="Campus General"
            description={`Posts from ${university} students about academic topics, campus events, and more.`}
            color="bg-cendy-primary"
            onClick={() => handleChannelSelect('CampusGeneral')}
          />
          
          <ChannelCard 
            title="Campus Community"
            description={`Connect directly with other ${university} students for study groups, roommates, and more.`}
            color="bg-emerald-500"
            onClick={() => handleChannelSelect('CampusCommunity')}
          />
          
          <ChannelCard 
            title="Forum"
            description="Open discussions with students from all universities on academic topics."
            color="bg-purple-500"
            onClick={() => handleChannelSelect('Forum')}
          />
          
          <ChannelCard 
            title="Community"
            description="Connect with students from all universities for social events, networking, and more."
            color="bg-amber-500"
            onClick={() => handleChannelSelect('Community')}
          />
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
