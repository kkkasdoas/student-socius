
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
import { toast } from 'sonner';

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
      chatroom_name: 'Economics Study Group',
      chatroom_photo: 'https://i.pravatar.cc/150?img=group',
      participants: currentUser ? [currentUser] : [],
      messages: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    // Generate some mock messages
    const mockMessages: ChatroomMessage[] = [
      {
        id: 'msg-1',
        chatroom_id: roomId || '',
        sender_id: '123',
        content: 'Hello everyone! Welcome to the Economics Study Group.',
        created_at: new Date(new Date().getTime() - 48 * 60 * 60 * 1000),
        is_read: true,
        is_edited: false,
        sender: {
          id: '123',
          display_name: 'James Wilson',
          university: 'TDTU University',
          verification_status: 'verified',
          auth_provider: 'google',
          profile_picture_url: 'https://i.pravatar.cc/150?img=33',
          block_status: false,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      },
      {
        id: 'msg-2',
        chatroom_id: roomId || '',
        sender_id: currentUser?.id || '',
        content: 'Hi James! Thanks for creating this group. I have a question about the upcoming exam.',
        created_at: new Date(new Date().getTime() - 24 * 60 * 60 * 1000),
        is_read: true,
        is_edited: false,
        sender: currentUser || {
          id: 'user-current',
          display_name: 'Current User',
          university: 'TDTU University',
          verification_status: 'verified',
          auth_provider: 'google',
          profile_picture_url: 'https://i.pravatar.cc/150?img=45',
          block_status: false,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      },
      {
        id: 'msg-3',
        chatroom_id: roomId || '',
        sender_id: '123',
        content: 'Sure! What questions do you have?',
        created_at: new Date(new Date().getTime() - 22 * 60 * 60 * 1000),
        is_read: true,
        is_edited: false,
        sender: {
          id: '123',
          display_name: 'James Wilson',
          university: 'TDTU University',
          verification_status: 'verified',
          auth_provider: 'google',
          profile_picture_url: 'https://i.pravatar.cc/150?img=33',
          block_status: false,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      },
      {
        id: 'msg-4',
        chatroom_id: roomId || '',
        sender_id: '456',
        content: 'I\'d like to know which chapters will be covered?',
        created_at: new Date(new Date().getTime() - 20 * 60 * 60 * 1000),
        is_read: true,
        is_edited: false,
        sender: {
          id: '456',
          display_name: 'Sarah Johnson',
          university: 'TDTU University',
          verification_status: 'verified',
          auth_provider: 'microsoft',
          profile_picture_url: 'https://i.pravatar.cc/150?img=23',
          block_status: false,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
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
      toast.success('Message sent');
      
      // Create a new message
      const newMessage: ChatroomMessage = {
        id: `msg-${Date.now()}`,
        chatroom_id: chatRoom.id,
        sender_id: currentUser?.id || '',
        content: message,
        created_at: new Date(),
        is_read: true,
        is_edited: false,
        sender: currentUser || {
          id: 'user-current',
          display_name: 'Current User',
          university: 'TDTU University',
          verification_status: 'verified',
          auth_provider: 'google',
          profile_picture_url: 'https://i.pravatar.cc/150?img=45',
          block_status: false,
          is_deleted: false,
          created_at: new Date(),
          updated_at: new Date()
        }
      };
      
      // Update the chatroom with the new message
      setChatRoom(prev => {
        if (!prev) return null;
        return {
          ...prev,
          messages: [...(prev.messages || []), newMessage],
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
              src={chatRoom.chatroom_photo || "https://i.pravatar.cc/150?img=group"} 
              alt={chatRoom.chatroom_name || "Chatroom"} 
            />
            <AvatarFallback>
              {chatRoom.chatroom_name ? chatRoom.chatroom_name.substring(0, 2).toUpperCase() : "CR"}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-medium">{chatRoom.chatroom_name || "Chatroom"}</h2>
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
          {chatRoom.messages && (
            <MessageList messages={chatRoom.messages} />
          )}
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

export default ChatRoomPage;
