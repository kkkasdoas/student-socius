import React from 'react';
import { Bookmark, EyeOff, Edit, Trash, Share, Flag, User, MessageCircle } from 'lucide-react';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Post, ReactionType } from '@/types';
import { differenceInMinutes } from 'date-fns';

interface ContextMenuItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}

const ContextMenuItem: React.FC<ContextMenuItemProps> = ({ icon, label, onClick, className }) => {
  return (
    <button 
      className={`w-full px-3 py-2.5 flex items-center hover:bg-gray-100 transition-colors ${className || 'text-gray-700'}`}
      onClick={onClick}
    >
      <span className="mr-2 text-gray-500">{icon}</span>
      <span>{label}</span>
    </button>
  );
};

interface ReactionButtonProps {
  type: ReactionType;
  isActive: boolean;
  onClick: () => void;
}

const ReactionButton: React.FC<ReactionButtonProps> = ({ type, isActive, onClick }) => {
  let emoji;
  let activeClass = '';

  switch (type) {
    case 'like':
      emoji = '👍';
      activeClass = isActive ? 'bg-blue-50' : '';
      break;
    case 'heart':
      emoji = '❤️';
      activeClass = isActive ? 'bg-red-50' : '';
      break;
    case 'laugh':
      emoji = '😂';
      activeClass = isActive ? 'bg-yellow-50' : '';
      break;
    case 'wow':
      emoji = '😲';
      activeClass = isActive ? 'bg-yellow-50' : '';
      break;
    case 'sad':
      emoji = '😢';
      activeClass = isActive ? 'bg-blue-50' : '';
      break;
    case 'angry':
      emoji = '😡';
      activeClass = isActive ? 'bg-red-50' : '';
      break;
  }

  return (
    <button 
      onClick={onClick} 
      className={`text-2xl hover:bg-gray-100 w-12 h-12 rounded-full flex items-center justify-center ${activeClass} ${isActive ? 'scale-110' : ''} transition-all`}
    >
      <span>{emoji}</span>
    </button>
  );
};

export interface PostInteractionMenuProps {
  post: Post;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isOwnPost: boolean;
  isSaved: boolean;
  isHidden: boolean;
  userReaction: string | null;
  onReaction: (type: ReactionType) => void;
  onSave: () => void;
  onHide: () => void;
  onShare: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReport?: () => void;
  onBlockUser?: () => void;
  onMessage?: () => void;
}

const PostInteractionMenu: React.FC<PostInteractionMenuProps> = ({
  post,
  open,
  onOpenChange,
  isOwnPost,
  isSaved,
  isHidden,
  userReaction,
  onReaction,
  onSave,
  onHide,
  onShare,
  onEdit,
  onDelete,
  onReport,
  onBlockUser,
  onMessage
}) => {
  // Check if post can be edited (within 30 minutes of posting)
  const canEdit = isOwnPost && differenceInMinutes(new Date(), new Date(post.createdAt)) <= 30;

  const hasReacted = (type: ReactionType) => {
    return userReaction === type;
  };

  const isCommunityPost = post.channelType === 'CampusCommunity' || post.channelType === 'Community';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 max-w-[280px] rounded-lg shadow-lg overflow-hidden">
        {/* Reactions Section - only show for non-community posts */}
        {!isCommunityPost && (
          <div className="p-3 border-b border-gray-100 flex justify-around">
            <ReactionButton type="like" isActive={hasReacted('like')} onClick={() => onReaction('like')} />
            <ReactionButton type="heart" isActive={hasReacted('heart')} onClick={() => onReaction('heart')} />
            <ReactionButton type="laugh" isActive={hasReacted('laugh')} onClick={() => onReaction('laugh')} />
            <ReactionButton type="wow" isActive={hasReacted('wow')} onClick={() => onReaction('wow')} />
            <ReactionButton type="sad" isActive={hasReacted('sad')} onClick={() => onReaction('sad')} />
            <ReactionButton type="angry" isActive={hasReacted('angry')} onClick={() => onReaction('angry')} />
          </div>
        )}
        
        {/* Actions Section */}
        <div className="py-1">
          {isOwnPost ? (
            // Own post actions
            <>
              <ContextMenuItem 
                icon={<Bookmark className="h-5 w-5" />} 
                label={isSaved ? "Unsave" : "Save"}
                onClick={onSave}
              />
              {canEdit && onEdit && (
                <ContextMenuItem 
                  icon={<Edit className="h-5 w-5" />} 
                  label="Edit" 
                  onClick={onEdit}
                />
              )}
              <ContextMenuItem 
                icon={<Share className="h-5 w-5" />} 
                label="Share" 
                onClick={onShare}
              />
              {onDelete && (
                <ContextMenuItem 
                  icon={<Trash className="h-5 w-5" />} 
                  label="Delete" 
                  onClick={onDelete}
                  className="text-red-500"
                />
              )}
            </>
          ) : (
            // Other's post actions
            <>
              <ContextMenuItem 
                icon={<Bookmark className="h-5 w-5" />} 
                label={isSaved ? "Unsave" : "Save"}
                onClick={onSave}
              />
              <ContextMenuItem 
                icon={<EyeOff className="h-5 w-5" />} 
                label={isHidden ? "Unhide" : "Hide"}
                onClick={onHide}
              />
              {/* Message option for community posts */}
              {isCommunityPost && onMessage && (
                <ContextMenuItem 
                  icon={<MessageCircle className="h-5 w-5" />} 
                  label="Message User" 
                  onClick={onMessage}
                />
              )}
              <ContextMenuItem 
                icon={<Share className="h-5 w-5" />} 
                label="Share" 
                onClick={onShare}
              />
              {onBlockUser && (
                <ContextMenuItem 
                  icon={<User className="h-5 w-5" />} 
                  label="Block User" 
                  onClick={onBlockUser}
                />
              )}
              {onReport && (
                <ContextMenuItem 
                  icon={<Flag className="h-5 w-5" />} 
                  label="Report" 
                  onClick={onReport}
                  className="text-red-500"
                />
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PostInteractionMenu; 