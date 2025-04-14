import { supabase } from "@/integrations/supabase/client";
import { Conversation, ConversationParticipant, Message } from "@/types";

// User cache to avoid repeated auth calls
let cachedUserId: string | null = null;

// New interfaces to match our SQL function return types
export interface ConversationPreview {
  id: string;
  type: string;
  chatroom_name: string;
  photo: string;
  post_id: string;
  last_message_content: string;
  last_message_sender_id: string;
  last_message_timestamp: Date;
  participant_count: number;
  participants: any[]; // JSONB array from SQL function
  unread_count?: number;
}

// Interface for our simplified get_conversations function
export interface SimpleConversation {
  id: string;
  type: string;
  name: string;
  photo: string | null;
  last_message: string;
  last_message_timestamp: Date | null;
  last_message_sender_name: string;
  unread_count: number;
  is_muted: boolean;
  is_archived: boolean;
}

export interface ConversationMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_display_name: string;
  sender_profile_picture: string;
  content: string;
  created_at: Date;
  updated_at: Date;
  is_edited: boolean;
  reply_to_id?: string;
  reply_to_content?: string;
  reply_to_sender_id?: string;
  reply_to_sender_display_name?: string;
}

export interface ConversationFullDetails {
  id: string;
  type: string;
  chatroom_name: string;
  photo: string;
  post_id: string;
  post_title: string;
  post_content: string;
  created_at: Date;
  updated_at: Date;
  participants: any[]; // JSONB array from SQL function
  participant_count: number;
  current_user_role: string;
  current_user_joined_at: Date;
}

export interface IConversationService {
  // Legacy methods
  getConversation(conversationId: string): Promise<Conversation>;
  getMessages(conversationId: string, limit?: number, before?: Date): Promise<Message[]>;
  sendMessage(conversationId: string, content: string, replyToId?: string): Promise<Message>;
  deleteMessage(messageId: string): Promise<{ success: boolean; message: string }>;
  editMessage(messageId: string, content: string): Promise<{ success: boolean; message: string }>;
  getParticipants(conversationId: string): Promise<ConversationParticipant[]>;
  addParticipant(conversationId: string, userId: string): Promise<{ success: boolean; message: string }>;
  removeParticipant(conversationId: string, userId: string): Promise<{ success: boolean; message: string }>;
  isAdmin(conversationId: string): Promise<boolean>;
  leaveConversation(conversationId: string): Promise<{ success: boolean; message: string }>;
  muteConversation(conversationId: string, durationHours?: number): Promise<{ success: boolean; message: string }>;
  unmuteConversation(conversationId: string): Promise<{ success: boolean; message: string }>;
  
  // SQL function methods
  getUserConversations(userId?: string): Promise<ConversationPreview[]>;
  getConversations(userId?: string, showArchived?: boolean | null): Promise<SimpleConversation[]>;
  getConversationPreview(conversationId: string): Promise<ConversationPreview>;
  getConversationMessages(conversationId: string, limit?: number, offset?: number): Promise<ConversationMessage[]>;
  getConversationFullDetails(conversationId: string): Promise<ConversationFullDetails>;
  joinConversation(conversationId: string, role?: string): Promise<string>;
  archiveConversation(conversationId: string): Promise<{ success: boolean; message: string }>;
  unarchiveConversation(conversationId: string): Promise<{ success: boolean; message: string }>;
  deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }>;
  deleteConversationForAll(conversationId: string): Promise<{ success: boolean; message: string }>;
  
  // New method
  createOrGetPrivateConversation(initiatorUserId: string, targetUserId: string): Promise<string>;
}

// Helper to update the cached user ID
const updateCachedUserId = (userId: string) => {
  cachedUserId = userId;
};

// Helper to clear the cached user ID (for logout)
const clearCachedUserId = () => {
  cachedUserId = null;
};

class ConversationService implements IConversationService {
  // Legacy implementation that uses direct database queries
  async getConversation(conversationId: string): Promise<Conversation> {
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error) {
        console.error('Error fetching conversation:', error);
        throw error;
      }

