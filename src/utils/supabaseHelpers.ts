
import { supabase } from "@/integrations/supabase/client";
import { 
  User, Post, Comment, Reaction, ChannelType, 
  ChatRoom, ChatRoomParticipant, ChatroomMessage,
  UserSettings, BlockedUser, SavedPost, HiddenPost
} from "@/types";

// Helper function to format date fields from Supabase
export const formatDates = <T extends Record<string, any>>(obj: T): T => {
  const formatted = { ...obj };
  
  Object.keys(formatted).forEach(key => {
    if (key.includes('_at') && formatted[key]) {
      formatted[key] = new Date(formatted[key]);
    }
  });
  
  return formatted;
};

// User data fetching
export const fetchUserById = async (userId: string): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error || !data) {
    console.error('Error fetching user:', error);
    return null;
  }
  
  return {
    id: data.id,
    display_name: data.display_name,
    bio: data.bio,
    university: data.university,
    verification_status: data.verification_status as 'verified' | 'unverified',
    profile_picture_url: data.profile_picture_url,
    auth_provider: data.auth_provider as 'google' | 'microsoft' | 'apple',
    login_email: data.login_email,
    login_name: data.login_name,
    block_status: data.block_status,
    is_deleted: data.is_deleted,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
};

// Post data fetching
export const fetchPosts = async (channelType: ChannelType, university?: string): Promise<Post[]> => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:profiles!posts_user_id_fkey(*),
      reactions(*)
    `)
    .eq('channel_type', channelType)
    .order('created_at', { ascending: false });
    
  if (university && channelType !== 'Forum' && channelType !== 'Community') {
    query = query.eq('university', university);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
  
  return data.map(post => ({
    id: post.id,
    user_id: post.user_id,
    title: post.title,
    content: post.content,
    university: post.university,
    image_url: post.image_url,
    channel_type: post.channel_type as ChannelType,
    category: post.category as 'Study' | 'Fun' | 'Drama' | 'Other' | undefined,
    is_edited: post.is_edited,
    created_at: new Date(post.created_at),
    updated_at: new Date(post.updated_at),
    user: post.user ? {
      id: post.user.id,
      display_name: post.user.display_name,
      bio: post.user.bio,
      university: post.user.university,
      verification_status: post.user.verification_status,
      profile_picture_url: post.user.profile_picture_url,
      auth_provider: post.user.auth_provider,
      login_email: post.user.login_email,
      login_name: post.user.login_name,
      block_status: post.user.block_status,
      is_deleted: post.user.is_deleted,
      created_at: new Date(post.user.created_at),
      updated_at: new Date(post.user.updated_at)
    } : undefined,
    reactions: post.reactions ? post.reactions.map(reaction => ({
      id: reaction.id,
      post_id: reaction.post_id,
      user_id: reaction.user_id,
      type: reaction.type,
      created_at: new Date(reaction.created_at)
    })) : []
  }));
};

// Comment data fetching
export const fetchCommentsByPostId = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:profiles!comments_user_id_fkey(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
  
  return data.map(comment => ({
    id: comment.id,
    post_id: comment.post_id,
    user_id: comment.user_id,
    content: comment.content,
    created_at: new Date(comment.created_at),
    user: comment.user ? {
      id: comment.user.id,
      display_name: comment.user.display_name,
      bio: comment.user.bio,
      university: comment.user.university,
      verification_status: comment.user.verification_status,
      profile_picture_url: comment.user.profile_picture_url,
      auth_provider: comment.user.auth_provider,
      login_email: comment.user.login_email,
      login_name: comment.user.login_name,
      block_status: comment.user.block_status,
      is_deleted: comment.user.is_deleted,
      created_at: new Date(comment.user.created_at),
      updated_at: new Date(comment.user.updated_at)
    } : undefined
  }));
};

// Post reactions
export const addReaction = async (postId: string, userId: string, type: Reaction['type']): Promise<Reaction | null> => {
  const { data, error } = await supabase
    .from('reactions')
    .upsert({
      post_id: postId,
      user_id: userId,
      type
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error adding reaction:', error);
    return null;
  }
  
  return {
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    type: data.type,
    created_at: new Date(data.created_at)
  };
};

export const removeReaction = async (postId: string, userId: string, type: Reaction['type']): Promise<boolean> => {
  const { error } = await supabase
    .from('reactions')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId)
    .eq('type', type);
    
  if (error) {
    console.error('Error removing reaction:', error);
    return false;
  }
  
  return true;
};

// Chat rooms
export const fetchChatRooms = async (userId: string): Promise<ChatRoom[]> => {
  const { data, error } = await supabase
    .from('chat_room_participants')
    .select(`
      chatroom_id,
      chat_rooms(*)
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching chat rooms:', error);
    return [];
  }
  
  // Filter out any participants where chat_rooms is null
  const validParticipants = data.filter(participant => participant.chat_rooms);
  
  return validParticipants.map(participant => ({
    id: participant.chat_rooms.id,
    post_id: participant.chat_rooms.post_id,
    chatroom_name: participant.chat_rooms.chatroom_name,
    chatroom_photo: participant.chat_rooms.chatroom_photo,
    created_at: new Date(participant.chat_rooms.created_at),
    updated_at: new Date(participant.chat_rooms.updated_at)
  }));
};

