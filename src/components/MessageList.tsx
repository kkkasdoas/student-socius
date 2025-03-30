import React, { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, Message, User, MessageReaction } from '@/types';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Copy, Edit, Reply, Trash, Flag } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInHours } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

type MessageListProps = {
  messages?: Message[];
  conversation?: Conversation;
  onReply?: (message: Message) => void;
};

const MessageList: React.FC<MessageListProps> = ({ 
  messages = [], 
  conversation,
  onReply
}) => {
  const { currentUser } = useAuth();
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [messageReactions, setMessageReactions] = useState<{ [messageId: string]: MessageReaction[] }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    if (!conversation) return;
    
    const fetchReactions = async () => {
      try {
        const { data, error } = await supabase
          .from('message_reactions')
          .select('*')
          .in('messageId', messages.map(m => m.id));
          
        if (error) {
          console.error('Error fetching reactions:', error);
          return;
        }
        
        if (data) {
          const reactionsMap = data.reduce((acc, reaction) => {
            if (!acc[reaction.messageId]) {
              acc[reaction.messageId] = [];
            }
            acc[reaction.messageId].push(reaction as MessageReaction);
            return acc;
          }, {} as { [messageId: string]: MessageReaction[] });
          
          setMessageReactions(reactionsMap);
        }
      } catch (error) {
        console.error('Failed to fetch message reactions:', error);
      }
    };
    
    fetchReactions();
  }, [conversation, messages]);
  
  if (!messages || messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-gray-400">
        <p>No messages yet</p>
        <p className="text-sm mt-2">Start a conversation!</p>
      </div>
    );
  }

  const handleReaction = async (message: Message, reaction: string) => {
    if (!currentUser) return;
    
    const messageId = message.id;
    const currentReactions = messageReactions[messageId] || [];
    const userReactionIndex = currentReactions.findIndex(r => r.userId === currentUser.id);
    
    try {
      if (userReactionIndex >= 0) {
        const userReaction = currentReactions[userReactionIndex];
        
        if (userReaction.reaction === reaction) {
          const { error } = await supabase
            .from('message_reactions')
            .delete()
            .eq('id', userReaction.id);
            
          if (error) throw error;
          
          const updatedReactions = [...currentReactions];
          updatedReactions.splice(userReactionIndex, 1);
          
          setMessageReactions({
            ...messageReactions,
            [messageId]: updatedReactions
          });
          
          toast.success('Reaction removed');
        } else {
          const { error } = await supabase
            .from('message_reactions')
            .update({ reaction })
            .eq('id', userReaction.id);
            
          if (error) throw error;
          
          const updatedReactions = [...currentReactions];
          updatedReactions[userReactionIndex] = {
            ...updatedReactions[userReactionIndex],
            reaction
          };
          
          setMessageReactions({
            ...messageReactions,
            [messageId]: updatedReactions
          });
          
          toast.success('Reaction updated');
        }
      } else {
        const newReaction: Omit<MessageReaction, 'id'> = {
          messageId,
          userId: currentUser.id,
          reaction,
          createdAt: new Date()
        };
        
        const { data, error } = await supabase
          .from('message_reactions')
          .insert(newReaction)
          .select();
          
        if (error) throw error;
        
        setMessageReactions({
          ...messageReactions,
          [messageId]: [...(messageReactions[messageId] || []), data[0] as MessageReaction]
        });
        
        toast.success('Reaction added');
      }
    } catch (error) {
      console.error('Error handling reaction:', error);
      toast.error('Failed to update reaction');
    }
  };
  
  const handleCopyMessage = (message: Message) => {
    navigator.clipboard.writeText(message.content);
    toast.success('Message copied to clipboard');
  };
  
  const handleReplyMessage = (message: Message) => {
    if (onReply) {
      onReply(message);
    }
  };
  
  const handleEditMessage = (message: Message) => {
    const hoursElapsed = differenceInHours(new Date(), new Date(message.createdAt));
    
    if (hoursElapsed > 24) {
      toast.error('Messages can only be edited within 24 hours of sending');
      return;
    }
    
    setSelectedMessage(message);
    setEditContent(message.content);
    setShowEditDialog(true);
  };
  
  const submitEdit = async () => {
    if (!selectedMessage || !editContent.trim() || !currentUser) {
      toast.error('Message content cannot be empty');
      return;
    }
    
    if (selectedMessage.senderId !== currentUser.id) {
      toast.error('You can only edit your own messages');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          content: editContent,
          isEdited: true,
          updatedAt: new Date()
        })
        .eq('id', selectedMessage.id);
        
      if (error) throw error;
      
      toast.success('Message updated');
      setShowEditDialog(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error updating message:', error);
      toast.error('Failed to update message');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    if (!selectedMessage || !currentUser) return;
    
    if (selectedMessage.senderId !== currentUser.id) {
      toast.error('You can only delete your own messages');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', selectedMessage.id);
        
      if (error) throw error;
      
      toast.success('Message deleted');
      setShowDeleteConfirm(false);
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleReportMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowReportDialog(true);
  };
  
  const submitReport = async () => {
    if (!selectedMessage || !reportReason.trim() || !currentUser) {
      toast.error('Please provide a reason for the report');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('message_reports')
        .insert({
          messageId: selectedMessage.id,
          reporterId: currentUser.id,
          reason: reportReason,
          createdAt: new Date()
        });
        
      if (error) throw error;
      
      toast.success('Report submitted');
      setShowReportDialog(false);
      setReportReason('');
      setSelectedMessage(null);
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setIsSubmitting(false);
    }
  };

  const groupedMessages: { [key: string]: Message[] } = {};
  
  messages.forEach(message => {
    const date = new Date(message.createdAt).toDateString();
    if (!groupedMessages[date]) {
      groupedMessages[date] = [];
    }
    groupedMessages[date].push(message);
  });
  
  return (
    <div className="flex flex-col space-y-6 p-4">
      {conversation && conversation.type === 'chatroom' && (
        <div className="flex flex-col items-center justify-center mb-4 text-center">
          <Avatar className="w-16 h-16 mb-2">
            <AvatarImage 
              src={conversation.photo || "https://i.pravatar.cc/150?img=group"} 
              alt={conversation.chatroomName} 
            />
            <AvatarFallback>{conversation.chatroomName?.substring(0, 2).toUpperCase() || "CH"}</AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold">{conversation.chatroomName || "Chat Room"}</h2>
          <p className="text-sm text-gray-500">
            {conversation.participants?.length || 0} participants
          </p>
        </div>
      )}
      
      {Object.keys(groupedMessages).map(date => (
        <div key={date} className="space-y-4">
          <div className="flex justify-center">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
              {new Date(date).toLocaleDateString(undefined, { 
                weekday: 'long', 
                month: 'short', 
                day: 'numeric'
              })}
            </div>
          </div>
          
          {groupedMessages[date].map((message) => {
            const isCurrentUser = message.senderId === currentUser?.id;
            
            const sender = message.sender;
            
            const reactions = messageReactions[message.id] || [];
            const reactionGroups = reactions.reduce((groups, reaction) => {
              groups[reaction.reaction] = (groups[reaction.reaction] || 0) + 1;
              return groups;
            }, {} as Record<string, number>);
            
            const canEdit = isCurrentUser && differenceInHours(new Date(), new Date(message.createdAt)) <= 24;
            
            return (
              <div 
                key={message.id} 
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <ContextMenu>
                  <ContextMenuTrigger>
                    <div className={`flex max-w-[75%] ${isCurrentUser ? 'flex-row-reverse' : ''}`}>
                      {!isCurrentUser && sender && (
                        <Avatar className="w-8 h-8 mr-2">
                          <AvatarImage 
                            src={sender.profilePictureUrl || "https://i.pravatar.cc/150?img=default"} 
                            alt={sender.displayName} 
                          />
                          <AvatarFallback>{sender?.displayName.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div className={`flex flex-col ${isCurrentUser ? 'items-end mr-2' : 'items-start'}`}>
                        {!isCurrentUser && sender && (
                          <span className="text-xs text-gray-500 mb-1">{sender.displayName}</span>
                        )}
                        
                        <div 
                          className={`px-4 py-2 rounded-2xl ${
                            isCurrentUser 
                              ? 'bg-cendy-primary text-white rounded-tr-none' 
                              : 'bg-gray-100 text-gray-800 rounded-tl-none'
                          }`}
                          onDoubleClick={() => handleReaction(message, '❤️')}
                        >
                          {message.replyToId && (
                            <div className={`text-xs italic mb-1 ${isCurrentUser ? 'text-white/80' : 'text-gray-500'}`}>
                              Replying to a message
                            </div>
                          )}
                          <p>{message.content}</p>
                          {message.isEdited && (
                            <span className={`text-xs ${isCurrentUser ? 'text-white/70' : 'text-gray-500'}`}>
                              (edited)
                            </span>
                          )}
                        </div>
                        
                        {Object.keys(reactionGroups).length > 0 && (
                          <div className="flex mt-1 bg-white rounded-full shadow-sm px-2 py-0.5 border border-gray-100">
                            {Object.entries(reactionGroups).map(([reaction, count]) => (
                              <div key={reaction} className="flex items-center mx-0.5">
                                <span>{reaction}</span>
                                {count > 1 && <span className="text-xs ml-0.5">{count}</span>}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <span className="text-xs text-gray-400 mt-1">
                          {formatDistanceToNow(new Date(message.createdAt), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    {isCurrentUser ? (
                      <>
                        {canEdit && (
                          <ContextMenuItem onClick={() => handleEditMessage(message)}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                          </ContextMenuItem>
                        )}
                        <ContextMenuItem onClick={() => handleDeleteMessage(message)}>
                          <Trash className="mr-2 h-4 w-4" />
                          <span>Delete</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleReplyMessage(message)}>
                          <Reply className="mr-2 h-4 w-4" />
                          <span>Reply</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleCopyMessage(message)}>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Copy</span>
                        </ContextMenuItem>
                      </>
                    ) : (
                      <>
                        <ContextMenuItem onClick={() => handleReplyMessage(message)}>
                          <Reply className="mr-2 h-4 w-4" />
                          <span>Reply</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleCopyMessage(message)}>
                          <Copy className="mr-2 h-4 w-4" />
                          <span>Copy</span>
                        </ContextMenuItem>
                        <ContextMenuItem onClick={() => handleReportMessage(message)}>
                          <Flag className="mr-2 h-4 w-4" />
                          <span>Report</span>
                        </ContextMenuItem>
                      </>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              </div>
            );
          })}
        </div>
      ))}
      
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Message</DialogTitle>
            <DialogDescription>
              Edit your message content below. Messages can only be edited within 24 hours of sending.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Edit your message..."
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitEdit}
              disabled={isSubmitting || !editContent.trim()}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Message</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Deleting...' : 'Delete Message'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Message</DialogTitle>
            <DialogDescription>
              Tell us why you're reporting this message. Your report will be kept anonymous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Please explain why you're reporting this message..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowReportDialog(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={submitReport}
              disabled={isSubmitting || !reportReason.trim()}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MessageList;
