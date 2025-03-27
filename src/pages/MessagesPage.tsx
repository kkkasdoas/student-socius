
import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { Search, ChevronRight, Check, CheckCheck, BadgeAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/utils/mockData';
import { Conversation, Message, User, ConversationType } from '@/types';
import { Badge } from '@/components/ui/badge';

// Mock data for the unified conversations
const generateMockConversations = (currentUser: User | null): Conversation[] => {
  if (!currentUser) return [];
  
  const otherUsers = mockUsers.filter(user => user.id !== currentUser.id);
  
  // Create some private conversations
  const privateConversations: Conversation[] = otherUsers.slice(0, 3).map((user, index) => {
    const lastMessageTime = new Date();
    lastMessageTime.setHours(lastMessageTime.getHours() - index);
    
    return {
      id: `conv-private-${index}`,
      type: 'private',
      lastMessageContent: index === 0 ? "Hey, have you finished the assignment?" : 
                         index === 1 ? "Let's meet up later to study" : 
                                      "Thanks for the help!",
      lastMessageSenderId: index % 2 === 0 ? currentUser.id : user.id,
      lastMessageTimestamp: lastMessageTime,
      createdAt: new Date(lastMessageTime.getTime() - 24 * 60 * 60 * 1000),
      updatedAt: lastMessageTime,
      participants: [currentUser, user]
    };
  });
  
  // Create some chatroom conversations
  const chatroomConversations: Conversation[] = [
    {
      id: 'conv-chatroom-1',
      type: 'chatroom',
      chatroomName: 'Study Group - Computer Science',
      photo: 'https://i.pravatar.cc/150?img=group1',
      postId: 'post-1',
      lastMessageContent: 'I think we should focus on algorithms first',
      lastMessageSenderId: otherUsers[0].id,
      lastMessageTimestamp: new Date(new Date().getTime() - 30 * 60 * 1000),
      createdAt: new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(new Date().getTime() - 30 * 60 * 1000),
      participants: [currentUser, ...otherUsers.slice(0, 4)]
    },
    {
      id: 'conv-chatroom-2',
      type: 'chatroom',
      chatroomName: 'Campus Events',
      photo: 'https://i.pravatar.cc/150?img=group2',
      postId: 'post-2',
      lastMessageContent: 'Who\'s going to the concert this weekend?',
      lastMessageSenderId: currentUser.id,
      lastMessageTimestamp: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
      createdAt: new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(new Date().getTime() - 2 * 60 * 60 * 1000),
      participants: [currentUser, ...otherUsers.slice(2, 6)]
    },
    {
      id: 'conv-chatroom-3',
      type: 'chatroom',
      chatroomName: 'Course Discussion - Philosophy 101',
      photo: 'https://i.pravatar.cc/150?img=group3',
      postId: 'post-3',
      lastMessageContent: 'The reading assignment for tomorrow is chapters 4-5',
      lastMessageSenderId: otherUsers[3].id,
      lastMessageTimestamp: new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
      createdAt: new Date(new Date().getTime() - 21 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(new Date().getTime() - 12 * 60 * 60 * 1000),
      participants: [currentUser, ...otherUsers.slice(3, 8)]
    }
  ];
  
  // Combine and sort by last message timestamp
  return [...privateConversations, ...chatroomConversations].sort((a, b) => {
    return (b.lastMessageTimestamp?.getTime() || 0) - (a.lastMessageTimestamp?.getTime() || 0);
  });
};

// Function to format the timestamp
const formatMessageTime = (date: Date | undefined) => {
  if (!date) return '';
  
  if (isToday(date)) {
    return format(date, 'HH:mm');
  } else if (isYesterday(date)) {
    return 'Yesterday';
  } else if (date.getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) {
    return format(date, 'EEE'); // Day of week
  } else {
    return format(date, 'dd/MM/yyyy');
  }
};

// Generate random number of unread messages for demo
const getRandomUnreadCount = (senderId: string | undefined, currentUserId: string | undefined) => {
  if (senderId === currentUserId) return 0;
  return Math.random() > 0.6 ? Math.floor(Math.random() * 10) + 1 : 0;
};

const ConversationListItem: React.FC<{
  conversation: Conversation;
  currentUser: User | null;
  onClick: () => void;
}> = ({ conversation, currentUser, onClick }) => {
  // For private conversations, get the other participant
  let displayName = '';
  let displayPhoto = '';
  let displayUser: User | undefined;
  
  if (conversation.type === 'private' && conversation.participants) {
    displayUser = conversation.participants.find(p => p.id !== currentUser?.id);
    displayName = displayUser?.displayName || 'Unknown User';
    displayPhoto = displayUser?.profilePictureUrl || '';
  } else {
    displayName = conversation.chatroomName || 'Unnamed Chat';
    displayPhoto = conversation.photo || '';
  }
  
  // Get unread count (mock data for demo)
  const unreadCount = getRandomUnreadCount(conversation.lastMessageSenderId, currentUser?.id);
  
  // Check if the last message is from the current user
  const isLastMessageFromCurrentUser = conversation.lastMessageSenderId === currentUser?.id;
  
  // Determine read status
  const isRead = isLastMessageFromCurrentUser || unreadCount === 0;
  
  return (
    <div 
      className="flex items-center p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={onClick}
    >
      <Avatar className="h-12 w-12 mr-3">
        <AvatarImage src={displayPhoto || "https://i.pravatar.cc/150?img=default"} alt={displayName} />
        <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <h3 className={`font-medium truncate ${!isRead ? 'text-black' : 'text-gray-800'}`}>
            {displayName}
          </h3>
          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
            {formatMessageTime(conversation.lastMessageTimestamp)}
          </span>
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className={`text-sm truncate ${!isRead ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
            {isLastMessageFromCurrentUser && "You: "}
            {conversation.lastMessageContent || "No messages yet"}
          </p>
          
          <div className="flex items-center ml-2">
            {unreadCount > 0 ? (
              <Badge variant="default" className="text-xs bg-cendy-primary rounded-full h-5 min-w-5 flex items-center justify-center">
                {unreadCount}
              </Badge>
            ) : isLastMessageFromCurrentUser && (
              isRead ? (
                <CheckCheck className="h-4 w-4 text-cendy-primary" />
              ) : (
                <Check className="h-4 w-4 text-gray-400" />
              )
            )}
          </div>
        </div>
      </div>
      
      <ChevronRight className="h-5 w-5 text-gray-300 ml-1" />
    </div>
  );
};

const MessagesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Generate mock conversations
    const mockConversations = generateMockConversations(currentUser);
    setConversations(mockConversations);
  }, [currentUser]);
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conversation => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    
    // For private conversations, search in the other participant's name
    if (conversation.type === 'private' && conversation.participants) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);
      if (otherParticipant?.displayName.toLowerCase().includes(query)) {
        return true;
      }
    }
    
    // For chatrooms, search in the chatroom name
    if (conversation.type === 'chatroom' && conversation.chatroomName?.toLowerCase().includes(query)) {
      return true;
    }
    
    // Search in the last message content
    return conversation.lastMessageContent?.toLowerCase().includes(query) || false;
  });
  
  const handleConversationClick = (conversation: Conversation) => {
    if (conversation.type === 'private' && conversation.participants) {
      const otherParticipant = conversation.participants.find(p => p.id !== currentUser?.id);
      if (otherParticipant) {
        navigate(`/direct-message/${otherParticipant.id}`);
      }
    } else if (conversation.type === 'chatroom' && conversation.postId) {
      navigate(`/chatroom/${conversation.id}`);
    }
  };
  
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
        
        {filteredConversations.length > 0 ? (
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(conversation => (
              <ConversationListItem
                key={conversation.id}
                conversation={conversation}
                currentUser={currentUser}
                onClick={() => handleConversationClick(conversation)}
              />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-4 text-gray-500">
            {searchQuery ? (
              <>
                <p>No conversations found</p>
                <p className="text-sm mt-1">Try a different search term</p>
              </>
            ) : (
              <>
                <p>No conversations yet</p>
                <p className="text-sm mt-1">Start a conversation with someone!</p>
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default MessagesPage;
