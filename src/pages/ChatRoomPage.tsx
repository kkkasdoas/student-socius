
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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatroomMessage[]>([]);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the chatroom data 
  useEffect(() => {
    const fetchChatRoom = async () => {
      if (!roomId) return;
      
      try {
        // Fetch chatroom
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();
        
        if (roomError) throw roomError;
        
        // Fetch messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chatroom_messages')
          .select('*, profiles:sender_id(*)')
          .eq('chatroom_id', roomId)
          .order('created_at', { ascending: true });
        
        if (messagesError) throw messagesError;
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('chat_room_participants')
          .select('*, profiles:user_id(*)')
          .eq('chatroom_id', roomId);
        
        if (participantsError) throw participantsError;
        
        // Process the data
        const formattedMessages = messagesData.map((msg: any): ChatroomMessage => ({
          id: msg.id,
          chatroomId: msg.chatroom_id,
          senderId: msg.sender_id,
          content: msg.content,
          createdAt: new Date(msg.created_at),
          isRead: msg.is_read,
          isEdited: msg.is_edited,
          replyToId: msg.reply_to_id,
          sender: msg.profiles ? {
            id: msg.profiles.id,
            displayName: msg.profiles.display_name,
            login_name: msg.profiles.login_name,
            bio: msg.profiles.bio,
            university: msg.profiles.university,
            verificationStatus: msg.profiles.verification_status,
            profilePictureUrl: msg.profiles.profile_picture_url,
            authProvider: msg.profiles.auth_provider,
            loginEmail: msg.profiles.login_email,
            blockStatus: msg.profiles.block_status,
            isDeleted: msg.profiles.is_deleted,
            createdAt: new Date(msg.profiles.created_at),
            updatedAt: new Date(msg.profiles.updated_at)
          } : undefined
        }));
        
        const formattedParticipants = participantsData.map((p: any) => ({
          id: p.id,
          chatroomId: p.chatroom_id,
          userId: p.user_id,
          joinedAt: p.joined_at,
          user: p.profiles ? {
            id: p.profiles.id,
            displayName: p.profiles.display_name,
            login_name: p.profiles.login_name,
            bio: p.profiles.bio,
            university: p.profiles.university,
            verificationStatus: p.profiles.verification_status,
            profilePictureUrl: p.profiles.profile_picture_url,
            authProvider: p.profiles.auth_provider,
            loginEmail: p.profiles.login_email,
            blockStatus: p.profiles.block_status,
            isDeleted: p.profiles.is_deleted,
            createdAt: new Date(p.profiles.created_at),
            updatedAt: new Date(p.profiles.updated_at)
          } : null
        }));
        
        // Create chatroom object
        const room: ChatRoom = {
          id: roomData.id,
          postId: roomData.post_id,
          chatroomName: roomData.chatroom_name,
          chatroomPhoto: roomData.chatroom_photo,
          messages: formattedMessages,
          participants: formattedParticipants.map(p => p.user).filter(Boolean),
          lastMessage: formattedMessages.length > 0 ? formattedMessages[formattedMessages.length - 1] : undefined,
          createdAt: new Date(roomData.created_at),
          updatedAt: new Date(roomData.updated_at)
        };
        
        setChatRoom(room);
        setMessages(formattedMessages);
        setParticipants(formattedParticipants);
        
        // Subscribe to new messages
        const subscription = supabase
          .channel(`chatroom:${roomId}`)
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'chatroom_messages',
            filter: `chatroom_id=eq.${roomId}`
          }, async (payload) => {
            // Fetch the complete message with sender info
            const { data, error } = await supabase
              .from('chatroom_messages')
              .select('*, profiles:sender_id(*)')
              .eq('id', payload.new.id)
              .single();
              
            if (error) {
              console.error('Error fetching new message:', error);
              return;
            }
            
            const newMessage: ChatroomMessage = {
              id: data.id,
              chatroomId: data.chatroom_id,
              senderId: data.sender_id,
              content: data.content,
              createdAt: new Date(data.created_at),
              isRead: data.is_read,
              isEdited: data.is_edited,
              replyToId: data.reply_to_id,
              sender: data.profiles ? {
                id: data.profiles.id,
                displayName: data.profiles.display_name,
                login_name: data.profiles.login_name,
                bio: data.profiles.bio,
                university: data.profiles.university,
                verificationStatus: data.profiles.verification_status,
                profilePictureUrl: data.profiles.profile_picture_url,
                authProvider: data.profiles.auth_provider,
                loginEmail: data.profiles.login_email,
                blockStatus: data.profiles.block_status,
                isDeleted: data.profiles.is_deleted,
                createdAt: new Date(data.profiles.created_at),
                updatedAt: new Date(data.profiles.updated_at)
              } : undefined
            };
            
            setMessages(prevMessages => [...prevMessages, newMessage]);
          })
          .subscribe();
        
        // Check if current user is a participant, if not, add them
        if (currentUser && !participantsData.some((p: any) => p.user_id === currentUser.id)) {
          await supabase
            .from('chat_room_participants')
            .insert([
              { chatroom_id: roomId, user_id: currentUser.id }
            ]);
        }
      } catch (error) {
        console.error('Error fetching chatroom data:', error);
        toast.error('Failed to load chatroom');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChatRoom();
  }, [roomId, currentUser]);
  
  const handleSendMessage = async () => {
    if (!message.trim() || !chatRoom || !currentUser) return;
    
    try {
      // Insert the message into Supabase
      const { error } = await supabase
        .from('chatroom_messages')
        .insert([
          {
            chatroom_id: chatRoom.id,
            sender_id: currentUser.id,
            content: message
          }
        ]);
      
      if (error) throw error;
      
      // Clear the input
      setMessage('');
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
          <p className="text-gray-500">Loading chatroom...</p>
        </div>
      </Layout>
    );
  }
  
  if (!chatRoom) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <p className="text-gray-500">Chatroom not found</p>
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
              {participants.length} participants
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
