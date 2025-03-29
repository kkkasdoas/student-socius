
// Adapter functions to convert between database format and application format

import { User, Post, Comment, Reaction, ChatRoom, ChatRoomParticipant, ChatroomMessage } from '@/types';

// Function to transform database user to app User type
export function dbUserToAppUser(dbUser: any): User {
  if (!dbUser) return null;
  
  return {
    id: dbUser.id,
    display_name: dbUser.display_name,
    bio: dbUser.bio || null,
    university: dbUser.university || null,
    verification_status: dbUser.verification_status === 'verified' ? 'verified' : 'unverified',
    profile_picture_url: dbUser.profile_picture_url || null,
    auth_provider: dbUser.auth_provider as 'google' | 'microsoft' | 'apple',
    login_email: dbUser.login_email || null,
    login_name: dbUser.login_name || null,
    block_status: dbUser.block_status || false,
    is_deleted: dbUser.is_deleted || false,
    created_at: new Date(dbUser.created_at),
    updated_at: new Date(dbUser.updated_at)
  };
}

// Function to transform database post to app Post type
export function dbPostToAppPost(dbPost: any): Post {
  if (!dbPost) return null;
  
  return {
    id: dbPost.id,
    user_id: dbPost.user_id,
    title: dbPost.title,
    content: dbPost.content,
    university: dbPost.university || null,
    conversation_id: dbPost.conversation_id || null,
    image_url: dbPost.image_url || null,
    channel_type: dbPost.channel_type,
    category: dbPost.category || null,
    is_edited: dbPost.is_edited || false,
    created_at: new Date(dbPost.created_at),
    updated_at: new Date(dbPost.updated_at),
    user: dbPost.user ? dbUserToAppUser(dbPost.user) : null,
    reactions: (dbPost.reactions || []).map(dbReactionToAppReaction)
  };
}

// Function to transform database reaction to app Reaction type
export function dbReactionToAppReaction(dbReaction: any): Reaction {
  if (!dbReaction) return null;
  
  return {
    id: dbReaction.id,
    post_id: dbReaction.post_id,
    user_id: dbReaction.user_id,
    type: dbReaction.type as 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry',
    created_at: new Date(dbReaction.created_at)
  };
}

// Function to transform database comment to app Comment type
export function dbCommentToAppComment(dbComment: any): Comment {
  if (!dbComment) return null;
  
  return {
    id: dbComment.id,
    post_id: dbComment.post_id,
    user_id: dbComment.user_id,
    content: dbComment.content,
    created_at: new Date(dbComment.created_at),
    user: dbComment.user ? dbUserToAppUser(dbComment.user) : null
  };
}

// Function to transform database chatroom message to app ChatroomMessage type
export function dbChatroomMessageToAppChatroomMessage(dbMessage: any): ChatroomMessage {
  if (!dbMessage) return null;
  
  return {
    id: dbMessage.id,
    chatroom_id: dbMessage.chatroom_id,
    sender_id: dbMessage.sender_id,
    content: dbMessage.content,
    created_at: new Date(dbMessage.created_at),
    is_read: dbMessage.is_read || false,
    is_edited: dbMessage.is_edited || false,
    reply_to_id: dbMessage.reply_to_id || null,
    sender: dbMessage.sender ? dbUserToAppUser(dbMessage.sender) : null
  };
}

// Function to transform database chatroom to app ChatRoom type
export function dbChatroomToAppChatroom(dbChatroom: any, participants: any[] = [], messages: any[] = []): ChatRoom {
  if (!dbChatroom) return null;
  
  const appChatroom: ChatRoom = {
    id: dbChatroom.id,
    chatroom_name: dbChatroom.chatroom_name,
    chatroom_photo: dbChatroom.chatroom_photo || null,
    post_id: dbChatroom.post_id || null,
    created_at: new Date(dbChatroom.created_at),
    updated_at: new Date(dbChatroom.updated_at),
    participants: participants.map(p => p.user ? dbUserToAppUser(p.user) : null).filter(Boolean),
  };
  
  // Add these properties for compatibility with existing code
  if (messages && messages.length > 0) {
    appChatroom.messages = messages.map(dbChatroomMessageToAppChatroomMessage);
    appChatroom.lastMessage = dbChatroomMessageToAppChatroomMessage(messages[messages.length - 1]);
  }
  
  return appChatroom;
}

// Function to transform database chatroom participant to app ChatRoomParticipant type
export function dbChatroomParticipantToAppChatroomParticipant(dbParticipant: any): ChatRoomParticipant {
  if (!dbParticipant) return null;
  
  return {
    id: dbParticipant.id,
    chatroom_id: dbParticipant.chatroom_id,
    user_id: dbParticipant.user_id,
    joined_at: new Date(dbParticipant.joined_at),
    user: dbParticipant.user ? dbUserToAppUser(dbParticipant.user) : null
  };
}
