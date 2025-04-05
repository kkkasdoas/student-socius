
import React from 'react';
import Layout from '@/components/Layout';
import ChannelTabs from '@/components/ChannelTabs';
import { useAuth } from '@/contexts/AuthContext';

const Feed: React.FC = () => {
  const { currentUser } = useAuth();
  const university = currentUser?.university; // Default for demo
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <ChannelTabs university={university} />
      </div>
    </Layout>
  );
};

export default Feed;

