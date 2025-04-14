import { supabase } from "@/integrations/supabase/client";
import { Post, User, Reaction, PostReport } from "@/types";

export interface IPostService {
  getFilteredPosts(university: string, channelType: string, page: number, category?: string, sortBy?: string): Promise<Post[]>;
  toggleReaction(postId: string, reactionType: string): Promise<{ 
    action: string; 
    type: string; 
    previous_type?: string; 
    top_reactions?: {
      reactions: Array<{type: string, count: number}>, 
      total_count: number, 
      user_reaction: string | null
    },
    all_counts?: {
      counts: {[key: string]: number},
      total: number
    }
  }>;
  toggleSavedPost(postId: string): Promise<{ action: 'saved' | 'unsaved'; post_id: string }>;
  toggleHiddenPost(postId: string): Promise<{ action: 'hidden' | 'unhidden'; post_id: string }>;
  reportPost(postId: string, reason: string): Promise<{ success: boolean; message?: string; report_id?: string }>;
  deletePost(postId: string): Promise<{ success: boolean; message: string }>;
  getUserReaction(postId: string): Promise<string | null>;
  getOrCreateChatroom(postId: string): Promise<{ conversation_id: string; user_role: string }>;
  getTopReactions(postId: string, limit?: number): Promise<{
    reactions: Array<{type: string, count: number}>,
    total_count: number,
    user_reaction: string | null
  }>;
  getAllReactionCounts(postId: string): Promise<{
    counts: {[key: string]: number},
    total: number
  }>;
}

class PostService implements IPostService {
  async getFilteredPosts(
    university: string, 
    channelType: string, 
    page: number, 
    category?: string,
    sortBy: string = 'new'
  ): Promise<Post[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_posts_with_reactions_optimized', {
          university_input: university,
          channel_input: channelType,
          page_number: page,
          category_input: category || null,
          sort_by: sortBy
        });

      if (error) {
        console.error('Error fetching filtered posts:', error);
        throw error;
      }

      return data.map((post: any) => ({
        id: post.post_id,
        userId: post.user_id,
        title: post.title,
        content: post.content,
        category: post.category,
        createdAt: new Date(post.created_at),
        updatedAt: new Date(post.updated_at),
        isEdited: post.is_edited,
        imageUrl: post.image_url,
        university: university,
        channelType: channelType,
        conversationId: post.conversation_id,
        isOwnPost: post.is_own_post,
        isSaved: post.is_saved || false,
        isHidden: post.is_hidden || false,
        userReaction: post.user_reaction || null,
        user: {
          id: post.user_id,
          displayName: post.display_name,
          profilePictureUrl: post.profile_picture_url
        },
        totalReactions: post.total_reactions || 0,
        topReactions: post.top_reactions || [],
        reactionCounts: post.reaction_counts || {
          like: 0,
          heart: 0,
          laugh: 0,
          wow: 0,
          sad: 0,
          angry: 0
        }
      }));
    } catch (error) {
      console.error('Error in getFilteredPosts:', error);
      throw error;
    }
  }

  async toggleReaction(postId: string, reactionType: string): Promise<{ 
    action: string; 
    type: string; 
    previous_type?: string; 
    top_reactions?: {
      reactions: Array<{type: string, count: number}>, 
      total_count: number, 
      user_reaction: string | null
    },
    all_counts?: {
      counts: {[key: string]: number},
      total: number
    }
  }> {
    try {
      const { data, error } = await supabase
        .rpc('toggle_reaction', {
          p_post_id: postId,
          p_reaction_type: reactionType
        });

      if (error) {
        console.error('Error toggling reaction:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleReaction:', error);
      throw error;
    }
  }

  async toggleSavedPost(postId: string): Promise<{ action: 'saved' | 'unsaved'; post_id: string }> {
    try {
      const { data, error } = await supabase
        .rpc('toggle_saved_post', {
          p_post_id: postId
        });

      if (error) {
        console.error('Error toggling saved post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleSavedPost:', error);
      throw error;
    }
  }

  async toggleHiddenPost(postId: string): Promise<{ action: 'hidden' | 'unhidden'; post_id: string }> {
    try {
      const { data, error } = await supabase
        .rpc('toggle_hidden_post', {
          p_post_id: postId
        });

      if (error) {
        console.error('Error toggling hidden post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in toggleHiddenPost:', error);
      throw error;
    }
  }

  async reportPost(postId: string, reason: string): Promise<{ success: boolean; message?: string; report_id?: string }> {
    try {
      const { data, error } = await supabase
        .rpc('report_post', {
          p_post_id: postId,
          p_reason: reason
        });

      if (error) {
        console.error('Error reporting post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in reportPost:', error);
      throw error;
    }
  }

  async deletePost(postId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase
        .rpc('delete_post', {
          p_post_id: postId
        });

      if (error) {
        console.error('Error deleting post:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in deletePost:', error);
      throw error;
    }
  }

  async getUserReaction(postId: string): Promise<string | null> {
    try {
      const { data, error } = await supabase
        .rpc('get_user_reaction', {
          p_post_id: postId
        });

      if (error) {
        console.error('Error getting user reaction:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getUserReaction:', error);
      throw error;
    }
  }

  async getOrCreateChatroom(postId: string): Promise<{ conversation_id: string; user_role: string }> {
    try {
      const { data, error } = await supabase
        .rpc('get_or_create_chatroom', {
          p_post_id: postId
        });

      if (error) {
        console.error('Error getting or creating chatroom:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getOrCreateChatroom:', error);
      throw error;
    }
  }

  async getTopReactions(postId: string, limit?: number): Promise<{
    reactions: Array<{type: string, count: number}>,
    total_count: number,
    user_reaction: string | null
  }> {
    try {
      // Development warning - this call may be unnecessary for posts loaded from the feed
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'getTopReactions called for post:', postId,
          'This API call may be unnecessary if the post was loaded with get_posts_with_reactions_optimized'
        );
      }

      const { data, error } = await supabase
        .rpc('get_top_reactions', {
          p_post_id: postId,
          p_limit: limit || 6
        });

      if (error) {
        console.error('Error getting top reactions:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getTopReactions:', error);
      throw error;
    }
  }

  async getAllReactionCounts(postId: string): Promise<{
    counts: {[key: string]: number},
    total: number
  }> {
    try {
      // Development warning - this call may be unnecessary for posts loaded from the feed
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          'getAllReactionCounts called for post:', postId,
          'This API call may be unnecessary if the post was loaded with get_posts_with_reactions_optimized'
        );
      }
      
      const { data, error } = await supabase
        .rpc('get_all_reaction_counts', {
          p_post_id: postId
        });

      if (error) {
        console.error('Error getting all reaction counts:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getAllReactionCounts:', error);
      throw error;
    }
  }
}

export const postService = new PostService(); 