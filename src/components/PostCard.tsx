import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const isOwnPost = currentUser?.id === post.user.id;
  const canEdit = isOwnPost && differenceInMinutes(new Date(), new Date(post.createdAt)) <= 30;

  // Add ref to track mounted state for async operations
  const isMounted = useRef(true);
  
  // Add debounce ref to prevent rapid reactions
  const reactionDebounceRef = useRef(false);
  
  // Clean up event listeners and mounted state on unmount
  useEffect(() => {
    return () => {
      // If any long press timeout is active, clear it
      if (longPressTimeout) {
        clearTimeout(longPressTimeout);
      }
      // Set mounted to false to prevent state updates after unmount
      isMounted.current = false;
    };
  }, [longPressTimeout]);
  
  // Track copy link event for sharing
  const handleCopyLink = useCallback(() => {
    const postUrl = `${window.location.origin}/post/${post.id}`;
    navigator.clipboard.writeText(postUrl)
      .then(() => {
        toast.success('Link copied to clipboard');
        // If using analytics, track this event
        // analytics.track('post_link_copied', { postId: post.id });
      })
      .catch(() => {
        toast.error('Failed to copy link');
      });
    setShowShareSheet(false);
  }, [post.id]);

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
      // Check if post is saved by this user
      const checkSavedStatus = async () => {
        const { data, error } = await supabase
          .from('saved_posts')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id)
          .single();
          
        if (!error && data) {
          setIsSaved(true);
        }
      };
      
      // Check if post is hidden by this user
      const checkHiddenStatus = async () => {
        const { data, error } = await supabase
          .from('hidden_posts')
          .select('*')
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id)
          .single();
          
        if (!error && data) {
          setIsHidden(true);
        }
      };
      
      checkSavedStatus();
      checkHiddenStatus();
    }
    
    setEditTitle(post.title);
    setEditContent(post.content);
  }, [post, currentUser]);

  const totalReactions = Object.values(reactionGroups).reduce((sum, count) => sum + count, 0);

  const hasReacted = (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry') => {
    return userReactions.some(reaction => reaction.type === type);
  };

  const handleReaction = async (type: 'like' | 'heart' | 'laugh' | 'wow' | 'sad' | 'angry') => {
    if (!currentUser) {
      toast.error('Please log in to react to posts');
      return;
    }
    
    // Prevent rapid clicks
    if (reactionDebounceRef.current) return;
    reactionDebounceRef.current = true;
    
    // Reset debounce after 500ms
    setTimeout(() => {
      if (isMounted.current) {
        reactionDebounceRef.current = false;
      }
    }, 500);
    
    try {
      setIsLoading(true);
      
      if (hasReacted(type)) {
        // Delete the reaction
        const { error } = await supabase
          .from('reactions')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', currentUser.id)
          .eq('type', type);
        
        if (error) throw error;
        
        // Update local state (optimistic update)
        if (isMounted.current) {
          setUserReactions(userReactions.filter(r => r.type !== type));
          setReactionGroups({
            ...reactionGroups,
            [type]: Math.max(0, reactionGroups[type] - 1)
          });
        }
      } else {
        // If user has a different reaction, replace it
        if (userReactions.length > 0) {
          const oldType = userReactions[0].type;
          
          // Update the reaction
          const { error } = await supabase
            .from('reactions')
            .update({ type })
            .eq('post_id', post.id)
            .eq('user_id', currentUser.id);
          
          if (error) throw error;
          
          // Update local state (optimistic update)
          if (isMounted.current) {
            setUserReactions([{ ...userReactions[0], type }]);
            setReactionGroups({
              ...reactionGroups,
              [oldType]: Math.max(0, reactionGroups[oldType] - 1),
              [type]: (reactionGroups[type] || 0) + 1
            });
          }
        } else {
          // Add new reaction
          const newReaction = {
            post_id: post.id,
            user_id: currentUser.id,
            type: type,
          };
          
          const { data, error } = await supabase
            .from('reactions')
            .insert(newReaction)
            .select()
            .single();
          
          if (error) throw error;
          
          // Update local state with the returned data
          const reactionWithId: Reaction = {
            id: data.id,
            postId: data.post_id,
            userId: data.user_id,
            type: data.type,
            createdAt: new Date(data.created_at)
          };
          
          if (isMounted.current) {
            setUserReactions([reactionWithId]);
            setReactionGroups({
              ...reactionGroups,
              [type]: (reactionGroups[type] || 0) + 1
            });
          }
        }
      }
    } catch (error) {
      console.error('Error updating reaction:', error);
      if (isMounted.current) {
        setError('Failed to update reaction. Please try again.');
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setShowContextMenu(false);
      }
    }
  };

  const navigateToUserProfile = useCallback((userId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    navigate(`/user/${userId}`);
  }, [navigate]);

  const navigateToChatroom = useCallback(() => {
    if (post.conversationId) {
      navigate(`/chatroom/${post.conversationId}`);
    }
  }, [navigate, post.conversationId]);
  
  const handleShare = () => {
    setShowShareSheet(true);
    setShowContextMenu(false);
  };
  
  const handleSavePost = async () => {
    if (!currentUser) {
      toast.error('Please log in to save posts');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (isSaved) {
        // Delete from saved posts
        const { error } = await supabase
          .from('saved_posts')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id);
          
        if (error) throw error;
        
        setIsSaved(false);
        toast.success('Post removed from saved posts');
      } else {
        // Add to saved posts
        const newSavedPost = {
          user_id: currentUser.id,
          post_id: post.id
        };
        
        const { error } = await supabase
          .from('saved_posts')
          .insert(newSavedPost);
          
        if (error) throw error;
        
        setIsSaved(true);
        toast.success('Post saved for later');
      }
    } catch (error) {
      console.error('Error updating saved status:', error);
      setError('Failed to update saved status. Please try again.');
    } finally {
      setIsLoading(false);
      setShowContextMenu(false);
    }
  };
  
  const handleHidePost = async () => {
    if (!currentUser) {
      toast.error('Please log in to hide posts');
      return;
    }
    
    try {
      if (isHidden) {
        // Unhide post
        const { error } = await supabase
          .from('hidden_posts')
          .delete()
          .eq('user_id', currentUser.id)
          .eq('post_id', post.id);
          
        if (error) throw error;
        
        setIsHidden(false);
        toast.success('Post unhidden');
      } else {
        // Hide post
        const newHiddenPost = {
          user_id: currentUser.id,
          post_id: post.id
        };
        
        const { error } = await supabase
          .from('hidden_posts')
          .insert(newHiddenPost);
          
        if (error) throw error;
        
        setIsHidden(true);
        toast.success('Post hidden from your feed');
      }
    } catch (error) {
      console.error('Error updating hidden status:', error);
      toast.error('Failed to update hidden status. Please try again.');
    }
    
    setShowContextMenu(false);
  };
  
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
      // Insert report into database
      const newReport = {
        reporter_id: currentUser.id,
        post_id: post.id,
        reason: reportReason
      };
      
      const { error } = await supabase
        .from('post_reports')
        .insert(newReport);
        
      if (error) throw error;
      
      toast.success('Report submitted successfully');
      setShowReportDialog(false);
      setReportReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report. Please try again.');
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
      // Update post in database
      const { error } = await supabase
        .from('posts')
        .update({
          title: editTitle,
          content: editContent,
          is_edited: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', post.id);
        
      if (error) throw error;
      
      toast.success('Post updated successfully');
      setShowEditDialog(false);
      
      // Update local post (this would typically be handled by a state refresh in the parent)
      // Here we're just showing what would happen
      post.title = editTitle;
      post.content = editContent;
      post.isEdited = true;
      post.updatedAt = new Date();
    } catch (error) {
      console.error('Error updating post:', error);
      toast.error('Failed to update post. Please try again.');
    }
  };
  
  const handleDeletePost = () => {
    setShowDeleteConfirm(true);
    setShowContextMenu(false);
  };
  
  const confirmDelete = async () => {
    try {
      // Delete post
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
        
      if (error) throw error;
      
      toast.success('Post deleted successfully');
      setShowDeleteConfirm(false);
      
      // In a real app, we would either:
      // 1. Remove the post from the feed via a callback to the parent component
      // 2. Redirect the user if this is a single post view
      
      // For now, we'll just notify the parent somehow that the post was deleted
      // This is a placeholder for actual implementation
      document.dispatchEvent(new CustomEvent('post-deleted', { detail: { postId: post.id } }));
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post. Please try again.');
    }
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

  useEffect(() => {
    if (error) {
      toast.error(error);
      setError(null);
    }
  }, [error]);

  // Add proper accessibility attributes
  return (
    <div 
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4"
      role="article"
      aria-labelledby={`post-${post.id}-title`}
    >
      {/* Post Header */}
      <div className="p-4 flex items-start">
        <Avatar 
          className="w-10 h-10 mr-3 cursor-pointer"
          onClick={(e) => navigateToUserProfile(post.user.id, e)}
          role="img"
          aria-label={`${post.user.displayName}'s profile picture`}
        >
          <AvatarImage src={post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} alt={post.user.displayName} />
          <AvatarFallback>{post.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center">
            <h3 
              id={`post-${post.id}-title`}
              className="font-medium text-gray-900 cursor-pointer hover:text-cendy-primary"
              onClick={(e) => navigateToUserProfile(post.user.id, e)}
            >
              {post.user.displayName}
            </h3>
            <span className="text-gray-500 text-sm ml-2" aria-label={`Posted ${formattedTime} ago`}>
              {formattedTime}
            </span>
            {post.isEdited && (
              <span className="text-gray-500 text-xs ml-2" aria-label="This post has been edited">
                (Edited)
              </span>
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
        aria-label="Post content. Long press or right click for more options."
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

      {/* Share Sheet Dialog - update with copy link functionality */}
      <Dialog open={showShareSheet} onOpenChange={setShowShareSheet}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-center font-medium">Share this post</h3>
          </div>
          <div className="p-6 grid grid-cols-4 gap-4">
            <ShareOption 
              icon="facebook" 
              label="Facebook" 
              onClick={() => {
                window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin + '/post/' + post.id)}`, '_blank');
                setShowShareSheet(false);
              }} 
            />
            <ShareOption 
              icon="twitter" 
              label="Twitter" 
              onClick={() => {
                window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.origin + '/post/' + post.id)}&text=${encodeURIComponent(post.title)}`, '_blank');
                setShowShareSheet(false);
              }} 
            />
            <ShareOption 
              icon="linkedin" 
              label="LinkedIn" 
              onClick={() => {
                window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.origin + '/post/' + post.id)}`, '_blank');
                setShowShareSheet(false);
              }} 
            />
            <ShareOption 
              icon="copy" 
              label="Copy Link" 
              onClick={handleCopyLink}
            />
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

      {/* Show loading overlay when needed */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center z-50">
            <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
          </div>
        )}
      </div>
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

// Memoize context menu item for better performance
const ContextMenuItem = memo<ContextMenuItemProps>(({ icon, label, onClick, className }) => {
  return (
    <button 
      className={`w-full px-3 py-2.5 flex items-center hover:bg-gray-100 transition-colors ${className || 'text-gray-700'}`}
      onClick={onClick}
    >
      <span className="mr-2 text-gray-500">{icon}</span>
      <span>{label}</span>
    </button>
  );
});
ContextMenuItem.displayName = 'ContextMenuItem';

// Share Option Component
interface ShareOptionProps {
  icon: 'facebook' | 'twitter' | 'linkedin' | 'copy';
  label: string;
}

// Memoize share option for better performance
const ShareOption: React.FC<ShareOptionProps & { onClick?: () => void }> = memo(({ icon, label, onClick }) => {
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
    <button 
      className="flex flex-col items-center hover:opacity-80 transition-opacity"
      onClick={onClick}
      aria-label={`Share on ${label}`}
    >
      <div className={`w-12 h-12 rounded-full ${iconColorClass} flex items-center justify-center mb-1`}>
        {iconElement}
      </div>
      <span className="text-xs text-gray-700">{label}</span>
    </button>
  );
});
ShareOption.displayName = 'ShareOption';

export default PostCard;
