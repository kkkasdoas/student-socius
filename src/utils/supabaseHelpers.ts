import { supabase } from '@/integrations/supabase/client';
import { User, Post, Comment, Reaction, ChatRoom, ChatRoomParticipant, ChatroomMessage, UserSettings } from '@/types';

// Helper function to transform snake_case keys to camelCase
export const transformSnakeToCamel = <T>(obj: any): T => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => transformSnakeToCamel<any>(item)) as unknown as T;
  }

  const transformed: any = {};
  Object.keys(obj).forEach(key => {
    const value = obj[key];
    transformed[key] = transformSnakeToCamel(value);
  });

  return transformed as T;
};

// Get current user profile
export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  } as User;
};

// Fetch posts with user and reactions data
export const fetchPosts = async (channelType: string, university?: string): Promise<Post[]> => {
  let query = supabase
    .from('posts')
    .select(`
      *,
      user:user_id(id, display_name, bio, university, verification_status, profile_picture_url, auth_provider),
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

  if (!data) return [];

  return data.map(post => ({
    ...post,
    created_at: new Date(post.created_at),
    updated_at: new Date(post.updated_at),
    reactions: post.reactions || [],
  })) as Post[];
};

// Fetch post by ID
export const fetchPostById = async (postId: string): Promise<Post | null> => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      user:user_id(id, display_name, bio, university, verification_status, profile_picture_url, auth_provider),
      reactions(*)
    `)
    .eq('id', postId)
    .single();

  if (error || !data) {
    console.error('Error fetching post by ID:', error);
    return null;
  }

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    reactions: data.reactions || [],
  } as Post;
};

// Fetch comments for a post
export const fetchComments = async (postId: string): Promise<Comment[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      user:user_id(*)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    return [];
  }

  if (!data) return [];

  return data.map(comment => ({
    ...comment,
    created_at: new Date(comment.created_at),
  })) as Comment[];
};

// Create a new reaction
export const addReaction = async (postId: string, userId: string, type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry'): Promise<Reaction | null> => {
  // First check if user already reacted to this post
  const { data: existingReaction } = await supabase
    .from('reactions')
    .select('*')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existingReaction) {
    // If the reaction type is the same, delete it (toggle off)
    if (existingReaction.type === type) {
      const { error } = await supabase
        .from('reactions')
        .delete()
        .eq('id', existingReaction.id);

      if (error) {
        console.error('Error removing reaction:', error);
      }
      return null;
    }

    // If reaction type is different, update it
    const { data, error } = await supabase
      .from('reactions')
      .update({ type })
      .eq('id', existingReaction.id)
      .select()
      .single();

    if (error || !data) {
      console.error('Error updating reaction:', error);
      return null;
    }

    return {
      ...data,
      created_at: new Date(data.created_at),
    } as Reaction;
  }

  // Otherwise create a new reaction
  const { data, error } = await supabase
    .from('reactions')
    .insert({
      post_id: postId,
      user_id: userId,
      type,
    })
    .select()
    .single();

  if (error || !data) {
    console.error('Error adding reaction:', error);
    return null;
  }

  return {
    ...data,
    created_at: new Date(data.created_at),
  } as Reaction;
};

// Fetch chatroom participants
export const fetchChatroomParticipants = async (chatroomId: string): Promise<ChatRoomParticipant[]> => {
  const { data, error } = await supabase
    .from('chat_room_participants')
    .select(`
      *,
      user:user_id(*)
    `)
    .eq('chatroom_id', chatroomId);

  if (error) {
    console.error('Error fetching chatroom participants:', error);
    return [];
  }

  if (!data) return [];

  return data.map(participant => ({
    ...participant,
    joined_at: new Date(participant.joined_at),
  })) as ChatRoomParticipant[];
};

// Fetch chatroom messages
export const fetchChatroomMessages = async (chatroomId: string): Promise<ChatroomMessage[]> => {
  const { data, error } = await supabase
    .from('chatroom_messages')
    .select(`
      *,
      sender:sender_id(*)
    `)
    .eq('chatroom_id', chatroomId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching chatroom messages:', error);
    return [];
  }

  if (!data) return [];

  return data.map(message => ({
    ...message,
    created_at: new Date(message.created_at),
  })) as ChatroomMessage[];
};

// Send a chatroom message
export const sendChatroomMessage = async (
  chatroomId: string,
  senderId: string,
  content: string,
  replyToId?: string
): Promise<ChatroomMessage | null> => {
  const { data, error } = await supabase
    .from('chatroom_messages')
    .insert({
      chatroom_id: chatroomId,
      sender_id: senderId,
      content,
      reply_to_id: replyToId,
    })
    .select(`
      *,
      sender:sender_id(*)
    `)
    .single();

  if (error || !data) {
    console.error('Error sending message:', error);
    return null;
  }

  return {
    ...data,
    created_at: new Date(data.created_at),
  } as ChatroomMessage;
};

// Fetch user settings
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

  if (!data) return null;

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    // Ensure language is one of the allowed values
    language: (data.language === 'vietnamese' ? 'vietnamese' : 'english') as 'english' | 'vietnamese',
  } as UserSettings;
};

// Update user settings
export const updateUserSettings = async (settings: Partial<UserSettings> & { user_id: string }): Promise<UserSettings | null> => {
  const { data, error } = await supabase
    .from('user_settings')
    .update({
      ...settings,
      // Ensure created_at doesn't get sent in the update
      created_at: undefined,
      updated_at: undefined,
      // Ensure language is one of the allowed values
      language: settings.language === 'vietnamese' ? 'vietnamese' : 'english',
    })
    .eq('user_id', settings.user_id)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating user settings:', error);
    return null;
  }

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
  } as UserSettings;
};

// Fetch conversations for a user
export const fetchUserConversations = async (userId: string): Promise<Conversation[]> => {
  // This is a placeholder implementation
  // In a real app, you would fetch conversations from your database
  return [];
};

// Fetch chatrooms
export const fetchChatrooms = async (): Promise<ChatRoom[]> => {
  const { data, error } = await supabase
    .from('chat_rooms')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching chatrooms:', error);
    return [];
  }

  if (!data) return [];

  const chatrooms = data.map(chatroom => ({
    ...chatroom,
    created_at: new Date(chatroom.created_at),
    updated_at: new Date(chatroom.updated_at),
    participants: [], // Initialize with empty array
  })) as ChatRoom[];

  // For each chatroom, fetch participants
  for (const chatroom of chatrooms) {
    const participants = await fetchChatroomParticipants(chatroom.id);
    chatroom.participants = participants.map(p => p.user!).filter(Boolean);
    
    // Fetch last message
    const messages = await fetchChatroomMessages(chatroom.id);
    chatroom.messages = messages;
    if (messages.length > 0) {
      chatroom.lastMessage = messages[messages.length - 1];
    }
  }

  return chatrooms;
};

// Update user profile
export const updateUserProfile = async (userId: string, updates: Partial<User>): Promise<User | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      // Ensure these values aren't updated accidentally
      id: undefined,
      auth_provider: undefined,
      created_at: undefined,
      updated_at: undefined,
    })
    .eq('id', userId)
    .select()
    .single();

  if (error || !data) {
    console.error('Error updating user profile:', error);
    return null;
  }

  return {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    // Make sure verification_status is one of the allowed values
    verification_status: data.verification_status === 'verified' ? 'verified' : 'unverified',
    // Make sure auth_provider is one of the allowed values
    auth_provider: ['google', 'microsoft', 'apple'].includes(data.auth_provider) 
      ? data.auth_provider as 'google' | 'microsoft' | 'apple'
      : 'google',
  } as User;
};
