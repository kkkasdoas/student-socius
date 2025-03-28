
import React, { useState, useEffect, useRef } from 'react';
import { Post, ChannelType, GenderFilter } from '@/types';
import type { FilterOption } from '@/types';
import { 
  mockCampusGeneralPosts, 
  mockForumPosts, 
  mockCampusCommunityPosts, 
  mockCommunityPosts
} from '@/utils/mockData';
import PostCard from './PostCard';
import { Search, Filter, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger 
} from "@/components/ui/popover";

interface ChannelTabsProps {
  university: string;
}

const ChannelTabs: React.FC<ChannelTabsProps> = ({ university }) => {
  const navigate = useNavigate();
  const [activeChannel, setActiveChannel] = useState<ChannelType>('CampusGeneral');
  const [filterOption, setFilterOption] = useState<FilterOption>('Hot');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  
  // Handle scroll events to hide/show header
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down - hide header
        setShowHeader(false);
      } else {
        // Scrolling up - show header
        setShowHeader(true);
      }
      
      lastScrollY.current = currentScrollY;
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Get the active channel from session storage on component mount
  useEffect(() => {
    const storedChannel = sessionStorage.getItem('selectedChannel') as ChannelType | null;
    if (storedChannel) {
      setActiveChannel(storedChannel);
    }
  }, []);
  
  // Get posts based on active channel and user's university
  const getPosts = (): Post[] => {
    const userUniversity = currentUser?.university || university;
    
    let posts: Post[] = [];
    
    // Fetch posts based on channel type and university
    switch (activeChannel) {
      case 'CampusGeneral':
        // Filter posts for the user's university
        posts = mockCampusGeneralPosts.filter(post => 
          post.university === userUniversity && post.channelType === 'CampusGeneral'
        );
        break;
      case 'Forum':
        // Forum posts are for all universities
        posts = mockForumPosts.filter(post => 
          post.channelType === 'Forum'
        );
        break;
      case 'CampusCommunity':
        // Filter posts for the user's university
        posts = mockCampusCommunityPosts.filter(post => 
          post.university === userUniversity && post.channelType === 'CampusCommunity'
        );
        break;
      case 'Community':
        // Community posts are for all universities
        posts = mockCommunityPosts.filter(post => 
          post.channelType === 'Community'
        );
        break;
      default:
        break;
    }
    
    return posts;
  };
  
  // Filter and sort posts
  const filteredPosts = getPosts().filter(post => {
    // Search filter
    if (searchQuery) {
      return post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
             post.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    // Category filter for Campus General and Forum
    if ((activeChannel === 'CampusGeneral' || activeChannel === 'Forum') && filterOption !== 'Hot' && filterOption !== 'New') {
      return post.category === filterOption;
    }
    
    return true;
  }).sort((a, b) => {
    // Sort based on filter option
    if (filterOption === 'Hot') {
      return (b.reactions?.length || 0) - (a.reactions?.length || 0);
    } else if (filterOption === 'New') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    return 0;
  });
  
  // Handle navigating to create post page
  const handleCreatePost = () => {
    navigate('/create-post', { 
      state: { 
        channelType: activeChannel,
        university: activeChannel === 'Forum' || activeChannel === 'Community' ? 'all' : currentUser?.university
      }
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* New Top Navigation - Hide on scroll down */}
      <div 
        ref={headerRef}
        className={`flex flex-col bg-white border-b border-cendy-border shadow-sm transition-transform duration-300 sticky top-0 z-20 ${
          showHeader ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        {/* Channel Selector */}
        <div className="p-3 flex items-center gap-2">
          <Select value={activeChannel} onValueChange={(value) => {
            setActiveChannel(value as ChannelType);
            sessionStorage.setItem('selectedChannel', value);
          }}>
            <SelectTrigger className="w-full bg-gray-100 rounded-xl shadow-none border-none h-12">
              <SelectValue placeholder="Select Channel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CampusGeneral">Campus General</SelectItem>
              <SelectItem value="Forum">Forum</SelectItem>
              <SelectItem value="CampusCommunity">Campus Community</SelectItem>
              <SelectItem value="Community">Community</SelectItem>
            </SelectContent>
          </Select>

          {/* Create Post Button */}
          <button 
            onClick={handleCreatePost}
            className="p-3 bg-cendy-primary text-white rounded-full"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button className="p-3 bg-gray-100 rounded-full">
            <Search className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        {/* Filter Options */}
        <div className="px-3 pb-3 flex items-center gap-2">
          {/* Sort Option */}
          <Select value={filterOption} onValueChange={(value) => setFilterOption(value as FilterOption)}>
            <SelectTrigger className="flex-1 bg-gray-100 rounded-xl shadow-none border-none h-12">
              <div className="flex items-center">
                <span>{filterOption}</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Hot">Hot</SelectItem>
              <SelectItem value="New">New</SelectItem>
            </SelectContent>
          </Select>

          {/* Category Option */}
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-1 h-12 px-4 bg-gray-100 rounded-xl flex items-center justify-between">
                <span>Categories</span>
                <ChevronDown className="ml-1 h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-48">
              <div className="grid gap-1">
                {(activeChannel === 'CampusGeneral' || activeChannel === 'Forum') ? (
                  <>
                    <FilterButton 
                      label="Study" 
                      active={filterOption === 'Study'} 
                      onClick={() => setFilterOption('Study')} 
                    />
                    <FilterButton 
                      label="Fun" 
                      active={filterOption === 'Fun'} 
                      onClick={() => setFilterOption('Fun')} 
                    />
                    <FilterButton 
                      label="Drama" 
                      active={filterOption === 'Drama'} 
                      onClick={() => setFilterOption('Drama')} 
                    />
                  </>
                ) : (
                  <>
                    <FilterButton 
                      label="All" 
                      active={genderFilter === 'All'} 
                      onClick={() => setGenderFilter('All')} 
                    />
                    <FilterButton 
                      label="Male" 
                      active={genderFilter === 'Male'} 
                      onClick={() => setGenderFilter('Male')} 
                    />
                    <FilterButton 
                      label="Female" 
                      active={genderFilter === 'Female'} 
                      onClick={() => setGenderFilter('Female')} 
                    />
                    <FilterButton 
                      label="L" 
                      active={genderFilter === 'L'} 
                      onClick={() => setGenderFilter('L')} 
                    />
                    <FilterButton 
                      label="G" 
                      active={genderFilter === 'G'} 
                      onClick={() => setGenderFilter('G')} 
                    />
                    <FilterButton 
                      label="B" 
                      active={genderFilter === 'B'} 
                      onClick={() => setGenderFilter('B')} 
                    />
                    <FilterButton 
                      label="T" 
                      active={genderFilter === 'T'} 
                      onClick={() => setGenderFilter('T')} 
                    />
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Posts List */}
      <div className="flex-1 overflow-y-auto bg-cendy-bg">
        {filteredPosts.length > 0 ? (
          <div>
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p>No posts found</p>
            <button onClick={handleCreatePost} className="mt-2 text-cendy-primary text-sm">Create a post</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Filter Button Component
interface FilterButtonProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterButton: React.FC<FilterButtonProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-3 py-2 text-sm rounded transition-colors ${
        active 
          ? 'bg-cendy-primary/10 text-cendy-primary font-medium' 
          : 'hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
};

export default ChannelTabs;
