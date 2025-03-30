import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type MessageInputProps = {
  conversation: Conversation;
  onMessageSent?: () => void;
  replyToMessageId?: string | null;
  onCancelReply?: () => void;
};

const MessageInput: React.FC<MessageInputProps> = ({
  conversation,
  onMessageSent,
  replyToMessageId = null,
  onCancelReply
}) => {
  const { currentUser } = useAuth();
  const [messageContent, setMessageContent] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const handleSendMessage = async () => {
    if (!messageContent.trim() || !conversation || !currentUser) {
      return;
    }
    
    try {
      setIsSending(true);
      
      // Create new message in database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversation.id,
          sender_id: currentUser.id,
          content: messageContent.trim(),
          is_read: false,
          is_edited: false,
          reply_to_id: replyToMessageId || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();
        
      if (error) {
        throw error;
      }
      
      // Update last message in conversation
      await supabase
        .from('conversations')
        .update({
          last_message_content: messageContent.trim(),
          last_message_sender_id: currentUser.id,
          last_message_timestamp: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', conversation.id);
      
      // Clear input
      setMessageContent('');
      
      // Call callback if provided
      if (onMessageSent) {
        onMessageSent();
      }
      
      // Clear reply if applicable
      if (replyToMessageId && onCancelReply) {
        onCancelReply();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="border-t p-4 bg-white flex items-end gap-2">
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-500"
        aria-label="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-500 mr-2"
        aria-label="Attach image"
      >
        <ImageIcon className="h-5 w-5" />
      </Button>
      
      <div className="flex-1 relative">
        <Textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Type a message..."
          className="min-h-[40px] max-h-[120px] pr-12 py-2 resize-none"
          rows={1}
        />
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-1 bottom-1 text-gray-500"
          disabled={!messageContent.trim() || isSending}
          onClick={handleSendMessage}
          aria-label="Send message"
        >
          <Send className={`h-5 w-5 ${messageContent.trim() ? 'text-cendy-primary' : ''}`} />
        </Button>
      </div>
    </div>
  );
};

export default MessageInput; 