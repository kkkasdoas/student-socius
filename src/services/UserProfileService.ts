import { supabase } from "@/integrations/supabase/client";
import { User } from "@/types";
import { uploadGalleryImage, deleteGalleryImage, getUserGalleryImages, updateGalleryImageOrder } from '@/utils/storage';

export interface IUserProfileService {
  getUserProfile(userId: string): Promise<User>;
  blockUser(userId: string): Promise<{ success: boolean; message: string }>;
  unblockUser(userId: string): Promise<{ success: boolean; message: string }>;
  muteUser(userId: string, durationHours?: number): Promise<{ success: boolean; message: string }>;
  unmuteUser(userId: string): Promise<{ success: boolean; message: string }>;
  reportUser(userId: string, reason: string): Promise<{ success: boolean; message?: string; report_id?: string }>;
  getOrCreateConversation(userId: string): Promise<{ 
    success: boolean; 
    conversation_id?: string; 
    other_user_display_name?: string;
    other_user_profile_picture?: string;
    message?: string 
  }>;
  getUserGalleryImages(userId: string): Promise<{ success: boolean; images?: any[]; error?: string }>;
  uploadGalleryImage(file: File, userId: string): Promise<{ success: boolean; url?: string; error?: string }>;
  deleteGalleryImage(imageId: string, userId: string): Promise<{ success: boolean; error?: string }>;
  updateGalleryImageOrder(userId: string, imageId: string, newOrder: number): Promise<{ success: boolean; error?: string }>;
}

export interface UserProfileData {
  id: string;
  display_name: string;
  bio: string | null;
  university: string | null;
  verification_status: string | null;
  profile_picture_url: string | null;
  auth_provider: string | null;
  created_at: string;
  updated_at: string;
  post_count: number;
  reaction_count: number;
  is_blocked: boolean;
  is_muted: boolean;
  is_own_profile: boolean;
  social_links: {
    facebook?: string;
    instagram?: string;
  } | null;
}

class UserProfileService implements IUserProfileService {
  async getUserProfile(userId: string): Promise<User> {
    try {
      const { data: user, error } = await supabase
        .rpc('get_user_profile', { p_user_id: userId })
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        throw error;
      }

      if (!user) {
        throw new Error('User not found');
      }

      const userProfile = user as UserProfileData;

      return {
        id: userProfile.id,
        displayName: userProfile.display_name,
        bio: userProfile.bio,
        university: userProfile.university,
        verificationStatus: userProfile.verification_status,
        profilePictureUrl: userProfile.profile_picture_url,
        authProvider: userProfile.auth_provider,
        createdAt: new Date(userProfile.created_at),
        updatedAt: userProfile.updated_at ? new Date(userProfile.updated_at) : new Date(userProfile.created_at),
        postCount: userProfile.post_count,
        reactionCount: userProfile.reaction_count,
        isBlocked: userProfile.is_blocked,
        isMuted: userProfile.is_muted,
        isOwnProfile: userProfile.is_own_profile,
        socialLinks: userProfile.social_links || undefined
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      throw error;
    }
  }

  async blockUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .insert({
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: userId,
          created_at: new Date()
        });

      if (error) {
        console.error('Error blocking user:', error);
        if (error.code === '23505') { // Unique violation
          return { success: false, message: 'User is already blocked' };
        }
        throw error;
      }

