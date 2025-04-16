export type User = {
  id: string;
  displayName: string;
  bio?: string;
  university?: string;
  verificationStatus?: string;
  profilePictureUrl?: string;
  authProvider?: string;
  loginEmail?: string;
  login_name?: string;
  lastLogin?: Date;
  blockStatus?: boolean;
  isDeleted?: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from get_user_profile function
  postCount?: number;
  reactionCount?: number;
  isBlocked?: boolean;
  isMuted?: boolean;
  isOwnProfile?: boolean;
  socialLinks?: {
    facebook?: string;
    instagram?: string;
  };
};

// Define reaction types
export type ReactionType = 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry';

// Type for reaction counts
export type ReactionCounts = {
  like: number;
  heart: number;
  laugh: number;
  wow: number;
  sad: number;
  angry: number;
  [key: string]: number; // Allow for dynamic keys
};

export type Post = {
  id: string;
  userId: string;
  title: string;
  content: string;
  university?: string;
  conversationId?: string;
  imageUrl?: string;
  channelType: string;
  category?: string;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  isOwnPost?: boolean;
  isSaved?: boolean;
  isHidden?: boolean;
  userReaction?: ReactionType | null;
  user?: User;
  reactions?: Reaction[];
  // Additional fields for aggregated reaction data
  totalReactions?: number;
  topReactions?: {
    type: ReactionType;
    count: number;
  }[];
  // New reaction counts structure from the enhanced backend
  reactionCounts?: ReactionCounts;
};

export type PostAuthor = {
  postId?: string;
  userId?: string;
  displayName?: string;
  profilePictureUrl?: string;
  university?: string;
};

export type Reaction = {
  id: string;
  postId: string;
  userId: string;
  type: string;
  createdAt: Date;
};

export type ChannelType = 'CampusGeneral' | 'Forum' | 'CampusCommunity' | 'Community';

export type FilterOption = 'Hot' | 'New' | 'Study' | 'Fun' | 'Drama' | 'All';

export type GenderFilter = 'All' | 'Male' | 'Female' | 'L' | 'G' | 'B' | 'T';

export type ConversationType = 'private' | 'chatroom';

export type ConversationParticipantRole = 'admin' | 'member';

export interface ConversationParticipant {
  conversation_id: string;
  user_id: string;
  role: ConversationParticipantRole;
  created_at: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isEdited: boolean;
  replyToId?: string;
  sender?: User;
}

export interface Conversation {
  id: string;
  type: ConversationType;
  chatroom_name?: string;
  photo?: string;
  post_id?: string;
  last_message_content?: string;
  last_message_sender_id?: string;
  last_message_timestamp?: Date;
  created_at: Date;
  updated_at: Date;
  participants?: Array<User & { role: ConversationParticipantRole }>;
  lastMessage?: Message;
}

export type UserSettings = {
  userId: string;
  muteAllNotifications: boolean;
  privateChatNotifications: boolean;
  chatroomNotifications: boolean;
  darkMode: boolean;
  language: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BlockedUser = {
  blockerId: string;
  blockedId: string;
  createdAt: Date;
};

export type MutedUser = {
  muterId: string;
  mutedId: string;
  createdAt: Date;
};

export type SavedPost = {
  userId: string;
  postId: string;
  createdAt: Date;
};

export type HiddenPost = {
  userId: string;
  postId: string;
  createdAt: Date;
};

export type UserReport = {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  createdAt: Date;
};

export type PostReport = {
  id: string;
  reporterId: string;
  postId: string;
  reason: string;
  createdAt: Date;
};

export type MessageReport = {
  id: string;
  reporterId: string;
  messageId: string;
  reason: string;
  createdAt: Date;
};

// New consolidated Report type
export type ReportType = 'chatroom' | 'message' | 'profile' | 'post';

export type ReportReason = {
  chatroom: 'spam' | 'inappropriate_content' | 'harassment' | 'scam' | 'other';
  message: 'spam' | 'harassment' | 'hate_speech' | 'misinformation' | 'other';
  profile: 'fake_account' | 'impersonation' | 'inappropriate_behavior' | 'spam' | 'other';
  post: 'spam' | 'inappropriate_content' | 'hate_speech' | 'misinformation' | 'other';
};

export type Report = {
  report_id: string;
  reporter_id: string;
  reported_entity_id: string;
  type: ReportType;
  reason: string;
  reporter_note?: string;
  message_id?: string;
  created_at: Date;
};

export type MessageReaction = {
  id: string;
  messageId: string;
  userId: string;
  reaction: string;
  createdAt: Date;
};

export type UserDevice = {
  id: string;
  userId: string;
  deviceToken: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VerifiedDomain = {
  id: number;
  domain: string;
  createdAt?: Date;
  university?: string;
};
