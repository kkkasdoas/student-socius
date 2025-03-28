
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { mockUsers } from '@/utils/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, Image, Smile, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Message } from '@/types';
import MessageList from '@/components/MessageList';

const DirectMessagePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the user and their messages
  useEffect(() => {
    if (!userId || !currentUser) return;
    
    // Find the user
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setRecipient(user);
    }
    
    // Create some mock messages for demo purposes
    const mockMessages: Message[] = [
      {
        id: `msg-${Date.now()}-1`,
        conversationId: `conv-${currentUser.id}-${userId}`,
        senderId: currentUser.id,
        content: "Hey there! How's it going?",
        createdAt: new Date(Date.now() - 3600000 * 2), // 2 hours ago
        isRead: true,
        isEdited: false,
        sender: currentUser
      },
      {
        id: `msg-${Date.now()}-2`,
        conversationId: `conv-${currentUser.id}-${userId}`,
        senderId: userId,
        content: "I'm doing well, thanks for asking!",
        createdAt: new Date(Date.now() - 3600000), // 1 hour ago
        isRead: true,
        isEdited: false,
        sender: user
      },
      {
        id: `msg-${Date.now()}-3`,
        conversationId: `conv-${currentUser.id}-${userId}`,
        senderId: currentUser.id,
        content: "Great to hear! What have you been up to lately?",
        createdAt: new Date(Date.now() - 1800000), // 30 minutes ago
        isRead: true,
        isEdited: false,
        sender: currentUser
      }
    ];
    
    setMessages(mockMessages);
  }, [userId, currentUser]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (!message.trim() || !currentUser || !recipient) return;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversationId: `conv-${currentUser.id}-${recipient.id}`,
      senderId: currentUser.id,
      content: message,
      createdAt: new Date(),
      isRead: false,
      isEdited: false,
      sender: currentUser,
      ...(replyingTo ? { replyToId: replyingTo.id } : {})
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
    setReplyingTo(null);
  };
  
  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  if (!recipient) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <p className="text-gray-500">User not found</p>
          <button 
            className="mt-4 text-cendy-primary"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </Layout>
    );
  }
  
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
          
          <img 
            src={recipient.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
            alt={recipient.displayName} 
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
          
          <div className="ml-2 flex-1">
            <h1 className="font-medium text-gray-800">
              {recipient.displayName}
            </h1>
            <p className="text-xs text-gray-500">
              {recipient.university || 'Unverified User'}
              {recipient.verificationStatus === 'verified' && (
                <span className="ml-1 text-xs inline-flex items-center text-cendy-primary">
                  • Verified <span className="ml-0.5">✓</span>
                </span>
              )}
            </p>
          </div>
        </div>
        
        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          <MessageList messages={messages} onReply={handleReply} />
          <div ref={messagesEndRef} />
        </div>
        
        {/* Reply Preview */}
        {replyingTo && (
          <div className="bg-gray-50 border-t border-gray-200 p-2 flex items-start">
            <div className="flex-1 ml-2">
              <div className="flex justify-between">
                <p className="text-xs text-gray-500">
                  Replying to <span className="font-medium">{replyingTo.sender?.displayName}</span>
                </p>
                <button 
                  className="p-0 h-auto text-gray-400 hover:text-gray-600 text-xs"
                  onClick={cancelReply}
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 truncate">{replyingTo.content}</p>
            </div>
          </div>
        )}
        
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

export default DirectMessagePage;
