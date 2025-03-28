
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send, Paperclip, Mic, Image as ImageIcon, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom, ChatroomMessage } from '@/types';

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  
  // Fetch the chatroom data 
  useEffect(() => {
    // In a real app, we would fetch this data from the API
    // For now, we'll create a mock chatroom
    const mockChatRoom: ChatRoom = {
      id: roomId || 'unknown',
      chatroomName: 'Economics Study Group',
      chatroomPhoto: 'https://i.pravatar.cc/150?img=group',
      participants: currentUser ? [currentUser] : [],
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Generate some mock messages
    const mockMessages: ChatroomMessage[] = [
      {
        id: 'msg-1',
        chatroomId: roomId || '',
        senderId: '123',
        content: 'Hello everyone! Welcome to the Economics Study Group.',
        createdAt: new Date(new Date().getTime() - 48 * 60 * 60 * 1000),
        sender: {
          id: '123',
          displayName: 'James Wilson',
          university: 'TDTU University',
          verificationStatus: 'verified',
          authProvider: 'google',
          profilePictureUrl: 'https://i.pravatar.cc/150?img=33',
          blockStatus: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'msg-2',
        chatroomId: roomId || '',
        senderId: currentUser?.id || '',
        content: 'Hi James! Thanks for creating this group. I have a question about the upcoming exam.',
        createdAt: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        sender: currentUser || {
          id: 'user-current',
          displayName: 'Current User',
          university: 'TDTU University',
          verificationStatus: 'verified',
          authProvider: 'google',
          profilePictureUrl: 'https://i.pravatar.cc/150?img=45',
          blockStatus: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'msg-3',
        chatroomId: roomId || '',
        senderId: '123',
        content: 'Sure! What questions do you have?',
        createdAt: new Date(new Date().getTime() - 22 * 60 * 60 * 1000),
        sender: {
          id: '123',
          displayName: 'James Wilson',
          university: 'TDTU University',
          verificationStatus: 'verified',
          authProvider: 'google',
          profilePictureUrl: 'https://i.pravatar.cc/150?img=33',
          blockStatus: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: 'msg-4',
        chatroomId: roomId || '',
        senderId: '456',
        content: 'I\'d like to know which chapters will be covered?',
        createdAt: new Date(new Date().getTime() - 20 * 60 * 60 * 1000),
        sender: {
          id: '456',
          displayName: 'Sarah Johnson',
          university: 'TDTU University',
          verificationStatus: 'verified',
          authProvider: 'microsoft',
          profilePictureUrl: 'https://i.pravatar.cc/150?img=23',
          blockStatus: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];
    
    mockChatRoom.messages = mockMessages;
    mockChatRoom.lastMessage = mockMessages[mockMessages.length - 1];
    
    setChatRoom(mockChatRoom);
  }, [roomId, currentUser]);
  
  const handleSendMessage = () => {
    if (message.trim() && chatRoom) {
      // In a real app, this would send the message to the API
      console.log('Sending message to chatroom:', message);
      
      // Create a new message
      const newMessage: ChatroomMessage = {
        id: `msg-${Date.now()}`,
        chatroomId: chatRoom.id,
        senderId: currentUser?.id || '',
        content: message,
        createdAt: new Date(),
        sender: currentUser || {
          id: 'user-current',
          displayName: 'Current User',
          university: 'TDTU University',
          verificationStatus: 'verified',
          authProvider: 'google',
          profilePictureUrl: 'https://i.pravatar.cc/150?img=45',
          blockStatus: false,
          isDeleted: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };
      
      // Update the chatroom with the new message
      setChatRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...prev.messages, newMessage],
          lastMessage: newMessage
        };
      });
      
      setMessage('');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (!chatRoom) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <p>Loading chatroom...</p>
        </div>
      </Layout>
    );
  }
  
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
              src={chatRoom.chatroomPhoto || "https://i.pravatar.cc/150?img=group"} 
              alt={chatRoom.chatroomName || "Chatroom"} 
            />
            <AvatarFallback>
              {chatRoom.chatroomName ? chatRoom.chatroomName.substring(0, 2).toUpperCase() : "CR"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-medium">{chatRoom.chatroomName || "Chatroom"}</h2>
            <p className="text-xs text-gray-500">
              {chatRoom.participants.length} participants
            </p>
          </div>
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(`/chatroom-info/${roomId}`)}
          >
            <Info className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={chatRoom.messages} chatRoom={chatRoom} isChatroom={true} />
        </div>
        
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
              className="min-h-[40px] max-h-[120px] pr-12 py-2 resize-none"
              multiline="true"
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

export default ChatRoomPage;
