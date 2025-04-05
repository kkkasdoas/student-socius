import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ConversationListProps = {
  onNewChat?: () => void;
};

const ConversationList: React.FC<ConversationListProps> = ({ onNewChat }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [otherParticipants, setOtherParticipants] = useState<{ [conversationId: string]: User }>({}); 
  
  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Get all conversations the current user is a participant in
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', currentUser.id);
          
        if (participantError) throw participantError;
        
        if (!participantData || participantData.length === 0) {
          setConversations([]);
          setFilteredConversations([]);
          return;
        }
        
        const conversationIds = participantData.map(p => p.conversation_id);
        
        // Fetch full conversation data
        const { data: conversationsData, error: conversationsError } = await supabase
          .from('conversations')
          .select(`
            id,
            type,
            chatroom_name,
            photo,
            post_id,
            last_message_content,
            last_message_sender_id,
            last_message_timestamp,
            created_at,
            updated_at,
            participants:conversation_participants(
              user:profiles(*)
            )
          `)
          .in('id', conversationIds)
          .order('last_message_timestamp', { ascending: false });
          
        if (conversationsError) throw conversationsError;
        
        if (conversationsData) {
          // Transform to application type
          const formattedConversations: Conversation[] = conversationsData.map(conv => {
            const participants = conv.participants ? conv.participants.map((p: any) => p.user).filter(Boolean) : [];
            
            // For direct messages, find the other user
            if (conv.type === 'private') {
              const otherUser = participants.find((user: User) => user.id !== currentUser.id);
              if (otherUser) {
                setOtherParticipants(prev => ({
                  ...prev,
                  [conv.id]: otherUser
                }));
              }
            }
            
            return {
              id: conv.id,
              type: conv.type,
              chatroomName: conv.chatroom_name,
              photo: conv.photo,
              postId: conv.post_id,
              lastMessageContent: conv.last_message_content,
              lastMessageSenderId: conv.last_message_sender_id,
              lastMessageTimestamp: conv.last_message_timestamp ? new Date(conv.last_message_timestamp) : undefined,
              createdAt: new Date(conv.created_at),
              updatedAt: new Date(conv.updated_at),
              participants: participants
            };
          });
          
          setConversations(formattedConversations);
          setFilteredConversations(formattedConversations);
        }
      } catch (error) {
        console.error('Error fetching conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversations();
    
    // Set up real-time subscription for conversation updates
    const subscription = supabase
      .channel('conversations_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations'
      }, () => {
        // Refresh conversations when there's a change
        fetchConversations();
      })
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, [currentUser]);
  
  // Filter conversations based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conv => {
      // For private conversations, check the other user's name
      if (conv.type === 'private') {
        const otherUser = otherParticipants[conv.id];
        if (otherUser && otherUser.displayName.toLowerCase().includes(query)) {
          return true;
        }
      }
      
      // For chatrooms, check the chatroom name
      if (conv.type === 'chatroom' && conv.chatroomName?.toLowerCase().includes(query)) {
        return true;
      }
      
      // Also check last message content
      return conv.lastMessageContent?.toLowerCase().includes(query);
    });
    
    setFilteredConversations(filtered);
  }, [searchQuery, conversations, otherParticipants]);
  
  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/conversation/${conversation.id}`);
  };
  
  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Conversations</h2>
          {onNewChat && (
            <button 
              onClick={onNewChat}
              className="p-2 text-cendy-primary hover:bg-gray-100 rounded-full transition"
              aria-label="Start new conversation"
            >
              <PlusCircle className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-100 border-none"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
            <p className="text-center mb-2">No conversations yet</p>
            {onNewChat && (
              <button
                onClick={onNewChat}
                className="px-4 py-2 bg-cendy-primary text-white rounded-lg hover:bg-cendy-primary/90 transition"
              >
                Start a new conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const isPrivate = conversation.type === 'private';
              const otherUser = isPrivate ? otherParticipants[conversation.id] : null;
              const displayName = isPrivate 
                ? otherUser?.displayName || 'Unknown User'
                : conversation.chatroomName || 'Unnamed Chatroom';
              const avatarSrc = isPrivate
                ? otherUser?.profilePictureUrl
                : conversation.photo;
                
              return (
                <div
                  key={conversation.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
                      <AvatarImage src={avatarSrc} />
                      <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <h3 className="font-medium text-gray-900 truncate">{displayName}</h3>
                        <span className="text-xs text-gray-500">
                          {conversation.lastMessageTimestamp && 
                            formatDistanceToNow(conversation.lastMessageTimestamp, { addSuffix: true })}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.lastMessageContent 
                          ? (conversation.lastMessageSenderId === currentUser?.id 
                              ? 'You: ' 
                              : '') + conversation.lastMessageContent
                          : 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationList; 