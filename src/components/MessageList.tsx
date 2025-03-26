
import React from 'react';
import { ChatRoom, Message, User } from '@/types';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Plus } from 'lucide-react';
import { mockChatRooms, mockUsers, mockMessages } from '@/utils/mockData';
import { useAuth } from '@/contexts/AuthContext';

interface MessageListProps {
  searchQuery?: string;
}

const MessageList: React.FC<MessageListProps> = ({ searchQuery = '' }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  // Combine chatrooms and direct messages
  const getCombinedConversations = () => {
    if (!currentUser) return [];
    
    // Get chat rooms the current user is part of
    const userChatRooms = mockChatRooms.filter(room => 
      room.participants.some(p => p.id === currentUser.id)
    );
    
    // Get direct message conversations
    const directMessageUsers = new Map<string, { user: User, lastMessage: Message }>();
    
    // Find all unique users the current user has messaged with
    mockMessages.forEach(msg => {
      if (msg.senderId === currentUser.id || msg.receiverId === currentUser.id) {
        const otherUserId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        
        // If this user is not yet in our map or this message is newer than what we have
        if (!directMessageUsers.has(otherUserId) || 
            new Date(msg.createdAt) > new Date(directMessageUsers.get(otherUserId)!.lastMessage.createdAt)) {
          directMessageUsers.set(otherUserId, {
            user: msg.senderId === currentUser.id ? msg.receiver : msg.sender,
            lastMessage: msg
          });
        }
      }
    });
    
    // Convert direct message map to array
    const directMessages = Array.from(directMessageUsers.values()).map(({ user, lastMessage }) => ({
      type: 'direct' as const,
      id: user.id,
      user,
      lastMessage,
      updatedAt: lastMessage.createdAt
    }));
    
    // Convert chat rooms to our unified format
    const chatRoomConversations = userChatRooms.map(room => ({
      type: 'chatroom' as const,
      id: room.id,
      name: room.name || room.participants.map(p => p.displayName).join(', '),
      participants: room.participants,
      lastMessage: room.lastMessage,
      updatedAt: room.lastMessage?.createdAt || room.updatedAt
    }));
    
    // Combine and sort by most recent message
    return [...directMessages, ...chatRoomConversations].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  };
  
  const combinedConversations = getCombinedConversations();
  
  // Filter conversations based on search query
  const filteredConversations = combinedConversations.filter(convo => {
    if (!searchQuery) return true;
    
    if (convo.type === 'direct') {
      return convo.user.displayName.toLowerCase().includes(searchQuery.toLowerCase());
    } else {
      const participantNames = convo.participants.map(p => p.displayName.toLowerCase()).join(' ');
      return convo.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
             participantNames.includes(searchQuery.toLowerCase());
    }
  });
  
  const handleConversationClick = (conversation: typeof combinedConversations[0]) => {
    if (conversation.type === 'direct') {
      navigate(`/messages/${conversation.id}`);
    } else {
      navigate(`/chatroom/${conversation.id}`);
    }
  };
  
  return (
    <div className="flex flex-col h-full">
      {/* Chat list */}
      <div className="flex-1 overflow-y-auto bg-cendy-bg">
        {filteredConversations.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map(conversation => (
              <div 
                key={`${conversation.type}-${conversation.id}`}
                className="p-3 flex items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => handleConversationClick(conversation)}
              >
                {conversation.type === 'direct' ? (
                  // Direct Message Item
                  <>
                    <div className="relative mr-3">
                      <img 
                        src={conversation.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                        alt={conversation.user.displayName} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      {conversation.user.verificationStatus === 'verified' && (
                        <div className="absolute bottom-0 right-0 bg-cendy-primary rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
                          <span className="text-white text-[8px]">✓</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-gray-800 truncate">{conversation.user.displayName}</h3>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.lastMessage.content}
                      </p>
                    </div>
                  </>
                ) : (
                  // Chatroom Item
                  <>
                    <div className="relative mr-3">
                      {conversation.participants.length > 0 ? (
                        <div className="relative">
                          <img 
                            src={conversation.participants[0].profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                            alt={conversation.name} 
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          {conversation.participants.length > 1 && (
                            <div className="absolute -bottom-1 -right-1 bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                              <span className="text-xs text-gray-600">+{conversation.participants.length - 1}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-500 text-sm">🔄</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <h3 className="font-medium text-gray-800 truncate">{conversation.name}</h3>
                        <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
                          {conversation.lastMessage ? 
                            formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { addSuffix: false }) : 
                            formatDistanceToNow(new Date(conversation.updatedAt), { addSuffix: false })}
                        </span>
                      </div>
                      
                      {conversation.lastMessage ? (
                        <p className="text-sm text-gray-500 truncate mt-1">
                          <span className="font-medium">{conversation.lastMessage.sender.displayName}: </span>
                          {conversation.lastMessage.content}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic truncate mt-1">
                          No messages yet
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500 p-4 text-center">
            <p className="mb-2">No messages found</p>
            <p className="text-sm text-gray-400">
              {searchQuery ? 'Try a different search term' : 'Start a conversation by clicking the button below'}
            </p>
          </div>
        )}
      </div>
      
      {/* New message button */}
      <div className="p-4 border-t border-cendy-border bg-white">
        <button 
          className="w-full py-2.5 bg-cendy-primary text-white rounded-lg font-medium flex items-center justify-center hover:bg-cendy-primary/90 transition-colors"
          onClick={() => navigate('/new-message')}
        >
          <Plus className="w-5 h-5 mr-2" />
          New Conversation
        </button>
      </div>
    </div>
  );
};

export default MessageList;
