import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ChevronLeft, Camera } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// Interface for the get_conversation_full_details SQL function return
interface ConversationFullDetails {
  id: string;
  type: string;
  chatroom_name: string | null;
  photo: string | null;
  post_id: string | null;
  post_title: string | null;
  post_content: string | null;
  created_at: Date;
  updated_at: Date;
  participants: ParticipantDetails[]; // JSONB array from SQL function
  participant_count: number;
  current_user_role: string | null;
  current_user_joined_at: Date | null;
  can_join: boolean;
  conversation_exists: boolean;
}

// Define the participant structure based on the SQL function
interface ParticipantDetails {
  user_id: string;
  display_name: string;
  profile_picture_url: string | null;
  role: string;
  joined_at: string;
  email?: string;
}

const EditChatroomInfoPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [conversation, setConversation] = useState<ConversationFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [chatroomName, setChatroomName] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  // Fetch the conversation data
  useEffect(() => {
    const fetchConversation = async () => {
      if (!roomId || !currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Call the get_conversation_full_details SQL function
        const { data, error } = await supabase
          .rpc('get_conversation_full_details', { conversation_id_param: roomId });
          
        if (error) {
          throw error;
        }
        
        if (!data || (Array.isArray(data) && data.length === 0)) {
          toast.error('Conversation not found');
          navigate('/conversations');
          return;
        }
        
        // The response is an array, get the first item
        const conversationData = Array.isArray(data) ? data[0] : data;
        
        // Check if user is admin
        if (conversationData.current_user_role !== 'admin') {
          toast.error('You do not have permission to edit this chatroom');
          navigate(`/chatroom-info/${roomId}`);
          return;
        }
        
        // Transform dates
        const transformedData = {
          ...conversationData,
          created_at: conversationData.created_at ? new Date(conversationData.created_at) : new Date(),
          updated_at: conversationData.updated_at ? new Date(conversationData.updated_at) : new Date(),
          current_user_joined_at: conversationData.current_user_joined_at ? new Date(conversationData.current_user_joined_at) : null
        };
        
        setConversation(transformedData);
        setChatroomName(transformedData.chatroom_name || '');
        setTitle(transformedData.post_title || '');
        setContent(transformedData.post_content || '');
        setPhoto(transformedData.photo || null);
        
        console.log("Fetched conversation data:", transformedData);
      } catch (error) {
        console.error('Error fetching conversation:', error);
        toast.error('Failed to load chatroom information');
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [roomId, currentUser, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      
      // Create a preview of the image
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!roomId || !currentUser || !conversation) return;
    
    try {
      setIsSaving(true);
      
      let photoUrl = photo;
      
      // If there's a new photo, upload it to storage
      if (photoFile) {
        const fileName = `chatrooms/${roomId}/photo-${Date.now()}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('conversation-photos')
          .upload(fileName, photoFile, {
            upsert: true,
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('conversation-photos')
          .getPublicUrl(fileName);
          
        photoUrl = publicUrlData.publicUrl;
      }
      
      // Call the RPC function to update chatroom info
      const { data, error } = await supabase.rpc('update_chatroom_info', {
        conversation_id_param: roomId,
        chatroom_name_param: chatroomName,
        photo_param: photoUrl,
        post_title_param: title,
        post_content_param: content
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Chatroom information updated successfully');
      navigate(`/chatroom-info/${roomId}`);
    } catch (error) {
      console.error('Error updating chatroom:', error);
      toast.error('Failed to update chatroom information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteChatroom = async () => {
    if (!roomId || !currentUser || !conversation) return;
    
    if (!confirm('Are you sure you want to delete this chatroom? This action cannot be undone.')) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Call the RPC function to delete chatroom
      const { data, error } = await supabase.rpc('delete_chatroom', {
        conversation_id_param: roomId
      });
      
      if (error) {
        throw error;
      }
      
      toast.success('Chatroom deleted successfully');
      navigate('/conversations');
    } catch (error) {
      console.error('Error deleting chatroom:', error);
      toast.error('Failed to delete chatroom');
    } finally {
      setIsSaving(false);
    }
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
        </div>
      </Layout>
    );
  }
  
  if (!conversation) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <p>Chatroom not found</p>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="h-screen flex flex-col bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 flex items-center p-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2 text-cyan-500" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold flex-1">Cancel</h1>
          
          <Button 
            variant="ghost" 
            className="text-cyan-500"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            Done
          </Button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto">
          {/* Chatroom Photo */}
          <div className="p-6 bg-white flex flex-col items-center">
            <div className="relative">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage 
                  src={photo || "https://i.pravatar.cc/150?img=group"} 
                  alt={chatroomName || "Chatroom"} 
                />
                <AvatarFallback className="text-2xl">
                  {chatroomName ? chatroomName.substring(0, 2).toUpperCase() : "CR"}
                </AvatarFallback>
              </Avatar>
              
              <label 
                htmlFor="photo-upload" 
                className="absolute bottom-4 right-0 h-8 w-8 rounded-full bg-cyan-500 flex items-center justify-center cursor-pointer"
              >
                <Camera className="h-4 w-4 text-white" />
              </label>
              
              <input 
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                className="hidden"
                onChange={handlePhotoChange}
              />
            </div>
            
            <p className="text-sm text-cyan-500 mb-2">Set New Photo</p>
          </div>
          
          {/* Chatroom Name */}
          <div className="px-4 py-3 bg-white mt-2">
            <p className="text-sm text-gray-600 mb-1">Chatroom Name</p>
            <Input 
              value={chatroomName} 
              onChange={(e) => setChatroomName(e.target.value)}
              className="border-none px-0 text-base focus-visible:ring-0"
              placeholder="Enter chatroom name"
              required
            />
          </div>
          
          {/* Post Title */}
          <div className="px-4 py-3 bg-white mt-2">
            <p className="text-sm text-gray-600 mb-1">Title and Body text</p>
            <Textarea 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-none px-0 text-base focus-visible:ring-0 resize-none"
              placeholder="Enter title"
              rows={2}
              required
            />
          </div>
          
          {/* Post Content */}
          <div className="px-4 py-3 bg-white">
            <Textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="border-none px-0 text-base focus-visible:ring-0 resize-none"
              placeholder="Enter content"
              rows={6}
              required
            />
          </div>
          
          {/* Delete Button */}
          <div className="px-4 py-6 flex justify-center">
            <Button
              type="button"
              variant="ghost"
              onClick={handleDeleteChatroom}
              className="text-red-500 hover:text-red-600 hover:bg-red-50"
              disabled={isSaving}
            >
              Delete Chatroom (including Post)
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default EditChatroomInfoPage; 