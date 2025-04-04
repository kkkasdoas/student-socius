
// Replace the search bar section only
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Search, ChevronLeft, Plus } from 'lucide-react';
import { Conversation, User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { mockConversations, mockUsers } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { format, isToday, formatDistanceToNow } from 'date-fns';

const MessagesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'private' | 'chatrooms'>('all');
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  // Get all conversations for the current user from mock data
  const userConversations = mockConversations.filter(conv => 
    conv.participants?.some(participant => participant.id === currentUser?.id)
  );

  // Filter conversations based on search query and active tab
  const filteredConversations = userConversations
    .filter(conv => {
      // Filter by search query
      if (searchQuery) {
        // For private chats, search by participant name
        if (conv.type === 'private') {
          const otherParticipant = conv.participants?.find(p => p.id !== currentUser?.id);
          return otherParticipant?.displayName.toLowerCase().includes(searchQuery.toLowerCase());
        } 
        // For chatrooms, search by chatroom name
        else if (conv.chatroomName) {
          return conv.chatroomName.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return false;
      }
      
      // Filter by tab
      if (activeTab === 'private') return conv.type === 'private';
      if (activeTab === 'chatrooms') return conv.type === 'chatroom';
      return true; // 'all' tab
    })
    .sort((a, b) => {
      // Sort by latest message timestamp
      const timeA = a.lastMessageTimestamp ? new Date(a.lastMessageTimestamp).getTime() : 0;
      const timeB = b.lastMessageTimestamp ? new Date(b.lastMessageTimestamp).getTime() : 0;
      return timeB - timeA;
    });

  const formatMessageTime = (timestamp?: Date) => {
    if (!timestamp) return '';
    
    if (isToday(new Date(timestamp))) {
      return format(new Date(timestamp), 'HH:mm');
    } else {
      return format(new Date(timestamp), 'dd/MM/yyyy');
    }
  };

  const getConversationTitle = (conversation: Conversation) => {
    if (conversation.type === 'chatroom') {
      return conversation.chatroomName || 'Unnamed Group';
    } else {
      const otherParticipant = conversation.participants?.find(p => p.id !== currentUser?.id);
      return otherParticipant?.displayName || 'Unknown User';
    }
  };

  const getConversationAvatar = (conversation: Conversation) => {
    if (conversation.type === 'chatroom') {
      return conversation.photo || undefined;
    } else {
      const otherParticipant = conversation.participants?.find(p => p.id !== currentUser?.id);
      return otherParticipant?.profilePictureUrl || undefined;
    }
  };

  const getConversationInitials = (conversation: Conversation) => {
    if (conversation.type === 'chatroom') {
      return (conversation.chatroomName || 'UG').substring(0, 2).toUpperCase();
    } else {
      const otherParticipant = conversation.participants?.find(p => p.id !== currentUser?.id);
      return (otherParticipant?.displayName || 'U').substring(0, 2).toUpperCase();
    }
  };

  const handleSearchUsers = (query: string) => {
    if (query.length > 0) {
      const users = mockUsers.filter(user => 
        user.id !== currentUser?.id && // Exclude current user
        user.displayName.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredUsers(users);
    } else {
      setFilteredUsers([]);
    }
  };

  const startConversation = (userId: string) => {
    // In a real app, we would create a new conversation or open an existing one
    navigate(`/messages/${userId}`);
    setShowNewChatDialog(false);
  };

  const navigateToConversation = (conversationId: string, type: 'private' | 'chatroom') => {
    if (type === 'private') {
      const otherParticipant = mockConversations
        .find(conv => conv.id === conversationId)
        ?.participants?.find(p => p.id !== currentUser?.id);
      
      if (otherParticipant) {
        navigate(`/messages/${otherParticipant.id}`);
      }
    } else {
      navigate(`/chatroom/${conversationId}`);
    }
  };

  const toggleSearch = () => {
    setIsSearching(!isSearching);
    if (!isSearching) {
      setSearchQuery('');
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold">Messages</h1>
            <div className="flex items-center space-x-2">
              <button 
                onClick={toggleSearch}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Search className="h-5 w-5 text-gray-500" />
              </button>
              <button 
                onClick={() => setShowNewChatDialog(true)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <Plus className="h-5 w-5 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Search Bar (Shown only when searching) */}
          {isSearching && (
            <div className="flex items-center px-4 py-2 bg-white border-t border-gray-100">
              <ChevronLeft 
                className="h-5 w-5 mr-2 text-gray-500 cursor-pointer"
                onClick={toggleSearch}
              />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm w-full focus:outline-none focus:ring-2 focus:ring-cendy-primary/30 transition-all"
                  autoFocus
                />
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === 'all' 
                  ? "text-cendy-primary" 
                  : "text-gray-500 hover:text-gray-800"
              )}
              onClick={() => setActiveTab('all')}
            >
              All
              {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cendy-primary" />
              )}
            </button>
            <button
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === 'private' 
                  ? "text-cendy-primary" 
                  : "text-gray-500 hover:text-gray-800"
              )}
              onClick={() => setActiveTab('private')}
            >
              Private
              {activeTab === 'private' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cendy-primary" />
              )}
            </button>
            <button
              className={cn(
                "flex-1 py-3 text-sm font-medium transition-colors relative",
                activeTab === 'chatrooms' 
                  ? "text-cendy-primary" 
                  : "text-gray-500 hover:text-gray-800"
              )}
              onClick={() => setActiveTab('chatrooms')}
            >
              Chatrooms
              {activeTab === 'chatrooms' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cendy-primary" />
              )}
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length > 0 ? (
            <div>
              {filteredConversations.map(conversation => (
                <div 
                  key={conversation.id}
                  className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigateToConversation(conversation.id, conversation.type)}
                >
                  <Avatar className="h-12 w-12 mr-3">
                    <AvatarImage src={getConversationAvatar(conversation)} />
                    <AvatarFallback>{getConversationInitials(conversation)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h3 className="font-medium text-gray-900 truncate">
                        {getConversationTitle(conversation)}
                      </h3>
                      <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                        {formatMessageTime(conversation.lastMessageTimestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conversation.lastMessageContent || 'No messages yet'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-500 p-4">
              <p className="text-center mb-2">
                {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
              </p>
              <button 
                onClick={() => setShowNewChatDialog(true)}
                className="text-cendy-primary text-sm"
              >
                Start a new conversation
              </button>
            </div>
          )}
        </div>

        {/* New Chat Dialog */}
        <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogTitle>New Message</DialogTitle>
            <div className="my-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 bg-gray-100 rounded-full w-full text-sm focus:outline-none"
                  onChange={(e) => handleSearchUsers(e.target.value)}
                />
              </div>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {filteredUsers.map(user => (
                <div 
                  key={user.id}
                  className="flex items-center px-2 py-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                  onClick={() => startConversation(user.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={user.profilePictureUrl} />
                    <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium text-gray-900">{user.displayName}</h4>
                    <p className="text-xs text-gray-500">{user.university || 'No university'}</p>
                  </div>
                </div>
              ))}
              {filteredUsers.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  Type to search for users
                </p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default MessagesPage;
