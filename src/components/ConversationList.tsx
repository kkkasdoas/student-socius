import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, PlusCircle, Archive, BellOff, Bell, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { conversationService } from '@/services/ConversationService';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmationDialog from './DeleteConfirmationDialog';

// Define interface for our new conversation format
interface ConversationItem {
  id: string;
  type: string;
  name: string;
  photo: string;
  last_message: string;
  last_message_timestamp: Date;
  last_message_sender_name: string;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
}

type ConversationListProps = {
  onNewChat?: () => void;
};

const ConversationList: React.FC<ConversationListProps> = ({ 
  onNewChat
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<ConversationItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [contextMenuOpen, setContextMenuOpen] = useState<string | null>(null);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [longPressedConversation, setLongPressedConversation] = useState<string | null>(null);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ConversationItem | null>(null);
  const [isUserAdmin, setIsUserAdmin] = useState(false);
  
  // Tab state
  const [showArchived, setShowArchived] = useState(false);
  
  // Reference to track if component is mounted
  const isMounted = useRef(true);
  
  useEffect(() => {
    return () => {
      isMounted.current = false;
      // Clear any timers when unmounting
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);
  
  useEffect(() => {
    const fetchConversations = async () => {
      // Add a global timeout
      const timeoutId = setTimeout(() => {
        if (isMounted.current) {
          setIsLoading(false);
          toast.error('Failed to load conversations. Please try again.');
        }
      }, 15000); // 15 seconds timeout

      try {
        if (!currentUser?.id) {
          setIsLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        setIsLoading(true);
        
        // Always fetch ALL conversations (both archived and active)
        const conversationsData = await conversationService.getConversations(currentUser.id, null);
        
        if (isMounted.current) {
          setConversations(conversationsData);
          // Filter based on current tab state
          setFilteredConversations(conversationsData.filter(conv => conv.is_archived === showArchived));
          setIsLoading(false);
        }
      } catch (error) {
        if (isMounted.current) {
          toast.error('Failed to load conversations');
          setIsLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };
    
    fetchConversations();
    
    // Keep track of last updated time to prevent duplicate calls
    let debounceTimeout: NodeJS.Timeout | null = null;
    
    // Debounced version of fetchConversations
    const debouncedFetch = () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      
      debounceTimeout = setTimeout(() => {
        fetchConversations();
      }, 500); // 500ms debounce interval
    };
    
    // Create a channel for both table subscriptions
    const channel = supabase.channel('conversation_updates');
    
    // Subscribe to conversations table changes
    channel
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'conversations'
      }, () => {
        debouncedFetch();
      });
    
    // Also subscribe to conversation_participants table 
    // to catch new conversations being created
    channel
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'conversation_participants',
        filter: `user_id=eq.${currentUser?.id}`
      }, () => {
        debouncedFetch();
      })
      .subscribe();
      
    return () => {
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }
      channel.unsubscribe();
    };
  }, [currentUser]);
  
  // Add this useEffect after the data fetching useEffect and before the search filtering useEffect
  // This will update filteredConversations whenever showArchived changes (tab switch)
  useEffect(() => {
    // No need to refetch - just filter the existing conversations based on archive status
    setFilteredConversations(
      conversations.filter(conv => conv.is_archived === showArchived)
    );
  }, [showArchived, conversations]);
  
  // Filter conversations based on search query only
  useEffect(() => {
    // If no search query, we already filtered based on showArchived in the earlier useEffect
    if (!searchQuery.trim()) {
      return;
    }
    
    const query = searchQuery.toLowerCase();
    // Start with conversations already filtered by archive status
    const baseFiltered = conversations.filter(conv => conv.is_archived === showArchived);
    
    // Then apply search filtering
    const searchFiltered = baseFiltered.filter(conv => {
      // Check conversation name
      if (conv.name && conv.name.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check last message
      if (conv.last_message && conv.last_message.toLowerCase().includes(query)) {
        return true;
      }
      
      // Check sender name
      if (conv.last_message_sender_name && conv.last_message_sender_name.toLowerCase().includes(query)) {
        return true;
      }
      
      return false;
    });
    
    setFilteredConversations(searchFiltered);
  }, [searchQuery, conversations, showArchived]);
  
  const handleConversationClick = (conversation: ConversationItem) => {
    // Only navigate if we're not handling a long press
    if (!longPressedConversation) {
      navigate(`/conversation/${conversation.id}`);
    }
  };
  
  const handleArchiveConversation = async (conversationId: string) => {
    try {
      const result = await conversationService.archiveConversation(conversationId);
      if (result.success) {
        toast.success(result.message);
        
        // Update the main conversation list
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === conversationId 
              ? { ...conv, is_archived: true } 
              : conv
          )
        );
        
        // If currently viewing non-archived conversations, remove this one from view
        if (!showArchived) {
          setFilteredConversations(prevFiltered => 
            prevFiltered.filter(conv => conv.id !== conversationId)
          );
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error archiving conversation:', error);
      toast.error('Failed to archive conversation');
    }
  };
  
  const handleUnarchiveConversation = async (conversationId: string) => {
    try {
      const result = await conversationService.unarchiveConversation(conversationId);
      if (result.success) {
        toast.success(result.message);
        
        // Update the main conversation list
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === conversationId 
              ? { ...conv, is_archived: false } 
              : conv
          )
        );
        
        // If currently viewing archived conversations, remove this one from view
        if (showArchived) {
          setFilteredConversations(prevFiltered => 
            prevFiltered.filter(conv => conv.id !== conversationId)
          );
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error unarchiving conversation:', error);
      toast.error('Failed to unarchive conversation');
    }
  };
  
  const handleToggleMute = async (conversation: ConversationItem) => {
    try {
      let result;
      if (conversation.is_muted) {
        result = await conversationService.unmuteConversation(conversation.id);
      } else {
        result = await conversationService.muteConversation(conversation.id);
      }
      
      if (result.success) {
        toast.success(result.message);
        
        // Update the local state directly without refetching
        setConversations(prevConversations => 
          prevConversations.map(conv => 
            conv.id === conversation.id 
              ? { ...conv, is_muted: !conv.is_muted } 
              : conv
          )
        );
        
        // Also update filtered conversations
        setFilteredConversations(prevFiltered => 
          prevFiltered.map(conv => 
            conv.id === conversation.id 
              ? { ...conv, is_muted: !conv.is_muted } 
              : conv
          )
        );
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error toggling mute status:', error);
      toast.error(`Failed to ${conversation.is_muted ? 'unmute' : 'mute'} conversation`);
    }
  };
  
  const handleDeleteConversation = async (conversationId: string) => {
    try {
      const result = await conversationService.deleteConversation(conversationId);
      if (result.success) {
        toast.success(result.message);
        
        // Update conversation lists without refetching
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.id !== conversationId)
        );
        
        setFilteredConversations(prevFiltered => 
          prevFiltered.filter(conv => conv.id !== conversationId)
        );
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };
  
  // Start a timer for long press
  const handleTouchStart = (conversationId: string) => {
    const timer = setTimeout(() => {
      setLongPressedConversation(conversationId);
      setContextMenuOpen(conversationId);
    }, 500); // 500ms long press
    
    setLongPressTimer(timer);
  };
  
  // Clear the timer if touch ends before long press threshold
  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    // Reset after a short delay to allow click handling
    setTimeout(() => {
      setLongPressedConversation(null);
    }, 100);
  };

  // Handle checking if user is admin for selected conversation
  const checkAdminStatus = async (conversationId: string) => {
    try {
      const isAdmin = await conversationService.isAdmin(conversationId);
      setIsUserAdmin(isAdmin);
    } catch (error) {
      console.error('Error checking admin status:', error);
      setIsUserAdmin(false);
    }
  };
  
  // Handle opening the delete confirmation dialog
  const handleOpenDeleteDialog = async (conversation: ConversationItem) => {
    setSelectedConversation(conversation);
    
    // Check admin status if it's a chatroom
    if (conversation.type === 'chatroom') {
      await checkAdminStatus(conversation.id);
    }
    
    setDeleteDialogOpen(true);
    setContextMenuOpen(null); // Close the dropdown menu
  };
  
  // Handle delete for just the current user
  const handleDeleteForMe = async () => {
    if (!selectedConversation) return;
    
    try {
      const result = await conversationService.deleteConversation(selectedConversation.id);
      
      if (result.success) {
        toast.success('Conversation deleted');
        
        // Update conversation lists without refetching
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.id !== selectedConversation.id)
        );
        
        setFilteredConversations(prevFiltered => 
          prevFiltered.filter(conv => conv.id !== selectedConversation.id)
        );
        
        setDeleteDialogOpen(false);
        setSelectedConversation(null);
        
        // Navigate back to conversations list if we're currently in the deleted conversation
        const currentPath = window.location.pathname;
        if (currentPath.includes(`/conversation/${selectedConversation.id}`)) {
          navigate('/conversations');
        }
      } else {
        toast.error(result.message || 'Failed to delete conversation');
      }
    } catch (error) {
      console.error('Error deleting conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };
  
  // Handle delete for all participants
  const handleDeleteForAll = async () => {
    if (!selectedConversation) return;
    
    try {
      const result = await conversationService.deleteConversationForAll(selectedConversation.id);
      
      if (result.success) {
        toast.success(result.message || 'Conversation deleted for all');
        
        // Update conversation lists without refetching
        setConversations(prevConversations => 
          prevConversations.filter(conv => conv.id !== selectedConversation.id)
        );
        
        setFilteredConversations(prevFiltered => 
          prevFiltered.filter(conv => conv.id !== selectedConversation.id)
        );
        
        setDeleteDialogOpen(false);
        setSelectedConversation(null);
        
        // Navigate back to conversations list if we're currently in the deleted conversation
        const currentPath = window.location.pathname;
        if (currentPath.includes(`/conversation/${selectedConversation.id}`)) {
          navigate('/conversations');
        }
      } else {
        toast.error(result.message || 'Failed to delete conversation for all');
      }
    } catch (error) {
      console.error('Error deleting conversation for all:', error);
      toast.error('Failed to delete conversation for all');
    }
  };
  
  // Handle canceling the delete operation
  const handleCancelDelete = () => {
    setDeleteDialogOpen(false);
    setSelectedConversation(null);
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
      </div>
    );
  }

  return (
    <>
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
          
          {/* Tab navigation */}
          <div className="flex mt-4">
            <button
              onClick={() => setShowArchived(false)}
              className={`mr-4 pb-1 ${!showArchived ? 'text-cendy-primary font-medium border-b-2 border-cendy-primary' : 'text-gray-500'}`}
            >
              All Chats
            </button>
            <button
              onClick={() => setShowArchived(true)}
              className={`pb-1 ${showArchived ? 'text-cendy-primary font-medium border-b-2 border-cendy-primary' : 'text-gray-500'}`}
            >
              Archived
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {filteredConversations.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 p-4">
              <p className="text-center mb-2">
                {showArchived 
                  ? "No archived conversations" 
                  : "No conversations yet"}
              </p>
              {onNewChat && !showArchived && (
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
                const hasUnread = (conversation.unread_count || 0) > 0;
                  
                return (
                  <DropdownMenu
                    key={conversation.id}
                    open={contextMenuOpen === conversation.id}
                    onOpenChange={(open) => {
                      if (!open) setContextMenuOpen(null);
                    }}
                  >
                    <DropdownMenuTrigger asChild>
                      <div
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                          hasUnread ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => handleConversationClick(conversation)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenuOpen(conversation.id);
                        }}
                        onTouchStart={() => handleTouchStart(conversation.id)}
                        onTouchEnd={handleTouchEnd}
                        onTouchMove={handleTouchEnd}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-12 w-12 mr-3 relative">
                            <AvatarImage src={conversation.photo} />
                            <AvatarFallback>{conversation.name.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-center">
                              <h3 className={`font-medium text-gray-900 truncate ${
                                hasUnread ? 'font-bold' : ''
                              }`}>
                                {conversation.name}
                              </h3>
                              <span className="text-xs text-gray-500">
                                {conversation.last_message_timestamp && 
                                  formatDistanceToNow(conversation.last_message_timestamp, { addSuffix: true })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <p className="text-sm text-gray-500 truncate">
                                {conversation.last_message_sender_name && (
                                  <span className="font-medium">{conversation.last_message_sender_name}: </span>
                                )}
                                {conversation.last_message}
                              </p>
                              {hasUnread && (
                                <Badge variant="default" className="ml-2 bg-cendy-primary">
                                  {conversation.unread_count}
                                </Badge>
                              )}
                              {conversation.is_muted && (
                                <BellOff className="h-3 w-3 text-gray-500 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      {showArchived ? (
                        <DropdownMenuItem 
                          onClick={() => handleUnarchiveConversation(conversation.id)}
                          className="flex items-center cursor-pointer"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          <span>Unarchive</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem 
                          onClick={() => handleArchiveConversation(conversation.id)}
                          className="flex items-center cursor-pointer"
                        >
                          <Archive className="mr-2 h-4 w-4" />
                          <span>Archive</span>
                        </DropdownMenuItem>
                      )}
                      
                      <DropdownMenuItem 
                        onClick={() => handleToggleMute(conversation)}
                        className="flex items-center cursor-pointer"
                      >
                        {conversation.is_muted ? (
                          <>
                            <Bell className="mr-2 h-4 w-4" />
                            <span>Unmute</span>
                          </>
                        ) : (
                          <>
                            <BellOff className="mr-2 h-4 w-4" />
                            <span>Mute</span>
                          </>
                        )}
                      </DropdownMenuItem>
                      
                      <DropdownMenuSeparator />
                      
                      <DropdownMenuItem 
                        onClick={() => handleOpenDeleteDialog(conversation)}
                        className="flex items-center cursor-pointer text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {selectedConversation && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          conversationType={selectedConversation.type as 'private' | 'chatroom'}
          name={selectedConversation.name}
          isAdmin={isUserAdmin}
          onDeleteForMe={handleDeleteForMe}
          onDeleteForAll={handleDeleteForAll}
          onCancel={handleCancelDelete}
        />
      )}
    </>
  );
};

export default ConversationList; 