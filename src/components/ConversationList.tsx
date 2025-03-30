import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
          
        if (participantError) {
          throw participantError;
        }
        
        if (!participantData || participantData.length === 0) {
          setConversations([]);
          setFilteredConversations([]);
          return;
        }
        
        const conversationIds = participantData.map(p => p.conversation_id);
        
        // Fetch full conversation data for those conversations
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
          
        if (conversationsError) {
          throw conversationsError;
        }
        
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
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  const handleConversationClick = (conversation: Conversation) => {
    navigate(`/conversation/${conversation.id}`);
  };
  
  const getLastMessagePreview = (conversation: Conversation) => {
    if (!conversation.lastMessageContent) {
      return "No messages yet";
    }
    
    const isFromCurrentUser = conversation.lastMessageSenderId === currentUser?.id;
    const prefix = isFromCurrentUser ? 'You: ' : '';
    
    return `${prefix}${conversation.lastMessageContent}`;
  };
  
  const getLastMessageTime = (conversation: Conversation) => {
    if (!conversation.lastMessageTimestamp) {
      return formatDistanceToNow(conversation.createdAt, { addSuffix: true });
    }
    
    return formatDistanceToNow(conversation.lastMessageTimestamp, { addSuffix: true });
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
      <div className="p-4 flex justify-between items-center border-b">
        <h1 className="text-xl font-bold">Messages</h1>
        {onNewChat && (
          <Button 
            onClick={onNewChat}
            variant="ghost" 
            size="icon"
            aria-label="Start new chat"
          >
            <PlusCircle className="h-5 w-5" />
          </Button>
        )}
      </div>
      
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <p>No conversations found</p>
            {searchQuery ? (
              <Button 
                variant="link" 
                onClick={() => setSearchQuery('')}
                className="mt-2"
              >
                Clear search
              </Button>
            ) : onNewChat ? (
              <Button 
                variant="link" 
                onClick={onNewChat}
                className="mt-2"
              >
                Start a new chat
              </Button>
            ) : null}
          </div>
        ) : (
          <div className="divide-y">
            {filteredConversations.map(conversation => {
              const otherUser = conversation.type === 'private' ? otherParticipants[conversation.id] : null;
              
              return (
                <div
                  key={conversation.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleConversationClick(conversation)}
                >
                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-3">
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
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between">
                        <h3 className="font-medium truncate">
                          {conversation.type === 'private' 
                            ? otherUser?.displayName || "User" 
                            : conversation.chatroomName || "Chat Room"
                          }
                        </h3>
                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                          {getLastMessageTime(conversation)}
                        </span>
                      </div>
                      
                      <p className="text-sm text-gray-500 truncate">
                        {getLastMessagePreview(conversation)}
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