import { User, Post, Comment, Reaction, Message } from "@/types";

// Mock Universities
const universities = [
  { name: "TDTU University", domain: "student.tdtu.edu.vn" },
  { name: "Harvard University", domain: "harvard.edu" },
  { name: "Stanford University", domain: "stanford.edu" },
];

// Mock Users
export const mockUsers: User[] = [
  {
    id: "user-1",
    displayName: "Alex Johnson",
    login_name: "Alex Wang",
    bio: "Computer Science Major. Coffee addict.",
    university: "TDTU University",
    verificationStatus: "verified",
    profilePictureUrl: "https://i.pravatar.cc/150?img=1",
    authProvider: "google",
    loginEmail: "alex@student.tdtu.edu.vn",
    blockStatus: false,
    isDeleted: false,
    createdAt: new Date("2023-01-02"),
    updatedAt: new Date("2023-05-15"),
  },
  {
    id: "user-2",
    displayName: "Emma Williams",
    login_name: "Emma Parker",
    bio: "Psychology student. Love reading and hiking.",
    university: "TDTU University",
    verificationStatus: "verified",
    profilePictureUrl: "https://i.pravatar.cc/150?img=5",
    authProvider: "microsoft",
    loginEmail: "emma@student.tdtu.edu.vn",
    blockStatus: false,
    isDeleted: false,
    createdAt: new Date("2023-02-10"),
    updatedAt: new Date("2023-06-20"),
  },
  {
    id: "user-3",
    displayName: "Michael Brown",
    login_name: "Michael Lee",
    bio: "Business major. Basketball team captain.",
    university: "Harvard University",
    verificationStatus: "verified",
    profilePictureUrl: "https://i.pravatar.cc/150?img=3",
    authProvider: "google",
    loginEmail: "michael@harvard.edu",
    blockStatus: false,
    isDeleted: false,
    createdAt: new Date("2023-03-15"),
    updatedAt: new Date("2023-07-01"),
  },
  {
    id: "user-4",
    displayName: "Sophia Garcia",
    login_name: "Sophia Kim",
    bio: "Art history major. Amateur photographer.",
    university: "Stanford University",
    verificationStatus: "verified",
    profilePictureUrl: "https://i.pravatar.cc/150?img=6",
    authProvider: "microsoft",
    loginEmail: "sophia@stanford.edu",
    blockStatus: false,
    isDeleted: false,
    createdAt: new Date("2023-01-20"),
    updatedAt: new Date("2023-05-25"),
  },
  {
    id: "user-5",
    displayName: "James Wilson",
    login_name: "James Chen",
    bio: "Engineering student. Robotics enthusiast.",
    university: "TDTU University",
    verificationStatus: "verified",
    profilePictureUrl: "https://i.pravatar.cc/150?img=8",
    authProvider: "google",
    loginEmail: "james@student.tdtu.edu.vn",
    blockStatus: false,
    isDeleted: false,
    createdAt: new Date("2023-02-28"),
    updatedAt: new Date("2023-06-15"),
  },
  {
    id: "user-6",
    displayName: "AppleUser123",
    login_name: "John Doe",
    bio: "",
    verificationStatus: "unverified",
    profilePictureUrl: "https://i.pravatar.cc/150?img=10",
    authProvider: "apple",
    blockStatus: false,
    isDeleted: false,
    createdAt: new Date("2023-04-05"),
    updatedAt: new Date("2023-04-05"),
  },
];

// Create mock reactions
const createMockReactions = (postId: string, count: number): Reaction[] => {
  const reactionTypes: Array<'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry'> = [
    'like', 'heart', 'laugh', 'wow', 'sad', 'angry'
  ];
  
  return Array(count).fill(0).map((_, index) => ({
    id: `reaction-${postId}-${index}`,
    postId,
    userId: mockUsers[Math.floor(Math.random() * mockUsers.length)].id,
    type: reactionTypes[Math.floor(Math.random() * reactionTypes.length)],
    createdAt: new Date(Date.now() - Math.random() * 10000000)
  }));
};