      return {
        id: data.id,
        type: data.type,
        chatroom_name: data.chatroom_name,
        photo: data.photo,
        post_id: data.post_id,
        last_message_content: data.last_message_content,
        last_message_sender_id: data.last_message_sender_id,
        last_message_timestamp: data.last_message_timestamp ? new Date(data.last_message_timestamp) : undefined,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at)
      };
    } catch (error) {
      console.error('Error in getConversation:', error);
      throw error;
    }
  }

  // This is our new method with simplified schema
  async getConversations(userId?: string, showArchived?: boolean | null): Promise<SimpleConversation[]> {
    try {
      // Use provided userId, cached userId, or fetch if necessary
      let currentUserId = userId || cachedUserId;
      
      if (!currentUserId) {
        // Only fetch user if we don't have a cached ID
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return [];
        }
        
        currentUserId = data.session.user.id;
        // Cache the user ID for future calls
        cachedUserId = currentUserId;
      }
      
      // Call the RPC function with the appropriate parameters
      const { data, error } = await supabase.rpc('get_conversations', { 
        user_id_param: currentUserId
      });
      
      if (error) {
        return [];
      }
      
      if (!data) {
        return [];
      }
      
      // If showArchived is null, return all conversations
      // Otherwise, filter based on archive status
      let filteredData = data;
      if (showArchived !== null && showArchived !== undefined) {
        filteredData = data.filter((conv: any) => conv.is_archived === showArchived);
      }
      
      // Transform dates
      return filteredData.map((conversation: any) => ({
        id: conversation.id,
        type: conversation.type,
        name: conversation.name,
        photo: conversation.photo,
        last_message: conversation.last_message,
        last_message_timestamp: conversation.last_message_timestamp ? new Date(conversation.last_message_timestamp) : null,
        last_message_sender_name: conversation.last_message_sender_name,
        unread_count: conversation.unread_count || 0,
        is_muted: conversation.is_muted,
        is_archived: conversation.is_archived
      }));
    } catch (error) {
      return [];
    }
  }

  async getMessages(conversationId: string, limit: number = 20, before?: Date): Promise<Message[]> {
    try {
      let query = supabase
        .from('messages')
        .select('*, sender:profiles(*)')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (before) {
        query = query.lt('created_at', before.toISOString());
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        throw error;
      }

      return data.map(message => ({
        id: message.id,
        conversationId: message.conversation_id,
        senderId: message.sender_id,
        content: message.content,
        createdAt: new Date(message.created_at),
        isRead: message.is_read,
        isEdited: message.is_edited,
        replyToId: message.reply_to_id,
        sender: message.sender ? {
          id: message.sender.id,
          displayName: message.sender.display_name,
          profilePictureUrl: message.sender.profile_picture_url,
          createdAt: new Date(message.sender.created_at),
          updatedAt: new Date(message.sender.updated_at)
        } : undefined
      }));
    } catch (error) {
      console.error('Error in getMessages:', error);
      throw error;
    }
  }

  async sendMessage(conversationId: string, content: string, replyToId?: string): Promise<Message> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase.rpc('send_message', {
        conversation_id_param: conversationId,
        sender_id_param: currentUser.id,
        content_param: content,
        reply_to_id_param: replyToId || null
      });

      if (error) {
        console.error('Error sending message:', error);
        throw error;
      }

      // Return the new message ID or fetch the full message details if needed
      return {
        id: data,
        conversationId: conversationId,
        senderId: currentUser.id,
        content: content,
        createdAt: new Date(),
        isRead: false,
        isEdited: false,
        replyToId: replyToId
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async editMessage(messageId: string, content: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Call the edit_message SQL function
      const { data, error } = await supabase
        .rpc('edit_message', {
          message_id_param: messageId,
          content_param: content,
          user_id_param: currentUser.id
        });

      if (error) {
        console.error('Error editing message:', error);
        throw error;
      }

      if (!data) {
        return {
          success: false,
          message: "Failed to edit message. It may be too old to edit or you don't have permission."
        };
      }

      return {
        success: true,
        message: 'Message updated successfully'
      };
    } catch (error) {
      console.error('Error in editMessage:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  async deleteMessage(messageId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      console.log('Attempting to delete message with ID:', messageId);

      // First, fetch the message to get its conversation_id and sender_id
      const { data: messageData, error: messageError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', messageId)
        .single();

      if (messageError) {
        console.error('Error fetching message:', messageError);
        return {
          success: false,
          message: "Message not found"
        };
      }

      // Check if user is the message sender (can delete their own messages)
      const isOwner = messageData.sender_id === currentUser.id;
      
      if (!isOwner) {
        // If not the owner, check if the user is an admin in this conversation
        const { data: participantData, error: participantError } = await supabase
          .from('conversation_participants')
          .select('role')
          .eq('conversation_id', messageData.conversation_id)
          .eq('user_id', currentUser.id)
          .single();
        
        if (participantError || !participantData || participantData.role !== 'admin') {
          console.error('User does not have permission to delete this message');
          return {
            success: false,
            message: "You don't have permission to delete this message"
          };
        }
      }

      // User is either the message owner or an admin, proceed with deletion
      const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);
      
      if (deleteError) {
        console.error('Error deleting message:', deleteError);
        throw deleteError;
      }

      console.log('Message successfully deleted:', messageId);

      return {
        success: true,
        message: 'Message deleted successfully'
      };
    } catch (error) {
      console.error('Error in deleteMessage:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  async getParticipants(conversationId: string): Promise<ConversationParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('conversation_participants')
        .select('*, user:profiles(*)')
        .eq('conversation_id', conversationId);

      if (error) {
        console.error('Error fetching participants:', error);
        throw error;
      }

      return data.map(participant => ({
        conversation_id: participant.conversation_id,
        user_id: participant.user_id,
        role: participant.role,
        created_at: participant.created_at,
        user: participant.user ? {
          id: participant.user.id,
          displayName: participant.user.display_name,
          profilePictureUrl: participant.user.profile_picture_url,
          createdAt: new Date(participant.user.created_at),
          updatedAt: new Date(participant.user.updated_at)
        } : undefined
      }));
    } catch (error) {
      console.error('Error in getParticipants:', error);
      throw error;
    }
  }

  async addParticipant(conversationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Call the add_participant SQL function
      const { data, error } = await supabase
        .rpc('add_participant', {
          conversation_id_param: conversationId,
          user_id_to_add_param: userId,
          role_param: 'member',
          current_user_id_param: currentUser.id
        });

      if (error) {
        console.error('Error adding participant:', error);
        throw error;
      }

      if (!data) {
        return {
          success: false,
          message: "Failed to add participant. Either you don't have admin permissions, or the user is already a participant."
        };
      }

      return {
        success: true,
        message: 'Participant added successfully'
      };
    } catch (error) {
      console.error('Error in addParticipant:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  async removeParticipant(conversationId: string, userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Call the remove_participant SQL function
      const { data, error } = await supabase
        .rpc('remove_participant', {
          conversation_id_param: conversationId,
          user_id_to_remove_param: userId,
          current_user_id_param: currentUser.id
        });

      if (error) {
        console.error('Error removing participant:', error);
        throw error;
      }

      if (!data) {
        return {
          success: false,
          message: "Failed to remove participant. You might not have permission, or you can't remove the last admin."
        };
      }

      return {
        success: true,
        message: 'Participant removed successfully'
      };
    } catch (error) {
      console.error('Error in removeParticipant:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      };
    }
  }

  async isAdmin(conversationId: string): Promise<boolean> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        return false;
      }

      const { data, error } = await supabase
        .from('conversation_participants')
        .select('role')
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id)
        .single();

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data.role === 'admin';
    } catch (error) {
      console.error('Error in isAdmin:', error);
      return false;
    }
  }

  async leaveConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      // Check if user is an admin and if there are other admins
      const isAdmin = await this.isAdmin(conversationId);
      
      if (isAdmin) {
        const { data: adminCount, error: countError } = await supabase
          .from('conversation_participants')
          .select('id')
          .eq('conversation_id', conversationId)
          .eq('role', 'admin')
          .neq('user_id', currentUser.id);

        if (!countError && (!adminCount || adminCount.length === 0)) {
          // User is the only admin, can't leave without appointing a new admin
          const { data: members, error: membersError } = await supabase
            .from('conversation_participants')
            .select('user_id')
            .eq('conversation_id', conversationId)
            .neq('user_id', currentUser.id)
            .limit(1);

          if (membersError || !members || members.length === 0) {
            // No other members, delete the conversation
            await supabase
              .from('conversations')
              .delete()
              .eq('id', conversationId);
          } else {
            // Appoint the first member as admin
            await supabase
              .from('conversation_participants')
              .update({ role: 'admin' })
              .eq('conversation_id', conversationId)
              .eq('user_id', members[0].user_id);
          }
        }
      }

      // Remove the user from the conversation
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUser.id);

      if (error) {
        console.error('Error leaving conversation:', error);
        throw error;
      }

      return { success: true, message: 'Left conversation successfully' };
    } catch (error) {
      console.error('Error in leaveConversation:', error);
      throw error;
    }
  }

  async muteConversation(conversationId: string, durationHours?: number): Promise<{ success: boolean; message: string }> {
    try {
      // Use cached ID or fetch if necessary
      let currentUserId = cachedUserId;
      
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return { success: false, message: 'User not authenticated' };
        }
        
        currentUserId = data.session.user.id;
        cachedUserId = currentUserId;
      }

      const { error } = await supabase
        .from('muted_entities')
        .insert({
          user_id: currentUserId,
          entity_id: conversationId,
          entity_type: 'chatroom',
          muted_at: new Date(),
          is_permanent: durationHours === undefined, // If no duration provided, it's permanent
          mute_duration_hours: durationHours,
          muted_until: durationHours 
            ? new Date(Date.now() + durationHours * 60 * 60 * 1000) 
            : null
        });

      if (error) {
        if (error.code === '23505') { // Unique violation
          return { success: false, message: 'Conversation is already muted' };
        }
        return { success: false, message: error.message };
      }

      const durationMessage = durationHours 
        ? (durationHours >= 24 
            ? `for ${durationHours / 24} day${durationHours > 24 ? 's' : ''}` 
            : `for ${durationHours} hour${durationHours > 1 ? 's' : ''}`)
        : 'forever';
      
      return { success: true, message: `Chatroom muted ${durationMessage}` };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to mute conversation' 
      };
    }
  }

  async unmuteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use cached ID or fetch if necessary
      let currentUserId = cachedUserId;
      
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return { success: false, message: 'User not authenticated' };
        }
        
        currentUserId = data.session.user.id;
        cachedUserId = currentUserId;
      }

      const { error } = await supabase
        .from('muted_entities')
        .delete()
        .match({
          user_id: currentUserId,
          entity_id: conversationId,
          entity_type: 'chatroom'
        });

      if (error) {
        return { success: false, message: error.message };
      }

      return { success: true, message: 'Chatroom unmuted successfully' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to unmute conversation' 
      };
    }
  }

  // New methods that use our SQL functions
  /**
   * @deprecated Use getConversations() instead
   */
  async getUserConversations(userId?: string): Promise<ConversationPreview[]> {
    console.warn('getUserConversations is deprecated. Please use getConversations instead.');
    
    // Just forward to getConversations and convert the result format
    const conversations = await this.getConversations(userId);
    
    // Convert SimpleConversation[] to ConversationPreview[]
    return conversations.map(conv => ({
      id: conv.id,
      type: conv.type,
      chatroom_name: conv.name,
      photo: conv.photo,
      post_id: null,
      last_message_content: conv.last_message,
      last_message_sender_id: null,
      last_message_timestamp: conv.last_message_timestamp || new Date(),
      participant_count: 0,
      participants: [],
      unread_count: conv.unread_count
    }));
  }
  
  async getConversationPreview(conversationId: string): Promise<ConversationPreview> {
    try {
      const { data, error } = await supabase
        .rpc('get_conversation_preview', { conversation_id_param: conversationId });
        
      if (error) {
        console.error('Error in getConversationPreview:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        throw new Error('Conversation not found');
      }
      
      // Transform dates
      return {
        ...data[0],
        last_message_timestamp: data[0].last_message_timestamp ? new Date(data[0].last_message_timestamp) : undefined
      };
    } catch (error) {
      console.error('Error in getConversationPreview:', error);
      throw error;
    }
  }
  
  async getConversationMessages(
    conversationId: string, 
    limit: number = 20, 
    offset: number = 0
  ): Promise<ConversationMessage[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_conversation_messages', { 
          conversation_id_param: conversationId,
          limit_param: limit,
          offset_param: offset 
        });
        
      if (error) {
        console.error('Error in getConversationMessages:', error);
        throw error;
      }
      
      // Transform dates
      return data.map((message: any) => ({
        ...message,
        created_at: new Date(message.created_at),
        updated_at: new Date(message.updated_at)
      }));
    } catch (error) {
      console.error('Error in getConversationMessages:', error);
      throw error;
    }
  }
  
  async getConversationFullDetails(conversationId: string): Promise<ConversationFullDetails> {
    try {
      const { data, error } = await supabase
        .rpc('get_conversation_full_details', { conversation_id_param: conversationId });
        
      if (error) {
        console.error('Error in getConversationFullDetails:', error);
        throw error;
      }
      
      if (!data) {
        throw new Error('Conversation not found');
      }
      
      // Transform dates
      return {
        ...data,
        created_at: new Date(data.created_at),
        updated_at: new Date(data.updated_at),
        current_user_joined_at: data.current_user_joined_at ? new Date(data.current_user_joined_at) : undefined
      };
    } catch (error) {
      console.error('Error in getConversationFullDetails:', error);
      throw error;
    }
  }
  
  async joinConversation(conversationId: string, role: string = 'member'): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('join_conversation', { 
          conversation_id_param: conversationId,
          role_param: role
        });
        
      if (error) {
        console.error('Error in joinConversation:', error);
        throw error;
      }
      
      // Return the participant ID
      return data;
    } catch (error) {
      console.error('Error in joinConversation:', error);
      throw error;
    }
  }

  async archiveConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use cached ID or fetch if necessary
      let currentUserId = cachedUserId;
      
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return { success: false, message: 'User not authenticated' };
        }
        
        currentUserId = data.session.user.id;
        cachedUserId = currentUserId;
      }
      
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_archived: true })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
        
      if (error) {
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Conversation archived' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to archive conversation' 
      };
    }
  }

  async unarchiveConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use cached ID or fetch if necessary
      let currentUserId = cachedUserId;
      
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return { success: false, message: 'User not authenticated' };
        }
        
        currentUserId = data.session.user.id;
        cachedUserId = currentUserId;
      }
      
      const { error } = await supabase
        .from('conversation_participants')
        .update({ is_archived: false })
        .eq('conversation_id', conversationId)
        .eq('user_id', currentUserId);
        
      if (error) {
        return { success: false, message: error.message };
      }
      
      return { success: true, message: 'Conversation unarchived' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to unarchive conversation' 
      };
    }
  }

  async deleteConversation(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use cached ID or fetch if necessary
      let currentUserId = cachedUserId;
      
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return { success: false, message: 'User not authenticated' };
        }
        
        currentUserId = data.session.user.id;
        cachedUserId = currentUserId;
      }
      
      const { data, error } = await supabase
        .rpc('delete_conversation_for_me', { conversation_id_param: conversationId });
        
      if (error) {
        return { success: false, message: error.message };
      }
      
      const result = Array.isArray(data) ? data[0] : data;
      
      return { 
        success: result.success, 
        message: result.message || 'Conversation deleted' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete conversation' 
      };
    }
  }

  async deleteConversationForAll(conversationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Use cached ID or fetch if necessary
      let currentUserId = cachedUserId;
      
      if (!currentUserId) {
        const { data, error } = await supabase.auth.getSession();
        
        if (error || !data.session) {
          return { success: false, message: 'User not authenticated' };
        }
        
        currentUserId = data.session.user.id;
        cachedUserId = currentUserId;
      }
      
      const { data, error } = await supabase
        .rpc('delete_conversation_for_all', { conversation_id_param: conversationId });
        
      if (error) {
        return { success: false, message: error.message };
      }
      
      const result = Array.isArray(data) ? data[0] : data;
      
      return { 
        success: result.success, 
        message: result.message || 'Conversation deleted for all' 
      };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Failed to delete conversation for all' 
      };
    }
  }

  async createOrGetPrivateConversation(
    initiatorUserId: string, 
    targetUserId: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('create_or_get_private_conversation', {
          initiator_user_id: initiatorUserId,
          target_user_id: targetUserId
        });
      
      if (error) {
        console.error('Error creating/getting private conversation:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in createOrGetPrivateConversation:', error);
      throw error;
    }
  }

  // Remove the helper function declarations from inside the class, only keep the public method
  updateUserCache(userId: string | null): void {
    if (userId) {
      cachedUserId = userId;
    } else {
      cachedUserId = null;
    }
  }
}

// Export the class as default and create a singleton instance
export default ConversationService;
export const conversationService = new ConversationService(); 