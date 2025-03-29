
import React from 'react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { Copy, Edit, Reply, Trash, Flag } from 'lucide-react';
import { Message, ChatroomMessage } from '@/types';
import { differenceInHours } from 'date-fns';

interface MessageContextMenuProps {
  message: Message | ChatroomMessage;
  isCurrentUser: boolean;
  children: React.ReactNode;
  onReply: (message: Message | ChatroomMessage) => void;
  onCopy: (message: Message | ChatroomMessage) => void;
  onEdit: (message: Message | ChatroomMessage) => void;
  onDelete: (message: Message | ChatroomMessage) => void;
  onReport: (message: Message | ChatroomMessage) => void;
  onReaction: (message: Message | ChatroomMessage, reaction: string) => void;
}

const MessageContextMenu: React.FC<MessageContextMenuProps> = ({
  message,
  isCurrentUser,
  children,
  onReply,
  onCopy,
  onEdit,
  onDelete,
  onReport,
  onReaction
}) => {
  // Check if message can be edited (own message, less than 24 hours old)
  const canEdit = isCurrentUser && differenceInHours(new Date(), new Date(message.created_at)) <= 24;
  
  return (
    <ContextMenu>
      <ContextMenuTrigger>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-56">
        {/* Reaction Options */}
        <div className="flex justify-around p-2 border-b">
          <button 
            onClick={() => onReaction(message, '👍')} 
            className="text-lg hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            👍
          </button>
          <button 
            onClick={() => onReaction(message, '❤️')} 
            className="text-lg hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            ❤️
          </button>
          <button 
            onClick={() => onReaction(message, '😂')} 
            className="text-lg hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            😂
          </button>
          <button 
            onClick={() => onReaction(message, '😢')} 
            className="text-lg hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            😢
          </button>
          <button 
            onClick={() => onReaction(message, '😡')} 
            className="text-lg hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            😡
          </button>
          <button 
            onClick={() => onReaction(message, '🎉')} 
            className="text-lg hover:bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center"
          >
            🎉
          </button>
        </div>
        
        {/* Other Actions */}
        {isCurrentUser ? (
          // Own message options
          <>
            {canEdit && (
              <ContextMenuItem onClick={() => onEdit(message)}>
                <Edit className="mr-2 h-4 w-4" />
                <span>Edit</span>
              </ContextMenuItem>
            )}
            <ContextMenuItem onClick={() => onDelete(message)}>
              <Trash className="mr-2 h-4 w-4" />
              <span>Delete</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onReply(message)}>
              <Reply className="mr-2 h-4 w-4" />
              <span>Reply</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCopy(message)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
            </ContextMenuItem>
          </>
        ) : (
          // Other's message options
          <>
            <ContextMenuItem onClick={() => onReply(message)}>
              <Reply className="mr-2 h-4 w-4" />
              <span>Reply</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onCopy(message)}>
              <Copy className="mr-2 h-4 w-4" />
              <span>Copy</span>
            </ContextMenuItem>
            <ContextMenuItem onClick={() => onReport(message)}>
              <Flag className="mr-2 h-4 w-4" />
              <span>Report</span>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
    </ContextMenu>
  );
};

export default MessageContextMenu;
