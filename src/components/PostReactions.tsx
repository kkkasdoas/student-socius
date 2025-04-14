import React from 'react';
import { ReactionType } from '@/types';

interface ReactionItem {
  type: string;
  count: number;
}

interface PostReactionsProps {
  reactions: ReactionItem[];
  userReaction: string | null;
  onReactionClick?: (type: ReactionType) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  maxDisplay?: number;
}

/**
 * PostReactions - Displays reactions in a Telegram-like style
 * Shows emoji with count beside it
 */
const PostReactions: React.FC<PostReactionsProps> = ({
  reactions,
  userReaction,
  onReactionClick,
  className = '',
  size = 'md',
  maxDisplay = 6
}) => {
  // Skip rendering if no reactions
  if (!reactions || reactions.length === 0) {
    return null;
  }

  // Get the text size based on the size prop
  const textSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];

  // Get the padding based on the size prop
  const padding = {
    sm: 'py-0.5 px-1.5',
    md: 'py-1 px-2', 
    lg: 'py-1.5 px-3'
  }[size];

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {reactions
        .slice(0, maxDisplay)
        .map(({type, count}) => {
          let emoji;
          let bgColor;
          let textColor;
          let isActive = userReaction === type;
          
          switch (type) {
            case 'like':
              emoji = '👍';
              bgColor = isActive ? 'bg-blue-100' : 'bg-gray-100';
              textColor = isActive ? 'text-blue-600' : 'text-gray-600';
              break;
            case 'heart':
              emoji = '❤️';
              bgColor = isActive ? 'bg-red-100' : 'bg-gray-100';
              textColor = isActive ? 'text-red-600' : 'text-gray-600';
              break;
            case 'laugh':
              emoji = '😂';
              bgColor = isActive ? 'bg-yellow-100' : 'bg-gray-100';
              textColor = isActive ? 'text-yellow-600' : 'text-gray-600';
              break;
            case 'wow':
              emoji = '😲';
              bgColor = isActive ? 'bg-yellow-100' : 'bg-gray-100';
              textColor = isActive ? 'text-yellow-600' : 'text-gray-600';
              break;
            case 'sad':
              emoji = '😢';
              bgColor = isActive ? 'bg-blue-100' : 'bg-gray-100';
              textColor = isActive ? 'text-blue-600' : 'text-gray-600';
              break;
            case 'angry':
              emoji = '😡';
              bgColor = isActive ? 'bg-red-100' : 'bg-gray-100';
              textColor = isActive ? 'text-red-600' : 'text-gray-600';
              break;
            default:
              emoji = '👍';
              bgColor = 'bg-gray-100';
              textColor = 'text-gray-600';
          }
          
          const reactionButton = (
            <div
              key={type}
              className={`${bgColor} ${textColor} rounded-full ${padding} flex items-center ${textSize} font-medium ${onReactionClick ? 'cursor-pointer hover:bg-opacity-80' : ''}`}
              onClick={onReactionClick ? () => onReactionClick(type as ReactionType) : undefined}
            >
              <span className="mr-1">{emoji}</span>
              <span>{count}</span>
            </div>
          );
          
          return reactionButton;
        })}
    </div>
  );
};

export default PostReactions; 