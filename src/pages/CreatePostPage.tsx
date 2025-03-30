
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChevronLeft, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChannelType, ConversationType } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [category, setCategory] = useState<'Study' | 'Fun' | 'Drama' | 'Other' | ''>('');
  const [channelType, setChannelType] = useState<ChannelType | ''>('');
  const [chatroomName, setChatroomName] = useState('');
  
  // Initialize the chatroom name with a default based on user's display name
  useEffect(() => {
    if (currentUser) {
      setChatroomName(`${currentUser.displayName}'s chatroom`);
    }
  }, [currentUser]);
  
  // Get the channel type from session storage if available
  useEffect(() => {
    const storedChannel = sessionStorage.getItem('selectedChannel') as ChannelType | null;
    if (storedChannel) {
      setChannelType(storedChannel);
    }
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      toast.error('You must be logged in to create a post');
      navigate('/login');
      return;
    }

    if (!title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!content.trim()) {
      toast.error('Please enter some content');
      return;
    }

    if (!category) {
      toast.error('Please select a category');
      return;
    }

    if (!channelType) {
      toast.error('Please select a channel');
      return;
    }

    if (!chatroomName.trim()) {
      toast.error('Please enter a chatroom name');
      return;
    }

    try {
      setIsPosting(true);
      
      // Upload the image to Supabase Storage if it exists
      let imageUrl = null;
      if (image) {
        const fileExt = image.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `post-images/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(filePath, image);
        
        if (uploadError) {
          throw uploadError;
        }
        
        const { data } = supabase.storage
          .from('posts')
          .getPublicUrl(filePath);
        
        imageUrl = data.publicUrl;
      }
      
      // Create the post
      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: currentUser.id,
          title,
          content,
          university: (channelType === 'Forum' || channelType === 'Community') ? 'all' : currentUser.university,
          image_url: imageUrl,
          channel_type: channelType,
          category
        })
        .select()
        .single();
      
      if (postError) {
        throw postError;
      }
      
      // Create the chat room
      const { data: chatRoom, error: chatRoomError } = await supabase
        .from('chat_rooms')
        .insert({
          post_id: post.id,
          chatroom_name: chatroomName,
          chatroom_photo: currentUser.profilePictureUrl
        })
        .select()
        .single();
      
      if (chatRoomError) {
        throw chatRoomError;
      }
      
      // Add the user as a participant in the chat room
      const { error: participantError } = await supabase
        .from('chat_room_participants')
        .insert({
          chatroom_id: chatRoom.id,
          user_id: currentUser.id
        });
      
      if (participantError) {
        throw participantError;
      }
      
      toast.success('Post created successfully!');
      navigate('/feed');
    } catch (error) {
      console.error('Error creating post:', error);
      toast.error('Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">Create Post</h1>
          </div>
          
          <Button 
            onClick={handleSubmit} 
            disabled={isPosting || !title.trim() || !content.trim() || !category || !channelType}
            className="bg-cendy-primary hover:bg-cendy-primary/90"
          >
            {isPosting ? 'Posting...' : 'Post'}
          </Button>
        </div>
        
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Channel Type */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Channel</h3>
            <Select value={channelType} onValueChange={(value) => setChannelType(value as ChannelType)}>
              <SelectTrigger className="w-full">
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
          
          {/* Category */}
          <div>
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
          
          {/* Title */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Title</h3>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a title..."
              className="w-full"
            />
          </div>
          
          {/* Content */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Content</h3>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full min-h-[150px]"
            />
          </div>
          
          {/* Chatroom Name */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Chatroom Name</h3>
            <Input
              value={chatroomName}
              onChange={(e) => setChatroomName(e.target.value)}
              placeholder="Enter a name for the chatroom"
              className="w-full"
            />
          </div>
          
          {/* Image Upload */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Image (Optional)</h3>
            
            {imagePreview ? (
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-auto max-h-[300px] object-contain bg-gray-100"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm text-gray-600 justify-center">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer rounded-md font-medium text-cendy-primary hover:text-cendy-primary/80"
                  >
                    <span>Upload an image</span>
                    <input
                      id="file-upload"
                      name="file-upload"
                      type="file"
                      accept="image/*"
                      className="sr-only"
                      onChange={handleImageChange}
                    />
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePostPage;