      return { success: true, message: 'User blocked successfully' };
    } catch (error) {
      console.error('Error in blockUser:', error);
      throw error;
    }
  }

  async unblockUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .delete()
        .match({
          blocker_id: (await supabase.auth.getUser()).data.user?.id,
          blocked_id: userId
        });

      if (error) {
        console.error('Error unblocking user:', error);
        throw error;
      }

      return { success: true, message: 'User unblocked successfully' };
    } catch (error) {
      console.error('Error in unblockUser:', error);
      throw error;
    }
  }

  async muteUser(userId: string, durationHours?: number): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('muted_entities')
        .insert({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          entity_id: userId,
          entity_type: 'user',
          muted_at: new Date(),
          is_permanent: durationHours === undefined, // If no duration provided, it's permanent
          mute_duration_hours: durationHours,
          muted_until: durationHours 
            ? new Date(Date.now() + durationHours * 60 * 60 * 1000) 
            : null
        });

      if (error) {
        console.error('Error muting user:', error);
        if (error.code === '23505') { // Unique violation
          return { success: false, message: 'User is already muted' };
        }
        throw error;
      }

      const durationMessage = durationHours 
        ? (durationHours >= 24 
            ? `for ${durationHours / 24} day${durationHours > 24 ? 's' : ''}` 
            : `for ${durationHours} hour${durationHours > 1 ? 's' : ''}`)
        : 'forever';
      
      return { success: true, message: `User muted ${durationMessage}` };
    } catch (error) {
      console.error('Error in muteUser:', error);
      throw error;
    }
  }

  async unmuteUser(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .from('muted_entities')
        .delete()
        .match({
          user_id: (await supabase.auth.getUser()).data.user?.id,
          entity_id: userId,
          entity_type: 'user'
        });

      if (error) {
        console.error('Error unmuting user:', error);
        throw error;
      }

      return { success: true, message: 'User unmuted successfully' };
    } catch (error) {
      console.error('Error in unmuteUser:', error);
      throw error;
    }
  }

  async reportUser(userId: string, reason: string): Promise<{ success: boolean; message?: string; report_id?: string }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        return { success: false, message: 'You must be logged in to report a user' };
      }
      
      const { data, error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: currentUser.id,
          reported_id: userId,
          reason: reason,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error reporting user:', error);
        throw error;
      }
      
      return { success: true, report_id: data.id, message: 'Report submitted successfully' };
    } catch (error) {
      console.error('Error in reportUser:', error);
      return { success: false, message: 'Failed to submit report' };
    }
  }
  
  async getOrCreateConversation(userId: string): Promise<{ 
    success: boolean; 
    conversation_id?: string; 
    other_user_display_name?: string;
    other_user_profile_picture?: string;
    message?: string 
  }> {
    try {
      const currentUser = (await supabase.auth.getUser()).data.user;
      
      if (!currentUser) {
        return { success: false, message: 'You must be logged in to start a conversation' };
      }
      
      // Use our new function to just get user info and check for existing conversations
      // This method is no longer used with the new conversation creation flow
      const { data, error } = await supabase
        .rpc('get_user_for_messaging', { other_user_id: userId });
      
      if (error) {
        console.error('Error checking messaging status:', error);
        return { success: false, message: error.message };
      }
      
      // The function returns a single row
      const result = Array.isArray(data) ? data[0] : data;
      
      return { 
        success: true, 
        conversation_id: result.existing_conversation_id || undefined,
        other_user_display_name: result.display_name,
        other_user_profile_picture: result.profile_picture_url || undefined
      };
    } catch (error) {
      console.error('Error in getOrCreateConversation:', error);
      return { success: false, message: 'Failed to get conversation information' };
    }
  }

  async getUserGalleryImages(userId: string): Promise<{ success: boolean; images?: any[]; error?: string }> {
    try {
      return await getUserGalleryImages(userId);
    } catch (error) {
      console.error('Error in getUserGalleryImages service method:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async uploadGalleryImage(file: File, userId: string): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
      return await uploadGalleryImage(file, userId);
    } catch (error) {
      console.error('Error in uploadGalleryImage service method:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async deleteGalleryImage(imageId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await deleteGalleryImage(imageId, userId);
    } catch (error) {
      console.error('Error in deleteGalleryImage service method:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  async updateGalleryImageOrder(userId: string, imageId: string, newOrder: number): Promise<{ success: boolean; error?: string }> {
    try {
      return await updateGalleryImageOrder(userId, imageId, newOrder);
    } catch (error) {
      console.error('Error in updateGalleryImageOrder service method:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}

export const userProfileService = new UserProfileService(); 