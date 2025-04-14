import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import MessageList from '@/components/MessageList';
import MessageInput from '@/components/MessageInput';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Info, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, ConversationType, Message, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Define local interfaces to match our SQL function return types
interface ConversationPreview {
  id: string;
  type: ConversationType;
  chatroom_name: string;
  photo: string;
  post_id: string;
  last_message_content: string;
  last_message_sender_id: string;
  last_message_timestamp: Date | null;
  participant_count: number;
  participants: any[]; // JSONB array from SQL function
  unread_count?: number;
  is_member: boolean; // New field from updated SQL function
  created_at: Date;
  updated_at: Date;
}

interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_display_name: string;
  sender_profile_picture: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  is_edited: boolean; // Added field to match updated SQL function
  reply_to_id?: string;
  reply_to_content?: string;
  reply_to_sender_id?: string;
  reply_to_sender_display_name?: string;
}

const MessagePage: React.FC = () => {
  const { conversationId, userId } = useParams<{ conversationId: string; userId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as {
    otherUserName?: string;
    otherUserProfilePicture?: string;
  };
  const [conversation, setConversation] = useState<ConversationPreview | null>(null);
  const [otherUser, setOtherUser] = useState<any | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<ConversationMessage | null>(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageSubscription = useRef<any>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);
  
  // Fetch conversation
  useEffect(() => {
    const fetchConversation = async () => {
      if (!conversationId || !currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Use the getConversationByID function to fetch conversation details
        const { data, error } = await supabase
          .rpc('get_conversation_by_id', { conversation_id_param: conversationId });
          
        if (error) {
          throw error;
        }
        
        if (!data || data.length === 0) {
          // Conversation not found, possibly deleted
          console.error('Conversation not found or deleted');
          toast.error('This conversation no longer exists');
          navigate('/conversations');
          return;
        }
        
        // Transform the conversation data
        const conversationData = {
          ...data[0],
          last_message_timestamp: data[0].last_message_timestamp ? new Date(data[0].last_message_timestamp) : null
        };
        
        setConversation(conversationData);
        
        // For direct messages, find the other user
        if (conversationData.type === 'private') {
          // Check if we have state data from navigation
          if (locationState?.otherUserName) {
            setOtherUser({
              display_name: locationState.otherUserName,
              profile_picture_url: locationState.otherUserProfilePicture || null
            });
          } 
          // If no state data, find the other user from participants
          else if (conversationData.participants) {
            // Check participant structure to find the correct id field
            const firstParticipant = conversationData.participants[0];
            const idField = firstParticipant.hasOwnProperty('user_id') ? 'user_id' : 'id';
            
            const otherParticipant = conversationData.participants.find(
              (p: any) => p[idField] !== currentUser.id
            );
            
            if (otherParticipant) {
              setOtherUser(otherParticipant);
            }
          }
        }
        
        // Always fetch messages regardless of participation
        fetchMessages(0, true); // Pass true to force refresh
        
        // Set up real-time subscription for new messages
        setupMessageSubscription();
      } catch (error) {
        console.error('Error fetching conversation:', error);
        toast.error('Failed to load conversation');
        navigate('/conversations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversation();

    // Set up event listener for message refresh
    const handleRefreshMessages = (event: any) => {
      // Check if the deleted message is in our current conversation
      if (event.detail?.messageId) {
        // Remove it from our messages state
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== event.detail.messageId)
        );
      }
    };

    window.addEventListener('refresh-messages', handleRefreshMessages);
    
    // Cleanup subscription on unmount
    return () => {
      if (messageSubscription.current) {
        messageSubscription.current.unsubscribe();
      }
      window.removeEventListener('refresh-messages', handleRefreshMessages);
    };
  }, [conversationId, currentUser, locationState, navigate]);
  
  // Fetch messages for this conversation with pagination
  const fetchMessages = async (offset: number = 0, forceRefresh: boolean = false) => {
    if (!conversationId || conversationId === 'draft') return;
    
    try {
      if (offset === 0) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      // Use the getConversationMessages function
      const { data, error } = await supabase
        .rpc('get_conversation_messages', { 
          conversation_id_param: conversationId,
          limit_param: 20,
          offset_param: offset
        });
        
      if (error) {
        throw error;
      }
      
      // Transform message data
      const formattedMessages = data.map((msg: any) => ({
        ...msg,
        created_at: new Date(msg.created_at),
        updated_at: new Date(msg.updated_at)
      }));
      
      if (offset === 0 || forceRefresh) {
        // For initial load, sort messages by date
        setMessages(formattedMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime()));
      } else {
        // For loading more, prepend sorted messages to existing ones
        const sortedNewMessages = formattedMessages.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());
        setMessages(prev => [...sortedNewMessages, ...prev]);
      }
      
      // Track pagination state
      setMessagesOffset(offset);
      setHasMoreMessages(formattedMessages.length === 20); // If we got less than the limit, there are no more messages
      
      // Scroll to bottom after loading initial messages
      if (offset === 0 || forceRefresh) {
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };
  
  // Setup real-time message subscription
  const setupMessageSubscription = () => {
    // Don't set up subscription for draft conversations
    if (!conversationId || conversationId === 'draft') return;
    
    // First, unsubscribe if there's an existing subscription
    if (messageSubscription.current) {
      messageSubscription.current.unsubscribe();
      messageSubscription.current = null;
    }
    
    // Create a channel with a unique name for this conversation and user
    const channelName = `conversation:${conversationId}:${Date.now()}`;
    
    const channel = supabase.channel(channelName);
    
    // Handle conversation deletion
    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'conversations',
      filter: `id=eq.${conversationId}`
    }, (payload) => {
      // Show toast notification
      toast.error('This conversation has been deleted');
      
      // Navigate back to conversations list
      navigate('/conversations');
    });
    
    // Also listen for conversation participant removal
    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'conversation_participants',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      if (payload.old && payload.old.user_id === currentUser?.id) {
        // Show toast notification
        toast.error('You have been removed from this conversation');
        
        // Navigate back to conversations list
        navigate('/conversations');
      }
    });
    
    // Handle INSERT events (new messages)
    channel.on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, async (payload) => {
      // For new messages, we need to fetch the complete data including sender info
      // Only fetch the specific new message, not the entire conversation
      const { data, error } = await supabase
        .rpc('get_conversation_messages', { 
          conversation_id_param: conversationId,
          limit_param: 1,
          offset_param: 0,
          message_id_filter: payload.new.id
        });
        
      if (error) {
        console.error('Error fetching new message details:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const newMessage = {
          ...data[0],
          created_at: new Date(data[0].created_at),
          updated_at: new Date(data[0].updated_at)
        };
        
        // Update messages state, handling temporary/optimistic messages
        setMessages(prev => {
          // First, check if we already have this exact message
          const exactMatch = prev.find(msg => msg.id === newMessage.id);
          if (exactMatch) {
            return prev; // Skip if we already have this message with the same ID
          }
          
          // Check for optimistic versions of this message (from the same sender with similar content)
          const optimisticVersions = prev.filter(msg => 
            msg.id.toString().includes('temp-') && 
            msg.sender_id === newMessage.sender_id &&
            msg.content === newMessage.content
          );
          
          if (optimisticVersions.length > 0) {
            // Replace optimistic message(s) with the real one
            return prev.map(msg => 
              optimisticVersions.some(opt => opt.id === msg.id) 
                ? newMessage // Return the new message for the first match
                : msg 
            ).filter((msg, index, self) => 
              // Remove any duplicate optimistic messages after the first replacement
              index === self.findIndex(m => m.id === msg.id) ||
              !optimisticVersions.some(opt => opt.id === msg.id)
            );
          }
          
          // If not an optimistic update, just add the new message
          return [...prev, newMessage];
        });
        
        // Scroll to bottom for new messages
        setTimeout(scrollToBottom, 100);
      }
    });
    
    // Handle UPDATE events (edited messages)
    channel.on('postgres_changes', { 
      event: 'UPDATE', 
      schema: 'public', 
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      const updatedMessageId = payload.new.id;
      
      // For updates, we can update the existing message in state using payload data
      setMessages(prevMessages => 
        prevMessages.map(msg => {
          if (msg.id === updatedMessageId) {
            return {
              ...msg,
              content: payload.new.content,
              is_edited: payload.new.is_edited,
              updated_at: new Date(payload.new.updated_at || payload.new.created_at)
            };
          }
          return msg;
        })
      );
    });
    
    // Handle DELETE events (deleted messages)
    channel.on('postgres_changes', {
      event: 'DELETE',
      schema: 'public',
      table: 'messages'
    }, (payload) => {
      // The deleted message ID should be in payload.old.id
      const deletedMessageId = payload.old?.id;
      
      if (deletedMessageId) {
        // Remove the message from the state
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== deletedMessageId)
        );
      }
    });
    
    // Subscribe to the channel
    channel.subscribe();
    
    // Store the subscription reference for cleanup
    messageSubscription.current = channel;
  };
  
  // Handle message sent - refresh or scroll to bottom
  const handleMessageSent = async (content: string, replyToMessageId?: string) => {
    console.log(`handleMessageSent called with content: ${content}`);
    
    try {
      const { data, error } = await supabase
        .rpc('send_message', {
          conversation_id_param: conversation?.id,
          sender_id_param: currentUser?.id,
          content_param: content,
          reply_to_id_param: replyToMessageId
        });
        
      if (error) {
        throw error;
      }
      
      // Clear reply state
      setReplyToMessage(null);
      
      // Scroll to bottom
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  // Convert ConversationMessage to Message type
  const convertToMessages = (convMessages: ConversationMessage[]): Message[] => {
    return convMessages.map(msg => ({
      id: msg.id,
      conversationId: msg.conversation_id,
      senderId: msg.sender_id,
      senderDisplayName: msg.sender_display_name,
      senderProfilePicture: msg.sender_profile_picture,
      content: msg.content,
      createdAt: msg.created_at,
      updatedAt: msg.updated_at,
      isEdited: msg.is_edited,
      isRead: false, // Add default value
      replyToId: msg.reply_to_id,
      replyToContent: msg.reply_to_content,
      replyToSenderId: msg.reply_to_sender_id,
      replyToSenderDisplayName: msg.reply_to_sender_display_name
    }));
  };
  
  // Handle reply to message - convert back from Message to ConversationMessage
  const handleReplyToMessage = (message: Message) => {
    // Find the original ConversationMessage from our state
    const originalMessage = messages.find(m => m.id === message.id);
    if (originalMessage) {
      setReplyToMessage(originalMessage);
    }
  };
  
  const handleCancelReply = () => {
    setReplyToMessage(null);
  };
  
  // Get display name for header
  const getConversationName = () => {
    if (!conversation) return '';
    
    if (conversation.type !== 'private') {
      return conversation.chatroom_name || 'Unnamed Chatroom';
    }
    
    // For private chats, show the other participant's name
    return otherUser?.display_name || 'Chat';
  };
  
  // Get empty state message
  const getEmptyStateMessage = () => {
    return "No messages yet";
  };
  
  if (isLoading && !conversation) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
        </div>
      </Layout>
    );
  }
  
  // Handle case when conversation doesn't exist but loading is complete
  if (!isLoading && !conversation) {
    return (
      <Layout>
        <div className="h-screen flex flex-col items-center justify-center p-4">
          <p className="text-gray-500 mb-4">This conversation no longer exists or you don't have access to it.</p>
          <Button onClick={() => navigate('/conversations')}>Back to Conversations</Button>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            {(conversation?.type === 'private') && (
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={otherUser?.profile_picture_url} />
                <AvatarFallback>
                  {otherUser?.display_name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            )}
            
            <div>
              <h2 className="font-semibold">{getConversationName()}</h2>
              {conversation && conversation.type !== 'private' && conversation.photo !== undefined && (
                <p className="text-xs text-gray-500">
                  {conversation.participant_count} participants
                </p>
              )}
            </div>
          </div>
          
          {conversation?.type !== 'private' && conversation?.photo !== undefined && (
            <Avatar 
              className="h-8 w-8 cursor-pointer"
              onClick={() => {
                // TODO: Implement group details view
              }}
            >
              <AvatarImage src={conversation?.photo} />
              <AvatarFallback>
                <Users className="h-5 w-5" />
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        {/* Message List */}
        <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
          {!conversation && hasMoreMessages && (
            <div className="text-center my-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fetchMessages(messagesOffset + 20)}
                disabled={!hasMoreMessages}
              >
                Load More
              </Button>
            </div>
          )}
          
          <MessageList 
            messages={convertToMessages(messages)}
            onReply={handleReplyToMessage}
          />
          
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="border-t p-4">
          <MessageInput 
            conversation={conversation}
            onMessageSent={handleMessageSent}
            replyToMessageId={replyToMessage?.id}
            onCancelReply={handleCancelReply}
          />
        </div>
      </div>
    </Layout>
  );
};

export default MessagePage; 