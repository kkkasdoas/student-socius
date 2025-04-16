import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Image as ImageIcon, Paperclip, Link as LinkIcon, Flag, Bell, BellOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { conversationService } from '@/services/ConversationService';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import ReportModal from '@/components/ReportModal';

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
  is_muted: boolean;
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

const ChatroomInfoPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [conversation, setConversation] = useState<ConversationFullDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');
  const [isLeaving, setIsLeaving] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [userToRemove, setUserToRemove] = useState<any | null>(null);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Define fetchConversation function before it's used
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
      
      // Transform dates
      setConversation({
        ...conversationData,
        created_at: conversationData.created_at ? new Date(conversationData.created_at) : new Date(),
        updated_at: conversationData.updated_at ? new Date(conversationData.updated_at) : new Date(),
        current_user_joined_at: conversationData.current_user_joined_at ? new Date(conversationData.current_user_joined_at) : null
      });
      
      // Set the muted state from the conversation data
      setIsMuted(conversationData.is_muted || false);
      
      console.log("Fetched conversation data:", conversationData);
    } catch (error) {
      console.error('Error fetching conversation:', error);
      toast.error('Failed to load chatroom information');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch the conversation data
  useEffect(() => {
    const fetchConversationData = async () => {
      try {
        setIsLoading(true);
        await fetchConversation();
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching conversation data:', error);
        setIsLoading(false);
      }
    };
    
    fetchConversationData();
  }, [roomId]);
  
  const confirmLeaveChatroom = () => {
    setShowLeaveConfirmation(true);
  };
  
  const handleLeaveChatroom = async () => {
    if (!currentUser || !conversation) return;
    
    // Check if the user is actually a participant
    if (!conversation.current_user_role) {
      toast.error('You are not a member of this chatroom');
      return;
    }
    
    try {
      setIsLeaving(true);
      
      // Use the remove_participant function to leave the chatroom
      const result = await conversationService.removeParticipant(
        conversation.id, 
        currentUser.id
      );
      
      if (result.success) {
        toast.success('You have left the chatroom');
        navigate('/conversations');
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error leaving chatroom:', error);
      toast.error('Failed to leave chatroom');
    } finally {
      setIsLeaving(false);
      setShowLeaveConfirmation(false);
    }
  };
  
  // Function to join a chatroom
  const handleJoinChatroom = async () => {
    if (!currentUser || !conversation || !roomId) return;
    
    try {
      setIsJoining(true);
      
      // Call the join_conversation RPC function
      const { data, error } = await supabase
        .rpc('join_conversation', { conversation_id_param: roomId });
        
      if (error) {
        throw error;
      }
      
      toast.success('You have joined the chatroom');
      
      // Refresh the conversation data
      const { data: refreshData, error: refreshError } = await supabase
        .rpc('get_conversation_full_details', { conversation_id_param: roomId });
        
      if (refreshError) {
        throw refreshError;
      }
      
      if (refreshData && Array.isArray(refreshData) && refreshData.length > 0) {
        const rawData = refreshData[0];
        setConversation({
          ...rawData,
          created_at: rawData.created_at ? new Date(rawData.created_at) : new Date(),
          updated_at: rawData.updated_at ? new Date(rawData.updated_at) : new Date(),
          current_user_joined_at: rawData.current_user_joined_at ? new Date(rawData.current_user_joined_at) : null
        });
      }
    } catch (error) {
      console.error('Error joining chatroom:', error);
      toast.error('Failed to join chatroom');
    } finally {
      setIsJoining(false);
    }
  };
  
  // Check if current user is an admin
  const isAdmin = conversation?.current_user_role === 'admin';
  
  // Check if user is a participant
  const isParticipant = !!conversation?.current_user_role;
  
  // Check if user can join
  const canJoin = conversation?.can_join === true;
  
  // Search for users
  const handleSearchUsers = async () => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    
    try {
      setIsSearching(true);
      
      // Find users by display name or email
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, profile_picture_url, email')
        .or(`display_name.ilike.%${searchTerm}%, email.ilike.%${searchTerm}%`)
        .limit(10);
        
      if (error) {
        throw error;
      }
      
      // Filter out users who are already members
      const filteredResults = data.filter(user => {
        if (!conversation?.participants) return true;
        return !conversation.participants.some(p => p.user_id === user.id);
      });
      
      setSearchResults(filteredResults);
    } catch (error) {
      console.error('Error searching users:', error);
      toast.error('Failed to search users');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Add a user to the conversation
  const handleAddMember = async () => {
    if (!searchResults || !conversation) return;
    
    try {
      setIsAddingMember(true);
      
      const result = await conversationService.addParticipant(
        conversation.id, 
        searchResults[0].id
      );
      
      if (result.success) {
        toast.success(`${searchResults[0].display_name} has been added to the conversation`);
        
        // Refresh the conversation data
        fetchConversation();
        
        // Reset selection and close dialog
        setShowAddMemberDialog(false);
        setSearchTerm('');
        setSearchResults([]);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error adding user to conversation:', error);
      toast.error('Failed to add user to conversation');
    } finally {
      setIsAddingMember(false);
    }
  };
  
  // Handle removing a participant
  const handleRemoveMember = async () => {
    if (!conversation || !userToRemove) return;
    
    try {
      setIsRemoving(true);
      
      const result = await conversationService.removeParticipant(
        conversation.id, 
        userToRemove.user_id
      );
      
      if (result.success) {
        toast.success(`${userToRemove.display_name} has been removed from the conversation`);
        
        // Refresh the conversation data
        fetchConversation();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error removing member:', error);
      toast.error('Failed to remove member');
    } finally {
      setIsRemoving(false);
      setShowConfirmDelete(false);
      setUserToRemove(null);
    }
  };
  
  // Function to navigate to user profile
  const navigateToUserProfile = (userId: string) => {
    navigate(`/user/${userId}`);
  };
  
  // Add this function to handle mute/unmute
  const handleMute = async (durationHours?: number) => {
    try {
      if (isMuted) {
        // Unmute chatroom
        const result = await conversationService.unmuteConversation(conversation.id);
        
        if (result.success) {
          setIsMuted(false);
          toast.success('Chatroom unmuted successfully');
        } else {
          toast.error(result.message || 'Failed to unmute chatroom');
        }
      } else {
        // Mute chatroom
        const result = await conversationService.muteConversation(conversation.id, durationHours);
        
        if (result.success) {
          setIsMuted(true);
          toast.success(result.message || 'Chatroom muted successfully');
        } else {
          toast.error(result.message || 'Failed to mute chatroom');
        }
      }
    } catch (error) {
      console.error('Error updating mute status:', error);
      toast.error('Failed to update mute settings');
    }
  };
  
  // Add a new function to handle reporting the chatroom
  const handleReportChatroom = () => {
    if (!currentUser) {
      toast.error('You must be logged in to report a chatroom');
      return;
    }
    
    setShowReportModal(true);
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
  
  const renderActionButtons = () => {
    // Display different actions based on user's role
    if (!conversation) return null;

    return (
      <div className="mt-6 flex flex-col space-y-3">
        {conversation.current_user_role ? (
          // User is a member
          <>
            {conversation.current_user_role === 'admin' && (
              <Button
                variant="default"
                onClick={() => navigate(`/chatrooms/${conversation.id}/edit`)}
                className="w-full"
              >
                Edit Chatroom
              </Button>
            )}
            <Button
              variant="outline"
              onClick={confirmLeaveChatroom}
              className="w-full"
              disabled={isLeaving}
            >
              {isLeaving ? 'Leaving...' : 'Leave Chatroom'}
            </Button>
          </>
        ) : (
          // User is not a member
          <Button
            variant="default"
            onClick={handleJoinChatroom}
            className="w-full"
            disabled={isJoining || !conversation.can_join}
          >
            {isJoining ? 'Joining...' : 'Join Chatroom'}
          </Button>
        )}
        
        {/* Report button available to all users */}
        <Button
          variant="outline"
          onClick={handleReportChatroom}
          className="w-full flex items-center gap-2 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <Flag className="h-4 w-4" />
          Report Chatroom
        </Button>
      </div>
    );
  };
  
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
          
          <h1 className="text-xl font-semibold flex-1">Back</h1>
          
          {isAdmin && (
            <Button 
              variant="ghost" 
              className="text-cyan-500"
              onClick={() => navigate(`/chatroom-info/${roomId}/edit`)}
            >
              Edit
            </Button>
          )}
        </div>
        
        {/* Chatroom Info */}
        <div className="p-6 bg-white flex flex-col items-center">
          <Avatar className="w-24 h-24 mb-4">
            <AvatarImage 
              src={conversation.photo || "https://i.pravatar.cc/150?img=group"} 
              alt={conversation.chatroom_name || "Chatroom"} 
            />
            <AvatarFallback className="text-2xl">
              {conversation.chatroom_name ? conversation.chatroom_name.substring(0, 2).toUpperCase() : "CR"}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold mb-1">{conversation.chatroom_name || "Chatroom"}</h2>
          
          <p className="text-gray-500 mb-4">
            Members: {conversation.participant_count || 0}
          </p>
          
          {/* Action buttons (4 buttons in a row) */}
          <div className={`grid ${isParticipant ? 'grid-cols-4' : 'grid-cols-2'} w-full gap-4`}>
            {isParticipant && (
              <div className="flex flex-col items-center">
                {isMuted ? (
                  <button 
                    className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                    onClick={() => handleMute()}
                  >
                    <BellOff className="h-6 w-6 text-cyan-500" />
                  </button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                        <Bell className="h-6 w-6 text-cyan-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                      <DropdownMenuItem onSelect={() => handleMute(1)}>
                        Mute for 1 hour
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleMute(8)}>
                        Mute for 8 hours
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleMute(24)}>
                        Mute for 1 day
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleMute(168)}>
                        Mute for 7 days
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleMute()} className="text-red-500">
                        Mute forever
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                <span className="text-xs">{isMuted ? "Unmute" : "Mute"}</span>
              </div>
            )}
            
            <div className="flex flex-col items-center">
              <button className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <span className="text-xs">Search</span>
            </div>
            
            {isParticipant && (
              <div className="flex flex-col items-center">
                <button 
                  className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                  onClick={confirmLeaveChatroom}
                  disabled={isLeaving}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                    <polyline points="16 17 21 12 16 7"></polyline>
                    <line x1="21" y1="12" x2="9" y2="12"></line>
                  </svg>
                </button>
                <span className="text-xs">Leave</span>
              </div>
            )}
            
            {isAdmin ? (
              <div className="flex flex-col items-center">
                <button className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                    <path d="M3 6h18"></path>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
                <span className="text-xs text-red-500">Delete</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <button 
                  className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                  onClick={handleReportChatroom}
                >
                  <Flag className="h-6 w-6 text-red-500" />
                </button>
                <span className="text-xs text-red-500">Report</span>
              </div>
            )}

            {!isParticipant && canJoin && (
              <div className="col-span-2 mt-4">
                <Button 
                  className="w-full bg-cyan-500 hover:bg-cyan-600"
                  onClick={handleJoinChatroom}
                  disabled={isJoining}
                >
                  {isJoining ? 'Joining...' : 'Join Chatroom'}
                </Button>
              </div>
            )}
          </div>
        </div>
        
        {/* Chatroom Details */}
        <div className="bg-white mt-2 px-4 py-3">
          <p className="text-sm text-gray-600 mb-1">Chatroom link</p>
          <p className="text-sm text-blue-500 underline mb-4">https://www.coogle.com/search?</p>
          
          <p className="text-sm text-gray-600 mb-1">Title</p>
          <p className="text-sm mb-4">{conversation.post_title || 'Title not available'}</p>
          
          <p className="text-sm text-gray-600 mb-1">Content</p>
          <p className="text-sm mb-1">{conversation.post_content || 'Content not available'}</p>
          <p className="text-sm text-blue-500">more</p>
        </div>
        
        {/* Tabs */}
        <div className="flex-1 bg-white mt-2 overflow-hidden flex flex-col">
          <Tabs defaultValue="members" className="w-full h-full">
            <TabsList className="w-full border-b border-gray-200">
              <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
              <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
              <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
              <TabsTrigger value="links" className="flex-1">Links</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="flex-1 overflow-y-auto p-4">
              {isAdmin && (
                <div className="flex items-center p-2 mb-2">
                  <button 
                    className="flex items-center justify-center w-full"
                    onClick={() => setShowAddMemberDialog(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 text-cyan-500">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                      <circle cx="8.5" cy="7" r="4"></circle>
                      <line x1="20" y1="8" x2="20" y2="14"></line>
                      <line x1="23" y1="11" x2="17" y2="11"></line>
                    </svg>
                    <span className="text-cyan-500">Add members</span>
                  </button>
                </div>
              )}
              
              <div className="space-y-4">
                {conversation.participants && Array.isArray(conversation.participants) && conversation.participants.map((participant: ParticipantDetails) => (
                  <ContextMenu key={participant.user_id}>
                    <ContextMenuTrigger>
                      <div 
                        className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-100 cursor-pointer hover:bg-gray-50"
                        onClick={() => navigateToUserProfile(participant.user_id)}
                      >
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarImage 
                              src={participant.profile_picture_url || "https://i.pravatar.cc/150?img=default"} 
                              alt={participant.display_name} 
                            />
                            <AvatarFallback>{participant.display_name?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="flex items-center">
                              <p className="font-medium">{participant.display_name}</p>
                              {participant.role === 'admin' && (
                                <Badge variant="default" className="ml-2 bg-cyan-500 text-xs">owner</Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              Joined {new Date(participant.joined_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </ContextMenuTrigger>
                    {isAdmin && participant.user_id !== currentUser?.id && participant.role !== 'admin' && (
                      <ContextMenuContent>
                        <ContextMenuItem 
                          className="text-red-500 focus:text-red-500 focus:bg-red-50"
                          onClick={() => {
                            setUserToRemove(participant);
                            setShowConfirmDelete(true);
                          }}
                        >
                          Delete {participant.display_name}
                        </ContextMenuItem>
                      </ContextMenuContent>
                    )}
                  </ContextMenu>
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
      
      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
              Search for users to add to this conversation.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email"
                className="w-full p-3 pr-10 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchUsers()}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={handleSearchUsers}
                disabled={isSearching}
              >
                {isSearching ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-cyan-500" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                  </svg>
                )}
              </Button>
            </div>
            
            <div className="mt-4 max-h-60 overflow-y-auto">
              {searchResults.length === 0 && searchTerm ? (
                <p className="text-center text-gray-500 py-4">No users found</p>
              ) : (
                searchResults.map(user => (
                  <div 
                    key={user.id}
                    className={`flex items-center p-3 mb-2 rounded-lg cursor-pointer ${
                      user.id === searchResults[0].id ? 'bg-cyan-50 border border-cyan-200' : 'hover:bg-gray-50'
                    }`}
                  >
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage 
                        src={user.profile_picture_url || "https://i.pravatar.cc/150?img=default"} 
                        alt={user.display_name} 
                      />
                      <AvatarFallback>{user.display_name?.substring(0, 2).toUpperCase() || "UN"}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.display_name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddMemberDialog(false);
                setSearchTerm('');
                setSearchResults([]);
              }}
              disabled={isAddingMember}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddMember}
              disabled={isAddingMember || searchResults.length === 0}
            >
              {isAddingMember ? 'Adding...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Delete Dialog */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove {userToRemove?.display_name} from this conversation?
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowConfirmDelete(false);
                setUserToRemove(null);
              }}
              disabled={isRemoving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleRemoveMember}
              disabled={isRemoving}
              className="bg-red-500 hover:bg-red-600"
            >
              {isRemoving ? 'Removing...' : 'Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Leave Confirmation Dialog */}
      <Dialog open={showLeaveConfirmation} onOpenChange={setShowLeaveConfirmation}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Leave Chatroom</DialogTitle>
            <DialogDescription>
              Are you sure you want to leave this chatroom? You'll need to be added by an admin to rejoin.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowLeaveConfirmation(false)}
              disabled={isLeaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLeaveChatroom}
              disabled={isLeaving}
              className="bg-red-500 hover:bg-red-600"
            >
              {isLeaving ? 'Leaving...' : 'Leave Chatroom'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Report Modal */}
      <ReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        type="chatroom"
        entityId={conversation.id}
        entity={{
          id: conversation.id,
          type: conversation.type as any,
          chatroom_name: conversation.chatroom_name,
          photo: conversation.photo,
          created_at: conversation.created_at,
          updated_at: conversation.updated_at
        }}
        onSuccess={() => toast.success('Report submitted successfully')}
      />
    </Layout>
  );
};

export default ChatroomInfoPage;
