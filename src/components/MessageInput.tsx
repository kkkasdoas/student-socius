import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

type MessageInputProps = {
  conversation: Conversation;
  onMessageSent?: (content: string, replyToMessageId?: string | null) => void;
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
  const navigate = useNavigate();
  
  const handleSendMessage = async () => {
    if (!messageContent.trim()) {
      toast.error('Please enter a message');
      return;
    }
    
    if (!conversation) {
      toast.error('Conversation not found');
      return;
    }
    
    if (!currentUser) {
      toast.error('You must be logged in to send messages');
      return;
    }
    
    try {
      setIsSending(true);
      
      // If we have a custom handler, always use it and skip all default behavior
      if (onMessageSent) {
        // Use the custom handler and pass the message content
        const content = messageContent.trim();
        onMessageSent(content, replyToMessageId);
        setMessageContent('');
        
        // If there's a reply, clear it
        if (replyToMessageId && onCancelReply) {
          onCancelReply();
        }
        
        return;
      }
      
      // Normal conversation flow
      const { data, error } = await supabase.rpc('send_message', {
        conversation_id_param: conversation.id,
        sender_id_param: currentUser.id,
        content_param: messageContent.trim(),
        reply_to_id_param: replyToMessageId || null
      });
      
      if (error) {
        // Handle specific error cases
        if (error.message.includes('not a participant')) {
          throw new Error('You are not a participant in this conversation');
        } else if (error.message.includes('conversation not found')) {
          throw new Error('This conversation no longer exists');
        } else {
          throw error;
        }
      }
      
      // Clear input and reply state
      setMessageContent('');
      if (replyToMessageId && onCancelReply) {
        onCancelReply();
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast.error(error.message || 'Failed to send message');
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
        disabled={true} // Disable until file upload is implemented
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="text-gray-500 mr-2"
        aria-label="Attach image"
        disabled={true} // Disable until image upload is implemented
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
          disabled={isSending}
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