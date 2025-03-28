
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Layout from '@/components/Layout';
import { ArrowLeft, Image, Send } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChannelType } from '@/types';
import { createPost } from '@/utils/supabaseHelpers';
import { uploadPostImage } from '@/utils/storage';
import { toast } from 'sonner';

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  
  // Get channel type from location state or default to CampusGeneral
  const initialChannelType = (
    location.state?.channelType || 'CampusGeneral'
  ) as ChannelType;
  
  // Get university from location state, use user's university, or default to undefined
  const initialUniversity = location.state?.university || currentUser?.university || undefined;
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'Study' | 'Fun' | 'Drama' | 'Other' | undefined>('Study');
  const [channelType, setChannelType] = useState<ChannelType>(initialChannelType);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      toast.error('You must be logged in to create a post');
      return;
    }
    
    if (!title.trim() || !content.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Upload image if one is selected
      let imageUrl = undefined;
      if (selectedImage) {
        imageUrl = await uploadPostImage(selectedImage, currentUser.id);
        if (!imageUrl) {
          toast.error('Failed to upload image');
          setIsSubmitting(false);
          return;
        }
      }
      
      // Create post
      const newPost = await createPost({
        user_id: currentUser.id,
        title,
        content,
        university: initialUniversity === 'all' ? undefined : initialUniversity,
        image_url: imageUrl,
        channel_type: channelType,
        category: (channelType === 'CampusGeneral' || channelType === 'Forum') ? category : undefined
      });
      
      if (newPost) {
        toast.success('Post created successfully');
        navigate('/feed');
      } else {
        toast.error('Failed to create post');
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)}
              className="mr-2"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-bold text-lg">Create Post</h1>
          </div>
          
          <Button 
            disabled={isSubmitting || !title.trim() || !content.trim()} 
            onClick={handleSubmit}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Posting...
              </span>
            ) : (
              <span className="flex items-center">
                <Send className="mr-2 h-4 w-4" />
                Post
              </span>
            )}
          </Button>
        </div>
        
        {/* Post Form */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <form onSubmit={handleSubmit}>
              {/* Channel Type */}
              <div className="mb-4">
                <Label htmlFor="channelType">Channel</Label>
                <Select 
                  value={channelType} 
                  onValueChange={(value) => setChannelType(value as ChannelType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger className="w-full mt-1" id="channelType">
                    <SelectValue placeholder="Select a channel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CampusGeneral">Campus General</SelectItem>
                    <SelectItem value="Forum">Forum</SelectItem>
                    <SelectItem value="CampusCommunity">Campus Community</SelectItem>
                    <SelectItem value="Community">Community</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Category - Only shown for CampusGeneral and Forum */}
              {(channelType === 'CampusGeneral' || channelType === 'Forum') && (
                <div className="mb-4">
                  <Label htmlFor="category">Category</Label>
                  <Select 
                    value={category || 'Study'} 
                    onValueChange={(value) => setCategory(value as 'Study' | 'Fun' | 'Drama' | 'Other')}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full mt-1" id="category">
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
              )}
              
              {/* Title */}
              <div className="mb-4">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Give your post a title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Content */}
              <div className="mb-4">
                <Label htmlFor="content">Content</Label>
                <textarea
                  id="content"
                  placeholder="What's on your mind?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full mt-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
                  required
                  disabled={isSubmitting}
                />
              </div>
              
              {/* Image Upload */}
              <div className="mb-4">
                <Label htmlFor="image">Image (Optional)</Label>
                
                {imagePreview ? (
                  <div className="mt-2 relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="max-h-60 rounded-md object-cover"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-1">
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-blue-500"
                    >
                      <div className="flex flex-col items-center">
                        <Image className="h-6 w-6 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-500">Click to upload an image</span>
                      </div>
                      <input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        disabled={isSubmitting}
                      />
                    </label>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePostPage;
