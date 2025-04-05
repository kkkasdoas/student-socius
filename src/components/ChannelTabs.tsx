import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Post, ChannelType, GenderFilter } from '@/types';
import type { FilterOption } from '@/types';
import PostCard from './PostCard';
import { Search, Filter, ChevronDown, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
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

// Create a new wrapper component to handle initialization
const ChannelTabsWrapper: React.FC<ChannelTabsProps> = ({ university }) => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initialChannel, setInitialChannel] = useState<ChannelType | null>(null);
  
  // On component mount, read from sessionStorage BEFORE rendering the actual component
  useEffect(() => {
    const storedChannel = sessionStorage.getItem('selectedChannel') as ChannelType | null;
    setInitialChannel(storedChannel || 'CampusGeneral');
    setIsInitialized(true);
  }, []);
  
  // Only render the actual component after we've determined the correct initial channel
  if (!isInitialized) {
    return (
      <div className="flex justify-center items-center h-screen bg-cendy-bg">
        <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
      </div>
    );
  }
  
  // Now render the actual component with the correct initial channel
  return <ChannelTabsWithInitialChannel university={university} initialChannel={initialChannel!} />;
};

// Modify the original component to accept initialChannel as a prop instead of using default state
interface ChannelTabsWithInitialChannelProps extends ChannelTabsProps {
  initialChannel: ChannelType;
}

