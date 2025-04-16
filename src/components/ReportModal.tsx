import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ReportType, Message, User, Post, Conversation } from "@/types";
import { reportService } from "@/services/ReportService";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

// Define reason options for each report type
const reasonOptions = {
  chatroom: [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'scam', label: 'Scam' },
    { value: 'other', label: 'Other' }
  ],
  message: [
    { value: 'spam', label: 'Spam' },
    { value: 'harassment', label: 'Harassment' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'other', label: 'Other' }
  ],
  profile: [
    { value: 'fake_account', label: 'Fake Account' },
    { value: 'impersonation', label: 'Impersonation' },
    { value: 'inappropriate_behavior', label: 'Inappropriate Behavior' },
    { value: 'spam', label: 'Spam' },
    { value: 'other', label: 'Other' }
  ],
  post: [
    { value: 'spam', label: 'Spam' },
    { value: 'inappropriate_content', label: 'Inappropriate Content' },
    { value: 'hate_speech', label: 'Hate Speech' },
    { value: 'misinformation', label: 'Misinformation' },
    { value: 'other', label: 'Other' }
  ]
};

// Type for message preview (for chatroom reports)
type MessagePreview = {
  id: string;
  content: string;
  sender_name: string;
  created_at: string;
};

interface ReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: ReportType;
  entityId: string;
  entity?: Conversation | Message | User | Post;
  onSuccess?: () => void;
}

const ReportModal: React.FC<ReportModalProps> = ({
  open,
  onOpenChange,
  type,
  entityId,
  entity,
  onSuccess
}) => {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [recentMessages, setRecentMessages] = useState<MessagePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch recent messages for chatroom reports
  useEffect(() => {
    const fetchRecentMessages = async () => {
      if (type === 'chatroom' && open) {
        try {
          const { data, error } = await supabase
            .from('messages')
            .select(`
              id,
              content,
              created_at,
              sender_id
            `)
            .eq('conversation_id', entityId)
            .order('created_at', { ascending: false })
            .limit(10);

          if (error) throw error;

          // Simplified approach to avoid type issues
          const formattedMessages = data.map(msg => ({
            id: msg.id,
            content: msg.content,
            sender_name: 'User', // Simplified approach
            created_at: msg.created_at
          }));

          setRecentMessages(formattedMessages);
        } catch (error) {
          console.error('Error fetching recent messages:', error);
          toast.error('Failed to load recent messages');
        }
      }
    };

    fetchRecentMessages();
  }, [type, entityId, open]);

  const handleSubmit = async () => {
    if (!reason) {
      toast.error('Please select a reason for the report');
      return;
    }

    if (!currentUser) {
      toast.error('You must be logged in to submit a report');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await reportService.submitReport(
        entityId,
        type,
        reason,
        note.trim() || undefined,
        type === 'chatroom' && selectedMessageId && selectedMessageId !== 'none' ? selectedMessageId : undefined,
        currentUser.id
      );

      if (result.success) {
        toast.success('Report submitted successfully');
        setReason("");
        setNote("");
        setSelectedMessageId(null);
        if (onSuccess) onSuccess();
        onOpenChange(false);
      } else {
        toast.error(result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render title based on type
  const renderTitle = () => {
    switch (type) {
      case 'chatroom':
        return `Report Chatroom${entity ? `: ${(entity as Conversation).chatroom_name}` : ''}`;
      case 'message':
        return 'Report Message';
      case 'profile':
        return `Report Profile${entity ? `: ${(entity as User).displayName}` : ''}`;
      case 'post':
        return 'Report Post';
      default:
        return 'Submit Report';
    }
  };

  // Render content preview based on type
  const renderContentPreview = () => {
    if (!entity) return null;

    switch (type) {
      case 'message':
        const message = entity as Message;
        return (
          <div className="p-3 bg-gray-50 rounded-md text-sm mb-4 max-h-32 overflow-y-auto">
            <p className="text-gray-800 break-words">{message.content}</p>
          </div>
        );
      case 'post':
        const post = entity as Post;
        return (
          <div className="p-3 bg-gray-50 rounded-md text-sm mb-4 max-h-32 overflow-y-auto">
            <p className="font-semibold">{post.title}</p>
            <p className="text-gray-800 break-words">{post.content}</p>
            {post.imageUrl && <div className="mt-2 text-xs text-gray-500">[Post contains an image]</div>}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{renderTitle()}</DialogTitle>
          <DialogDescription>
            Tell us why you're reporting this {type}. Your report will be kept anonymous.
          </DialogDescription>
        </DialogHeader>

        {renderContentPreview()}

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason
            </label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {reasonOptions[type].map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {type === 'chatroom' && (
            <div className="space-y-2">
              <label htmlFor="message" className="text-sm font-medium">
                Specific Message (Optional)
              </label>
              <Select value={selectedMessageId || ''} onValueChange={setSelectedMessageId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a message (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {recentMessages.map((msg) => (
                    <SelectItem key={msg.id} value={msg.id}>
                      {msg.content.substring(0, 30)}
                      {msg.content.length > 30 ? '...' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                You can select a specific message that shows the issue
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label htmlFor="note" className="text-sm font-medium">
              Additional Notes (Optional)
            </label>
            <Textarea
              id="note"
              placeholder="Provide any additional context..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal; 