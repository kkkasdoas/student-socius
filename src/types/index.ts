
export type Post = {
  id: string;
  userId: string;
  title: string;
  content: string;
  university: string;
  conversationId?: string;
  imageUrl?: string;
  channelType: ChannelType;
  category: 'Study' | 'Fun' | 'Drama' | 'Other';
  createdAt: Date;
  updatedAt: Date;
  user: User;
  reactions: Reaction[];
};

// Add new types for the additional tables
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

export type UserDevice = {
  id: string;
  userId: string;
  deviceToken: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserReport = {
  id: string;
  reporterId: string;
  reportedId: string;
  reason: string;
  createdAt: Date;
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

export type PostReport = {
  id: string;
  reporterId: string;
  postId: string;
  reason: string;
  createdAt: Date;
};

