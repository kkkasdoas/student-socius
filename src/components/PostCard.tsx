import React, { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow, differenceInDays, format, differenceInMinutes } from 'date-fns';
import {
  ThumbsUp,
  Heart,
  Smile,
  MessageCircle,
  Share,
  Edit,
  Trash,
  EyeOff,
  Bookmark,
  Flag,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { Post, Reaction, SavedPost, HiddenPost, PostReport } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const [reactionGroups, setReactionGroups] = useState({
    like: 0,
    heart: 0,
    laugh: 0,
    wow: 0,
    sad: 0,
    angry: 0,
  });
  const [userReactions, setUserReactions] = useState<Reaction[]>([]);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const contextAreaRef = useRef<HTMLDivElement>(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnPost = currentUser?.id === post.user.id;
  const canEdit = isOwnPost && differenceInMinutes(new Date(), new Date(post.createdAt)) <= 30;

  useEffect(() => {
    // Group reactions by type
    const groupedReactions = post.reactions.reduce((acc, reaction) => {
      acc[reaction.type] = (acc[reaction.type] || 0) + 1;
      return acc;
    }, {
      like: 0,
      heart: 0,
      laugh: 0,
      wow: 0,
      sad: 0,
      angry: 0,
    });
    setReactionGroups(groupedReactions);

    // Get user's reactions for this post
    const userReactionsForPost = post.reactions.filter(reaction => reaction.userId === currentUser?.id);
    setUserReactions(userReactionsForPost);

    // Initialize post state
    if (currentUser) {
      // In a real app, check if post is saved by this user
      setIsSaved(false);
      
      // In a real app, check if post is hidden by this user
      setIsHidden(false);
    }
    
    setEditTitle(post.title);
    setEditContent(post.content);
  }, [post, currentUser]);

  const totalReactions = Object.values(reactionGroups).reduce((sum, count) => sum + count, 0);

  const hasReacted = (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry') => {
    return userReactions.some(reaction => reaction.type === type);
  };

  const handleReaction = (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry') => {
    if (!currentUser) {
      toast.error('Please log in to react to posts');
      return;
    }
    
    // In a real app, this would send the reaction to the server
    console.log('Reacted with:', type);
    
    // If user already has this reaction, remove it
    if (hasReacted(type)) {
      // DELETE FROM reactions WHERE postId = ? AND userId = ? AND type = ?
      console.log('Removing reaction:', type);
      
      // Update local state (optimistic update)
      setUserReactions(userReactions.filter(r => r.type !== type));
      setReactionGroups({
        ...reactionGroups,
        [type]: Math.max(0, reactionGroups[type] - 1)
      });
    } else {
      // If user has a different reaction, replace it
      if (userReactions.length > 0) {
        const oldType = userReactions[0].type;
        // UPDATE reactions SET type = ? WHERE postId = ? AND userId = ?
        console.log('Replacing reaction from', oldType, 'to', type);
        
        // Update local state (optimistic update)
        setUserReactions([{ ...userReactions[0], type }]);
        setReactionGroups({
          ...reactionGroups,
          [oldType]: Math.max(0, reactionGroups[oldType] - 1),
          [type]: (reactionGroups[type] || 0) + 1
        });
      } else {
        // Add new reaction
        // INSERT INTO reactions (id, postId, userId, type, createdAt) VALUES (uuid(), ?, ?, ?, NOW())
        console.log('Adding new reaction:', type);
        
        // Update local state (optimistic update)
        const newReaction: Reaction = {
          id: `reaction-${Date.now()}`,
          postId: post.id,
          userId: currentUser.id,
          type: type,
          createdAt: new Date()
        };
        setUserReactions([newReaction]);
        setReactionGroups({
          ...reactionGroups,
          [type]: (reactionGroups[type] || 0) + 1
        });
      }
    }
    
    setShowContextMenu(false);
  };

  const navigateToUserProfile = (userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/user/${userId}`);
  };

  const navigateToChatroom = () => {
    if (post.conversationId) {
      navigate(`/chatroom/${post.conversationId}`);
    }
  };
  
  const handleShare = () => {
    setShowShareSheet(true);
    setShowContextMenu(false);
  };
  
  const handleSavePost = () => {
    if (!currentUser) {
      toast.error('Please log in to save posts');
      return;
    }
    
    if (isSaved) {
      // DELETE FROM saved_posts WHERE userId = ? AND postId = ?
      console.log('Unsaving post:', post.id);
      setIsSaved(false);
      toast.success('Post removed from saved posts');
    } else {
      // INSERT INTO saved_posts (userId, postId) VALUES (?, ?)
      console.log('Saving post:', post.id);
      setIsSaved(true);
      toast.success('Post saved for later');
    }
    
    setShowContextMenu(false);
  };
  
  const handleHidePost = () => {
    if (!currentUser) {
      toast.error('Please log in to hide posts');
      return;
    }
    
    if (isHidden) {
      // DELETE FROM hidden_posts WHERE userId = ? AND postId = ?
      console.log('Unhiding post:', post.id);
      setIsHidden(false);
      toast.success('Post unhidden');
    } else {
      // INSERT INTO hidden_posts (userId, postId) VALUES (?, ?)
      console.log('Hiding post:', post.id);
      setIsHidden(true);
      toast.success('Post hidden from your feed');
    }
    
    setShowContextMenu(false);
  };
  
  const handleReportPost = () => {
    setShowReportDialog(true);
    setShowContextMenu(false);
  };
  
  const submitReport = () => {
    if (!reportReason.trim() || !currentUser) {
      toast.error('Please provide a reason for the report');
      return;
    }
    
    // INSERT INTO post_reports (id, reporterId, postId, reason, createdAt) VALUES (uuid(), ?, ?, ?, NOW())
    const newReport: PostReport = {
      id: `report-${Date.now()}`,
      reporterId: currentUser.id,
      postId: post.id,
      reason: reportReason,
      createdAt: new Date()
    };
    
    console.log('Submitting post report:', newReport);
    toast.success('Report submitted successfully');
    setShowReportDialog(false);
    setReportReason('');
  };
  
  const handleEditPost = () => {
    if (!canEdit) {
      toast.error('Posts can only be edited within 30 minutes of posting');
      return;
    }
    
    setShowEditDialog(true);
    setShowContextMenu(false);
  };
  
  const submitEdit = () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content cannot be empty');
      return;
    }
    
    // UPDATE posts SET title = ?, content = ?, isEdited = true, updatedAt = NOW() WHERE id = ?
    console.log('Editing post:', post.id, {
      title: editTitle,
      content: editContent,
      isEdited: true
    });
    
    toast.success('Post updated successfully');
    setShowEditDialog(false);
    
    // In a real app, we would refetch the post or update the local state
  };
  
  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
    setShowContextMenu(false);
  };
  
  const confirmDelete = () => {
    // DELETE FROM posts WHERE id = ?
    // Also delete related data (reactions, comments, etc.)
    console.log('Deleting post:', post.id);
    
    toast.success('Post deleted successfully');
    setShowDeleteConfirm(false);
    
    // In a real app, we would remove the post from the UI or redirect
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const daysDifference = differenceInDays(new Date(), new Date(date));
    
    if (daysDifference > 30) {
      return format(new Date(date), 'dd/MM/yyyy');
    }
    
    const timeAgo = formatDistanceToNow(new Date(date), { addSuffix: false });
    
    // Convert to short format
    if (timeAgo.includes('second')) {
      return timeAgo.replace(/\d+ seconds?/, match => `${match.split(' ')[0]}s`);
    }
    if (timeAgo.includes('minute')) {
      return timeAgo.replace(/\d+ minutes?/, match => `${match.split(' ')[0]}m`);
    }
    if (timeAgo.includes('hour')) {
      return timeAgo.replace(/\d+ hours?/, match => `${match.split(' ')[0]}h`);
    }
    if (timeAgo.includes('day')) {
      return timeAgo.replace(/\d+ days?/, match => `${match.split(' ')[0]}d`);
    }
    if (timeAgo.includes('month')) {
      return timeAgo.replace(/\d+ months?/, match => `${match.split(' ')[0]}mo`);
    }
    
    return timeAgo;
  };

  // Long press handling
  const handleLongPressStart = (e: React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    
    if ('touches' in e) {
      // Touch event (mobile)
      const timeout = setTimeout(() => {
        setShowContextMenu(true);
      }, 500);
      setLongPressTimeout(timeout);
    } else {
      // Right-click (desktop)
      setShowContextMenu(true);
    }
  };

  const handleLongPressEnd = () => {
    if (longPressTimeout) {
      clearTimeout(longPressTimeout);
      setLongPressTimeout(null);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowContextMenu(true);
  };

  // Format timestamp
  const formattedTime = formatTimeAgo(post.createdAt);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
      {/* Post Header */}
      <div className="p-4 flex items-start">
        <Avatar 
          className="w-10 h-10 mr-3 cursor-pointer"
          onClick={(e) => navigateToUserProfile(post.user.id, e)}
        >
          <AvatarImage src={post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} alt={post.user.displayName} />
          <AvatarFallback>{post.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center">
            <h3 
              className="font-medium text-gray-900 cursor-pointer hover:text-cendy-primary"
              onClick={(e) => navigateToUserProfile(post.user.id, e)}
            >
              {post.user.displayName}
            </h3>
            <span className="text-gray-500 text-sm ml-2">{formattedTime}</span>
            {post.isEdited && (
              <span className="text-gray-500 text-xs ml-2">(Edited)</span>
            )}
          </div>

          <div className="mt-0.5 flex items-center text-xs text-gray-500">
            <div className="flex items-center">
              {post.category && (
                <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs mr-2">
                  {post.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Post Content - Tap and Hold Area */}
      <div 
        ref={contextAreaRef}
        className="cursor-pointer"
        onClick={navigateToChatroom}
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onContextMenu={handleContextMenu}
      >
        {/* Post Title */}
        <div className="px-4 pb-2 text-lg font-semibold">
          {post.title}
        </div>

        {/* Post Content */}
        <div className="px-4 pb-4 text-gray-700">
          {post.content}
        </div>

        {/* Post Image (if available) */}
        {post.imageUrl && (
          <div>
            <img src={post.imageUrl} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
          </div>
        )}

        {/* Reactions Section */}
        {totalReactions > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center text-gray-500 text-sm">
            <div className="flex -space-x-1 mr-2">
              {reactionGroups.heart > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-100 text-red-500">
                  <Heart className="w-3 h-3 fill-current" />
                </span>
              )}
              {reactionGroups.like > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 text-blue-500">
                  <ThumbsUp className="w-3 h-3" />
                </span>
              )}
              {reactionGroups.laugh > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-yellow-100 text-yellow-500">
                  <Smile className="w-3 h-3" />
                </span>
              )}
            </div>
            <span>
              {totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}
            </span>
          </div>
        )}
      </div>

      {/* Telegram-style Context Menu Dialog */}
      <Dialog open={showContextMenu} onOpenChange={setShowContextMenu}>
        <DialogContent className="p-0 max-w-[280px] rounded-lg shadow-lg overflow-hidden">
          {/* Reactions Section */}
          <div className="p-3 border-b border-gray-100 flex justify-around">
            <button 
              onClick={() => handleReaction('like')} 
              className="text-lg hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <ThumbsUp className={`h-6 w-6 ${hasReacted('like') ? 'text-blue-500 fill-blue-500' : 'text-gray-600'}`} />
            </button>
            <button 
              onClick={() => handleReaction('heart')} 
              className="text-lg hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Heart className={`h-6 w-6 ${hasReacted('heart') ? 'text-red-500 fill-red-500' : 'text-gray-600'}`} />
            </button>
            <button 
              onClick={() => handleReaction('laugh')} 
              className="text-lg hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <Smile className={`h-6 w-6 ${hasReacted('laugh') ? 'text-yellow-500 fill-yellow-500' : 'text-gray-600'}`} />
            </button>
            <button 
              onClick={() => handleReaction('wow')} 
              className="text-lg hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className={`text-2xl ${hasReacted('wow') ? 'text-yellow-500' : 'text-gray-600'}`}>😲</span>
            </button>
            <button 
              onClick={() => handleReaction('sad')} 
              className="text-lg hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className={`text-2xl ${hasReacted('sad') ? 'text-blue-500' : 'text-gray-600'}`}>😢</span>
            </button>
            <button 
              onClick={() => handleReaction('angry')} 
              className="text-lg hover:bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center"
            >
              <span className={`text-2xl ${hasReacted('angry') ? 'text-red-500' : 'text-gray-600'}`}>😡</span>
            </button>
          </div>
          
          {/* Actions Section */}
          <div className="py-1">
            {isOwnPost ? (
              // Own post actions
              <>
                <ContextMenuItem 
                  icon={<Bookmark className="h-5 w-5" />} 
                  label={isSaved ? "Unsave" : "Save"}
                  onClick={handleSavePost}
                />
                {canEdit && (
                  <ContextMenuItem 
                    icon={<Edit className="h-5 w-5" />} 
                    label="Edit" 
                    onClick={handleEditPost}
                  />
                )}
                <ContextMenuItem 
                  icon={<Share className="h-5 w-5" />} 
                  label="Share" 
                  onClick={handleShare}
                />
                <ContextMenuItem 
                  icon={<Trash className="h-5 w-5" />} 
                  label="Delete" 
                  onClick={handleDeletePost}
                  className="text-red-500"
                />
              </>
            ) : (
              // Other's post actions
              <>
                <ContextMenuItem 
                  icon={<Bookmark className="h-5 w-5" />} 
                  label={isSaved ? "Unsave" : "Save"}
                  onClick={handleSavePost}
                />
                <ContextMenuItem 
                  icon={<EyeOff className="h-5 w-5" />} 
                  label={isHidden ? "Unhide" : "Hide"}
                  onClick={handleHidePost}
                />
                <ContextMenuItem 
                  icon={<Share className="h-5 w-5" />} 
                  label="Share" 
                  onClick={handleShare}
                />
                <ContextMenuItem 
                  icon={<Flag className="h-5 w-5" />} 
                  label="Report" 
                  onClick={handleReportPost}
                  className="text-red-500"
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Sheet Dialog */}
      <Dialog open={showShareSheet} onOpenChange={setShowShareSheet}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-center font-medium">Share this post</h3>
          </div>
          <div className="p-6 grid grid-cols-4 gap-4">
            <ShareOption icon="facebook" label="Facebook" />
            <ShareOption icon="twitter" label="Twitter" />
            <ShareOption icon="linkedin" label="LinkedIn" />
            <ShareOption icon="copy" label="Copy Link" />
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <div>
            <h3 className="text-lg font-medium mb-2">Report Post</h3>
            <p className="text-sm text-gray-500 mb-4">
              Tell us why you're reporting this post. Your report will be kept anonymous.
            </p>
          </div>
          
          <div className="mt-4">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cendy-primary"
              rows={4}
              placeholder="Please explain why you're reporting this post..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
            />
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport}>
              Submit Report
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <div>
            <h3 className="text-lg font-medium mb-2">Edit Post</h3>
            <p className="text-sm text-gray-500 mb-4">
              You can edit your post within 30 minutes of posting.
            </p>
          </div>
          
          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cendy-primary"
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cendy-primary"
                rows={4}
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={submitEdit}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent>
          <div>
            <h3 className="text-lg font-medium mb-2">Delete Post</h3>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Context Menu Item Component
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

// Share Option Component
interface ShareOptionProps {
  icon: 'facebook' | 'twitter' | 'linkedin' | 'copy';
  label: string;
}

const ShareOption: React.FC<ShareOptionProps> = ({ icon, label }) => {
  let iconElement;
  let iconColorClass;
  
  switch (icon) {
    case 'facebook':
      iconElement = <div className="text-2xl">📘</div>;
      iconColorClass = 'bg-blue-50';
      break;
    case 'twitter':
      iconElement = <div className="text-2xl">🐦</div>;
      iconColorClass = 'bg-blue-50';
      break;
    case 'linkedin':
      iconElement = <div className="text-2xl">🔗</div>;
      iconColorClass = 'bg-blue-50';
      break;
    case 'copy':
      iconElement = <div className="text-2xl">📋</div>;
      iconColorClass = 'bg-gray-50';
      break;
  }
  
  return (
    <button className="flex flex-col items-center">
      <div className={`w-12 h-12 rounded-full ${iconColorClass} flex items-center justify-center mb-1`}>
        {iconElement}
      </div>
      <span className="text-xs text-gray-700">{label}</span>
    </button>
  );
};

export default PostCard;
