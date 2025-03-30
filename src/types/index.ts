export type User = {
  id: string;
  displayName: string;
  bio?: string;
  university?: string;
  verificationStatus: 'verified' | 'unverified';
  profilePictureUrl?: string;
  authProvider: 'google' | 'microsoft' | 'apple';
  loginEmail?: string;
  login_name?: string;
  lastLogin?: Date;
  blockStatus: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Post = {
  id: string;
  userId: string;
  title: string;
  content: string;
  university: string;
  conversationId?: string;
  imageUrl?: string;
  channelType: ChannelType;
  category?: 'Study' | 'Fun' | 'Drama' | 'Other';
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  reactions: Reaction[];
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user: User;
};

export type Reaction = {
  id: string;
  postId: string;
  userId: string;
  type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry';
  createdAt: Date;
};

export type ChannelType = 'CampusGeneral' | 'Forum' | 'CampusCommunity' | 'Community';

export type FilterOption = 'Hot' | 'New' | 'Study' | 'Fun' | 'Drama' | 'All';

export type GenderFilter = 'All' | 'Male' | 'Female' | 'L' | 'G' | 'B' | 'T';

export type ConversationType = 'private' | 'chatroom';

export type Conversation = {
  id: string;
  type: ConversationType;
  chatroomName?: string;
  photo?: string;
  postId?: string;
  lastMessageContent?: string;
  lastMessageSenderId?: string;
  lastMessageTimestamp?: Date;
  createdAt: Date;
  updatedAt: Date;
  participants?: User[];
  lastMessage?: Message;
};

export type ConversationParticipant = {
  conversationId: string;
  userId: string;
  user?: User;
};

export type Message = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isEdited: boolean;
  replyToId?: string;
  sender?: User;
};

export type UserSettings = {
  userId: string;
  muteAllNotifications: boolean;
  privateChatNotifications: boolean;
  chatroomNotifications: boolean;
  darkMode: boolean;
  language: 'english' | 'vietnamese';
  createdAt: Date;
  updatedAt: Date;
};

export type BlockedUser = {
  blockerId: string;
  blockedId: string;
};

export type MutedUser = {
  muterId: string;
  mutedId: string;
};

export type SavedPost = {
  userId: string;
  postId: string;
};

export type HiddenPost = {
  userId: string;
  postId: string;
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
