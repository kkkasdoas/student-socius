import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, UserX, Share2, BellOff, Flag, Edit, MessageCircle, PlusSquare, Camera, Facebook, Instagram, Bell } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User, Post } from '@/types';
import { userProfileService } from '@/services/UserProfileService';
import { UserGallery } from '@/components/UserGallery';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { conversationService } from '@/services/ConversationService';

type TabType = 'photos' | 'posts';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('photos');
  const [uploadHandler, setUploadHandler] = useState<((file: File) => Promise<void>) | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isFromConversation, setIsFromConversation] = useState(false);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !currentUser) return;
      
      setIsLoading(true);
      
      try {
        // Fetch user profile using UserProfileService
        const userProfile = await userProfileService.getUserProfile(userId);
        setUser(userProfile);
        
        // Check if navigation is from a conversation page
        const referrer = document.referrer;
        if (referrer.includes('/conversation/')) {
          setIsFromConversation(true);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        toast.error('Failed to load user profile');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [userId, currentUser]);
  
  const handleBlock = async () => {
    if (!currentUser || !user) return;
    
    try {
      if (user.isBlocked) {
        // Unblock user
        const result = await userProfileService.unblockUser(user.id);
        
        if (result.success) {
          // Update local state
          setUser({
            ...user,
            isBlocked: false
          });
          toast.success(result.message || 'User unblocked');
        } else {
          toast.error(result.message || 'Failed to unblock user');
        }
      } else {
        // Block user
        const result = await userProfileService.blockUser(user.id);
        
        if (result.success) {
          // Update local state
          setUser({
            ...user,
            isBlocked: true
          });
          toast.success(result.message || 'User blocked');
        } else {
          toast.error(result.message || 'Failed to block user');
        }
      }
      setMoreMenuOpen(false);
    } catch (error) {
      console.error('Error updating block status:', error);
      toast.error('Failed to update block status');
    }
  };
  
  const handleMute = async (durationHours?: number) => {
    if (!currentUser || !user) return;
    
    try {
      if (user.isMuted) {
        // Unmute user
        const result = await userProfileService.unmuteUser(user.id);
        
        if (result.success) {
          // Update local state
          setUser({
            ...user,
            isMuted: false
          });
          toast.success(result.message || 'Unmuted notifications from this user');
        } else {
          toast.error(result.message || 'Failed to unmute user');
        }
      } else {
        // Mute user
        const result = await userProfileService.muteUser(user.id, durationHours);
        
        if (result.success) {
          // Update local state
          setUser({
            ...user,
            isMuted: true
          });
          toast.success(result.message || 'Muted notifications from this user');
        } else {
          toast.error(result.message || 'Failed to mute user');
        }
      }
      setMoreMenuOpen(false);
    } catch (error) {
      console.error('Error updating mute status:', error);
      toast.error('Failed to update notification settings');
    }
  };
  
  const handleShare = () => {
    if (!user) return;
    
    const shareUrl = `${window.location.origin}/user/${user.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `Profile of ${user.displayName}`,
        text: `Check out ${user.displayName}'s profile!`,
        url: shareUrl,
      })
      .then(() => console.log('Successfully shared'))
      .catch((error) => console.log('Error sharing:', error));
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(shareUrl);
      toast.success('Profile link copied to clipboard');
    }
    setMoreMenuOpen(false);
  };
  
  const handleReport = () => {
    setReportDialogOpen(true);
    setMoreMenuOpen(false);
  };
  
  const submitReport = async () => {
    if (!reportReason.trim() || !currentUser || !user) {
      toast.error('Please provide a reason for the report');
      return;
    }
    
    try {
      setSubmittingReport(true);
      const result = await userProfileService.reportUser(user.id, reportReason);
      
      if (result.success) {
        toast.success('Report submitted successfully');
        setReportDialogOpen(false);
        setReportReason('');
      } else {
        toast.error(result.message || 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    } finally {
      setSubmittingReport(false);
    }
  };
  
  const handleEditProfile = () => {
    navigate('/edit-profile');
  };
  
  const handleEditProfilePhoto = () => {
    // Implement profile photo edit functionality
    toast.info('Profile photo edit functionality coming soon');
  };
  
  const handleAddPost = () => {
    if (user?.isOwnProfile && activeTab === 'photos' && uploadHandler) {
      // If on photos tab, trigger photo upload
      fileInputRef.current?.click();
    } else {
      // Otherwise navigate to post creation page
      navigate('/create-post');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !uploadHandler) return;
    
    await uploadHandler(e.target.files[0]);
    
    // Reset the input
    e.target.value = '';
  };
  
  const handleMessage = async () => {
    if (!currentUser || !user || user.isOwnProfile) return;
    
    try {
      // Use conversationService to create or get an existing private conversation
      const conversationId = await conversationService.createOrGetPrivateConversation(currentUser.id, user.id);
      
      // Navigate to the actual conversation page with the created/retrieved conversation ID
      navigate(`/conversation/${conversationId}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Get the upload handler function from UserGallery
  const handleUploadTrigger = (handler: (file: File) => Promise<void>) => {
    setUploadHandler(() => handler);
  };

  // Extract usernames from social links
  const extractFacebookUsername = (url: string | undefined): string => {
    if (!url) return '';
    try {
      // Extract username from Facebook URL patterns
      const match = url.match(/facebook\.com\/([^\/\?]+)/);
      return match ? match[1] : '';
    } catch (e) {
      return '';
    }
  };

  const extractInstagramUsername = (url: string | undefined): string => {
    if (!url) return '';
    try {
      // Extract username from Instagram URL patterns
      const match = url.match(/instagram\.com\/([^\/\?]+)/);
      return match ? match[1] : '';
    } catch (e) {
      return '';
    }
  };

  const handleClearChat = async () => {
    if (!currentUser || !user) return;
    
    try {
      // Call a service method to clear chat history
      toast.info('Chat clearing functionality coming soon');
      // Future implementation would call a service like:
      // const result = await conversationService.clearChatHistory(user.id);
      
    } catch (error) {
      console.error('Error clearing chat:', error);
      toast.error('Failed to clear chat history');
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <div className="loader animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-cendy-primary"></div>
          <p className="text-gray-500 mt-4">Loading profile...</p>
        </div>
      </Layout>
    );
  }
  
  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen p-4">
          <p className="text-gray-500">User not found</p>
          <button 
            className="mt-4 text-blue-500"
            onClick={() => navigate(-1)}
          >
            Go back
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center px-4 py-3 border-b border-gray-200 bg-gray-50 sticky top-0 z-10">
          {/* Use native back button styling */}
          <button 
            className="p-1"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold flex-1 text-center">{user.displayName}</h1>
          
          {/* Show plus icon for own profile, remove three dots for others */}
          {user.isOwnProfile && (
            <button
              className="p-1 text-gray-600"
              onClick={handleAddPost}
            >
              {/* This will be replaced with PNG later */}
              <div className="w-5 h-5 flex items-center justify-center">
                <PlusSquare className="w-5 h-5" />
              </div>
              {/* Hidden file input for photo upload */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
            </button>
          )}
          {!user.isOwnProfile && (
            <div className="w-7"></div> // Empty div to maintain header centering
          )}
        </div>
        
        <div className="flex-1 overflow-auto">
          <div className="relative">
            {/* Profile header with improved layout */}
            <div className="bg-white pt-6 pb-2">
              <div className="px-6">
                {/* Profile section with center alignment */}
                <div className="flex flex-col items-center">
                  {/* Profile Picture */}
                  <div className="relative">
                    <Avatar className="h-24 w-24 border-4 border-white rounded-full shadow-sm">
                      <AvatarImage src={user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} alt={user.displayName} />
                      <AvatarFallback className="text-xl">{user.displayName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    
                    {/* Edit Profile Photo Button */}
                    {user.isOwnProfile && (
                      <div className="absolute right-0 bottom-0">
                        <button 
                          onClick={handleEditProfilePhoto} 
                          className="bg-white rounded-full p-1.5 shadow-md"
                        >
                          <Camera className="h-4 w-4 text-gray-700" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Display Name */}
                  <h2 className="text-xl font-semibold mt-3">{user.displayName}</h2>
                  
                  {/* Action buttons (4 buttons in a row) */}
                  <div className="grid grid-cols-4 w-full gap-4 mt-4">
                    {/* Different button sets based on navigation source */}
                    {!user.isOwnProfile && (
                      <>
                        {/* Mute button - always present */}
                        <div className="flex flex-col items-center">
                          {user.isMuted ? (
                            <button 
                              className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                              onClick={() => handleMute()}
                            >
                              <BellOff className="h-6 w-6 text-cyan-500" />
                            </button>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button 
                                  className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                                >
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
                          <span className="text-xs">
                            {user.isMuted ? "Unmute" : "Mute"}
                          </span>
                        </div>
                        
                        {/* Conditional Search/Message button */}
                        {isFromConversation ? (
                          <div className="flex flex-col items-center">
                            <button className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                                <circle cx="11" cy="11" r="8"></circle>
                                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                              </svg>
                            </button>
                            <span className="text-xs">Search</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center">
                            <button 
                              className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                              onClick={handleMessage}
                            >
                              <MessageCircle className="h-6 w-6 text-cyan-500" />
                            </button>
                            <span className="text-xs">Message</span>
                          </div>
                        )}
                        
                        {/* Clear chat - always present */}
                        <div className="flex flex-col items-center">
                          <button 
                            className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                            onClick={handleClearChat}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                              <path d="M3 6h18"></path>
                              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                          </button>
                          <span className="text-xs text-red-500">Clear</span>
                        </div>
                        
                        {/* Report button - always present */}
                        <div className="flex flex-col items-center">
                          <button 
                            className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                            onClick={handleReport}
                          >
                            <Flag className="h-6 w-6 text-red-500" />
                          </button>
                          <span className="text-xs text-red-500">Report</span>
                        </div>
                      </>
                    )}
                    
                    {/* For own profile */}
                    {user.isOwnProfile && (
                      <>
                        <div className="flex flex-col items-center">
                          <button 
                            className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                              <polyline points="17 8 12 3 7 8"></polyline>
                              <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                          </button>
                          <span className="text-xs">Share</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <button className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-500">
                              <circle cx="11" cy="11" r="8"></circle>
                              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                            </svg>
                          </button>
                          <span className="text-xs">Search</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <button 
                            className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                            onClick={handleEditProfile}
                          >
                            <Edit className="h-6 w-6 text-cyan-500" />
                          </button>
                          <span className="text-xs">Edit</span>
                        </div>
                        
                        <div className="flex flex-col items-center">
                          <button 
                            className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center mb-1"
                            onClick={handleAddPost}
                          >
                            <PlusSquare className="h-6 w-6 text-cyan-500" />
                          </button>
                          <span className="text-xs">Add</span>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Social Links */}
                  {user.socialLinks && (Object.values(user.socialLinks).some(link => !!link)) && (
                    <div className="mt-4 space-y-1 w-full">
                      {user.socialLinks.facebook && (
                        <div className="flex items-center">
                          {/* This will be replaced with PNG later */}
                          <div className="w-5 h-5 flex items-center justify-center text-blue-600">
                            <Facebook className="w-5 h-5" />
                          </div>
                          <a 
                            href={user.socialLinks.facebook} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-sm text-gray-600 hover:underline"
                          >
                            {extractFacebookUsername(user.socialLinks.facebook)}
                          </a>
                        </div>
                      )}
                      {user.socialLinks.instagram && (
                        <div className="flex items-center">
                          {/* This will be replaced with PNG later */}
                          <div className="w-5 h-5 flex items-center justify-center text-pink-600">
                            <Instagram className="w-5 h-5" />
                          </div>
                          <a 
                            href={user.socialLinks.instagram} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="ml-2 text-sm text-gray-600 hover:underline"
                          >
                            {extractInstagramUsername(user.socialLinks.instagram)}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Bio */}
                  {user.bio && (
                    <p className="text-gray-600 text-sm mt-3 w-full">{user.bio}</p>
                  )}
                  
                  {/* Block User Button - only show for other profiles */}
                  {!user.isOwnProfile && (
                    <button 
                      onClick={handleBlock}
                      className="w-full mt-4 text-red-500 text-sm font-medium text-left"
                    >
                      {user.isBlocked ? 'Unblock User' : 'Block User'}
                    </button>
                  )}
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="bg-white border-t border-b border-gray-200 mt-2">
              <div className="flex w-full">
                <button
                  className={`flex-1 py-3 text-center font-medium text-sm ${
                    activeTab === 'photos' 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => handleTabChange('photos')}
                >
                  Photos
                </button>
                <button
                  className={`flex-1 py-3 text-center font-medium text-sm ${
                    activeTab === 'posts' 
                      ? 'text-blue-500 border-b-2 border-blue-500' 
                      : 'text-gray-500'
                  }`}
                  onClick={() => handleTabChange('posts')}
                >
                  Posts
                </button>
              </div>
            </div>
            
            {/* Tab Content */}
            <div className="bg-gray-100">
              {activeTab === 'photos' ? (
                <UserGallery 
                  userId={user.id} 
                  isOwnProfile={user.isOwnProfile} 
                  onUploadTrigger={handleUploadTrigger}
                />
              ) : (
                <div className="p-4 text-center text-gray-500">
                  User posts will be displayed here
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* More Menu Dialog */}
      {moreMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-50 flex items-start justify-end" onClick={() => setMoreMenuOpen(false)}>
          <div 
            className="bg-white rounded-lg shadow-lg w-64 mt-24 mr-5 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {user.isOwnProfile ? (
              <>
                <div 
                  className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={handleEditProfile}
                >
                  <Edit className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Edit Profile</span>
                </div>
                <div 
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Share Profile</span>
                </div>
              </>
            ) : (
              <>
                <div 
                  className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer text-red-500"
                  onClick={handleBlock}
                >
                  <UserX className="w-5 h-5 mr-3" />
                  <span>{user.isBlocked ? 'Unblock User' : 'Block User'}</span>
                </div>
                {user.isMuted ? (
                  <DropdownMenuItem onClick={() => handleMute()}>
                    <span>Unmute User</span>
                  </DropdownMenuItem>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                        <BellOff className="w-5 h-5 mr-3 text-gray-500" />
                        <span>Mute User</span>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-48">
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
                <div 
                  className="flex items-center px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={handleShare}
                >
                  <Share2 className="w-5 h-5 mr-3 text-gray-500" />
                  <span>Share Profile</span>
                </div>
                <div 
                  className="flex items-center px-4 py-3 hover:bg-gray-50 cursor-pointer text-red-500"
                  onClick={handleReport}
                >
                  <Flag className="w-5 h-5 mr-3" />
                  <span>Report</span>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Report Dialog */}
      <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report User</DialogTitle>
            <DialogDescription>
              Tell us why you're reporting this user. Your report will be kept anonymous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <textarea
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-cendy-primary"
              rows={4}
              placeholder="Please explain why you're reporting this user..."
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)} disabled={submittingReport}>
              Cancel
            </Button>
            <Button onClick={submitReport} disabled={submittingReport || !reportReason.trim()}>
              {submittingReport ? "Submitting..." : "Submit Report"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UserProfilePage;
