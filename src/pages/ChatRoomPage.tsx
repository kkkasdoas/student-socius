
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { mockChatRooms, mockCampusGeneralPosts, mockForumPosts } from '@/utils/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, Image, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Post, ChatroomMessage } from '@/types';

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatroomMessage[]>([]);
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [relatedPost, setRelatedPost] = useState<Post | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the chat room and related post
  useEffect(() => {
    if (!roomId) return;
    
    // Try to find a chat room
    const room = mockChatRooms.find(r => r.id === roomId);
    
    if (room) {
      setChatRoom(room);
      setMessages(room.messages);
      
      // If this room is linked to a post, find it
      if (room.postId) {
        const foundPost = [...mockCampusGeneralPosts, ...mockForumPosts].find(p => p.id === room.postId);
        if (foundPost) {
          setRelatedPost(foundPost);
        }
      }
      return;
    }
    
    // If not a chat room, check if it's a post ID
    const foundPost = [...mockCampusGeneralPosts, ...mockForumPosts].find(p => p.id === roomId);
    
    if (foundPost) {
      setRelatedPost(foundPost);
      // For posts without an existing chatroom, we would create a new one here
      // In this mock version, we just show the post details
    }
  }, [roomId]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (!message.trim() || !currentUser) return;
    
    const newMessage: ChatroomMessage = {
      id: `msg-${Date.now()}`,
      chatroomId: chatRoom ? chatRoom.id : roomId!,
      senderId: currentUser.id,
      content: message,
      createdAt: new Date(),
      sender: currentUser
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
  };
  
  const getChatroomName = () => {
    if (relatedPost) {
      return relatedPost.title;
    }
    
    if (chatRoom) {
      return chatRoom.name || chatRoom.participants.map((p: any) => p.displayName).join(', ');
    }
    
    return 'Chat Room';
  };
  
  return (
    <Layout hideNav>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="p-3 border-b border-cendy-border bg-white flex items-center">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          
          <div className="flex-1">
            <h1 className="font-medium text-gray-800 truncate">
              {getChatroomName()}
            </h1>
            <p className="text-xs text-gray-500">
              {chatRoom?.participants?.length || 0} participants
            </p>
          </div>
        </div>
        
        {/* Post (if viewing a post's chat room) */}
        {relatedPost && relatedPost.channelType !== 'CampusCommunity' && relatedPost.channelType !== 'Community' && (
          <div className="p-3 border-b border-cendy-border bg-white">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <img 
                  src={relatedPost.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                  alt={relatedPost.user.displayName} 
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <div className="ml-2">
                  <div className="flex items-center">
                    <p className="text-sm font-medium text-gray-800">{relatedPost.user.displayName}</p>
                    <span className="mx-1 text-xs text-gray-500">
                      {formatDistanceToNow(new Date(relatedPost.createdAt), { addSuffix: false })}
                    </span>
                  </div>
                  <div className="flex items-center">
                    {relatedPost.category && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-600 mr-1">
                        {relatedPost.category}
                      </span>
                    )}
                    <span className="text-xs text-gray-500">{relatedPost.user.university}</span>
                  </div>
                </div>
              </div>
              <h3 className="text-sm font-semibold mb-1">{relatedPost.title}</h3>
              <p className="text-sm text-gray-800">{relatedPost.content}</p>
              {relatedPost.imageUrl && (
                <img 
                  src={relatedPost.imageUrl} 
                  alt="Post content" 
                  className="mt-2 rounded-lg max-h-40 object-cover"
                />
              )}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.length > 0 ? (
            messages.map(msg => (
              <div 
                key={msg.id}
                className={`flex ${msg.senderId === currentUser?.id ? 'justify-end' : 'justify-start'}`}
              >
                {msg.senderId !== currentUser?.id && (
                  <img 
                    src={msg.sender.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                    alt={msg.sender.displayName} 
                    className="w-8 h-8 rounded-full object-cover mr-2 self-end"
                  />
                )}
                
                <div 
                  className={`max-w-[75%] rounded-2xl p-3 ${
                    msg.senderId === currentUser?.id 
                      ? 'bg-cendy-primary text-white rounded-br-none' 
                      : 'bg-white text-gray-800 rounded-bl-none'
                  }`}
                >
                  {msg.senderId !== currentUser?.id && (
                    <p className="text-xs font-medium mb-1">
                      {msg.sender.displayName}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p 
                    className={`text-[10px] mt-1 text-right ${
                      msg.senderId === currentUser?.id ? 'text-white/70' : 'text-gray-500'
                    }`}
                  >
                    {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: false })}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-gray-500">
              <p>No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Be the first to send a message</p>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        {/* Message Input */}
        <div className="p-3 border-t border-cendy-border bg-white">
          <div className="flex items-center">
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Image className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full mx-2 focus:outline-none focus:ring-2 focus:ring-cendy-primary/30"
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button 
              className="p-2 text-cendy-primary hover:text-cendy-primary/80 transition-colors"
              onClick={handleSend}
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ChatRoomPage;