export const fetchChatRoomParticipants = async (chatroomId: string): Promise<ChatRoomParticipant[]> => {
  const { data, error } = await supabase
    .from('chat_room_participants')
    .select(`
      *,
      user:profiles!chat_room_participants_user_id_fkey(*)
    `)
    .eq('chatroom_id', chatroomId);
    
  if (error) {
    console.error('Error fetching chat room participants:', error);
    return [];
  }
  
  return data.map(participant => ({
    id: participant.id,
    chatroom_id: participant.chatroom_id,
    user_id: participant.user_id,
    joined_at: new Date(participant.joined_at),
    user: participant.user ? {
      id: participant.user.id,
      display_name: participant.user.display_name,
      bio: participant.user.bio,
      university: participant.user.university,
      verification_status: participant.user.verification_status,
      profile_picture_url: participant.user.profile_picture_url,
      auth_provider: participant.user.auth_provider,
      login_email: participant.user.login_email,
      login_name: participant.user.login_name,
      block_status: participant.user.block_status,
      is_deleted: participant.user.is_deleted,
      created_at: new Date(participant.user.created_at),
      updated_at: new Date(participant.user.updated_at)
    } : undefined
  }));
};

export const fetchChatRoomMessages = async (chatroomId: string): Promise<ChatroomMessage[]> => {
  const { data, error } = await supabase
    .from('chatroom_messages')
    .select(`
      *,
      sender:profiles!chatroom_messages_sender_id_fkey(*)
    `)
    .eq('chatroom_id', chatroomId)
    .order('created_at', { ascending: true });
    
  if (error) {
    console.error('Error fetching chat room messages:', error);
    return [];
  }
  
  return data.map(message => ({
    id: message.id,
    chatroom_id: message.chatroom_id,
    sender_id: message.sender_id,
    content: message.content,
    created_at: new Date(message.created_at),
    is_read: message.is_read,
    is_edited: message.is_edited,
    reply_to_id: message.reply_to_id,
    sender: message.sender ? {
      id: message.sender.id,
      display_name: message.sender.display_name,
      bio: message.sender.bio,
      university: message.sender.university,
      verification_status: message.sender.verification_status,
      profile_picture_url: message.sender.profile_picture_url,
      auth_provider: message.sender.auth_provider,
      login_email: message.sender.login_email,
      login_name: message.sender.login_name,
      block_status: message.sender.block_status,
      is_deleted: message.sender.is_deleted,
      created_at: new Date(message.sender.created_at),
      updated_at: new Date(message.sender.updated_at)
    } : undefined
  }));
};

export const sendChatRoomMessage = async (chatroomId: string, senderId: string, content: string, replyToId?: string): Promise<ChatroomMessage | null> => {
  const { data, error } = await supabase
    .from('chatroom_messages')
    .insert({
      chatroom_id: chatroomId,
      sender_id: senderId,
      content,
      reply_to_id: replyToId
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error sending message:', error);
    return null;
  }
  
  return {
    id: data.id,
    chatroom_id: data.chatroom_id,
    sender_id: data.sender_id,
    content: data.content,
    created_at: new Date(data.created_at),
    is_read: data.is_read,
    is_edited: data.is_edited,
    reply_to_id: data.reply_to_id
  };
};

// User settings
export const fetchUserSettings = async (userId: string): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
  
  return {
    user_id: data.user_id,
    mute_all_notifications: data.mute_all_notifications,
    private_chat_notifications: data.private_chat_notifications,
    chatroom_notifications: data.chatroom_notifications,
    dark_mode: data.dark_mode,
    language: data.language,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
};

export const updateUserSettings = async (settings: Partial<UserSettings> & { user_id: string }): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .update(settings)
    .eq('user_id', settings.user_id)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating user settings:', error);
    return null;
  }
  
  return {
    user_id: data.user_id,
    mute_all_notifications: data.mute_all_notifications,
    private_chat_notifications: data.private_chat_notifications,
    chatroom_notifications: data.chatroom_notifications,
    dark_mode: data.dark_mode,
    language: data.language,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
};

// Blocked users
export const fetchBlockedUsers = async (userId: string): Promise<BlockedUser[]> => {
  const { data, error } = await supabase
    .from('blocked_users')
    .select(`
      *,
      blocked:profiles!blocked_users_blocked_id_fkey(*)
    `)
    .eq('blocker_id', userId);
    
  if (error) {
    console.error('Error fetching blocked users:', error);
    return [];
  }
  
  return data.map(blocked => ({
    blocker_id: blocked.blocker_id,
    blocked_id: blocked.blocked_id,
    created_at: new Date(blocked.created_at)
  }));
};

