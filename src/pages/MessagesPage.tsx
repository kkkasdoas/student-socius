
import React from 'react';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';

const MessagesPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <MessageList />
      </div>
    </Layout>
  );
};

export default MessagesPage;
