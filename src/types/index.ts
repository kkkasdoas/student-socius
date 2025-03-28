
export type User = {
  id: string;
  displayName: string;
  login_name?: string;
  bio?: string;
  university?: string;
  verificationStatus: 'verified' | 'unverified';
  profilePictureUrl?: string;
  authProvider: 'google' | 'microsoft' | 'apple';
  loginEmail?: string;
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
  university?: string;
  imageUrl?: string;
  channelType: ChannelType;
  category?: 'Study' | 'Fun' | 'Drama' | 'Other';
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: User;
  reactions?: Reaction[];
};

export type Comment = {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  user?: User;
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

export type ChatRoom = {
  id: string;
  postId?: string;
  chatroomName: string;
  chatroomPhoto?: string;
  participants?: User[];
  messages?: ChatroomMessage[];
  lastMessage?: ChatroomMessage;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatroomMessage = {
  id: string;
  chatroomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  isRead?: boolean;
  isEdited?: boolean;
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

export type UserDevice = {
  id: string;
  userId: string;
  deviceToken: string;
  createdAt: Date;
  updatedAt: Date;
};
