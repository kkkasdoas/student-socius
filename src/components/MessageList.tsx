
import React, { useState } from 'react';
import { Message, ChatRoom } from '@/types';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Search, Plus } from 'lucide-react';
import { mockChatRooms } from '@/utils/mockData';

const MessageList: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter chat rooms based on search query
  const filteredChatRooms = mockChatRooms.filter(room => {
    if (!searchQuery) return true;
    
    // Search by room name or participants' names
    const roomName = room.name?.toLowerCase() || '';
    const participantNames = room.participants.map(p => p.displayName.toLowerCase()).join(' ');
    
    return roomName.includes(searchQuery.toLowerCase()) || 
           participantNames.includes(searchQuery.toLowerCase());
  });
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-cendy-border bg-white">
        <h1 className="text-xl font-semibold text-gray-800 mb-3">Messages</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cendy-primary/30 transition-all"
          />
        </div>
      </div>
      
      {/* Chat rooms list */}
      <div className="flex-1 overflow-y-auto bg-cendy-bg">
        {filteredChatRooms.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {filteredChatRooms.map(room => (
              <ChatRoomItem 
                key={room.id} 
                room={room} 
                onClick={() => navigate(`/messages/${room.id}`)} 
              />
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
          New Message
        </button>
      </div>
    </div>
  );
};

interface ChatRoomItemProps {
  room: ChatRoom;
  onClick: () => void;
}

const ChatRoomItem: React.FC<ChatRoomItemProps> = ({ room, onClick }) => {
  // Get the last message
  const lastMessage = room.lastMessage;
  
  // Get the other participants (in a real app, you'd filter out the current user)
  const otherParticipants = room.participants.slice(0, 2);
  
  // Create display name based on participants or room name
  const displayName = room.name || otherParticipants.map(p => p.displayName).join(', ');
  
  // Get profile picture
  const profilePic = otherParticipants[0]?.profilePictureUrl || 'https://i.pravatar.cc/150?img=default';
  
  return (
    <div 
      className="p-3 flex items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="relative mr-3">
        <img 
          src={profilePic} 
          alt={displayName} 
          className="w-12 h-12 rounded-full object-cover"
        />
        {otherParticipants[0]?.verificationStatus === 'verified' && (
          <div className="absolute bottom-0 right-0 bg-cendy-primary rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
            <span className="text-white text-[8px]">✓</span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <h3 className="font-medium text-gray-800 truncate">{displayName}</h3>
          {lastMessage && (
            <span className="text-xs text-gray-500 ml-2 whitespace-nowrap">
              {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: false })}
            </span>
          )}
        </div>
        
        {lastMessage && (
          <p className="text-sm text-gray-500 truncate mt-1">
            {lastMessage.content}
          </p>
        )}
      </div>
    </div>
  );
};

export default MessageList;
