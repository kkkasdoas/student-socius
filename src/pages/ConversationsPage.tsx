import React, { useState } from 'react';
import Layout from '@/components/Layout';
import ConversationList from '@/components/ConversationList';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { User } from '@/types';

// Define interfaces for Supabase query responses
interface ParticipantWithConversation {
  conversation_id: string;
  conversation: {
    id: string;
    type: 'private' | 'chatroom';
  };
}

const ConversationsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [creating, setCreating] = useState(false);
  
  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };
  
  const handleSearchUsers = async () => {
    if (!searchQuery.trim() || !currentUser) return;
    
    try {
      setSearching(true);
      
      // Search for users by display name
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('display_name', `%${searchQuery}%`)
        .neq('id', currentUser.id)
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setSearching(false);
    }
  };
  
  const handleUserSelect = (user: User) => {
    setSelectedUser(user);
  };
  
  const handleCreateConversation = async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      setCreating(true);
      
      // Check if a private conversation already exists between these users
      const { data: existingConversationData, error: checkError } = await supabase
        .from('conversation_participants')
        .select(`
          conversation_id,
          conversations!inner(
            id,
            type
          )
        `)
        .eq('user_id', currentUser.id);
        
      if (checkError) {
        throw checkError;
      }
      
      // Find all conversation IDs the current user participates in
      const userConversationIds = existingConversationData?.map(item => item.conversation_id) || [];
      
      if (userConversationIds.length > 0) {
        // Now find if the selected user also participates in any of these conversations
        // AND the conversation is of type 'private'
        const { data: sharedConversations, error: sharedError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            conversations!inner(
              id,
              type
            )
          `)
          .eq('user_id', selectedUser.id)
          .in('conversation_id', userConversationIds);
          
        if (sharedError) {
          throw sharedError;
        }
        
        // Find a private conversation they share
        const privateConversation = sharedConversations?.find(item => 
          item.conversations && item.conversations.type === 'private'
        );
        
        if (privateConversation) {
          // If a conversation already exists, navigate to it
          setShowNewChatDialog(false);
          navigate(`/conversation/${privateConversation.conversation_id}`);
          return;
        }
      }
      
      // If no shared private conversation exists, create a new one
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'private',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) {
        throw createError;
      }
      
      // Add both users as participants
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: newConversation.id,
            user_id: currentUser.id
          },
          {
            conversation_id: newConversation.id,
            user_id: selectedUser.id
          }
        ]);
        
      if (participantsError) {
        throw participantsError;
      }
      
      // Close dialog and navigate to the new conversation
      setShowNewChatDialog(false);
      navigate(`/conversation/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to create conversation');
    } finally {
      setCreating(false);
    }
  };
  
  return (
    <Layout>
      <div className="h-screen">
        <ConversationList onNewChat={handleNewChat} />
      </div>
      
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Conversation</DialogTitle>
            <DialogDescription>
              Search for a user to start a conversation with.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearchUsers();
                }
              }}
            />
            <Button 
              onClick={handleSearchUsers}
              disabled={!searchQuery.trim() || searching}
            >
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>
          
          <div className="mt-4 max-h-60 overflow-y-auto">
            {searchResults.length === 0 ? (
              <p className="text-center text-gray-500 py-4">
                {searchQuery.trim() ? 'No users found' : 'Search for users to start a conversation'}
              </p>
            ) : (
              <div className="divide-y">
                {searchResults.map(user => (
                  <div 
                    key={user.id}
                    className={`p-2 flex items-center hover:bg-gray-50 cursor-pointer ${
                      selectedUser?.id === user.id ? 'bg-gray-100' : ''
                    }`}
                    onClick={() => handleUserSelect(user)}
                  >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                      {user.profilePictureUrl ? (
                        <img 
                          src={user.profilePictureUrl} 
                          alt={user.displayName} 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium">
                          {user.displayName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{user.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {user.verificationStatus === 'verified' ? 'Verified Student' : 'Student'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowNewChatDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateConversation}
              disabled={!selectedUser || creating}
            >
              {creating ? 'Creating...' : 'Start Conversation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default ConversationsPage; 