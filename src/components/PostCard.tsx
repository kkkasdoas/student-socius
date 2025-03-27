
import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, format, differenceInDays } from 'date-fns';
import {
  ThumbsUp,
  Heart,
  Smile,
  MessageCircle,
  Share,
  MoreVertical,
  Bookmark,
  Flag,
  Facebook as FacebookIcon,
  Twitter as TwitterIcon,
  Linkedin as LinkedinIcon,
  Link2 as Link2Icon,
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from '@/contexts/AuthContext';
import { Post, Reaction } from '@/types';
import { useNavigate } from 'react-router-dom';

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
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
  }, [post.reactions, currentUser?.id]);

  const totalReactions = Object.values(reactionGroups).reduce((sum, count) => sum + count, 0);

  const hasReacted = (type: string) => {
    return userReactions.some(reaction => reaction.type === type);
  };

  const handleReaction = (type: string) => {
    // In a real app, this would send the reaction to the server
    console.log('Reacted with:', type);
  };

  // Format timestamp
  const formattedTime = formatTimeAgo(new Date(post.createdAt));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-4">
      {/* Post Header */}
      <div className="p-4 flex items-start">
        <Avatar className="w-10 h-10 mr-3">
          <AvatarImage src={post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} alt={post.user.displayName} />
          <AvatarFallback>{post.user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center">
            <h3 className="font-medium text-gray-900">{post.user.displayName}</h3>
            <span className="text-gray-500 text-sm ml-2">{formattedTime}</span>
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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="-mr-2">
              <MoreVertical className="h-5 w-5 text-gray-500" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem>
              <Bookmark className="mr-2 h-4 w-4" />
              <span>Save post</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Share className="mr-2 h-4 w-4" />
              <span>Share</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Flag className="mr-2 h-4 w-4" />
              <span>Report</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Post Title */}
      <div
        className="px-4 pb-2 text-lg font-semibold cursor-pointer hover:text-cendy-primary"
        onClick={() => navigate(`/chatroom/${post.conversationId}`)}
      >
        {post.title}
      </div>

      {/* Post Content */}
      <div
        className="px-4 pb-4 text-gray-700 cursor-pointer"
        onClick={() => navigate(`/chatroom/${post.conversationId}`)}
      >
        {post.content}
      </div>

      {/* Post Image (if available) */}
      {post.imageUrl && (
        <div
          className="cursor-pointer"
          onClick={() => navigate(`/chatroom/${post.conversationId}`)}
        >
          <img src={post.imageUrl} alt="Post content" className="w-full h-auto max-h-[500px] object-cover" />
        </div>
      )}

      {/* Reactions Section */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center text-gray-500 text-sm">
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
            {totalReactions > 0 && (
              <>{totalReactions} {totalReactions === 1 ? 'reaction' : 'reactions'}</>
            )}
          </span>
        </div>
      </div>

      {/* Reaction Buttons */}
      <div className="flex items-center justify-around px-4 py-2 border-t border-gray-100">
        <Button variant="ghost" size="sm" className="flex-1 text-gray-500" onClick={() => handleReaction('like')}>
          <ThumbsUp className={`mr-1 h-4 w-4 ${hasReacted('like') ? 'text-blue-500 fill-blue-500' : ''}`} />
          <span>Like</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-gray-500" onClick={() => navigate(`/chatroom/${post.conversationId}`)}>
          <MessageCircle className="mr-1 h-4 w-4" />
          <span>Chat</span>
        </Button>
        <Button variant="ghost" size="sm" className="flex-1 text-gray-500" onClick={() => setShowShareSheet(true)}>
          <Share className="mr-1 h-4 w-4" />
          <span>Share</span>
        </Button>
      </div>

      {/* Share Sheet */}
      <Dialog open={showShareSheet} onOpenChange={setShowShareSheet}>
        <DialogContent className="sm:max-w-md rounded-xl p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <DialogTitle className="text-center">Share this post</DialogTitle>
          </div>
          <div className="p-6 grid grid-cols-4 gap-4">
            <Button variant="ghost" className="flex flex-col items-center rounded-lg p-3 h-auto">
              <FacebookIcon className="h-8 w-8 text-blue-600 mb-1" />
              <span className="text-xs">Facebook</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center rounded-lg p-3 h-auto">
              <TwitterIcon className="h-8 w-8 text-blue-400 mb-1" />
              <span className="text-xs">Twitter</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center rounded-lg p-3 h-auto">
              <LinkedinIcon className="h-8 w-8 text-blue-700 mb-1" />
              <span className="text-xs">LinkedIn</span>
            </Button>
            <Button variant="ghost" className="flex flex-col items-center rounded-lg p-3 h-auto">
              <Link2Icon className="h-8 w-8 text-gray-800 mb-1" />
              <span className="text-xs">Copy Link</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostCard;

