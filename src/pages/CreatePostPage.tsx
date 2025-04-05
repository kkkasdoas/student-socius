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
import imageCompression from 'browser-image-compression';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, session } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [category, setCategory] = useState<string>('');
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
  
  // Reset category when channel type changes
  useEffect(() => {
    setCategory('');
  }, [channelType]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // Compress the image
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true
      };
      
      const compressedFile = await imageCompression(file, options);
      setImage(compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing image:', error);
      toast.error('Failed to process image. Please try again with a different image.');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    // Validate all required fields
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
        const fileName = `${currentUser.id}/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError, data: uploadData } = await supabase.storage
          .from('post-images')
          .upload(fileName, image);
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }
        
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        imageUrl = data.publicUrl;
      }
      
      // Use the RPC function to create post, conversation, and participant in a single call
      try {
        const { data, error } = await supabase.rpc('create_post_with_chatroom', {
          p_user_id: currentUser.id,
          p_title: title,
          p_content: content,
          p_university: (channelType === 'Forum' || channelType === 'Community') ? 'all' : currentUser.university,
          p_image_url: imageUrl,
          p_channel_type: channelType as ChannelType,
          p_category: category,
          p_chatroom_name: chatroomName
        });
        
        if (error) {
          console.error('RPC function error:', error);
          throw new Error(error.message || 'Failed to create post');
        }

        console.log('RPC function success:', data);
        toast.success('Post created successfully!');
        navigate('/feed');

      } catch (rpcError: any) {
        console.error('RPC function failed, falling back to direct operations:', rpcError);
        
        // OPTION 2: Fallback to direct database operations
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
          throw new Error(`Post creation failed: ${postError.message}`);
        }
        
        // Create the chat room
        const { data: conversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            type: 'chatroom',
            chatroom_name: chatroomName,
            photo: currentUser.profilePictureUrl,
            post_id: post.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (conversationError) {
          throw new Error(`Conversation creation failed: ${conversationError.message}`);
        }
        
        // Add the user as a participant in the conversation
        const { error: participantError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversation.id,
            user_id: currentUser.id,
            role: 'admin'  // Set creator as admin
          });
        
        if (participantError) {
          throw new Error(`Participant creation failed: ${participantError.message}`);
        }
        
        toast.success('Post created successfully!');
        navigate('/feed');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      toast.error(error.message || 'Failed to create post. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  // Check if all required fields are filled
  const isFormValid = 
    title.trim() !== '' && 
    content.trim() !== '' && 
    category !== '' && 
    channelType !== '' && 
    chatroomName.trim() !== '';

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
            disabled={isPosting || !isFormValid}
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
            <Select value={channelType} onValueChange={(value) => {
              setChannelType(value as ChannelType);
              // Reset category when changing channel type
              setCategory('');
            }}>
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
            <Select value={category} onValueChange={(value) => setCategory(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {(channelType === 'CampusGeneral' || channelType === 'Forum') && (
                  <>
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
                  </>
                )}
                
                {(channelType === 'CampusCommunity' || channelType === 'Community') && (
                  <>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="L">L</SelectItem>
                    <SelectItem value="G">G</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="T">T</SelectItem>
                  </>
                )}
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
