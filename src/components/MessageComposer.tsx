import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { conversationService } from '@/services/ConversationService';

type MessageComposerProps = {
  userId: string;
  displayName: string;
  profilePictureUrl?: string;
  existingConversationId?: string;
  onBack: () => void;
};

const MessageComposer: React.FC<MessageComposerProps> = ({
  userId,
  displayName,
  profilePictureUrl,
  existingConversationId,
  onBack
}) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Handle sending the first message
  const handleSendMessage = async () => {
    if (!message.trim() || !currentUser) return;
    
    try {
      setIsSending(true);
      
      // If we already have a conversation, navigate to it directly
      if (existingConversationId) {
        // Use the service to send a message to an existing conversation
        await conversationService.sendMessage(
          existingConversationId,
          message
        );
        
        // Navigate to the existing conversation
        navigate(`/conversation/${existingConversationId}`, {
          state: {
            otherUserName: displayName,
            otherUserProfilePicture: profilePictureUrl
          }
        });
      } else {
        // Create a new conversation and send the first message
        const newConversation = await conversationService.createOrGetPrivateConversation(currentUser.id, userId);
        
        // Send the first message in the new conversation
        await conversationService.sendMessage(
          newConversation,
          message
        );
        
        // Navigate to the new conversation
        navigate(`/conversation/${newConversation}`, {
          state: {
            otherUserName: displayName,
            otherUserProfilePicture: profilePictureUrl
          }
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setIsSending(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center p-4 border-b border-gray-200">
        <button
          onClick={onBack}
          className="p-1 mr-2"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5 text-gray-500" />
        </button>
        <div className="flex items-center">
          <Avatar className="h-8 w-8 mr-3">
            <AvatarImage src={profilePictureUrl} />
            <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <span className="font-medium">{displayName}</span>
        </div>
      </div>
      
      {/* Message composition area */}
      <div className="flex-1 bg-gray-50 p-4 flex flex-col justify-end">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-sm text-gray-500 mb-4">
            {existingConversationId 
              ? "Continue your conversation with " + displayName
              : "Start a conversation with " + displayName}
          </p>
          
          <div className="relative">
            <textarea
              className="w-full border border-gray-300 rounded-lg p-3 pr-12 resize-none focus:outline-none focus:ring-2 focus:ring-cendy-primary"
              placeholder="Type your message..."
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isSending}
            />
            
            <Button
              className="absolute bottom-3 right-3 p-2 rounded-full"
              size="icon"
              onClick={handleSendMessage}
              disabled={!message.trim() || isSending}
            >
              <Send className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageComposer; 