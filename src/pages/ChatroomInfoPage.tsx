import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreVertical, Image as ImageIcon, Paperclip, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Conversation, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const ChatroomInfoPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the conversation data
  useEffect(() => {
    const fetchConversation = async () => {
      if (!roomId || !currentUser) return;
      
      try {
        setIsLoading(true);
        
        // Fetch conversation data
        const { data: conversationData, error: conversationError } = await supabase
          .from('conversations')
          .select(`
            *,
            participants:conversation_participants(
              user:user_id(*)
            )
          `)
          .eq('id', roomId)
          .eq('type', 'chatroom')
          .single();
          
        if (conversationError) {
          throw conversationError;
        }
        
        if (!conversationData) {
          toast.error('Chatroom not found');
          navigate('/conversations');
          return;
        }
        
        // Transform database shape to application type
        const conversation: Conversation = {
          id: conversationData.id,
          type: 'chatroom',
          chatroomName: conversationData.chatroom_name,
          photo: conversationData.photo,
          postId: conversationData.post_id,
          lastMessageContent: conversationData.last_message_content,
          lastMessageSenderId: conversationData.last_message_sender_id,
          lastMessageTimestamp: conversationData.last_message_timestamp ? new Date(conversationData.last_message_timestamp) : undefined,
          createdAt: new Date(conversationData.created_at),
          updatedAt: new Date(conversationData.updated_at),
          participants: conversationData.participants.map((p: any) => p.user)
        };
        
        setConversation(conversation);
      } catch (error) {
        console.error('Error fetching chatroom:', error);
        toast.error('Failed to load chatroom information');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchConversation();
  }, [roomId, currentUser, navigate]);
  
  const handleLeaveChatroom = async () => {
    if (!currentUser || !conversation) return;
    
    try {
      // Delete the participant record to leave the chatroom
      const { error } = await supabase
        .from('conversation_participants')
        .delete()
        .eq('conversation_id', conversation.id)
        .eq('user_id', currentUser.id);
        
      if (error) {
        throw error;
      }
      
      toast.success('You have left the chatroom');
      navigate('/conversations');
    } catch (error) {
      console.error('Error leaving chatroom:', error);
      toast.error('Failed to leave chatroom');
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
      <div className="h-screen flex flex-col bg-cendy-bg">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 flex items-center p-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate(`/conversation/${roomId}`)}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold flex-1">Chatroom Info</h1>
          
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Chatroom Info */}
        <div className="p-6 bg-white mb-2 flex flex-col items-center">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage 
              src={conversation.photo || "https://i.pravatar.cc/150?img=group"} 
              alt={conversation.chatroomName || "Chatroom"} 
            />
            <AvatarFallback className="text-2xl">
              {conversation.chatroomName ? conversation.chatroomName.substring(0, 2).toUpperCase() : "CR"}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold mb-1">{conversation.chatroomName || "Chatroom"}</h2>
          
          <p className="text-gray-500 mb-4">
            {conversation.participants?.length} participants
          </p>
          
          <div className="flex space-x-3">
            <Button variant="outline" className="text-gray-600">
              Search Chat
            </Button>
            <Button 
              variant="outline" 
              className="text-red-600"
              onClick={handleLeaveChatroom}
            >
              Leave Chat
            </Button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex-1 bg-white overflow-hidden flex flex-col">
          <Tabs defaultValue="members" className="w-full h-full">
            <TabsList className="grid grid-cols-4 bg-gray-100">
              <TabsTrigger value="members">Members</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="files">Files</TabsTrigger>
              <TabsTrigger value="links">Links</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {conversation.participants?.map(user => (
                  <div key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                    <Avatar className="w-12 h-12 mr-3">
                      <AvatarImage 
                        src={user.profilePictureUrl || "https://i.pravatar.cc/150?img=default"} 
                        alt={user.displayName} 
                      />
                      <AvatarFallback>{user.displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium">{user.displayName}</h3>
                        {user.verificationStatus === 'verified' && (
                          <span className="ml-1 text-xs text-blue-500">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{user.university || "Student"}</p>
                    </div>
                    
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate(`/user/${user.id}`)}
                    >
                      View
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="media" className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-3 gap-2">
                {Array(9).fill(0).map((_, i) => (
                  <div key={i} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <ImageIcon className="text-gray-400 h-8 w-8" />
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="files" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center p-3 border border-gray-200 rounded-lg">
                    <Paperclip className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium">Document {i+1}.pdf</p>
                      <p className="text-xs text-gray-500">2.4 MB</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="links" className="flex-1 overflow-y-auto p-4">
              <div className="space-y-2">
                {Array(3).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center p-3 border border-gray-200 rounded-lg">
                    <LinkIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div className="flex-1">
                      <p className="font-medium">Link to resource {i+1}</p>
                      <p className="text-xs text-gray-500 truncate">https://example.com/resource-{i+1}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      Open
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ChatroomInfoPage;
