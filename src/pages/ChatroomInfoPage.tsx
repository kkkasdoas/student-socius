
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ChevronLeft, MoreVertical, Image as ImageIcon, Paperclip, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ChatRoom, User } from '@/types';

const ChatroomInfoPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null);
  
  // Fetch the chatroom data
  useEffect(() => {
    // In a real app, we would fetch this data from the API
    // For now, we'll create a mock chatroom
    const mockParticipants: User[] = [
      {
        id: '123',
        display_name: 'James Wilson',
        university: 'TDTU University',
        verification_status: 'verified',
        auth_provider: 'google',
        profile_picture_url: 'https://i.pravatar.cc/150?img=33',
        block_status: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '456',
        display_name: 'Sarah Johnson',
        university: 'TDTU University',
        verification_status: 'verified',
        auth_provider: 'microsoft',
        profile_picture_url: 'https://i.pravatar.cc/150?img=23',
        block_status: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: '789',
        display_name: 'Michael Brown',
        university: 'TDTU University',
        verification_status: 'verified',
        auth_provider: 'apple',
        profile_picture_url: 'https://i.pravatar.cc/150?img=53',
        block_status: false,
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    if (currentUser) {
      mockParticipants.push(currentUser);
    }
    
    const mockChatRoom: ChatRoom = {
      id: roomId || 'unknown',
      chatroom_name: 'Economics Study Group',
      chatroom_photo: 'https://i.pravatar.cc/150?img=group',
      participants: mockParticipants,
      messages: [],
      created_at: new Date(),
      updated_at: new Date()
    };
    
    setChatRoom(mockChatRoom);
  }, [roomId, currentUser]);
  
  if (!chatRoom) {
    return (
      <Layout>
        <div className="h-screen flex items-center justify-center">
          <p>Loading chatroom info...</p>
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
            onClick={() => navigate(`/chatroom/${roomId}`)}
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
              src={chatRoom.chatroom_photo || "https://i.pravatar.cc/150?img=group"} 
              alt={chatRoom.chatroom_name || "Chatroom"} 
            />
            <AvatarFallback className="text-2xl">
              {chatRoom.chatroom_name ? chatRoom.chatroom_name.substring(0, 2).toUpperCase() : "CR"}
            </AvatarFallback>
          </Avatar>
          
          <h2 className="text-xl font-bold mb-1">{chatRoom.chatroom_name || "Chatroom"}</h2>
          
          <p className="text-gray-500 mb-4">
            {chatRoom.participants.length} participants
          </p>
          
          <div className="flex space-x-3">
            <Button variant="outline" className="text-gray-600">
              Search Chat
            </Button>
            <Button variant="outline" className="text-red-600">
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
                {chatRoom.participants.map(user => (
                  <div key={user.id} className="flex items-center p-2 hover:bg-gray-50 rounded-lg">
                    <Avatar className="w-12 h-12 mr-3">
                      <AvatarImage 
                        src={user.profile_picture_url || "https://i.pravatar.cc/150?img=default"} 
                        alt={user.display_name} 
                      />
                      <AvatarFallback>{user.display_name.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center">
                        <h3 className="font-medium">{user.display_name}</h3>
                        {user.verification_status === 'verified' && (
                          <span className="ml-1 text-xs text-blue-500">✓</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">{user.university || "Student"}</p>
                    </div>
                    
                    <Button variant="ghost" size="sm">
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
