
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Send, Paperclip, Mic, Image as ImageIcon, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom, ChatroomMessage } from '@/types';
import { fetchChatroomMessages, fetchChatroomParticipants, sendChatroomMessage } from '@/utils/supabaseHelpers';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatroomMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Fetch the chatroom data 
  useEffect(() => {
    const loadChatRoom = async () => {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch chatroom details
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();
          
        if (roomError) throw roomError;
        if (!roomData) throw new Error('Chatroom not found');
        
        // Fetch participants
        const participants = await fetchChatroomParticipants(roomId);
        
        // Fetch messages
        const chatroomMessages = await fetchChatroomMessages(roomId);
        
        // Create the chatroom object
        const chatRoomData: ChatRoom = {
          id: roomData.id,
          chatroom_name: roomData.chatroom_name,
          chatroom_photo: roomData.chatroom_photo,
          post_id: roomData.post_id,
          created_at: new Date(roomData.created_at),
          updated_at: new Date(roomData.updated_at),
          participants: participants.map(p => p.user!).filter(Boolean),
        };
        
        setChatRoom(chatRoomData);
        setMessages(chatroomMessages);
      } catch (error) {
        console.error('Error loading chatroom:', error);
        toast.error('Failed to load chatroom');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatRoom();
    
    // Set up real-time subscription for new messages
    const channel = supabase
      .channel('chatroom-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chatroom_messages',
          filter: `chatroom_id=eq.${roomId}`
        },
        async (payload) => {
          // Fetch the complete message with sender details
          const { data, error } = await supabase
            .from('chatroom_messages')
            .select(`
              *,
              sender:sender_id(*)
            `)
            .eq('id', payload.new.id)
            .single();
            
          if (error || !data) return;
          
          const newMessage: ChatroomMessage = {
            ...data,
            created_at: new Date(data.created_at),
          } as ChatroomMessage;
          
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !chatRoom || !currentUser) return;
    
    try {
      const newMessage = await sendChatroomMessage(
        chatRoom.id,
        currentUser.id,
        message
      );
      
      if (!newMessage) throw new Error('Failed to send message');
      
      // Clear the input
      setMessage('');
      
      // Manually add the message to the list (real-time subscription will also catch it)
      setMessages(prev => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cendy-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!chatRoom) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <p>Chatroom not found</p>
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
          <MessageList messages={messages} />
          <div ref={messagesEndRef} />
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