export const blockUser = async (blockerId: string, blockedId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('blocked_users')
    .insert({
      blocker_id: blockerId,
      blocked_id: blockedId
    });
    
  if (error) {
    console.error('Error blocking user:', error);
    return false;
  }
  
  return true;
};

export const unblockUser = async (blockerId: string, blockedId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('blocked_users')
    .delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
    
  if (error) {
    console.error('Error unblocking user:', error);
    return false;
  }
  
  return true;
};

// Saved posts
export const fetchSavedPosts = async (userId: string): Promise<SavedPost[]> => {
  const { data, error } = await supabase
    .from('saved_posts')
    .select(`
      *,
      post:posts!saved_posts_post_id_fkey(*)
    `)
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching saved posts:', error);
    return [];
  }
  
  return data.map(saved => ({
    user_id: saved.user_id,
    post_id: saved.post_id,
    created_at: new Date(saved.created_at)
  }));
};

export const savePost = async (userId: string, postId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_posts')
    .insert({
      user_id: userId,
      post_id: postId
    });
    
  if (error) {
    console.error('Error saving post:', error);
    return false;
  }
  
  return true;
};

export const unsavePost = async (userId: string, postId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('saved_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
    
  if (error) {
    console.error('Error unsaving post:', error);
    return false;
  }
  
  return true;
};

// Hidden posts
export const fetchHiddenPosts = async (userId: string): Promise<HiddenPost[]> => {
  const { data, error } = await supabase
    .from('hidden_posts')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching hidden posts:', error);
    return [];
  }
  
  return data.map(hidden => ({
    user_id: hidden.user_id,
    post_id: hidden.post_id,
    created_at: new Date(hidden.created_at)
  }));
};

export const hidePost = async (userId: string, postId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('hidden_posts')
    .insert({
      user_id: userId,
      post_id: postId
    });
    
  if (error) {
    console.error('Error hiding post:', error);
    return false;
  }
  
  return true;
};

export const unhidePost = async (userId: string, postId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('hidden_posts')
    .delete()
    .eq('user_id', userId)
    .eq('post_id', postId);
    
  if (error) {
    console.error('Error unhiding post:', error);
    return false;
  }
  
  return true;
};

// Create a new post
export const createPost = async (post: Omit<Post, 'id' | 'created_at' | 'updated_at' | 'is_edited'>): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: post.user_id,
      title: post.title,
      content: post.content,
      university: post.university,
      image_url: post.image_url,
      channel_type: post.channel_type,
      category: post.category
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating post:', error);
    return null;
  }
  
  return {
    id: data.id,
    user_id: data.user_id,
    title: data.title,
    content: data.content,
    university: data.university,
    image_url: data.image_url,
    channel_type: data.channel_type as ChannelType,
    category: data.category as 'Study' | 'Fun' | 'Drama' | 'Other' | undefined,
    is_edited: data.is_edited,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  };
};

// Update user profile
export const updateUserProfile = async (userId: string, profileData: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      display_name: profileData.display_name,
      bio: profileData.bio,
      university: profileData.university,
      profile_picture_url: profileData.profile_picture_url
    })
    .eq('id', userId)
    .select()
    .single();
    
  if (error) {
    console.error('Error updating profile:', error);
    return null;
  }
  
  return {
    id: data.id,
    display_name: data.display_name,
    bio: data.bio,
    university: data.university,
    verification_status: data.verification_status,
    profile_picture_url: data.profile_picture_url,
    auth_provider: data.auth_provider,
    login_email: data.login_email,
    login_name: data.login_name,
    block_status: data.block_status,
    is_deleted: data.is_deleted,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at)
  };
};

// Report a user
export const reportUser = async (reporterId: string, reportedId: string, reason: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_reports')
    .insert({
      reporter_id: reporterId,
      reported_id: reportedId,
      reason
    });
    
  if (error) {
    console.error('Error reporting user:', error);
    return false;
  }
  
  return true;
};

// Report a post
export const reportPost = async (reporterId: string, postId: string, reason: string): Promise<boolean> => {
  const { error } = await supabase
    .from('post_reports')
    .insert({
      reporter_id: reporterId,
      post_id: postId,
      reason
    });
    
  if (error) {
    console.error('Error reporting post:', error);
    return false;
  }
  
  return true;
};

// Create a comment
export const createComment = async (postId: string, userId: string, content: string): Promise<Comment | null> => {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      post_id: postId,
      user_id: userId,
      content
    })
    .select()
    .single();
    
  if (error) {
    console.error('Error creating comment:', error);
    return null;
  }
  
  return {
    id: data.id,
    post_id: data.post_id,
    user_id: data.user_id,
    content: data.content,
    created_at: new Date(data.created_at)
  };
};

// Upload an image to storage
export const uploadImage = async (file: File, bucket: string, path: string): Promise<string | null> => {
  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: true
    });
    
  if (error) {
    console.error('Error uploading image:', error);
    return null;
  }
  
  // Get public URL
  const { data: { publicUrl } } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(data.path);
    
  return publicUrl;
};
