
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { mockChatRooms, mockCampusGeneralPosts, mockForumPosts } from '@/utils/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, Image, Smile, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [post, setPost] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the chat room or post
  useEffect(() => {
    if (!roomId) return;
    
    // Try to find a chat room
    const room = mockChatRooms.find(r => r.id === roomId);
    
    if (room) {
      setMessages(room.messages);
      return;
    }
    
    // If not a chat room, check if it's a post ID
    const foundPost = [...mockCampusGeneralPosts, ...mockForumPosts].find(p => p.id === roomId);
    
    if (foundPost) {
      setPost(foundPost);
      // Convert comments to messages format for display
      const commentsAsMessages = foundPost.comments.map((comment: any) => ({
        id: comment.id,
        senderId: comment.userId,
        content: comment.content,
        createdAt: comment.createdAt,
        sender: comment.user
      }));
      setMessages(commentsAsMessages);
    }
  }, [roomId]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (!message.trim() || !currentUser) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      content: message,
      createdAt: new Date(),
      sender: currentUser
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
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
            <h1 className="font-medium text-gray-800">
              {post ? post.user.displayName : 'Chat Room'}
            </h1>
            {!post && (
              <p className="text-xs text-gray-500">
                {messages.length} messages
              </p>
            )}
          </div>
        </div>
        
        {/* Post (if viewing a post's chat room) */}
        {post && (
          <div className="p-3 border-b border-cendy-border bg-white">
            <div className="bg-gray-50 rounded-lg p-3">
              <div className="flex items-center mb-2">
                <img 
                  src={post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                  alt={post.user.displayName} 
                  className="w-8 h-8 rounded-full object-cover border border-gray-200"
                />
                <div className="ml-2">
                  <p className="text-sm font-medium text-gray-800">{post.user.displayName}</p>
                  <p className="text-xs text-gray-500">
                    {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-sm text-gray-800">{post.content}</p>
              {post.imageUrl && (
                <img 
                  src={post.imageUrl} 
                  alt="Post content" 
                  className="mt-2 rounded-lg max-h-40 object-cover"
                />
              )}
            </div>
          </div>
        )}
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map(msg => (
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
          ))}
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
