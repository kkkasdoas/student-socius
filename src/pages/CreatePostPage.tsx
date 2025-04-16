import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChevronLeft, Image as ImageIcon, X, Camera } from 'lucide-react';
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

// Add a default fallback image URL
const DEFAULT_PROFILE_IMAGE = '/default-profile.png';  // Make sure to add this image to your public folder

// Add a cache for profile images
const imageCache = new Map<string, string>();

// Helper function to handle profile image loading with caching and fallback
const loadProfileImage = async (url: string): Promise<string> => {
  // Check cache first
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    imageCache.set(url, objectUrl);
    return objectUrl;
  } catch (error) {
    console.warn(`Failed to load image from ${url}:`, error);
    return DEFAULT_PROFILE_IMAGE;
  }
};

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser, session } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [chatroomImage, setChatroomImage] = useState<File | null>(null);
  const [chatroomImagePreview, setChatroomImagePreview] = useState<string | null>(null);
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

  // Function to generate a Telegram-style default group icon (letter on colored background)
  const generateTelegramStyleGroupIcon = (name: string): string => {
    // Define Telegram's color palette (similar colors to Telegram's defaults)
    const colors = [
      '#5A9DD5', // blue
      '#5AD59F', // teal
      '#D55A5A', // red
      '#D5A65A', // orange
      '#8C5AD5', // purple
      '#D55AB3', // pink
    ];
    
    // Use the first character of the name for the icon
    const firstChar = name.trim()[0] || 'G';
    
    // Determine a consistent color based on the name
    // This ensures the same name always gets the same color
    const colorIndex = name.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) % colors.length;
    const backgroundColor = colors[colorIndex];
    
    // Create a canvas element to generate the image
    const canvas = document.createElement('canvas');
    const size = 200; // Size of the icon
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Draw background
      ctx.fillStyle = backgroundColor;
      ctx.fillRect(0, 0, size, size);
      
      // Draw text
      ctx.fillStyle = 'white';
      ctx.font = 'bold 100px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(firstChar.toUpperCase(), size / 2, size / 2);
      
      // Convert canvas to data URL
      return canvas.toDataURL('image/png');
    }
    
    // Fallback to a simple colored square if canvas fails
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='${backgroundColor.replace('#', '%23')}' /%3E%3Ctext x='100' y='120' font-family='Arial' font-size='100' font-weight='bold' fill='white' text-anchor='middle'%3E${firstChar.toUpperCase()}%3C/text%3E%3C/svg%3E`;
  };

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

  const handleChatroomImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setChatroomImage(compressedFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setChatroomImagePreview(reader.result as string);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Error compressing chatroom image:', error);
      toast.error('Failed to process chatroom image. Please try again with a different image.');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImagePreview(null);
  };

  const removeChatroomImage = () => {
    setChatroomImage(null);
    setChatroomImagePreview(null);
  };

  // Show chatroom fields only for CampusGeneral and Forum channel types
  const showChatroomFields = channelType === 'CampusGeneral' || channelType === 'Forum';

  // Update handleSubmit to handle different channel types
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

    // Only require chatroom name for channels that create chatrooms
    if (showChatroomFields && !chatroomName.trim()) {
      toast.error('Please enter a chatroom name');
      return;
    }

    try {
      setIsPosting(true);
      
      // Upload the post image to Supabase Storage if it exists
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

      // Upload the chatroom image to Supabase Storage if it exists and channel type creates chatrooms
      let chatroomImageUrl = null;
      if (showChatroomFields) {
        if (chatroomImage) {
          const fileExt = chatroomImage.name.split('.').pop();
          const fileName = `chatrooms/${currentUser.id}/${uuidv4()}.${fileExt}`;
          
          const { error: uploadError, data: uploadData } = await supabase.storage
            .from('conversation-photos')
            .upload(fileName, chatroomImage);
          
          if (uploadError) {
            console.error('Chatroom image upload error:', uploadError);
            throw new Error(`Chatroom image upload failed: ${uploadError.message}`);
          }
          
          const { data } = supabase.storage
            .from('conversation-photos')
            .getPublicUrl(fileName);
          
          chatroomImageUrl = data.publicUrl;
        } else {
          // Generate a Telegram-style default group icon
          const iconDataUrl = generateTelegramStyleGroupIcon(chatroomName);
          
          // Convert data URL to blob and upload to Supabase
          try {
            const response = await fetch(iconDataUrl);
            const blob = await response.blob();
            
            const fileName = `default-icons/${uuidv4()}.png`;
            
            const { error, data } = await supabase.storage
              .from('conversation-photos')
              .upload(fileName, blob);
              
            if (error) {
              console.error('Error uploading default icon:', error);
              // If upload fails, use data URL directly (not ideal for production)
              chatroomImageUrl = iconDataUrl;
            } else {
              // Get the URL of the uploaded icon
              const { data: urlData } = supabase.storage
                .from('conversation-photos')
                .getPublicUrl(fileName);
                
              chatroomImageUrl = urlData.publicUrl;
            }
          } catch (error) {
            console.error('Error processing default icon:', error);
            // Fallback
            chatroomImageUrl = iconDataUrl;
          }
        }
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
          p_chatroom_name: showChatroomFields ? chatroomName : null,
          p_chatroom_photo: showChatroomFields ? chatroomImageUrl : null
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
        
        // Only create chatroom for appropriate channel types
        if (showChatroomFields) {
          // Create the chat room
          const { data: conversation, error: conversationError } = await supabase
            .from('conversations')
            .insert({
              type: 'chatroom',
              chatroom_name: chatroomName,
              photo: chatroomImageUrl, // Use the chatroom image instead of post image
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
    // Only require chatroom name for channels that create chatrooms
    (!showChatroomFields || chatroomName.trim() !== '');

  return (
    <Layout>
      <div className="flex flex-col h-screen bg-white">
        {/* Header */}
        <div className="flex flex-col p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate(-1)} 
              className="mr-2"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-semibold">
              {showChatroomFields ? 'New Group' : 'New Post'}
            </h1>
            <Button 
              onClick={handleSubmit} 
              disabled={isPosting || !isFormValid}
              variant="link"
              className="text-cendy-primary"
            >
              {isPosting ? 'Creating...' : 'Create'}
            </Button>
          </div>
          
          {/* Chatroom Name and Camera - only show for channels that create chatrooms */}
          {showChatroomFields && (
            <div className="mt-4 bg-gray-100 rounded-lg p-3 flex items-center">
              <div className="flex-shrink-0 mr-3 relative">
                <label htmlFor="chatroom-image" className="cursor-pointer">
                  {chatroomImagePreview ? (
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img 
                        src={chatroomImagePreview} 
                        alt="Chatroom avatar" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 opacity-0 hover:opacity-100 transition-opacity rounded-full">
                        <Camera className="h-5 w-5 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center">
                      <Camera className="h-5 w-5 text-teal-500" />
                    </div>
                  )}
                  <input 
                    type="file" 
                    id="chatroom-image" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={handleChatroomImageChange}
                  />
                </label>
                {chatroomImagePreview && (
                  <button 
                    className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm"
                    onClick={removeChatroomImage}
                  >
                    <X className="h-3 w-3 text-gray-500" />
                  </button>
                )}
              </div>
              <div className="flex-1">
                <input 
                  type="text" 
                  placeholder="Group name" 
                  className="w-full bg-transparent border-0 outline-none"
                  value={chatroomName}
                  onChange={(e) => setChatroomName(e.target.value)}
                />
              </div>
            </div>
          )}
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
          
          {/* Image Upload Section */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Post Image (Optional)</h3>
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label htmlFor="post-image" className="cursor-pointer">
                  <div className="flex flex-col items-center">
                    <ImageIcon className="h-8 w-8 text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">Click to upload an image</span>
                  </div>
                  <input
                    id="post-image"
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-4">
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
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CreatePostPage;
