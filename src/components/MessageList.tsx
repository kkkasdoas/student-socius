
import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Check, Reply } from 'lucide-react';
import { ChatRoom, User, Message, ChatroomMessage } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import MessageContextMenu from './MessageContextMenu';
import { toast } from 'sonner';

interface MessageListProps {
  messages: (Message | ChatroomMessage)[];
  chatRoom?: ChatRoom;
  isChatroom?: boolean;
  onReply?: (message: Message | ChatroomMessage) => void;
}

const MessageList: React.FC<MessageListProps> = ({ 
  messages, 
  chatRoom,
  isChatroom = false,
  onReply 
}) => {
  const { currentUser } = useAuth();
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  
  const handleCopy = (message: Message | ChatroomMessage) => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };
  
  const handleEdit = (message: Message | ChatroomMessage) => {
    setEditingMessageId(message.id);
    setEditContent(message.content);
  };
  
  const handleDelete = (message: Message | ChatroomMessage) => {
    // In a real app this would call an API
    toast.success('Message deleted');
  };
  
  const handleReport = (message: Message | ChatroomMessage) => {
    // In a real app this would call an API
    toast.success('Message reported');
  };
  
  const handleReaction = (message: Message | ChatroomMessage, reaction: string) => {
    // In a real app this would call an API
    toast.success(`Added ${reaction} reaction`);
  };
  
  const saveEdit = () => {
    // In a real app this would call an API
    setEditingMessageId(null);
    toast.success('Message updated');
  };
  
  const handleReplyClick = (message: Message | ChatroomMessage) => {
    if (onReply) {
      onReply(message);
    }
  };
  
  // Group messages by date
  const groupedMessages: { [key: string]: (Message | ChatroomMessage)[] } = {};
  
  messages.forEach(message => {
    const date = message.created_at.toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  // Group consecutive messages from the same sender
  const groupConsecutiveMessages = (messages: (Message | ChatroomMessage)[]) => {
    const grouped: (Message | ChatroomMessage)[][] = [];
    let currentGroup: (Message | ChatroomMessage)[] = [];
    
    messages.forEach((message, index) => {
      const prevMessage = messages[index - 1];
      
      if (
        prevMessage && 
        prevMessage.sender_id === message.sender_id && 
        new Date(message.created_at).getTime() - new Date(prevMessage.created_at).getTime() < 5 * 60 * 1000 // 5 minutes
      ) {
        // Continue the current group
        currentGroup.push(message);
      } else {
        // Start a new group
        if (currentGroup.length > 0) {
          grouped.push([...currentGroup]);
        }
        currentGroup = [message];
      }
    });
    
    if (currentGroup.length > 0) {
      grouped.push(currentGroup);
    }
    
    return grouped;
  };
  
  return (
    <div className="flex flex-col space-y-4 p-4">
      {Object.entries(groupedMessages).map(([date, dateMessages]) => {
        const messageBubbles = groupConsecutiveMessages(dateMessages);
        
        return (
          <div key={date} className="space-y-4">
            <div className="flex justify-center">
              <div className="bg-gray-100 rounded-full px-3 py-1 text-xs text-gray-500">
                {new Date(date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: new Date(date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </div>
            </div>
            
            {messageBubbles.map((group, groupIndex) => {
              const firstMessage = group[0];
              const isCurrentUser = firstMessage.sender_id === currentUser?.id;
              
              return (
                <div 
                  key={`${firstMessage.id}-group-${groupIndex}`}
                  className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'} max-w-[80%]`}>
                    {!isCurrentUser && (
                      <div className="flex-shrink-0 mr-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage 
                            src={firstMessage.sender?.profile_picture_url || 'https://i.pravatar.cc/150?img=default'} 
                            alt={firstMessage.sender?.display_name || 'User'} 
                          />
                          <AvatarFallback>
                            {firstMessage.sender?.display_name?.substring(0, 2) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                    )}
                    
                    <div className={`flex flex-col ${isCurrentUser ? 'items-end' : 'items-start'}`}>
                      {!isCurrentUser && (
                        <div className="flex items-center mb-1">
                          <span className="text-sm font-medium">
                            {firstMessage.sender?.display_name}
                          </span>
                          {isChatroom && firstMessage.sender?.verification_status === 'verified' && (
                            <Check className="h-3 w-3 text-blue-500 ml-1" />
                          )}
                        </div>
                      )}
                      
                      <div className="space-y-1">
                        {group.map((message, messageIndex) => (
                          <MessageContextMenu
                            key={message.id}
                            message={message}
                            isCurrentUser={message.sender_id === currentUser?.id}
                            onReply={handleReplyClick}
                            onCopy={handleCopy}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onReport={handleReport}
                            onReaction={handleReaction}
                          >
                            <div className="group relative">
                              {message.reply_to_id && (
                                <div 
                                  className={`text-xs text-gray-500 mb-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}
                                >
                                  <span className="inline-flex items-center">
                                    <Reply className="h-3 w-3 mr-1" />
                                    Replying to message
                                  </span>
                                </div>
                              )}
                              
                              {editingMessageId === message.id ? (
                                <div className="flex items-end">
                                  <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    className="p-2 w-full rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-cendy-primary/50"
                                    rows={2}
                                    autoFocus
                                  />
                                  <div className="ml-2 flex flex-col space-y-1">
                                    <Button 
                                      size="sm" 
                                      onClick={saveEdit}
                                      className="px-2 py-1 h-auto"
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => setEditingMessageId(null)}
                                      className="px-2 py-1 h-auto"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  className={`py-2 px-3 rounded-lg ${
                                    isCurrentUser
                                      ? 'bg-cendy-primary text-white rounded-tr-none'
                                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                                  }`}
                                >
                                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                                </div>
                              )}
                              
                              <div 
                                className={`text-xs text-gray-500 mt-1 ${isCurrentUser ? 'text-right' : 'text-left'}`}
                              >
                                {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                                {message.is_edited && <span className="ml-1">(edited)</span>}
                              </div>
                              
                              {!editingMessageId && (
                                <div className={`absolute ${isCurrentUser ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} top-1/2 -translate-y-1/2 hidden group-hover:flex items-center space-x-1`}>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-full bg-white shadow-sm hover:bg-gray-100"
                                    onClick={() => handleReplyClick(message)}
                                  >
                                    <Reply className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          </MessageContextMenu>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-32">
          <p className="text-gray-500 text-sm">No messages yet</p>
          <p className="text-gray-400 text-xs mt-1">Start a conversation!</p>
        </div>
      )}
    </div>
  );
};

export default MessageList;
