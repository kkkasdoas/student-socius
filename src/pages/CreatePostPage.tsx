
import React, { useState } from 'react';
import Layout from '@/components/Layout';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelType } from '@/types';
import { X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface LocationState {
  channelType: ChannelType;
  university: string;
}

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Get the channel type and university from location state
  const state = location.state as LocationState;
  const channelType = state?.channelType || 'CampusGeneral';
  const university = state?.university || currentUser?.university || 'TDTU University';
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Study' | 'Fun' | 'Drama' | 'Other' | ''>('');
  const [chatroomName, setChatroomName] = useState(
    currentUser ? `${currentUser.displayName}'s chatroom` : 'New chatroom'
  );
  const [chatroomPhoto, setChatroomPhoto] = useState(currentUser?.profilePictureUrl || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleCancel = () => {
    navigate(-1);
  };
  
  const handleSubmit = () => {
    // Validate form
    if (!title.trim()) {
      toast.error('Please enter a title for your post');
      return;
    }
    
    if (!content.trim()) {
      toast.error('Please enter content for your post');
      return;
    }
    
    if (!category) {
      toast.error('Please select a category for your post');
      return;
    }
    
    if (!chatroomName.trim()) {
      toast.error('Please enter a name for the chatroom');
      return;
    }
    
    setIsSubmitting(true);
    
    // Simulate post creation
    setTimeout(() => {
      toast.success('Post created successfully');
      setIsSubmitting(false);
      navigate('/feed');
    }, 1000);
  };
  
  return (
    <Layout hideNav>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <button 
            onClick={handleCancel}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h1 className="text-lg font-semibold">{channelType === 'CampusGeneral' ? 'New Campus Post' : 
                         channelType === 'Forum' ? 'New Forum Post' :
                         channelType === 'CampusCommunity' ? 'New Campus Community Post' : 
                         'New Community Post'}</h1>
          
          <button 
            onClick={handleSubmit}
            disabled={isSubmitting || !title || !content || !category || !chatroomName}
            className="px-4 py-1.5 bg-cendy-primary text-white rounded-full text-sm font-medium disabled:opacity-50"
          >
            {isSubmitting ? 'Posting...' : 'Post'}
          </button>
        </div>
        
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Title */}
          <div className="mb-4">
            <input 
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 text-lg font-semibold border-none focus:outline-none focus:ring-0 placeholder:text-gray-400"
            />
          </div>
          
          {/* Content */}
          <div className="mb-4">
            <Textarea 
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full min-h-[200px] border-none focus:outline-none focus:ring-0 placeholder:text-gray-400 resize-none"
            />
          </div>
          
          {/* Category */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Category</h3>
            <Select value={category} onValueChange={(value) => setCategory(value as any)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Study">Study</SelectItem>
                <SelectItem value="Fun">Fun</SelectItem>
                <SelectItem value="Drama">Drama</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Chatroom Name */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Chatroom Name</h3>
            <input 
              type="text"
              placeholder="Enter chatroom name"
              value={chatroomName}
              onChange={(e) => setChatroomName(e.target.value)}
              className="w-full p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-cendy-primary/30"
            />
          </div>
          
          {/* Chatroom Photo */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Chatroom Photo URL (optional)</h3>
            <input 
              type="text"
              placeholder="Enter photo URL"
              value={chatroomPhoto}
              onChange={(e) => setChatroomPhoto(e.target.value)}
              className="w-full p-3 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-cendy-primary/30"
            />
            {chatroomPhoto && (
              <div className="mt-2 flex justify-center">
                <img 
                  src={chatroomPhoto} 
                  alt="Chatroom" 
                  className="w-16 h-16 rounded-full object-cover border"
                />
              </div>
            )}
          </div>
          
          {/* Info about where this post will be visible */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-sm font-medium text-gray-700 mb-1">Post visibility</h3>
            <p className="text-sm text-gray-600">
              {channelType === 'CampusGeneral' || channelType === 'CampusCommunity' 
                ? `This post will be visible to ${university} students only.`
                : 'This post will be visible to students from all universities.'}
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePostPage;
