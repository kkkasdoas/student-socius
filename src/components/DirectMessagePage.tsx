
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send, Paperclip, Mic, Image as ImageIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { User, Message } from '@/types';
import { mockUsers } from '@/utils/mockData';

const DirectMessagePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Find the user based on the userId param
  const otherUser = mockUsers.find(user => user.id === userId);
  
  // Create mock messages for demo
  const mockDirectMessages: Message[] = [
    {
      id: "msg-1",
      conversationId: `conv-${currentUser?.id}-${userId}`,
      senderId: currentUser?.id || "",
      content: "Hey, how are you doing?",
      createdAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000), // 1 day ago
      isRead: true,
      isEdited: false,
      sender: currentUser || mockUsers[0]
    },
    {
      id: "msg-2",
      conversationId: `conv-${currentUser?.id}-${userId}`,
      senderId: userId || "",
      content: "I'm good, thanks! How about you?",
      createdAt: new Date(new Date().getTime() - 23 * 60 * 60 * 1000), // 23 hours ago
      isRead: true,
      isEdited: false,
      sender: otherUser || mockUsers[1]
    },
    {
      id: "msg-3",
      conversationId: `conv-${currentUser?.id}-${userId}`,
      senderId: currentUser?.id || "",
      content: "Doing well! Just working on some assignments.",
      createdAt: new Date(new Date().getTime() - 22 * 60 * 60 * 1000), // 22 hours ago
      isRead: true,
      isEdited: false,
      sender: currentUser || mockUsers[0]
    },
    {
      id: "msg-4",
      conversationId: `conv-${currentUser?.id}-${userId}`,
      senderId: userId || "",
      content: "Nice! Which class are you working on?",
      createdAt: new Date(new Date().getTime() - 30 * 60 * 1000), // 30 minutes ago
      isRead: true,
      isEdited: false,
      sender: otherUser || mockUsers[1]
    }
  ];
  
  if (!otherUser) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <p>User not found</p>
        </div>
      </Layout>
    );
  }
  
  const handleSendMessage = () => {
    if (message.trim()) {
      // In a real app, this would send the message to the API
      console.log('Sending message:', message, replyingTo ? `replying to: ${replyingTo.id}` : '');
      setMessage('');
      setReplyingTo(null);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  return (
    <Layout>
      <div className="h-screen flex flex-col bg-cendy-bg">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 flex items-center p-2 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate('/messages')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="h-9 w-9 mr-3">
            <AvatarImage 
              src={otherUser.profilePictureUrl || "https://i.pravatar.cc/150?img=default"} 
              alt={otherUser.displayName} 
            />
            <AvatarFallback>{otherUser.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-medium">{otherUser.displayName}</h2>
            <p className="text-xs text-gray-500">
              {otherUser.verificationStatus === 'verified' ? 'Verified Student' : 'Student'}
            </p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={mockDirectMessages} onReply={handleReply} />
        </div>
        
        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-gray-50 border-t border-gray-200 p-2 flex items-start">
            <div className="flex-1 ml-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Replying to <span className="font-medium">{replyingTo.sender?.displayName}</span>
                </p>
                <Button variant="ghost" size="sm" onClick={cancelReply} className="p-0 h-auto text-gray-400 hover:text-gray-600">
                  ✕
                </Button>
              </div>
              <p className="text-sm text-gray-600 truncate">{replyingTo.content}</p>
            </div>
          </div>
        )}
        
        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-2 flex items-end">
          <Button variant="ghost" size="icon" className="text-gray-500">
            <Paperclip className="h-5 w-5" />
          </Button>
          
          <Button variant="ghost" size="icon" className="text-gray-500 mr-2">
            <ImageIcon className="h-5 w-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] pr-12 py-2"
            />
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute right-1 bottom-1 text-gray-500"
              disabled={!message.trim()}
              onClick={handleSendMessage}
            >
              {message.trim() ? (
                <Send className="h-5 w-5 text-cendy-primary" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DirectMessagePage;
