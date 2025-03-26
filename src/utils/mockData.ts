
import { User, Post, Comment, Reaction, Message, ChatRoom } from "@/types";

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

// Mock Posts for Campus General (TDTU)
export const mockCampusGeneralPosts: Post[] = [
  {
    id: "post-cg-1",
    userId: "user-1",
    content: "Has anyone taken Professor Smith's Economics class? I've heard it's challenging but rewarding.",
    category: "Study",
    createdAt: new Date("2023-09-15T10:30:00"),
    updatedAt: new Date("2023-09-15T10:30:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: createMockReactions("post-cg-1", 15),
    comments: createMockComments("post-cg-1", 3)
  },
  {
    id: "post-cg-2",
    userId: "user-2",
    content: "The campus library just got renovated and it looks amazing! Extra study spaces and better lighting.",
    imageUrl: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f",
    category: "Fun",
    createdAt: new Date("2023-09-14T14:45:00"),
    updatedAt: new Date("2023-09-14T14:45:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: createMockReactions("post-cg-2", 24),
    comments: createMockComments("post-cg-2", 5)
  },
  {
    id: "post-cg-3",
    userId: "user-5",
    content: "Did anyone else see the drama in the cafeteria today? Someone spilled their entire lunch tray on the Dean!",
    category: "Drama",
    createdAt: new Date("2023-09-13T12:15:00"),
    updatedAt: new Date("2023-09-13T12:15:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: createMockReactions("post-cg-3", 45),
    comments: createMockComments("post-cg-3", 12)
  },
  {
    id: "post-cg-4",
    userId: "user-1",
    content: "Study group for Calculus III forming. We meet twice a week at the library. DM if interested!",
    category: "Study",
    createdAt: new Date("2023-09-12T16:20:00"),
    updatedAt: new Date("2023-09-12T16:20:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: createMockReactions("post-cg-4", 8),
    comments: createMockComments("post-cg-4", 2)
  },
  {
    id: "post-cg-5",
    userId: "user-2",
    content: "Just found out our midterm for Biology is postponed! Now we have an extra week to prepare.",
    category: "Study",
    createdAt: new Date("2023-09-11T09:10:00"),
    updatedAt: new Date("2023-09-11T09:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: createMockReactions("post-cg-5", 32),
    comments: createMockComments("post-cg-5", 7)
  }
];

// Mock Posts for Forum (All Schools)
export const mockForumPosts: Post[] = [
  {
    id: "post-forum-1",
    userId: "user-3",
    content: "What are the best study techniques that actually work for you? I'm trying to improve my focus and retention.",
    category: "Study",
    createdAt: new Date("2023-09-15T11:30:00"),
    updatedAt: new Date("2023-09-15T11:30:00"),
    user: mockUsers.find(u => u.id === "user-3")!,
    reactions: createMockReactions("post-forum-1", 28),
    comments: createMockComments("post-forum-1", 8)
  },
  {
    id: "post-forum-2",
    userId: "user-4",
    content: "Has anyone tried the new coffee shop that opened near campus? Their cold brew is amazing!",
    imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772",
    category: "Fun",
    createdAt: new Date("2023-09-14T15:45:00"),
    updatedAt: new Date("2023-09-14T15:45:00"),
    user: mockUsers.find(u => u.id === "user-4")!,
    reactions: createMockReactions("post-forum-2", 19),
    comments: createMockComments("post-forum-2", 4)
  },
  {
    id: "post-forum-3",
    userId: "user-1",
    content: "Anyone else feel like there's too much homework this semester? I'm struggling to keep up with everything.",
    category: "Drama",
    createdAt: new Date("2023-09-13T13:15:00"),
    updatedAt: new Date("2023-09-13T13:15:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: createMockReactions("post-forum-3", 52),
    comments: createMockComments("post-forum-3", 15)
  },
  {
    id: "post-forum-4",
    userId: "user-5",
    content: "Looking for recommendations on the best online courses to supplement my studies. Any suggestions?",
    category: "Study",
    createdAt: new Date("2023-09-12T17:20:00"),
    updatedAt: new Date("2023-09-12T17:20:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: createMockReactions("post-forum-4", 14),
    comments: createMockComments("post-forum-4", 6)
  },
  {
    id: "post-forum-5",
    userId: "user-2",
    content: "Just finished my research project and it went so well! Feeling accomplished!",
    imageUrl: "https://images.unsplash.com/photo-1513135065346-a098a63a71ee",
    category: "Fun",
    createdAt: new Date("2023-09-11T10:10:00"),
    updatedAt: new Date("2023-09-11T10:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: createMockReactions("post-forum-5", 35),
    comments: createMockComments("post-forum-5", 9)
  }
];

// Mock Posts for Campus Community (TDTU)
export const mockCampusCommunityPosts: Post[] = [
  {
    id: "post-cc-1",
    userId: "user-1",
    content: "Looking for study partners for the upcoming CS 101 exam. Anyone interested?",
    createdAt: new Date("2023-09-15T09:30:00"),
    updatedAt: new Date("2023-09-15T09:30:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-cc-2",
    userId: "user-2",
    content: "Organizing a campus clean-up event this Saturday. We need volunteers! Message me if you can help.",
    createdAt: new Date("2023-09-14T13:45:00"),
    updatedAt: new Date("2023-09-14T13:45:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-cc-3",
    userId: "user-5",
    content: "I'm starting a photography club. First meeting is next week. All skill levels welcome!",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    createdAt: new Date("2023-09-13T11:15:00"),
    updatedAt: new Date("2023-09-13T11:15:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-cc-4",
    userId: "user-1",
    content: "Anyone know where I can find affordable textbooks? The campus bookstore prices are outrageous.",
    createdAt: new Date("2023-09-12T15:20:00"),
    updatedAt: new Date("2023-09-12T15:20:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-cc-5",
    userId: "user-2",
    content: "I'm looking for a roommate for next semester. Clean, quiet, engineering student.",
    createdAt: new Date("2023-09-11T08:10:00"),
    updatedAt: new Date("2023-09-11T08:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: [],
    comments: []
  }
];

// Mock Posts for Community (All Schools)
export const mockCommunityPosts: Post[] = [
  {
    id: "post-com-1",
    userId: "user-3",
    content: "Traveling to New York for a conference next month. Any recommendations on what to see?",
    createdAt: new Date("2023-09-15T08:30:00"),
    updatedAt: new Date("2023-09-15T08:30:00"),
    user: mockUsers.find(u => u.id === "user-3")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-com-2",
    userId: "user-4",
    content: "Looking for internship opportunities in tech. Anyone have connections at Google or Apple?",
    createdAt: new Date("2023-09-14T12:45:00"),
    updatedAt: new Date("2023-09-14T12:45:00"),
    user: mockUsers.find(u => u.id === "user-4")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-com-3",
    userId: "user-1",
    content: "Any basketball players looking for pickup games on weekends? We play at the rec center.",
    createdAt: new Date("2023-09-13T10:15:00"),
    updatedAt: new Date("2023-09-13T10:15:00"),
    user: mockUsers.find(u => u.id === "user-1")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-com-4",
    userId: "user-5",
    content: "I'm working on a research project about sustainable energy. Looking for participants for a survey.",
    createdAt: new Date("2023-09-12T14:20:00"),
    updatedAt: new Date("2023-09-12T14:20:00"),
    user: mockUsers.find(u => u.id === "user-5")!,
    reactions: [],
    comments: []
  },
  {
    id: "post-com-5",
    userId: "user-2",
    content: "Has anyone taken the GRE recently? Looking for study tips and resources.",
    createdAt: new Date("2023-09-11T07:10:00"),
    updatedAt: new Date("2023-09-11T07:10:00"),
    user: mockUsers.find(u => u.id === "user-2")!,
    reactions: [],
    comments: []
  }
];

// Mock Messages
export const mockMessages: Message[] = [
  {
    id: "msg-1",
    senderId: "user-1",
    receiverId: "user-2",
    content: "Hey Emma, did you get the notes from today's lecture?",
    createdAt: new Date("2023-09-15T14:30:00"),
    isRead: true,
    sender: mockUsers.find(u => u.id === "user-1")!,
    receiver: mockUsers.find(u => u.id === "user-2")!
  },
  {
    id: "msg-2",
    senderId: "user-2",
    receiverId: "user-1",
    content: "Yes, I'll send them to you in a minute!",
    createdAt: new Date("2023-09-15T14:35:00"),
    isRead: true,
    sender: mockUsers.find(u => u.id === "user-2")!,
    receiver: mockUsers.find(u => u.id === "user-1")!
  },
  {
    id: "msg-3",
    senderId: "user-1",
    receiverId: "user-2",
    content: "Thanks a lot! I missed some important points.",
    createdAt: new Date("2023-09-15T14:40:00"),
    isRead: true,
    sender: mockUsers.find(u => u.id === "user-1")!,
    receiver: mockUsers.find(u => u.id === "user-2")!
  },
  {
    id: "msg-4",
    senderId: "user-2",
    receiverId: "user-1",
    content: "No problem! Are you joining the study group later?",
    createdAt: new Date("2023-09-15T14:45:00"),
    isRead: false,
    sender: mockUsers.find(u => u.id === "user-2")!,
    receiver: mockUsers.find(u => u.id === "user-1")!
  },
  {
    id: "msg-5",
    senderId: "user-3",
    receiverId: "user-1",
    content: "Hey Alex, I saw your post about the Calculus study group. Can I join?",
    createdAt: new Date("2023-09-14T09:30:00"),
    isRead: true,
    sender: mockUsers.find(u => u.id === "user-3")!,
    receiver: mockUsers.find(u => u.id === "user-1")!
  },
  {
    id: "msg-6",
    senderId: "user-1",
    receiverId: "user-3",
    content: "Absolutely! We meet at the library on Tuesdays and Thursdays at 6PM.",
    createdAt: new Date("2023-09-14T10:00:00"),
    isRead: true,
    sender: mockUsers.find(u => u.id === "user-1")!,
    receiver: mockUsers.find(u => u.id === "user-3")!
  }
];

// Mock ChatRooms
export const mockChatRooms: ChatRoom[] = [
  {
    id: "chatroom-1",
    postId: "post-cg-1",
    participants: [
      mockUsers.find(u => u.id === "user-1")!,
      mockUsers.find(u => u.id === "user-2")!,
      mockUsers.find(u => u.id === "user-5")!
    ],
    messages: [
      {
        id: "cr-msg-1",
        senderId: "user-1",
        receiverId: "chatroom-1",
        content: "Has anyone gotten their grades back for the economics midterm?",
        createdAt: new Date("2023-09-14T15:30:00"),
        isRead: true,
        sender: mockUsers.find(u => u.id === "user-1")!,
        receiver: mockUsers.find(u => u.id === "user-2")!
      },
      {
        id: "cr-msg-2",
        senderId: "user-2",
        receiverId: "chatroom-1",
        content: "Not yet, but Professor Smith said they should be posted by tomorrow.",
        createdAt: new Date("2023-09-14T15:35:00"),
        isRead: true,
        sender: mockUsers.find(u => u.id === "user-2")!,
        receiver: mockUsers.find(u => u.id === "user-1")!
      },
      {
        id: "cr-msg-3",
        senderId: "user-5",
        receiverId: "chatroom-1",
        content: "I'm so nervous! That test was really tough.",
        createdAt: new Date("2023-09-14T15:40:00"),
        isRead: true,
        sender: mockUsers.find(u => u.id === "user-5")!,
        receiver: mockUsers.find(u => u.id === "user-1")!
      }
    ],
    lastMessage: {
      id: "cr-msg-3",
      senderId: "user-5",
      receiverId: "chatroom-1",
      content: "I'm so nervous! That test was really tough.",
      createdAt: new Date("2023-09-14T15:40:00"),
      isRead: true,
      sender: mockUsers.find(u => u.id === "user-5")!,
      receiver: mockUsers.find(u => u.id === "user-1")!
    },
    createdAt: new Date("2023-09-14T15:30:00"),
    updatedAt: new Date("2023-09-14T15:40:00")
  },
  {
    id: "chatroom-2",
    postId: "post-forum-2",
    participants: [
      mockUsers.find(u => u.id === "user-4")!,
      mockUsers.find(u => u.id === "user-1")!,
      mockUsers.find(u => u.id === "user-3")!
    ],
    messages: [
      {
        id: "cr-msg-4",
        senderId: "user-1",
        receiverId: "chatroom-2",
        content: "That coffee shop looks amazing! Where exactly is it located?",
        createdAt: new Date("2023-09-15T10:30:00"),
        isRead: true,
        sender: mockUsers.find(u => u.id === "user-1")!,
        receiver: mockUsers.find(u => u.id === "user-4")!
      },
      {
        id: "cr-msg-5",
        senderId: "user-4",
        receiverId: "chatroom-2",
        content: "It's on Oak Street, just two blocks from the science building. They have student discounts on Mondays!",
        createdAt: new Date("2023-09-15T10:35:00"),
        isRead: true,
        sender: mockUsers.find(u => u.id === "user-4")!,
        receiver: mockUsers.find(u => u.id === "user-1")!
      },
      {
        id: "cr-msg-6",
        senderId: "user-3",
        receiverId: "chatroom-2",
        content: "Do they have good study spaces too? I'm always looking for new places to work.",
        createdAt: new Date("2023-09-15T10:40:00"),
        isRead: false,
        sender: mockUsers.find(u => u.id === "user-3")!,
        receiver: mockUsers.find(u => u.id === "user-4")!
      }
    ],
    lastMessage: {
      id: "cr-msg-6",
      senderId: "user-3",
      receiverId: "chatroom-2",
      content: "Do they have good study spaces too? I'm always looking for new places to work.",
      createdAt: new Date("2023-09-15T10:40:00"),
      isRead: false,
      sender: mockUsers.find(u => u.id === "user-3")!,
      receiver: mockUsers.find(u => u.id === "user-4")!
    },
    createdAt: new Date("2023-09-15T10:30:00"),
    updatedAt: new Date("2023-09-15T10:40:00")
  }
];

// Helper function to get posts by university
export const getPostsByUniversity = (university: string, channelType: 'CampusGeneral' | 'CampusCommunity') => {
  if (channelType === 'CampusGeneral') {
    return mockCampusGeneralPosts.filter(
      post => post.user.university === university
    );
  } else {
    return mockCampusCommunityPosts.filter(
      post => post.user.university === university
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