// Create mock comments
const createMockComments = (postId: string, count: number): Comment[] => {
  const commentContents = [
    "Great post! Thanks for sharing.",
    "I completely agree with this.",
    "This is really helpful information.",
    "Has anyone else experienced this?",
    "I have a similar situation in my class.",
    "Can you provide more details?",
    "This changed my perspective, thank you!",
    "I'm going to try this approach.",
    "Interesting point of view.",
    "I respectfully disagree, because...",
  ];
  
  return Array(count).fill(0).map((_, index) => {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    return {
      id: `comment-${postId}-${index}`,
      postId,
      userId: user.id,
      content: commentContents[Math.floor(Math.random() * commentContents.length)],
      createdAt: new Date(Date.now() - Math.random() * 10000000),
      user
    };
  });
};

// Create mock chatroom messages
const createMockChatroomMessages = (chatroomId: string, count: number, initialPost?: Post): Message[] => {
  const messages: Message[] = [];
  
  // Add the initial post as the first message if provided
  if (initialPost) {
    messages.push({
      id: `cr-msg-${chatroomId}-post`,
      chatroomId,
      senderId: initialPost.userId,
      content: initialPost.content,
      createdAt: initialPost.createdAt,
      sender: initialPost.user
    });
  }
  
  // Add additional random messages
  const messageContents = [
    "I have the same question!",
    "I took that class last semester, it was great.",
    "Has anyone found good study materials for this?",
    "I'm also interested in this topic.",
    "Thanks for starting this discussion.",
    "Can we organize a study group?",
    "I disagree with the previous point because...",
    "This has been really helpful, thanks everyone!",
    "Does anyone know when the next session is?",
    "I found a great resource for this: check out this link..."
  ];
  
  for (let i = 0; i < count; i++) {
    const user = mockUsers[Math.floor(Math.random() * mockUsers.length)];
    messages.push({
      id: `cr-msg-${chatroomId}-${i}`,
      chatroomId,
      senderId: user.id,
      content: messageContents[Math.floor(Math.random() * messageContents.length)],
      createdAt: new Date(Date.now() - Math.random() * 10000000),
      sender: user
    });
  }
  
  // Sort by date
  return messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
};

