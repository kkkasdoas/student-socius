
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft, Send, Image, Smile, Paperclip } from 'lucide-react';
import { Message, User } from '@/types';
import MessageList from '@/components/MessageList';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DirectMessagePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState<User | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Find the user and their messages
  useEffect(() => {
    const loadUserAndMessages = async () => {
      if (!userId || !currentUser) return;
      
      setIsLoading(true);
      try {
        // Fetch the recipient user
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (userError) throw userError;
        if (!userData) throw new Error('User not found');
        
        // Convert to our User type
        const recipientUser: User = {
          ...userData,
          created_at: new Date(userData.created_at),
          updated_at: new Date(userData.updated_at),
        };
        
        setRecipient(recipientUser);
        
        // TODO: In a real implementation, we would fetch actual direct messages
        // For now, we'll create some placeholder messages
        const conversationId = `conv-${Math.min(currentUser.id, userId)}-${Math.max(currentUser.id, userId)}`;
        
        // Check if we have existing messages
        const { data: existingMessages, error: messagesError } = await supabase
          .from('messages') // This table would need to be created
          .select(`
            *,
            sender:sender_id(*)
          `)
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
          
        // If the table doesn't exist yet, we'll use placeholder messages
        if (messagesError || !existingMessages) {
          console.log('Using placeholder messages');
          const placeholderMessages: Message[] = [
            {
              id: `msg-${Date.now()}-1`,
              conversation_id: conversationId,
              sender_id: currentUser.id,
              content: "Hey there! How's it going?",
              created_at: new Date(Date.now() - 3600000 * 2), // 2 hours ago
              is_read: true,
              is_edited: false,
              sender: currentUser
            },
            {
              id: `msg-${Date.now()}-2`,
              conversation_id: conversationId,
              sender_id: userId,
              content: "I'm doing well, thanks for asking!",
              created_at: new Date(Date.now() - 3600000), // 1 hour ago
              is_read: true,
              is_edited: false,
              sender: recipientUser
            },
            {
              id: `msg-${Date.now()}-3`,
              conversation_id: conversationId,
              sender_id: currentUser.id,
              content: "Great to hear! What have you been up to lately?",
              created_at: new Date(Date.now() - 1800000), // 30 minutes ago
              is_read: true,
              is_edited: false,
              sender: currentUser
            }
          ];
          
          setMessages(placeholderMessages);
        } else {
          // Use real messages if they exist
          setMessages(existingMessages.map(msg => ({
            ...msg,
            created_at: new Date(msg.created_at),
          })) as Message[]);
        }
      } catch (error) {
        console.error('Error loading user or messages:', error);
        toast.error('Failed to load conversation');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserAndMessages();
    
    // TODO: Set up real-time subscription for direct messages
    // This would be implemented once the messages table is created
  }, [userId, currentUser]);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleSend = async () => {
    if (!message.trim() || !currentUser || !recipient) return;
    
    const conversationId = `conv-${Math.min(currentUser.id, userId!)}-${Math.max(currentUser.id, userId!)}`;
    
    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUser.id,
      content: message,
      created_at: new Date(),
      is_read: false,
      is_edited: false,
      sender: currentUser,
      ...(replyingTo ? { reply_to_id: replyingTo.id } : {})
    };
    
    // TODO: In a real implementation, we would send the message to the API
    // For now, we'll just add it to the local state
    setMessages([...messages, newMessage]);
    setMessage('');
    setReplyingTo(null);
    
    toast.success("Message sent");
    
    // In the future, this would be an API call:
    // const { data, error } = await supabase
    //   .from('messages')
    //   .insert({
    //     conversation_id: conversationId,
    //     sender_id: currentUser.id,
    //     content: message,
    //     ...(replyingTo ? { reply_to_id: replyingTo.id } : {})
    //   })
    //   .select()
    //   .single();
  };
  
  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
  };
  
  const cancelReply = () => {
    setReplyingTo(null);
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cendy-primary" />
        </div>
      </Layout>
    );
  }
  
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
            src={recipient.profile_picture_url || 'https://i.pravatar.cc/150?img=default'} 
            alt={recipient.display_name} 
            className="w-8 h-8 rounded-full object-cover border border-gray-200"
          />
          
          <div className="ml-2 flex-1">
            <h1 className="font-medium text-gray-800">
              {recipient.display_name}
            </h1>
            <p className="text-xs text-gray-500">
              {recipient.university || 'Unverified User'}
              {recipient.verification_status === 'verified' && (
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
                  Replying to <span className="font-medium">{replyingTo.sender?.display_name}</span>
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
