
import React, { useState } from 'react';
import { Post, ChannelType } from '@/types';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
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
    if (channelType === 'CampusGeneral' || channelType === 'Forum') {
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
  
  const handleMoreOptions = (e: React.MouseEvent) => {
    e.stopPropagation();
    // More options menu would go here
  };
  
  return (
    <div 
      className="bg-white rounded-xl shadow-sm overflow-hidden transition-all hover:shadow-md hover:translate-y-[-2px] active:translate-y-0 card-hover"
      onClick={handlePostClick}
    >
      {/* Post Header */}
      <div className="p-4 pb-3 flex items-center">
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
          <p className="font-medium text-sm text-gray-800">{post.user.displayName}</p>
          <p className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            {post.category && (
              <span className="ml-1 text-xs text-gray-400">• {post.category}</span>
            )}
          </p>
        </div>
        <button 
          className="p-1.5 hover:bg-gray-100 rounded-full transition-colors"
          onClick={handleMoreOptions}
        >
          <MoreHorizontal className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      
      {/* Post Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-gray-800 whitespace-pre-line">{post.content}</p>
      </div>
      
      {/* Post Image (if exists) */}
      {post.imageUrl && (
        <div className="mt-2 w-full">
          <img 
            src={post.imageUrl} 
            alt="Post content" 
            className="w-full h-auto max-h-96 object-cover"
            loading="lazy"
          />
        </div>
      )}
      
      {/* Post Stats */}
      {(channelType === 'CampusGeneral' || channelType === 'Forum') && (
        <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-sm text-gray-500">
          <span>{likesCount > 0 && `${likesCount} ${likesCount === 1 ? 'reaction' : 'reactions'}`}</span>
          <span>{post.comments?.length > 0 && `${post.comments.length} ${post.comments.length === 1 ? 'comment' : 'comments'}`}</span>
        </div>
      )}
      
      {/* Post Actions */}
      {(channelType === 'CampusGeneral' || channelType === 'Forum') ? (
        <div className="px-2 py-1 border-t border-gray-100 flex">
          <button 
            className={`flex-1 py-2 flex items-center justify-center space-x-2 rounded-md transition-colors ${
              liked ? 'text-cendy-primary' : 'text-gray-500 hover:bg-gray-50'
            }`}
            onClick={handleLike}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            <span className="text-sm font-medium">Like</span>
          </button>
          
          <button 
            className="flex-1 py-2 flex items-center justify-center space-x-2 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
            onClick={handleComment}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="text-sm font-medium">Comment</span>
          </button>
          
          <button 
            className="flex-1 py-2 flex items-center justify-center space-x-2 text-gray-500 rounded-md hover:bg-gray-50 transition-colors"
            onClick={handleShare}
          >
            <Share2 className="w-5 h-5" />
            <span className="text-sm font-medium">Share</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 border-t border-gray-100 flex justify-center">
          <button 
            className="w-full py-2 bg-cendy-primary/10 text-cendy-primary font-medium rounded-md hover:bg-cendy-primary/20 transition-colors"
            onClick={handlePostClick}
          >
            Message
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard;
