
// This file now contains utility functions instead of mock data

import { User, Post, Comment, Reaction } from "@/types";
import { supabase } from "@/integrations/supabase/client";

// Helper function to format data from Supabase
export const formatUser = (userData: any): User => {
  return {
    id: userData.id,
    displayName: userData.display_name,
    login_name: userData.login_name,
    bio: userData.bio,
    university: userData.university,
    verificationStatus: userData.verification_status,
    profilePictureUrl: userData.profile_picture_url,
    authProvider: userData.auth_provider,
    loginEmail: userData.login_email,
    blockStatus: userData.block_status,
    isDeleted: userData.is_deleted,
    createdAt: new Date(userData.created_at),
    updatedAt: new Date(userData.updated_at),
  };
};

export const formatPost = (postData: any): Post => {
  return {
    id: postData.id,
    userId: postData.user_id,
    title: postData.title,
    content: postData.content,
    university: postData.university,
    imageUrl: postData.image_url,
    channelType: postData.channel_type,
    category: postData.category,
    isEdited: postData.is_edited,
    createdAt: new Date(postData.created_at),
    updatedAt: new Date(postData.updated_at),
    user: postData.profiles ? formatUser(postData.profiles) : undefined,
    reactions: []
  };
};

export const formatComment = (commentData: any): Comment => {
  return {
    id: commentData.id,
    postId: commentData.post_id,
    userId: commentData.user_id,
    content: commentData.content,
    createdAt: new Date(commentData.created_at),
    user: commentData.profiles ? formatUser(commentData.profiles) : undefined
  };
};

export const formatReaction = (reactionData: any): Reaction => {
  return {
    id: reactionData.id,
    postId: reactionData.post_id,
    userId: reactionData.user_id,
    type: reactionData.type,
    createdAt: new Date(reactionData.created_at)
  };
};

// Helper function to get domain from email
export const getDomainFromEmail = (email: string): string => {
  return email.split('@')[1];
};

// Helper function to get university from domain
export const getUniversityFromDomain = (domain: string): string | undefined => {
  const universities = [
    { name: "TDTU University", domain: "student.tdtu.edu.vn" },
    { name: "Harvard University", domain: "harvard.edu" },
    { name: "Stanford University", domain: "stanford.edu" },
  ];
  
  const university = universities.find(u => u.domain === domain);
  return university?.name;
};

// Helper function to check if email domain is allowed
export const isAllowedDomain = (email: string): boolean => {
  const domain = getDomainFromEmail(email);
  const universities = [
    { name: "TDTU University", domain: "student.tdtu.edu.vn" },
    { name: "Harvard University", domain: "harvard.edu" },
    { name: "Stanford University", domain: "stanford.edu" },
  ];
  
  return universities.some(u => u.domain === domain);
};

// Fetch posts from Supabase with pagination
export const fetchPosts = async (
  channelType: string,
  university?: string,
  limit: number = 10,
  page: number = 1
): Promise<Post[]> => {
  try {
    let query = supabase
      .from('posts')
      .select('*, profiles:user_id(*)')
      .eq('channel_type', channelType)
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (university && university !== 'All') {
      query = query.eq('university', university);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching posts:', error);
      return [];
    }

    return data.map(formatPost);
  } catch (error) {
    console.error('Error in fetchPosts:', error);
    return [];
  }
};

// Fetch reactions for a post
export const fetchReactions = async (postId: string): Promise<Reaction[]> => {
  try {
    const { data, error } = await supabase
      .from('reactions')
      .select('*')
      .eq('post_id', postId);

    if (error) {
      console.error('Error fetching reactions:', error);
      return [];
    }

    return data.map(formatReaction);
  } catch (error) {
    console.error('Error in fetchReactions:', error);
    return [];
  }
};

// Fetch comments for a post
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select('*, profiles:user_id(*)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching comments:', error);
      return [];
    }

    return data.map(formatComment);
  } catch (error) {
    console.error('Error in fetchComments:', error);
    return [];
  }
};
