
import React, { useState } from 'react';
import { Post, FilterOption, GenderFilter, ChannelType } from '@/types';
import { 
  mockCampusGeneralPosts, 
  mockForumPosts, 
  mockCampusCommunityPosts, 
  mockCommunityPosts 
} from '@/utils/mockData';
import PostCard from './PostCard';
import { Search, Filter } from 'lucide-react';

interface ChannelTabsProps {
  university: string;
}

const ChannelTabs: React.FC<ChannelTabsProps> = ({ university }) => {
  const [activeChannel, setActiveChannel] = useState<ChannelType>('CampusGeneral');
  const [filterOption, setFilterOption] = useState<FilterOption>('Hot');
  const [genderFilter, setGenderFilter] = useState<GenderFilter>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  // Get posts based on active channel
  const getPosts = (): Post[] => {
    switch (activeChannel) {
      case 'CampusGeneral':
        return mockCampusGeneralPosts;
      case 'Forum':
        return mockForumPosts;
      case 'CampusCommunity':
        return mockCampusCommunityPosts;
      case 'Community':
        return mockCommunityPosts;
      default:
        return [];
    }
  };
  
  // Filter and sort posts
  const filteredPosts = getPosts().filter(post => {
    // Search filter
    if (searchQuery) {
      return post.content.toLowerCase().includes(searchQuery.toLowerCase());
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

  // Get filter options based on channel type
  const getFilterOptions = () => {
    if (activeChannel === 'CampusGeneral' || activeChannel === 'Forum') {
      return (
        <div className="flex space-x-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          <FilterPill
            label="Hot"
            active={filterOption === 'Hot'}
            onClick={() => setFilterOption('Hot')}
          />
          <FilterPill
            label="New"
            active={filterOption === 'New'}
            onClick={() => setFilterOption('New')}
          />
          <FilterPill
            label="Study"
            active={filterOption === 'Study'}
            onClick={() => setFilterOption('Study')}
          />
          <FilterPill
            label="Fun"
            active={filterOption === 'Fun'}
            onClick={() => setFilterOption('Fun')}
          />
          <FilterPill
            label="Drama"
            active={filterOption === 'Drama'}
            onClick={() => setFilterOption('Drama')}
          />
        </div>
      );
    } else {
      return (
        <div className="flex space-x-2 overflow-x-auto px-1 pb-1 scrollbar-hide">
          <FilterPill
            label="All"
            active={genderFilter === 'All'}
            onClick={() => setGenderFilter('All')}
          />
          <FilterPill
            label="Male"
            active={genderFilter === 'Male'}
            onClick={() => setGenderFilter('Male')}
          />
          <FilterPill
            label="Female"
            active={genderFilter === 'Female'}
            onClick={() => setGenderFilter('Female')}
          />
          <FilterPill
            label="L"
            active={genderFilter === 'L'}
            onClick={() => setGenderFilter('L')}
          />
          <FilterPill
            label="G"
            active={genderFilter === 'G'}
            onClick={() => setGenderFilter('G')}
          />
          <FilterPill
            label="B"
            active={genderFilter === 'B'}
            onClick={() => setGenderFilter('B')}
          />
          <FilterPill
            label="T"
            active={genderFilter === 'T'}
            onClick={() => setGenderFilter('T')}
          />
        </div>
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Channel Tabs */}
      <div className="flex overflow-x-auto scrollbar-hide border-b border-cendy-border">
        <ChannelTab
          label="Campus General"
          active={activeChannel === 'CampusGeneral'}
          onClick={() => setActiveChannel('CampusGeneral')}
        />
        <ChannelTab
          label="Forum"
          active={activeChannel === 'Forum'}
          onClick={() => setActiveChannel('Forum')}
        />
        <ChannelTab
          label="Campus Community"
          active={activeChannel === 'CampusCommunity'}
          onClick={() => setActiveChannel('CampusCommunity')}
        />
        <ChannelTab
          label="Community"
          active={activeChannel === 'Community'}
          onClick={() => setActiveChannel('Community')}
        />
      </div>
      
      {/* Search and Filter Bar */}
      <div className="p-3 bg-white border-b border-cendy-border">
        <div className="relative flex items-center">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search posts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-cendy-primary/30 transition-all"
          />
          <div className="relative ml-2">
            <button
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4 text-gray-600" />
            </button>
            
            {/* Filter Dropdown */}
            {showFilterDropdown && (
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 animate-fade-in">
                <div className="p-2">
                  <h4 className="text-xs font-medium text-gray-500 mb-1">SORT BY</h4>
                  <div className="space-y-1">
                    <FilterOption 
                      label="Hot" 
                      active={filterOption === 'Hot'} 
                      onClick={() => {
                        setFilterOption('Hot');
                        setShowFilterDropdown(false);
                      }} 
                    />
                    <FilterOption 
                      label="New" 
                      active={filterOption === 'New'} 
                      onClick={() => {
                        setFilterOption('New');
                        setShowFilterDropdown(false);
                      }} 
                    />
                  </div>
                  
                  {(activeChannel === 'CampusGeneral' || activeChannel === 'Forum') && (
                    <>
                      <h4 className="text-xs font-medium text-gray-500 mt-3 mb-1">CATEGORIES</h4>
                      <div className="space-y-1">
                        <FilterOption 
                          label="Study" 
                          active={filterOption === 'Study'} 
                          onClick={() => {
                            setFilterOption('Study');
                            setShowFilterDropdown(false);
                          }} 
                        />
                        <FilterOption 
                          label="Fun" 
                          active={filterOption === 'Fun'} 
                          onClick={() => {
                            setFilterOption('Fun');
                            setShowFilterDropdown(false);
                          }} 
                        />
                        <FilterOption 
                          label="Drama" 
                          active={filterOption === 'Drama'} 
                          onClick={() => {
                            setFilterOption('Drama');
                            setShowFilterDropdown(false);
                          }} 
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Horizontal Filter Pills */}
        <div className="mt-3">
          {getFilterOptions()}
        </div>
      </div>
      
      {/* Posts List */}
      <div className="flex-1 overflow-y-auto bg-cendy-bg p-3">
        {filteredPosts.length > 0 ? (
          <div className="space-y-3">
            {filteredPosts.map(post => (
              <PostCard 
                key={post.id} 
                post={post}
                channelType={activeChannel}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-gray-500">
            <p>No posts found</p>
            <button className="mt-2 text-cendy-primary text-sm">Create a post</button>
          </div>
        )}
      </div>
    </div>
  );
};

// Channel Tab Component
interface ChannelTabProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const ChannelTab: React.FC<ChannelTabProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors ${
        active 
          ? 'text-cendy-primary border-b-2 border-cendy-primary' 
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
};

// Filter Pill Component
interface FilterPillProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-all ${
        active 
          ? 'bg-cendy-primary text-white' 
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      {label}
    </button>
  );
};

// Filter Option Component
interface FilterOptionProps {
  label: string;
  active: boolean;
  onClick: () => void;
}

const FilterOption: React.FC<FilterOptionProps> = ({ label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`block w-full text-left px-3 py-1.5 text-sm rounded transition-colors ${
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
