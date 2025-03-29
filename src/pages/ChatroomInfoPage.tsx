
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { ArrowLeft, ChevronRight, Trash, UserPlus, Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom, User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { fetchChatroomParticipants } from '@/utils/supabaseHelpers';

const ChatroomInfoPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [showLeaveDialog, setShowLeaveDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch the chatroom information
  useEffect(() => {
    const loadChatRoom = async () => {
      if (!roomId) return;
      
      try {
        setIsLoading(true);
        
        // Fetch chatroom details
        const { data: roomData, error: roomError } = await supabase
          .from('chat_rooms')
          .select('*')
          .eq('id', roomId)
          .single();
          
        if (roomError) throw roomError;
        if (!roomData) throw new Error('Chatroom not found');
        
        // Fetch participants
        const chatRoomParticipants = await fetchChatroomParticipants(roomId);
        const participantUsers = chatRoomParticipants
          .map(p => p.user)
          .filter((user): user is User => !!user);
        
        // Create the chatroom object
        const chatRoomData: ChatRoom = {
          id: roomData.id,
          chatroom_name: roomData.chatroom_name,
          chatroom_photo: roomData.chatroom_photo,
          post_id: roomData.post_id,
          created_at: new Date(roomData.created_at),
          updated_at: new Date(roomData.updated_at),
          participants: participantUsers,
        };
        
        setChatRoom(chatRoomData);
        setParticipants(participantUsers);
        
        // Check if the current user has muted this chatroom
        // This would require a user_chatroom_settings table
        // For now, we'll use a placeholder value
        setIsMuted(false);
        
      } catch (error) {
        console.error('Error loading chatroom:', error);
        toast.error('Failed to load chatroom information');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadChatRoom();
  }, [roomId]);
  
  const toggleMute = () => {
    // In a real app, this would update the setting in the database
    setIsMuted(!isMuted);
    toast.success(`${isMuted ? 'Unmuted' : 'Muted'} ${chatRoom?.chatroom_name || 'chatroom'}`);
  };
  
  const handleLeaveChatroom = async () => {
    if (!currentUser || !roomId) return;
    
    try {
      // In a real app, this would remove the user from the chatroom participants
      const { error } = await supabase
        .from('chat_room_participants')
        .delete()
        .eq('chatroom_id', roomId)
        .eq('user_id', currentUser.id);
      
      if (error) throw error;
      
      toast.success(`Left ${chatRoom?.chatroom_name || 'chatroom'}`);
      navigate('/messages');
    } catch (error) {
      console.error('Error leaving chatroom:', error);
      toast.error('Failed to leave chatroom');
    } finally {
      setShowLeaveDialog(false);
    }
  };
  
  const handleAddParticipant = () => {
    // This would open a dialog to search and add users
    toast.info('Add participant feature not implemented yet');
  };
  
  if (isLoading) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cendy-primary" />
        </div>
      </Layout>
    );
  }
  
  if (!chatRoom) {
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
      <div className="flex flex-col h-screen bg-cendy-bg">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 flex items-center p-3">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 mr-2"
            onClick={() => navigate(`/chatroom/${roomId}`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-medium">Chatroom Info</h1>
        </div>
        
        {/* Profile Section */}
        <div className="bg-white p-4 flex flex-col items-center border-b border-gray-200">
          <Avatar className="h-20 w-20 mb-3">
            <AvatarImage 
              src={chatRoom.chatroom_photo || "https://i.pravatar.cc/150?img=group"} 
              alt={chatRoom.chatroom_name} 
            />
            <AvatarFallback>
              {chatRoom.chatroom_name ? chatRoom.chatroom_name.substring(0, 2).toUpperCase() : "CR"}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-semibold text-center">{chatRoom.chatroom_name}</h2>
          <p className="text-sm text-gray-500 mt-1">{participants.length} participants</p>
        </div>
        
        {/* Settings */}
        <div className="bg-white mt-2 border-t border-b border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <div className="flex items-center">
              {isMuted ? 
                <BellOff className="h-5 w-5 text-gray-500 mr-3" /> : 
                <Bell className="h-5 w-5 text-gray-500 mr-3" />
              }
              <span>Mute Notifications</span>
            </div>
            <Switch 
              checked={isMuted}
              onCheckedChange={toggleMute}
            />
          </div>
          
          {/* Add Participant Option (admins only) */}
          <div 
            className="flex items-center p-4 border-b border-gray-100 cursor-pointer"
            onClick={handleAddParticipant}
          >
            <UserPlus className="h-5 w-5 text-gray-500 mr-3" />
            <span>Add Participants</span>
            <ChevronRight className="h-5 w-5 text-gray-400 ml-auto" />
          </div>
          
          {/* Leave Chat Option */}
          <div 
            className="flex items-center p-4 cursor-pointer"
            onClick={() => setShowLeaveDialog(true)}
          >
            <Trash className="h-5 w-5 text-red-500 mr-3" />
            <span className="text-red-500">Leave Chatroom</span>
          </div>
        </div>
        
        {/* Participants List */}
        <div className="bg-white mt-2 border-t border-b border-gray-200">
          <h3 className="p-3 text-sm font-medium text-gray-500 border-b border-gray-100">
            PARTICIPANTS ({participants.length})
          </h3>
          
          <div className="divide-y divide-gray-100">
            {participants.map(user => (
              <div 
                key={user.id}
                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/user/${user.id}`)}
              >
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user.profile_picture_url} />
                  <AvatarFallback>{user.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h4 className="font-medium">{user.display_name}</h4>
                  <p className="text-xs text-gray-500 flex items-center">
                    {user.university || 'No university'}
                    {user.verification_status === 'verified' && (
                      <span className="ml-1 text-xs text-cendy-primary">• Verified ✓</span>
                    )}
                  </p>
                </div>
                
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Leave Dialog */}
        <Dialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Leave Chatroom</DialogTitle>
              <DialogDescription>
                Are you sure you want to leave "{chatRoom.chatroom_name}"? You will no longer receive messages from this chatroom.
              </DialogDescription>
            </DialogHeader>
            
            <DialogFooter className="mt-4">
              <Button
                variant="outline"
                onClick={() => setShowLeaveDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleLeaveChatroom}
              >
                Leave
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default ChatroomInfoPage;
