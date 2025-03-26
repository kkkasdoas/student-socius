
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter } from 'lucide-react';

const MessagesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  
  // Active tab logic based on URL
  useEffect(() => {
    // No need to manually set tabs since we're using URL-based navigation
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        <div className="p-3 bg-white border-b border-cendy-border shadow-sm">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">Messages</h1>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cendy-primary/30 transition-all"
              />
            </div>
          </div>
        </div>
        <MessageList searchQuery={searchQuery} />
      </div>
    </Layout>
  );
};

export default MessagesPage;