// Mock Posts for Campus General (TDTU) with conversationId
export const mockCampusGeneralPosts: Post[] = [
  {
    id: "post-cg-1",
    userId: "user-1",
    title: "Question about Economics Class",
    content: "Has anyone taken Professor Smith's Economics class? I've heard it's challenging but rewarding.",
    university: "TDTU University",
    conversationId: "conv-3",
    channelType: "CampusGeneral",
    category: "Study",
    createdAt: new Date("2023-09-15T10:30:00"),
    updatedAt: new Date("2023-09-15T10:30:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: createMockReactions("post-cg-1", 15)
  },
  {
    id: "post-cg-2",
    userId: "user-2",
    title: "Library Renovation Completed!",
    content: "The campus library just got renovated and it looks amazing! Extra study spaces and better lighting.",
    university: "TDTU University",
    conversationId: "conv-3",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
    channelType: "CampusGeneral",
    category: "Fun",
    createdAt: new Date("2023-09-14T14:45:00"),
    updatedAt: new Date("2023-09-14T14:45:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: createMockReactions("post-cg-2", 24)
  },
  {
    id: "post-cg-3",
    userId: "user-5",
    title: "Cafeteria Drama Today",
    content: "Did anyone else see the drama in the cafeteria today? Someone spilled their entire lunch tray on the Dean!",
    university: "TDTU University",
    conversationId: "conv-3",
    channelType: "CampusGeneral",
    category: "Drama",
    createdAt: new Date("2023-09-13T12:15:00"),
    updatedAt: new Date("2023-09-13T12:15:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: createMockReactions("post-cg-3", 45)
  },
  {
    id: "post-cg-4",
    userId: "user-1",
    title: "Calculus III Study Group",
    content: "Study group for Calculus III forming. We meet twice a week at the library. DM if interested!",
    university: "TDTU University",
    conversationId: "conv-3",
    channelType: "CampusGeneral",
    category: "Study",
    createdAt: new Date("2023-09-12T16:20:00"),
    updatedAt: new Date("2023-09-12T16:20:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: createMockReactions("post-cg-4", 8)
  },
  {
    id: "post-cg-5",
    userId: "user-2",
    title: "Biology Midterm Postponed",
    content: "Just found out our midterm for Biology is postponed! Now we have an extra week to prepare.",
    university: "TDTU University",
    conversationId: "conv-3",
    channelType: "CampusGeneral",
    category: "Study",
    createdAt: new Date("2023-09-11T09:10:00"),
    updatedAt: new Date("2023-09-11T09:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: createMockReactions("post-cg-5", 32)
  }
];

// Mock Posts for Forum (All Schools) with conversationId
export const mockForumPosts: Post[] = [
  {
    id: "post-forum-1",
    userId: "user-3",
    title: "Best Study Techniques?",
    content: "What are the best study techniques that actually work for you? I'm trying to improve my focus and retention.",
    university: "All",
    conversationId: "conv-3",
    channelType: "Forum",
    category: "Study",
    createdAt: new Date("2023-09-15T11:30:00"),
    updatedAt: new Date("2023-09-15T11:30:00"),
    user: mockUsers.find(u => u.id === "user-3")!,
    reactions: createMockReactions("post-forum-1", 28)
  },
  {
    id: "post-forum-2",
    userId: "user-4",
    title: "New Coffee Shop Review",
    content: "Has anyone tried the new coffee shop that opened near campus? Their cold brew is amazing!",
    university: "All",
    conversationId: "conv-3",
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772",
    category: "Fun",
    createdAt: new Date("2023-09-14T15:45:00"),
    updatedAt: new Date("2023-09-14T15:45:00"),
    user: mockUsers.find(u => u.id === "user-4")!,
    reactions: createMockReactions("post-forum-2", 19)
  },
  {
    id: "post-forum-3",
    userId: "user-1",
    title: "Too Much Homework This Semester",
    content: "Anyone else feel like there's too much homework this semester? I'm struggling to keep up with everything.",
    university: "All",
    conversationId: "conv-3",
    channelType: "Forum",
    category: "Drama",
    createdAt: new Date("2023-09-13T13:15:00"),
    updatedAt: new Date("2023-09-13T13:15:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: createMockReactions("post-forum-3", 52)
  },
  {
    id: "post-forum-4",
    userId: "user-5",
    title: "Online Course Recommendations",
    content: "Looking for recommendations on the best online courses to supplement my studies. Any suggestions?",
    university: "All",
    conversationId: "conv-3",
    channelType: "Forum",
    category: "Study",
    createdAt: new Date("2023-09-12T17:20:00"),
    updatedAt: new Date("2023-09-12T17:20:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: createMockReactions("post-forum-4", 14)
  },
  {
    id: "post-forum-5",
    userId: "user-2",
    title: "Research Project Completed!",
    content: "Just finished my research project and it went so well! Feeling accomplished!",
    university: "All",
    conversationId: "conv-3",
    imageUrl: "https://images.unsplash.com/photo-1513135065346-a098a63a71ee",
    category: "Fun",
    createdAt: new Date("2023-09-11T10:10:00"),
    updatedAt: new Date("2023-09-11T10:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: createMockReactions("post-forum-5", 35)
  }
];

// Mock Posts for Campus Community (TDTU) - no reactions or comments
export const mockCampusCommunityPosts: Post[] = [
  {
    id: "post-cc-1",
    userId: "user-1",
    title: "CS 101 Study Partners Needed",
    content: "Looking for study partners for the upcoming CS 101 exam. Anyone interested?",
    university: "TDTU University",
    conversationName: "CS 101 Study Group",
    channelType: "CampusCommunity",
    category: "Study",
    createdAt: new Date("2023-09-15T09:30:00"),
    updatedAt: new Date("2023-09-15T09:30:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: []
  },
  {
    id: "post-cc-2",
    userId: "user-2",
    title: "Campus Clean-up Event",
    content: "Organizing a campus clean-up event this Saturday. We need volunteers! Message me if you can help.",
    university: "TDTU University",
    conversationName: "Campus Clean-up Event",
    channelType: "CampusCommunity",
    category: "Other",
    createdAt: new Date("2023-09-14T13:45:00"),
    updatedAt: new Date("2023-09-14T13:45:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: []
  },
  {
    id: "post-cc-3",
    userId: "user-5",
    title: "New Photography Club",
    content: "I'm starting a photography club. First meeting is next week. All skill levels welcome!",
    university: "TDTU University",
    conversationName: "Photography Club",
    channelType: "CampusCommunity",
    category: "Fun",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    createdAt: new Date("2023-09-13T11:15:00"),
    updatedAt: new Date("2023-09-13T11:15:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: []
  },
  {
    id: "post-cc-4",
    userId: "user-1",
    title: "Affordable Textbooks?",
    content: "Anyone know where I can find affordable textbooks? The campus bookstore prices are outrageous.",
    university: "TDTU University",
    conversationName: "Textbook Exchange",
    channelType: "CampusCommunity",
    category: "Study",
    createdAt: new Date("2023-09-12T15:20:00"),
    updatedAt: new Date("2023-09-12T15:20:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: []
  },
  {
    id: "post-cc-5",
    userId: "user-2",
    title: "Roommate for Next Semester",
    content: "I'm looking for a roommate for next semester. Clean, quiet, engineering student.",
    university: "TDTU University",
    conversationName: "Roommate Finder",
    channelType: "CampusCommunity",
    category: "Other",
    createdAt: new Date("2023-09-11T08:10:00"),
    updatedAt: new Date("2023-09-11T08:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: []
  }
];

// Mock Posts for Community (All Schools) - no reactions or comments
export const mockCommunityPosts: Post[] = [
  {
    id: "post-com-1",
    userId: "user-3",
    title: "New York Travel Tips",
    content: "Traveling to New York for a conference next month. Any recommendations on what to see?",
    university: "All",
    conversationName: "Travel Tips & Recommendations",
    channelType: "Community",
    category: "Fun",
    createdAt: new Date("2023-09-15T08:30:00"),
    updatedAt: new Date("2023-09-15T08:30:00"),
    user: mockUsers.find(u => u.id === "user-3")!,
    reactions: []
  },
  {
    id: "post-com-2",
    userId: "user-4",
    title: "Tech Internship Opportunities",
    content: "Looking for internship opportunities in tech. Anyone have connections at Google or Apple?",
    university: "All",
    conversationName: "Internship Networking",
    channelType: "Community",
    category: "Study",
    createdAt: new Date("2023-09-14T12:45:00"),
    updatedAt: new Date("2023-09-14T12:45:00"),
    user: mockUsers.find(u => u.id === "user-4")!,
    reactions: []
  },
  {
    id: "post-com-3",
    userId: "user-1",
    title: "Weekend Basketball Games",
    content: "Any basketball players looking for pickup games on weekends? We play at the rec center.",
    university: "All",
    conversationName: "Basketball Meetup",
    channelType: "Community",
    category: "Fun",
    createdAt: new Date("2023-09-13T10:15:00"),
    updatedAt: new Date("2023-09-13T10:15:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: []
  },
  {
    id: "post-com-4",
    userId: "user-5",
    title: "Sustainable Energy Research Survey",
    content: "I'm working on a research project about sustainable energy. Looking for participants for a survey.",
    university: "All",
    conversationName: "Sustainable Energy Research",
    channelType: "Community",
    category: "Study",
    createdAt: new Date("2023-09-12T14:20:00"),
    updatedAt: new Date("2023-09-12T14:20:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: []
  },
  {
    id: "post-com-5",
    userId: "user-2",
    title: "GRE Study Tips",
    content: "Has anyone taken the GRE recently? Looking for study tips and resources.",
    university: "All",
    conversationName: "GRE Prep Group",
    channelType: "Community",
    category: "Study",
    createdAt: new Date("2023-09-11T07:10:00"),
    updatedAt: new Date("2023-09-11T07:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: []
  }
];

// Mock ChatRooms with connections to posts
export const mockChatRooms: Message[] = [
  {
    id: "chatroom-1",
    postId: "post-cg-1",
    conversationName: "Economics Class Discussion",
    conversationPhoto: "https://i.pravatar.cc/150?img=1",
    participants: [
      mockUsers.find(u => u.id === "user-1")!,
      mockUsers.find(u => u.id === "user-2")!,
      mockUsers.find(u => u.id === "user-5")!
    ],
    messages: createMockChatroomMessages("chatroom-1", 5, mockCampusGeneralPosts.find(p => p.id === "post-cg-1")),
    createdAt: new Date("2023-09-14T15:30:00"),
    updatedAt: new Date("2023-09-14T15:40:00")
  },
  {
    id: "chatroom-2",
    postId: "post-forum-1",
    conversationName: "Study Techniques Discussion",
    conversationPhoto: "https://i.pravatar.cc/150?img=3",
    participants: [
      mockUsers.find(u => u.id === "user-3")!,
      mockUsers.find(u => u.id === "user-1")!,
      mockUsers.find(u => u.id === "user-4")!
    ],
    messages: createMockChatroomMessages("chatroom-2", 8, mockForumPosts.find(p => p.id === "post-forum-1")),
    createdAt: new Date("2023-09-15T10:30:00"),
    updatedAt: new Date("2023-09-15T10:40:00")
  },
  {
    id: "chatroom-3",
    postId: "post-cg-2",
    conversationName: "Campus Library Updates",
    conversationPhoto: "https://i.pravatar.cc/150?img=5",
    participants: [
      mockUsers.find(u => u.id === "user-2")!,
      mockUsers.find(u => u.id === "user-1")!,
      mockUsers.find(u => u.id === "user-5")!
    ],
    messages: createMockChatroomMessages("chatroom-3", 4, mockCampusGeneralPosts.find(p => p.id === "post-cg-2")),
    createdAt: new Date("2023-09-14T14:45:00"),
    updatedAt: new Date("2023-09-14T16:30:00")
  }
];

// Set the lastMessage property for each chatroom
mockChatRooms.forEach(room => {
  if (room.messages.length > 0) {
    room.lastMessage = room.messages[room.messages.length - 1];
  }
});

// Helper function to get posts by university
export const getPostsByUniversity = (university: string, channelType: 'CampusGeneral' | 'CampusCommunity') => {
  if (channelType === 'CampusGeneral') {
    return mockCampusGeneralPosts.filter(
      post => post.university === university
    );
  } else {
    return mockCampusCommunityPosts.filter(
      post => post.university === university
    );
  }
};

// Helper function to get domain from email
export const getDomainFromEmail = (email: string): string => {
  return email.split('@')[1];
};

// Helper function to get university from domain
export const getUniversityFromDomain = (domain: string): string | undefined => {
  const university = universities.find(u => u.domain === domain);
  return university?.name;
};

// Helper function to check if email domain is allowed
export const isAllowedDomain = (email: string): boolean => {
  const domain = getDomainFromEmail(email);
  return universities.some(u => u.domain === domain);
};

// Mock conversations
export const mockConversations = [
  {
    id: 'conv-1',
    type: 'private',
    participants: [
      mockUsers[0],
      mockUsers[1]
    ],
    lastMessageContent: 'Hey, did you finish the assignment?',
    lastMessageSenderId: mockUsers[0].id,
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 30),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: 'conv-2',
    type: 'private',
    participants: [
      mockUsers[0],
      mockUsers[2]
    ],
    lastMessageContent: 'Thanks for your help!',
    lastMessageSenderId: mockUsers[2].id,
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: 'conv-3',
    type: 'chatroom',
    conversationName: 'Economics Study Group',
    participants: [
      mockUsers[0],
      mockUsers[1],
      mockUsers[2],
      mockUsers[3]
    ],
    lastMessageContent: 'When is our next meeting?',
    lastMessageSenderId: mockUsers[3].id,
    lastMessageTimestamp: new Date(Date.now() - 1000 * 60 * 60 * 12),
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12)
  }
];
