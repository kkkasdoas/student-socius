
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { mockChatRooms, mockCampusGeneralPosts, mockForumPosts } from '@/utils/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { ArrowLeft, Search, LogOut, Flag, Link as LinkIcon } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { User } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const ChatroomInfoPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [chatRoom, setChatRoom] = useState<any>(null);
  const [relatedPost, setRelatedPost] = useState<any>(null);
  
  useEffect(() => {
    if (!roomId) return;
    
    const room = mockChatRooms.find(r => r.id === roomId);
    if (room) {
      setChatRoom(room);
      
      if (room.postId) {
        const foundPost = [...mockCampusGeneralPosts, ...mockForumPosts].find(p => p.id === room.postId);
        if (foundPost) {
          setRelatedPost(foundPost);
        }
      }
    }
  }, [roomId]);
  
  if (!chatRoom) {
    return (
      <Layout hideNav>
        <div className="flex items-center justify-center h-screen">
          <p>Loading chatroom information...</p>
        </div>
      </Layout>
    );
  }
  
  const getChatroomName = () => {
    if (chatRoom.chatroomName) {
      return chatRoom.chatroomName;
    }
    
    if (relatedPost) {
      return relatedPost.chatroomName || relatedPost.title;
    }
    
    return 'Chat Room';
  };
  
  return (
    <Layout hideNav>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-4 border-b bg-white flex items-center">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors mr-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="font-medium text-lg text-gray-800">Chatroom Info</h1>
        </div>
        
        {/* Chatroom Photo & Name */}
        <div className="bg-white p-6 flex flex-col items-center">
          <div className="w-24 h-24 mb-4">
            {chatRoom.chatroomPhoto ? (
              <img 
                src={chatRoom.chatroomPhoto} 
                alt="Chatroom"
                className="w-full h-full rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-cendy-primary flex items-center justify-center text-white text-xl font-bold">
                {getChatroomName().charAt(0)}
              </div>
            )}
          </div>
          
          <h2 className="text-xl font-bold text-gray-800 mb-1">{getChatroomName()}</h2>
          <p className="text-sm text-gray-500">Members: {chatRoom.participants.length}</p>
        </div>
        
        {/* Action Buttons */}
        <div className="bg-white mt-2 p-4 grid grid-cols-4 gap-2">
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-1">
              <Search className="w-5 h-5 text-blue-500" />
            </button>
            <span className="text-xs text-blue-500">Search</span>
          </div>
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-1">
              <LinkIcon className="w-5 h-5 text-green-500" />
            </button>
            <span className="text-xs text-green-500">Share</span>
          </div>
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-1">
              <LogOut className="w-5 h-5 text-red-500" />
            </button>
            <span className="text-xs text-red-500">Leave</span>
          </div>
          <div className="flex flex-col items-center">
            <button className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-1">
              <Flag className="w-5 h-5 text-orange-500" />
            </button>
            <span className="text-xs text-orange-500">Report</span>
          </div>
        </div>
        
        {/* Chatroom Link */}
        {relatedPost && (
          <div className="bg-white mt-2 p-4">
            <h3 className="text-sm text-gray-500 mb-2">Chatroom link</h3>
            <div className="p-2 bg-gray-100 rounded-md text-blue-500 text-sm truncate">
              https://app.cendy.io/chatroom/{chatRoom.id}
            </div>
          </div>
        )}
        
        {/* Post Details */}
        {relatedPost && (
          <div className="bg-white mt-2 p-4">
            <h3 className="text-sm text-gray-500 mb-2">Original Post</h3>
            <div className="mb-2">
              <span className="text-sm font-medium">Title</span>
              <p className="text-gray-800">{relatedPost.title}</p>
            </div>
            <div>
              <span className="text-sm font-medium">Content</span>
              <p className="text-gray-800">
                {relatedPost.content.length > 100 
                  ? `${relatedPost.content.substring(0, 100)}... `
                  : relatedPost.content
                }
                {relatedPost.content.length > 100 && (
                  <span className="text-blue-500">more</span>
                )}
              </p>
            </div>
          </div>
        )}
        
        {/* Tabs */}
        <div className="flex-1 mt-2 bg-white">
          <Tabs defaultValue="members">
            <TabsList className="w-full">
              <TabsTrigger value="members" className="flex-1">Members</TabsTrigger>
              <TabsTrigger value="media" className="flex-1">Media</TabsTrigger>
              <TabsTrigger value="files" className="flex-1">Files</TabsTrigger>
              <TabsTrigger value="links" className="flex-1">Links</TabsTrigger>
            </TabsList>
            
            <TabsContent value="members" className="p-0">
              <div className="p-4 border-b flex items-center text-blue-500">
                <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" x2="19" y1="8" y2="14" />
                    <line x1="16" x2="22" y1="11" y2="11" />
                  </svg>
                </span>
                Add members
              </div>
              
              {chatRoom.participants.map((participant: User) => (
                <div key={participant.id} className="p-4 border-b flex items-center">
                  <img 
                    src={participant.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'}
                    alt={participant.displayName}
                    className="w-10 h-10 rounded-full object-cover mr-3"
                  />
                  <div>
                    <p className="font-medium">{participant.displayName}</p>
                    <p className="text-xs text-gray-500">{participant.bio || 'No bio'}</p>
                  </div>
                  {participant.id === chatRoom.participants[0]?.id && (
                    <span className="ml-auto text-xs text-gray-400">owner</span>
                  )}
                </div>
              ))}
            </TabsContent>
            
            <TabsContent value="media">
              <div className="flex items-center justify-center h-40 text-gray-400">
                <p>No media files</p>
              </div>
            </TabsContent>
            
            <TabsContent value="files">
              <div className="flex items-center justify-center h-40 text-gray-400">
                <p>No files</p>
              </div>
            </TabsContent>
            
            <TabsContent value="links">
              <div className="flex items-center justify-center h-40 text-gray-400">
                <p>No links</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default ChatroomInfoPage;
