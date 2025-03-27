
import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom, ChatroomMessage, Message } from '@/types';

type MessageListProps = {
  messages?: (Message | ChatroomMessage)[];
  chatRoom?: ChatRoom;
  isChatroom?: boolean;
};

const MessageList: React.FC<MessageListProps> = ({ 
  messages = [], 
  chatRoom,
  isChatroom = false 
}) => {
  const { currentUser } = useAuth();
  
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <p>No messages yet</p>
        <p className="text-sm mt-2">Start a conversation!</p>
      </div>
    );
  }

  // Group messages by date
  const groupedMessages: { [key: string]: (Message | ChatroomMessage)[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="flex flex-col space-y-6 p-4">
      {chatRoom && (
        <div className="flex flex-col items-center justify-center mb-4 text-center">
          <Avatar className="w-16 h-16 mb-2">
            <AvatarImage 
              src={chatRoom.chatroomPhoto || "https://i.pravatar.cc/150?img=group"} 
              alt={chatRoom.chatroomName} 
            />
            <AvatarFallback>{chatRoom.chatroomName?.substring(0, 2).toUpperCase() || "CH"}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{chatRoom.chatroomName || "Chat Room"}</h2>
          <p className="text-sm text-gray-500">
            {chatRoom.participants.length} participants
          </p>
        </div>
      )}
      
      {Object.keys(groupedMessages).map(date => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
              {new Date(date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric'
              })}
            </div>
          </div>
          
          {groupedMessages[date].map((message) => {
            // Determine if message is from current user
            const isCurrentUser = isChatroom 
              ? (message as ChatroomMessage).senderId === currentUser?.id 
              : (message as Message).senderId === currentUser?.id;
            
            // Get sender for proper display
            const sender = isChatroom 
              ? (message as ChatroomMessage).sender 
              : (message as Message).sender;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex max-w-[75%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                  {!isCurrentUser && (
                    <Avatar className="w-8 h-8 mr-2">
                      <AvatarImage 
                        src={sender.profilePictureUrl || "https://i.pravatar.cc/150?img=default"} 
                        alt={sender.displayName} 
                      />
                      <AvatarFallback>{sender.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}
                  
                  <div className={`flex flex-col ${isCurrentUser ? 'items-end mr-2' : 'items-start'}`}>
                    {!isCurrentUser && (
                      <span className="text-xs text-gray-500 mb-1">{sender.displayName}</span>
                    )}
                    
                    <div 
                      className={`px-4 py-2 rounded-2xl ${
                        isCurrentUser 
                          ? 'bg-cendy-primary text-white rounded-tr-none' 
                          : 'bg-gray-100 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      <p>{message.content}</p>
                    </div>
                    
                    <span className="text-xs text-gray-400 mt-1">
                      {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
};

export default MessageList;
