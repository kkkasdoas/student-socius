import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Info } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, ConversationType, Message, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const MessagePage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscription = useRef<any>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Fetch conversation and messages
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Fetch conversation data
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select(`
            *,
            participants:conversation_participants(
              user:user_id(*)
            )
          `)
          .eq('id', conversationId)
          .single();
          
        if (conversationError) {
          throw conversationError;
        }
        
        if (!conversationData) {
          throw new Error('Conversation not found');
        }
        
        // Transform database shape to application type
        const conversation: Conversation = {
          id: conversationData.id,
          type: conversationData.type as ConversationType,
          chatroomName: conversationData.chatroom_name,
          photo: conversationData.photo,
          postId: conversationData.post_id,
          lastMessageContent: conversationData.last_message_content,
          lastMessageSenderId: conversationData.last_message_sender_id,
          lastMessageTimestamp: conversationData.last_message_timestamp ? new Date(conversationData.last_message_timestamp) : undefined,
          createdAt: new Date(conversationData.created_at),
          updatedAt: new Date(conversationData.updated_at),
          participants: conversationData.participants.map((p: any) => p.user)
        };
        
        setConversation(conversation);
        
        // For direct messages, find the other user
        if (conversation.type === 'private' && conversation.participants) {
          const otherParticipant = conversation.participants.find(
            participant => participant.id !== currentUser.id
          );
          
          if (otherParticipant) {
            setOtherUser(otherParticipant);
          }
        }
        
        // Fetch messages
        fetchMessages();
        
        // Set up real-time subscription for new messages
        setupMessageSubscription();
      } catch (error) {
        console.error('Error fetching conversation:', error);
        toast.error('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversation();
    
    // Cleanup subscription on unmount
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
    };
  }, [conversationId, currentUser]);
  
  // Fetch messages for this conversation
  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });
        
      if (error) {
        throw error;
      }
      
      if (data) {
        // Transform database shape to application type
        const formattedMessages: Message[] = data.map(msg => ({
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          content: msg.content,
          createdAt: new Date(msg.created_at),
          isRead: msg.is_read,
          isEdited: msg.is_edited,
          replyToId: msg.reply_to_id,
          sender: msg.sender
        }));
        
        setMessages(formattedMessages);
        
        // Scroll to bottom after messages are loaded
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };
  
  // Setup real-time message subscription
  const setupMessageSubscription = () => {
    if (!conversationId) return;
    
    messageSubscription.current = supabase
      .channel(`conversation:${conversationId}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload) => {
        // When new message comes in, fetch the sender details
        const { data: senderData, error: senderError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', payload.new.sender_id)
          .single();
          
        if (senderError) {
          console.error('Error fetching message sender:', senderError);
          return;
        }
        
        // Format the new message
        const newMessage: Message = {
          id: payload.new.id,
          conversationId: payload.new.conversation_id,
          senderId: payload.new.sender_id,
          content: payload.new.content,
          createdAt: new Date(payload.new.created_at),
          isRead: payload.new.is_read,
          isEdited: payload.new.is_edited,
          replyToId: payload.new.reply_to_id,
          sender: senderData
        };
        
        // Add to messages state
        setMessages(prev => [...prev, newMessage]);
        
        // Scroll to bottom for new messages
        setTimeout(scrollToBottom, 100);
        
        // Mark as read if from other user
        if (payload.new.sender_id !== currentUser?.id) {
          markMessageAsRead(payload.new.id);
        }
      })
      .subscribe();
  };
  
  // Mark message as read
  const markMessageAsRead = async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('id', messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };
  
  // Handle message sent - refresh or scroll to bottom
  const handleMessageSent = () => {
    scrollToBottom();
  };
  
  // Handle reply to message
  const handleReplyToMessage = (message: Message) => {
    setReplyToMessage(message);
  };
  
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
        </div>
      </Layout>
    );
  }
  
  if (!conversation) {
    return (
      <Layout>
        <div className="h-screen flex flex-col items-center justify-center">
          <p className="text-gray-500">Conversation not found</p>
          <Button 
            variant="link" 
            className="mt-4" 
            onClick={() => navigate('/conversations')}
          >
            Back to Messages
          </Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <div className="p-4 border-b flex items-center bg-white">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/conversations')}
            className="mr-2"
            aria-label="Back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <Avatar className="w-10 h-10 mr-3">
            {conversation.type === 'private' ? (
              <>
                <AvatarImage 
                  src={otherUser?.profilePictureUrl || "https://i.pravatar.cc/150?img=default"} 
                  alt={otherUser?.displayName} 
                />
                <AvatarFallback>{otherUser?.displayName.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
              </>
            ) : (
              <>
                <AvatarImage 
                  src={conversation.photo || "https://i.pravatar.cc/150?img=group"} 
                  alt={conversation.chatroomName} 
                />
                <AvatarFallback>{conversation.chatroomName?.substring(0, 2).toUpperCase() || "CH"}</AvatarFallback>
              </>
            )}
          </Avatar>
          
          <div className="flex-1">
            <h2 className="font-medium">
              {conversation.type === 'private'
                ? otherUser?.displayName || "User"
                : conversation.chatroomName || "Chatroom"
              }
            </h2>
            <p className="text-xs text-gray-500">
              {conversation.type === 'private'
                ? otherUser?.verificationStatus === 'verified' ? 'Verified Student' : 'Student'
                : `${conversation.participants?.length || 0} participants`
              }
            </p>
          </div>
          
          {conversation.type === 'chatroom' && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(`/chatroom-info/${conversationId}`)}
              aria-label="Chatroom information"
            >
              <Info className="h-5 w-5" />
            </Button>
          )}
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4">
          <MessageList 
            messages={messages} 
            conversation={conversation}
            onReply={handleReplyToMessage}
          />
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        {replyToMessage && (
          <div className="border-t border-b bg-gray-50 p-2 px-4 flex justify-between">
            <div className="flex flex-col">
              <span className="text-xs text-cendy-primary font-medium">
                Replying to {replyToMessage.sender?.displayName || 'User'}
              </span>
              <span className="text-sm text-gray-600 truncate max-w-[300px]">
                {replyToMessage.content}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={handleCancelReply}
            >
              ✕
            </Button>
          </div>
        )}
        
        <MessageInput 
          conversation={conversation}
          onMessageSent={handleMessageSent}
          replyToMessageId={replyToMessage?.id}
          onCancelReply={handleCancelReply}
        />
      </div>
    </Layout>
  );
};

export default MessagePage; 