
import React from 'react';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';

const MessagesPage: React.FC = () => {
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <div className="p-3 bg-white border-b border-cendy-border shadow-sm">
          <h1 className="text-xl font-semibold">Messages</h1>
        </div>
        <MessageList />
      </div>
    </Layout>
  );
};

export default MessagesPage;