const ChannelTabsWithInitialChannel: React.FC<ChannelTabsWithInitialChannelProps> = ({ 
  university, 
  initialChannel 
}) => {
  const navigate = useNavigate();
  // Use the provided initialChannel instead of the default value
  const [activeChannel, setActiveChannel] = useState<ChannelType>(initialChannel);
  const [filterOption, setFilterOption] = useState<FilterOption>('New');
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const { currentUser } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageNumber, setPageNumber] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver>();
  const initialFetchCompleted = useRef(false);
  const channelChangeInProgress = useRef(false);
  const previousRequestParams = useRef({
    channel: '',
    filter: '',
    category: '',
    page: 0
  });
  
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
      channelChangeInProgress.current = true;
      setActiveChannel(storedChannel);
    } else {
      // Only fetch if no channel is stored (first visit)
      initialFetchCompleted.current = true;
    }
  }, []);
  
  // Fetch posts from Supabase when activeChannel, filterOption, or category changes
  useEffect(() => {
    if (initialFetchCompleted.current) {
      setPosts([]);
      setPageNumber(1);
      setHasMore(true);
      
      // Don't need to call fetchPosts() here as it will be triggered by the state changes
    } else if (channelChangeInProgress.current) {
      // This is the initial channel change from sessionStorage
      channelChangeInProgress.current = false;
      initialFetchCompleted.current = true;
      setPosts([]);
      setPageNumber(1);
      setHasMore(true);
    }
  }, [activeChannel, filterOption, categoryFilter]);
  
  // Fetch posts when pageNumber changes
  useEffect(() => {
    // Create an object representing current request parameters
    const currentParams = {
      channel: activeChannel,
      filter: filterOption,
      category: categoryFilter || '',
      page: pageNumber
    };
    
    // Prevent duplicate calls with same parameters
    const paramsChanged = 
      currentParams.channel !== previousRequestParams.current.channel ||
      currentParams.filter !== previousRequestParams.current.filter ||
      currentParams.category !== previousRequestParams.current.category ||
      currentParams.page !== previousRequestParams.current.page;
    
    // Only fetch if we've completed the initial setup and parameters changed
    if (initialFetchCompleted.current && paramsChanged) {
      previousRequestParams.current = {...currentParams};
      fetchPosts();
    }
  }, [pageNumber, activeChannel, filterOption, categoryFilter]);
  
  // Create a ref to track the actual request being made
  const currentRequest = useRef<{
    id: number;
    params: {
      channel: string;
      filter: string;
      category: string;
      page: number;
    }
  } | null>(null);
  
  let requestCounter = useRef(0);
  
  // Simplify to a single fetch useEffect for both filter changes and pagination
  useEffect(() => {
    // Reset posts when filter parameters change, not on pagination
    const isFilterChange = activeChannel !== initialChannel || 
                          filterOption !== 'New' || 
                          categoryFilter !== undefined;
    
    if (isFilterChange && pageNumber === 1) {
      setPosts([]);
      setHasMore(true);
    }
    
    // Generate unique ID for this request
    const requestId = ++requestCounter.current;
    
    // Create request parameters
    const requestParams = {
      channel: activeChannel,
      filter: filterOption,
      category: categoryFilter || '',
      page: pageNumber
    };
    
    // Store this request as the current one
    currentRequest.current = {
      id: requestId,
      params: requestParams
    };
    
    // Call fetchPosts with the request ID for tracking
    fetchPosts(requestId, requestParams);
  }, [activeChannel, filterOption, categoryFilter, pageNumber]);
  
  // Modified fetchPosts to handle request tracking
  const fetchPosts = async (
    requestId: number, 
    params: {
      channel: string;
      filter: string;
      category: string;
      page: number;
    }
  ) => {
    if (!hasMore && params.page > 1) return;
    
    try {
      setLoading(true);
      
      // Check if this request is still the current one
      if (currentRequest.current?.id !== requestId) {
        console.log("Cancelling outdated request:", requestId);
        return; // Cancel if a newer request has been made
      }
      
      // Check if the active channel is Forum or Community, use "all" instead of user's university
      const universityToUse = params.channel === 'Forum' || params.channel === 'Community' 
        ? 'all' 
        : currentUser?.university || university;
      
      // Store university in session storage
      sessionStorage.setItem('userUniversity', universityToUse);
      
      console.log("Making API call:", {
        university_input: universityToUse,
        channel_input: params.channel,
        sort_by: params.filter.toLowerCase(),
        category_input: params.category || null,
        page_number: params.page
      });
      
      // Call the Supabase function with the required parameters
      const { data, error } = await supabase.rpc('get_filtered_posts_with_reactions', {
        university_input: universityToUse,
        channel_input: params.channel,
        sort_by: params.filter.toLowerCase(),
        category_input: params.category || null,
        page_number: params.page
      });
      
      // Check again if this request is still current (in case another request started during the fetch)
      if (currentRequest.current?.id !== requestId) {
        console.log("Discarding results from outdated request:", requestId);
        return;
      }
      
      if (error) {
        throw error;
      }
      
      if (data) {
        if (data.length === 0) {
          setHasMore(false);
          return;
        }
        
        // Transform the data to match our Post type
        const transformedPosts: Post[] = data.map(post => ({
          id: post.post_id,
          userId: '', // Not provided in the function response
          title: post.post_title,
          content: post.post_content,
          university: universityToUse, // Use the current university
          conversationId: '', // Not provided in the function response
          imageUrl: '', // Not provided in the function response
          channelType: params.channel, // Use the current channel
          category: post.post_category,
          isEdited: post.post_is_edited,
          createdAt: new Date(post.post_created_at),
          updatedAt: new Date(post.post_updated_at),
          user: {
            id: '', // Not provided in the function response
            displayName: post.user_display_name,
            profilePictureUrl: post.user_profile_picture_url,
            university: universityToUse,
            createdAt: new Date(), // Not provided in the function response
            updatedAt: new Date()  // Not provided in the function response
          },
          reactions: [], // The function already provides aggregated reaction data
          totalReactions: post.total_reactions,
          topReactions: [
            { type: post.top_reaction_1_type, count: post.top_reaction_1_count },
            { type: post.top_reaction_2_type, count: post.top_reaction_2_count }
          ].filter(r => r.type) // Filter out undefined reactions
        }));
        
        setPosts(prevPosts => {
          if (params.page === 1) {
            return transformedPosts;
          } else {
            // Filter out any duplicates
            const existingIds = new Set(prevPosts.map(post => post.id));
            const uniqueNewPosts = transformedPosts.filter(post => !existingIds.has(post.id));
            return [...prevPosts, ...uniqueNewPosts];
          }
        });
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Filter posts by search query
  const filteredPosts = posts.filter(post => {
    // Search filter
    if (searchQuery) {
      return post.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
             post.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    
    return true;
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

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  // Handle category filter change
  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === 'All' ? undefined : value);
  };

  // Update the lastPostElementRef callback to prevent premature pagination
  const lastPostElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading || !initialFetchCompleted.current) return;
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && posts.length >= 10) {
        setPageNumber(prevPageNumber => prevPageNumber + 1);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, posts.length]);

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

          <div className="relative p-3 bg-gray-100 rounded-full flex items-center">
            <Search className="w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className="ml-2 bg-transparent border-none focus:outline-none w-0 focus:w-40 transition-all duration-300 absolute"
              onFocus={(e) => e.target.parentElement?.classList.add('w-40')}
              onBlur={(e) => {
                if (!e.target.value) {
                  e.target.parentElement?.classList.remove('w-40');
                }
              }}
            />
          </div>
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
          {(activeChannel === 'CampusGeneral' || activeChannel === 'Forum') && (
            <Select value={categoryFilter || 'All'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="flex-1 bg-gray-100 rounded-xl shadow-none border-none h-12">
                <div className="flex items-center">
                  <span>{categoryFilter || 'All'}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Study">Study</SelectItem>
                <SelectItem value="Fun">Fun</SelectItem>
                <SelectItem value="Confess">Confess</SelectItem>
                <SelectItem value="Work">Work</SelectItem>
                <SelectItem value="Q&A">Q&A</SelectItem>
                <SelectItem value="Drama">Drama</SelectItem>
                <SelectItem value="Room/Roomate">Room/Roomate</SelectItem>
                <SelectItem value="Items for Sale">Items for Sale</SelectItem>
                <SelectItem value="Missing Items">Missing Items</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Category Option for Community channels */}
          {(activeChannel === 'CampusCommunity' || activeChannel === 'Community') && (
            <Select value={categoryFilter || 'All'} onValueChange={handleCategoryChange}>
              <SelectTrigger className="flex-1 bg-gray-100 rounded-xl shadow-none border-none h-12">
                <div className="flex items-center">
                  <span>{categoryFilter || 'All'}</span>
                  <ChevronDown className="ml-1 h-4 w-4" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="L">L</SelectItem>
                <SelectItem value="G">G</SelectItem>
                <SelectItem value="B">B</SelectItem>
                <SelectItem value="T">T</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-cendy-bg">
        {loading && pageNumber === 1 ? (
          <div className="flex justify-center items-center h-40">
            <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
          </div>
        ) : filteredPosts.length > 0 ? (
          <div>
            {filteredPosts.map((post, index) => {
              if (filteredPosts.length === index + 1) {
                return (
                  <div key={post.id} ref={lastPostElementRef}>
                    <PostCard post={post} />
                  </div>
                );
              } else {
                return <PostCard key={post.id} post={post} />;
              }
            })}
            {loading && pageNumber > 1 && (
              <div className="flex justify-center items-center h-16 my-4">
                <div className="loader animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-cendy-primary"></div>
              </div>
            )}
            {!hasMore && filteredPosts.length > 0 && (
              <div className="text-center py-4 text-gray-500">
                No more posts to load
              </div>
            )}
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

export default ChannelTabsWrapper;