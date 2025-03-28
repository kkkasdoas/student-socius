
export type User = {
  id: string;
  display_name: string;
  bio?: string;
  university?: string;
  verification_status: 'verified' | 'unverified';
  profile_picture_url?: string;
  auth_provider: 'google' | 'microsoft' | 'apple';
  login_email?: string;
  login_name?: string;
  block_status: boolean;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
};

export type Post = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  university?: string;
  image_url?: string;
  channel_type: ChannelType;
  category?: 'Study' | 'Fun' | 'Drama' | 'Other';
  is_edited: boolean;
  created_at: Date;
  updated_at: Date;
  user?: User;
  reactions?: Reaction[];
};

export type Comment = {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Date;
  user?: User;
};

export type Reaction = {
  id: string;
  post_id: string;
  user_id: string;
  type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry';
  created_at: Date;
};

export type ChannelType = 'CampusGeneral' | 'Forum' | 'CampusCommunity' | 'Community';

export type FilterOption = 'Hot' | 'New' | 'Study' | 'Fun' | 'Drama' | 'All';

export type GenderFilter = 'All' | 'Male' | 'Female' | 'L' | 'G' | 'B' | 'T';

export type ChatRoom = {
  id: string;
  post_id?: string;
  chatroom_name: string;
  chatroom_photo?: string;
  created_at: Date;
  updated_at: Date;
  participants?: User[];
};

export type ChatRoomParticipant = {
  id: string;
  chatroom_id: string;
  user_id: string;
  joined_at: Date;
  user?: User;
};

export type ChatroomMessage = {
  id: string;
  chatroom_id: string;
  sender_id: string;
  content: string;
  created_at: Date;
  is_read: boolean;
  is_edited: boolean;
  reply_to_id?: string;
  sender?: User;
};

export type UserSettings = {
  user_id: string;
  mute_all_notifications: boolean;
  private_chat_notifications: boolean;
  chatroom_notifications: boolean;
  dark_mode: boolean;
  language: 'english' | 'vietnamese';
  created_at: Date;
  updated_at: Date;
};

export type BlockedUser = {
  blocker_id: string;
  blocked_id: string;
  created_at: Date;
};

export type SavedPost = {
  user_id: string;
  post_id: string;
  created_at: Date;
};

export type HiddenPost = {
  user_id: string;
  post_id: string;
  created_at: Date;
};

export type UserReport = {
  id: string;
  reporter_id: string;
  reported_id: string;
  reason: string;
  created_at: Date;
};

export type PostReport = {
  id: string;
  reporter_id: string;
  post_id: string;
  reason: string;
  created_at: Date;
};

export type MessageReport = {
  id: string;
  reporter_id: string;
  message_id: string;
  reason: string;
  created_at: Date;
};

export type UserDevice = {
  id: string;
  user_id: string;
  device_token: string;
  created_at: Date;
  updated_at: Date;
};
