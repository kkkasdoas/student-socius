
import React, { useState } from 'react';
import { Post, ChannelType } from '@/types';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow, differenceInDays, format } from 'date-fns';
import { Heart, MessageCircle, Share2, MoreHorizontal } from 'lucide-react';

interface PostCardProps {
  post: Post;
  channelType: ChannelType;
}

const PostCard: React.FC<PostCardProps> = ({ post, channelType }) => {
  const navigate = useNavigate();
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.reactions?.length || 0);
  
  const handlePostClick = () => {
    if (post.chatroomId) {
      navigate(`/chatroom/${post.chatroomId}`);
    } else if (channelType === 'CampusGeneral' || channelType === 'Forum') {
      navigate(`/chatroom/${post.id}`);
    } else {
      navigate(`/messages/${post.userId}`);
    }
  };
  
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (liked) {
      setLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      setLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };
  
  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    handlePostClick();
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Share functionality would go here
  };

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
  
  // Determine if reactions and comments should be shown
  const showInteractions = channelType === 'CampusGeneral' || channelType === 'Forum';
  
  return (
    <div 
      className="bg-white w-full overflow-hidden border-b border-gray-200"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="p-4 flex items-center">
        <div className="relative">
          <img 
            src={post.user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
            alt={post.user.displayName} 
            className="w-10 h-10 rounded-full object-cover border border-gray-200"
          />
          {post.user.verificationStatus === 'verified' && (
            <div className="absolute bottom-0 right-0 bg-cendy-primary rounded-full w-4 h-4 flex items-center justify-center border-2 border-white">
              <span className="text-white text-[8px]">✓</span>
            </div>
          )}
        </div>
        <div className="ml-3 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm text-gray-800">{post.user.displayName}</p>
            <span className="text-xs text-gray-500">{formatTimeAgo(new Date(post.createdAt))}</span>
          </div>
          <div className="flex items-center text-xs">
            {post.category && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{post.category}</span>
            )}
          </div>
        </div>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          onClick={(e) => {
            e.stopPropagation();
            // More options menu would go here
          }}
        >
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      {/* Post Title */}
      <div className="px-4 pb-2">
        <h2 className="text-lg font-semibold text-gray-900">{post.title}</h2>
      </div>
      
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-line">{post.content}</p>
      </div>
      
      {/* Post Image (if exists) */}
      {post.imageUrl && (
        <div className="w-full">
          <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full h-auto max-h-[500px] object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Post Stats & Actions - Only shown for CampusGeneral and Forum */}
      {showInteractions && (
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex gap-6">
            <div className="flex items-center gap-1.5">
              <button 
                className={`flex items-center justify-center ${liked ? 'text-cendy-primary' : 'text-gray-600'}`}
                onClick={handleLike}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              {likesCount > 0 && (
                <span className="text-sm text-gray-600 font-medium">{likesCount}</span>
              )}
            </div>
            
            <div className="flex items-center gap-1.5">
              <button 
                className="flex items-center justify-center text-gray-600"
                onClick={handleComment}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              {post.comments?.length > 0 && (
                <span className="text-sm text-gray-600 font-medium">{post.comments.length}</span>
              )}
            </div>
          </div>
          
          <button 
            className="p-1 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard;
