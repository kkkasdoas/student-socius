
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { mockUsers, mockMessages } from '@/utils/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Send, Image, Smile, Paperclip } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const DirectMessagePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [recipient, setRecipient] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the user and their messages
  useEffect(() => {
    if (!userId || !currentUser) return;
    
    // Find the user
    const user = mockUsers.find(u => u.id === userId);
    if (user) {
      setRecipient(user);
    }
    
    // Filter messages between current user and recipient
    const relevantMessages = mockMessages.filter(
      msg => (msg.senderId === currentUser.id && msg.receiverId === userId) || 
             (msg.senderId === userId && msg.receiverId === currentUser.id)
    );
    
    // Sort by date
    const sortedMessages = [...relevantMessages].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    setMessages(sortedMessages);
  }, [userId, currentUser]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = () => {
    if (!message.trim() || !currentUser || !recipient) return;
    
    const newMessage = {
      id: `msg-${Date.now()}`,
      senderId: currentUser.id,
      receiverId: recipient.id,
      content: message,
      createdAt: new Date(),
      isRead: false,
      sender: currentUser,
      receiver: recipient
    };
    
    setMessages([...messages, newMessage]);
    setMessage('');
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
              <p className="text-center">No messages yet</p>
              <p className="text-sm text-gray-400 mt-1">Send a message to start the conversation</p>
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

export default DirectMessagePage;
