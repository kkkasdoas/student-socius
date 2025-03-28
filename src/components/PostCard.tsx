
import React, { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Post, Reaction } from '@/types';
import { Heart, MessageCircle, MoreHorizontal, Share, Bookmark, Flag, X, ThumbsUp, EyeOff } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { addReaction, removeReaction, savePost, unsavePost, hidePost, reportPost } from '@/utils/supabaseHelpers';

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { currentUser } = useAuth();
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [localReactions, setLocalReactions] = useState<Reaction[]>(post.reactions || []);
  
  const getReactionCount = (type: Reaction['type']) => {
    return localReactions.filter(reaction => reaction.type === type).length;
  };
  
  const hasUserReacted = (type: Reaction['type']) => {
    return currentUser ? localReactions.some(reaction => 
      reaction.user_id === currentUser.id && reaction.type === type
    ) : false;
  };
  
  const handleReaction = async (type: Reaction['type']) => {
    if (!currentUser) {
      toast.error('Please sign in to react to posts');
      return;
    }
    
    const hasReacted = hasUserReacted(type);
    
    if (hasReacted) {
      // Remove reaction
      const success = await removeReaction(post.id, currentUser.id, type);
      
      if (success) {
        setLocalReactions(prev => prev.filter(
          reaction => !(reaction.user_id === currentUser.id && reaction.type === type)
        ));
      }
    } else {
      // Add reaction
      const newReaction = await addReaction(post.id, currentUser.id, type);
      
      if (newReaction) {
        setLocalReactions(prev => [...prev, newReaction]);
      }
    }
  };
  
  const handleSavePost = async () => {
    if (!currentUser) {
      toast.error('Please sign in to save posts');
      return;
    }
    
    const success = await savePost(currentUser.id, post.id);
    
    if (success) {
      toast.success('Post saved successfully');
    }
  };
  
  const handleHidePost = async () => {
    if (!currentUser) {
      toast.error('Please sign in to hide posts');
      return;
    }
    
    const success = await hidePost(currentUser.id, post.id);
    
    if (success) {
      toast.success('Post hidden successfully');
    }
  };
  
  const handleReport = () => {
    if (!currentUser) {
      toast.error('Please sign in to report posts');
      return;
    }
    
    setShowReportDialog(true);
  };
  
  const submitReport = async () => {
    if (!currentUser) return;
    
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for reporting');
      return;
    }
    
    const success = await reportPost(currentUser.id, post.id, reportReason);
    
    if (success) {
      toast.success('Post reported successfully');
      setShowReportDialog(false);
      setReportReason('');
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      {/* Post Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center">
          <Avatar className="h-10 w-10 mr-3">
            <AvatarImage src={post.user?.profile_picture_url} alt={post.user?.display_name} />
            <AvatarFallback>
              {post.user?.display_name.substring(0, 2).toUpperCase() || 'UN'}
            </AvatarFallback>
          </Avatar>
          
          <div>
            <h3 className="font-medium text-gray-900">
              {post.user?.display_name || 'Unknown User'}
              {post.user?.verification_status === 'verified' && (
                <span className="ml-1 inline-block bg-blue-100 text-blue-500 text-xs px-1 rounded-sm">✓</span>
              )}
            </h3>
            <p className="text-xs text-gray-500">
              {format(new Date(post.created_at), 'MMM d, yyyy • h:mm a')}
              {post.is_edited && <span className="ml-1">(edited)</span>}
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="text-gray-500 hover:text-gray-700 focus:outline-none">
              <MoreHorizontal size={18} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleSavePost}>
              <Bookmark className="mr-2 h-4 w-4" />
              <span>Save Post</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleHidePost}>
              <EyeOff className="mr-2 h-4 w-4" />
              <span>Hide Post</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleReport} className="text-red-500">
              <Flag className="mr-2 h-4 w-4" />
              <span>Report Post</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Post Content */}
      <div className="mt-3">
        <h2 className="text-lg font-semibold">{post.title}</h2>
        <p className="mt-1 text-gray-800">{post.content}</p>
        
        {post.image_url && (
          <div className="mt-3">
            <img 
              src={post.image_url} 
              alt="Post content" 
              className="rounded-lg w-full max-h-96 object-cover"
            />
          </div>
        )}
      </div>
      
      {/* Post Actions */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <button 
            className={`flex items-center text-sm ${hasUserReacted('like') ? 'text-blue-500' : 'text-gray-500'} hover:text-blue-500`}
            onClick={() => handleReaction('like')}
          >
            <ThumbsUp className="mr-1 h-5 w-5" />
            <span>{getReactionCount('like')}</span>
          </button>
          
          <button 
            className={`flex items-center text-sm ${hasUserReacted('heart') ? 'text-red-500' : 'text-gray-500'} hover:text-red-500`}
            onClick={() => handleReaction('heart')}
          >
            <Heart className="mr-1 h-5 w-5" />
            <span>{getReactionCount('heart')}</span>
          </button>
          
          <button className="flex items-center text-sm text-gray-500">
            <MessageCircle className="mr-1 h-5 w-5" />
            <span>0</span>
          </button>
        </div>
        
        <button className="text-gray-500 hover:text-gray-700">
          <Share className="h-5 w-5" />
        </button>
      </div>
      
      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Post</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-gray-600 mb-4">
              Please tell us why you're reporting this post. Your report will be kept anonymous.
            </p>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Describe why you're reporting this post..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowReportDialog(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={submitReport}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostCard;
