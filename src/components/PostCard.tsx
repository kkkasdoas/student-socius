import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { formatDistanceToNow, differenceInDays, format, differenceInMinutes } from 'date-fns';
import {
  ThumbsUp,
  Heart,
  Smile,
  MessageCircle,
  Share,
  MessageSquare,
  MoreHorizontal,
  Bookmark as BookmarkIcon
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { Post, Reaction, SavedPost, HiddenPost, PostReport, ReactionType, ReactionCounts } from '@/types';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { postService } from '@/services/PostService';
import { userProfileService } from '@/services/UserProfileService';
import PostInteractionMenu from './PostInteractionMenu';
import PostReactions from './PostReactions';

// Define a type for reaction groups - using the central ReactionCounts
type ReactionGroups = ReactionCounts;

// Update initializeReactionGroups to handle new response structure
const initializeReactionGroups = (post: Post, currentUserId?: string): ReactionGroups => {
  // If post already has organized reaction data from the API
  if (post.reactionCounts && typeof post.reactionCounts === 'object') {
    return post.reactionCounts as ReactionGroups;
  }
  
  // Default empty reaction groups
  const empty: ReactionGroups = {
    like: 0,
    heart: 0,
    laugh: 0, 
    wow: 0,
    sad: 0,
    angry: 0
  };

  // If no reactions, return empty counts
  if (!post.reactions || post.reactions.length === 0) {
    return empty;
  }

  // Count each reaction type
  return post.reactions.reduce((groups, reaction) => {
    const type = reaction.type as keyof ReactionGroups;
    if (type in groups) {
      groups[type] += 1;
    }
    return groups;
  }, {...empty});
};

// Extract initial user reaction determination
const findUserReaction = (post: Post, currentUserId?: string): string | null => {
  // Direct user reaction from post
  if (post.userReaction) {
    return post.userReaction;
  }
  
  // Find from reactions array
  if (post.reactions && post.reactions.length > 0 && currentUserId) {
    return post.reactions.find(reaction => reaction.userId === currentUserId)?.type || null;
  }
  
  return null;
};

const PostCard = React.memo(({ post }: { post: Post }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Derived values
  const isOwnPost = useMemo(() => 
    post.isOwnPost || (currentUser?.id === post.userId),
    [post.isOwnPost, post.userId, currentUser?.id]
  );
  
  const canEdit = useMemo(() => 
    isOwnPost && differenceInMinutes(new Date(), new Date(post.createdAt)) <= 30,
    [isOwnPost, post.createdAt]
  );
  
  // Initialize state with memoized values
  const [reactionGroups, setReactionGroups] = useState<ReactionGroups>(() => 
    initializeReactionGroups(post, currentUser?.id)
  );
  
  const [userReaction, setUserReaction] = useState<string | null>(() => 
    findUserReaction(post, currentUser?.id)
  );
  
  const [isSaved, setIsSaved] = useState(post.isSaved || false);
  const [isHidden, setIsHidden] = useState(post.isHidden || false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editTitle, setEditTitle] = useState(post.title);
  const [editContent, setEditContent] = useState(post.content);
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [longPressTimeout, setLongPressTimeout] = useState<NodeJS.Timeout | null>(null);
  const contextAreaRef = useRef<HTMLDivElement>(null);

  // Initial effects for loading component data
  useEffect(() => {
    // Initialize basic post data
    const initialReactionGroups = initializeReactionGroups(post, currentUser?.id);
    const initialUserReaction = findUserReaction(post, currentUser?.id);
    
    setReactionGroups(initialReactionGroups);
    setUserReaction(initialUserReaction);
    
    // Check saved/hidden status
    setIsSaved(!!post.isSaved);
    setIsHidden(!!post.isHidden);
    
    // Set initial content for post editing
    setEditTitle(post.title);
    setEditContent(post.content);
    
    // Note: We no longer need to fetch reactions separately as they are already
    // included in the post data from get_posts_with_reactions_optimized
    
  }, [post, currentUser?.id]);

  // Calculate total reactions once
  const totalReactions = useMemo(() => 
    post.totalReactions !== undefined 
    ? post.totalReactions 
      : Object.values(reactionGroups).reduce((sum, count) => sum + count, 0),
    [post.totalReactions, reactionGroups]
  );

  // Memoize handlers to prevent unnecessary re-renders
  const handleReaction = useCallback(async (type: ReactionType) => {
    if (!currentUser) {
      toast.error('Please log in to react to posts');
      return;
    }
    
    try {
      const result = await postService.toggleReaction(post.id, type);
      
      // Update local state based on the result
      if (result.action === 'added' || result.action === 'updated' || result.action === 'removed') {
        // Update user reaction state
        setUserReaction(result.action === 'removed' ? null : type);
        
        // If we have the enhanced response with top_reactions and all_counts
        if (result.top_reactions && result.all_counts) {
          // Update reaction groups with the complete counts
          const newCounts: ReactionGroups = {
            like: result.all_counts.counts.like || 0,
            heart: result.all_counts.counts.heart || 0,
            laugh: result.all_counts.counts.laugh || 0,
            wow: result.all_counts.counts.wow || 0,
            sad: result.all_counts.counts.sad || 0,
            angry: result.all_counts.counts.angry || 0
          };
          setReactionGroups(newCounts);
        } else {
          // Fallback to previous behavior if the backend doesn't return the enhanced data
          if (result.action === 'added') {
            setReactionGroups(prev => ({
              ...prev,
              [type]: prev[type] + 1
            }));
          } else if (result.action === 'removed') {
            setReactionGroups(prev => ({
              ...prev,
              [type]: Math.max(0, prev[type] - 1)
            }));
          } else if (result.action === 'updated' && result.previous_type) {
            setReactionGroups(prev => ({
              ...prev,
              [result.previous_type]: Math.max(0, prev[result.previous_type] - 1),
              [type]: prev[type] + 1
            }));
          }
        }
      }
    } catch (error) {
      console.error('Error toggling reaction:', error);
      toast.error('Failed to update reaction');
    }
    
    setShowContextMenu(false);
  }, [currentUser, post.id]);

  const navigateToUserProfile = useCallback((userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/user/${userId}`);
  }, [navigate]);

  const navigateToChatroom = useCallback(async () => {
    try {
    if (post.conversationId) {
      navigate(`/chatroom/${post.conversationId}`);
      } else {
        // Get or create a chatroom for this post
        const result = await postService.getOrCreateChatroom(post.id);
        navigate(`/chatroom/${result.conversation_id}`);
      }
    } catch (error) {
      console.error('Error navigating to chatroom:', error);
      toast.error('Failed to open chatroom');
    }
  }, [navigate, post.id, post.conversationId]);
  
  const handleShare = useCallback(() => {
    setShowShareSheet(true);
    setShowContextMenu(false);
  }, []);
  
  const handleSavePost = useCallback(async () => {
    if (!currentUser) {
      toast.error('Please log in to save posts');
      return;
    }
    
    try {
      const result = await postService.toggleSavedPost(post.id);
      
      if (result.action === 'saved') {
        setIsSaved(true);
        toast.success('Post saved for later');
      } else {
      setIsSaved(false);
      toast.success('Post removed from saved posts');
      }
    } catch (error) {
      console.error('Error toggling saved post:', error);
      toast.error('Failed to update saved status');
    }
    
    setShowContextMenu(false);
  }, [currentUser, post.id]);
  
  const handleHidePost = useCallback(async () => {
    if (!currentUser) {
      toast.error('Please log in to hide posts');
      return;
    }
    
    try {
      const result = await postService.toggleHiddenPost(post.id);
      
      if (result.action === 'hidden') {
        setIsHidden(true);
        toast.success('Post hidden from your feed');
      } else {
      setIsHidden(false);
      toast.success('Post unhidden');
      }
    } catch (error) {
      console.error('Error toggling hidden post:', error);
      toast.error('Failed to update hidden status');
    }
    
    setShowContextMenu(false);
  }, [currentUser, post.id]);
  
  const handleReportPost = () => {
    setShowReportDialog(true);
    setShowContextMenu(false);
  };
  
  const submitReport = async () => {
    if (!reportReason.trim() || !currentUser) {
      toast.error('Please provide a reason for the report');
      return;
    }
    
    try {
      const result = await postService.reportPost(post.id, reportReason);
    
      if (result.success) {
    toast.success('Report submitted successfully');
    setShowReportDialog(false);
    setReportReason('');
      } else {
        toast.error(result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      toast.error('Failed to submit report');
    }
  };
  
  const handleEditPost = () => {
    if (!canEdit) {
      toast.error('Posts can only be edited within 30 minutes of posting');
      return;
    }
    
    setShowEditDialog(true);
    setShowContextMenu(false);
  };
  
  const submitEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      toast.error('Title and content cannot be empty');
      return;
    }
    
    try {
      // In a real app, we would update this to use a proper API call
      // For now, let's just update the local state optimistically
    toast.success('Post updated successfully');
    setShowEditDialog(false);
    
      // Update local state
      post.title = editTitle;
      post.content = editContent;
      post.isEdited = true;
      
      // Force a re-render
      setReactionGroups({...reactionGroups});
    } catch (error) {
      console.error('Error editing post:', error);
      toast.error('Failed to update post');
    }
  };
  
  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
    setShowContextMenu(false);
  };
  
  const confirmDelete = async () => {
    try {
      const result = await postService.deletePost(post.id);
      
      if (result.success) {
    toast.success('Post deleted successfully');
    setShowDeleteConfirm(false);
    
        // Remove from UI or redirect
        // For now, we'll just reload the page
        window.location.reload();
      } else {
        toast.error(result.message || 'Failed to delete post');
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleBlockUser = async () => {
    if (!post.userId) {
      toast.error('Cannot block user - user ID not available');
      return;
    }
    
    try {
      const result = await userProfileService.blockUser(post.userId);
      
      if (result.success) {
        toast.success(result.message || 'User blocked successfully');
        setShowContextMenu(false);
      } else {
        toast.error(result.message || 'Failed to block user');
      }
    } catch (error) {
      console.error('Error blocking user:', error);
      toast.error('Failed to block user');
    }
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    // Ensure we have a valid date
    if (!date || isNaN(date.getTime())) {
      return 'Unknown date';
    }
    
    const daysDifference = differenceInDays(new Date(), date);
    
    if (daysDifference > 30) {
      return format(date, 'dd/MM/yyyy');
    }
    
    const timeAgo = formatDistanceToNow(date, { addSuffix: false });
    
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
    
    // For both touch and mouse events, require a 500ms press
    const timeout = setTimeout(() => {
      setShowContextMenu(true);
    }, 500);
    setLongPressTimeout(timeout);
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
          onClick={(e) => post.user?.id ? navigateToUserProfile(post.user.id, e) : e.preventDefault()}
        >
          <AvatarImage src={post.user?.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} alt={post.user?.displayName || 'User'} />
          <AvatarFallback>{post.user?.displayName ? post.user.displayName.substring(0, 2).toUpperCase() : 'US'}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center">
            <h3 
              className="font-medium text-gray-900 cursor-pointer hover:text-cendy-primary"
              onClick={(e) => post.user?.id ? navigateToUserProfile(post.user.id, e) : e.preventDefault()}
            >
              {post.user?.displayName || 'Anonymous User'}
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
        onTouchStart={handleLongPressStart}
        onTouchEnd={handleLongPressEnd}
        onTouchCancel={handleLongPressEnd}
        onMouseDown={handleLongPressStart}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onContextMenu={handleContextMenu}
      >
        {/* Post Title */}
        <div 
          className="px-4 pb-2 text-lg font-semibold"
          onClick={navigateToChatroom}
        >
          {post.title}
        </div>

        {/* Post Content */}
        <div 
          className="px-4 pb-4 text-gray-700"
          onClick={navigateToChatroom}
        >
          {post.content}
        </div>

        {/* Post Image (if available) */}
        {post.imageUrl && (
          <div>
            <img 
              src={post.imageUrl} 
              alt="Post content" 
              className="w-full h-auto max-h-[500px] object-cover"
              onClick={(e) => {
                e.stopPropagation(); // Prevent navigation to chatroom
                // Here you could add logic to view image in full screen
              }}
            />
          </div>
        )}

        {/* Reactions Section */}
        {totalReactions > 0 && (
          <div 
            className="px-4 py-3 border-t border-gray-100 flex items-center text-gray-500 text-sm"
            onClick={(e) => e.stopPropagation()} // Prevent navigation to chatroom
          >
            <PostReactions 
              reactions={Object.entries(reactionGroups)
                .filter(([_, count]) => count > 0)
                .map(([type, count]) => ({ type, count }))
                .sort((a, b) => b.count - a.count)}
              userReaction={userReaction}
              onReactionClick={handleReaction}
            />
          </div>
        )}
      </div>

      {/* Post Interaction Menu */}
      <PostInteractionMenu
        post={post}
        open={showContextMenu}
        onOpenChange={setShowContextMenu}
        isOwnPost={isOwnPost}
        isSaved={isSaved}
        isHidden={isHidden}
        userReaction={userReaction}
        onReaction={handleReaction}
        onSave={handleSavePost}
        onHide={handleHidePost}
        onShare={handleShare}
        onEdit={handleEditPost}
        onDelete={handleDeletePost}
        onReport={handleReportPost}
        onBlockUser={handleBlockUser}
      />

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
});

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