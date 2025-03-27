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
  sender?: User;
};

// Legacy types - these can be removed in a real app but keeping for backward compatibility during transition
export type ChatroomMessage = {
  id: string;
  chatroomId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  sender: User;
};

export type ChatRoom = {
  id: string;
  postId?: string;
  chatroomName?: string;
  chatroomPhoto?: string;
  participants: User[];
  messages: ChatroomMessage[];
  lastMessage?: ChatroomMessage;
  createdAt: Date;
  updatedAt: Date;
};
