import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, UserX, Share2, BellOff, Flag, Edit, ExternalLink, MessageCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { User, Post } from '@/types';
import PostCard from '@/components/PostCard';
import { supabase } from '@/integrations/supabase/client';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [reportDialogOpen, setReportDialogOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId || !currentUser) return;
      
      setIsLoading(true);
      
      try {
        // Check if viewing own profile
        setIsCurrentUser(userId === currentUser.id);
        
        // Fetch user profile from Supabase
        const { data: userData, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (userError) {
          throw userError;
        }
        
        if (!userData) {
          console.error('User not found');
          return;
        }
        
        // Transform database user to application User type
        const userProfile: User = {
          id: userData.id,
          displayName: userData.display_name,
          profilePictureUrl: userData.profile_picture_url,
          university: userData.university,
          verificationStatus: userData.verification_status,
          authProvider: userData.auth_provider,
          bio: userData.bio,
          blockStatus: userData.block_status,
          isDeleted: userData.is_deleted,
          createdAt: new Date(userData.created_at),
          updatedAt: new Date(userData.updated_at)
        };
        
        setUser(userProfile);
        
        // Check if user is blocked
        const { data: blockedData, error: blockedError } = await supabase
          .from('blocked_users')
          .select('*')
          .eq('blocker_id', currentUser.id)
          .eq('blocked_id', userId)
          .maybeSingle();
          
        if (blockedError) {
          console.error('Error checking block status:', blockedError);
        } else {
          setIsBlocked(!!blockedData);
        }
        
        // Check if user is muted
        const { data: mutedData, error: mutedError } = await supabase
          .from('muted_users')
          .select('*')
          .eq('muter_id', currentUser.id)
          .eq('muted_id', userId)
          .maybeSingle();
          
        if (mutedError) {
          console.error('Error checking mute status:', mutedError);
        } else {
          setIsMuted(!!mutedData);
        }
        
        // Fetch user posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            user:user_id(*)
          `)
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);
          
        if (postsError) {
          console.error('Error fetching posts:', postsError);
        } else if (postsData) {
          // Transform post data to application Post type
          const formattedPosts: Post[] = postsData.map(post => ({
            id: post.id,
            userId: post.user_id,
            title: post.title,
            content: post.content,
            university: post.university,
            conversationId: post.conversation_id,
            imageUrl: post.image_url,
            channelType: post.channel_type,
            category: post.category,
            isEdited: post.is_edited,
            createdAt: new Date(post.created_at),
            updatedAt: new Date(post.updated_at),
            user: post.user,
            reactions: []
          }));
          
          setUserPosts(formattedPosts);
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
      if (isBlocked) {
        // Unblock user
        const { error } = await supabase
          .from('blocked_users')
          .delete()
          .eq('blocker_id', currentUser.id)
          .eq('blocked_id', user.id);
          
        if (error) throw error;
        
        setIsBlocked(false);
        toast.success('User unblocked');
      } else {
        // Block user
        const { error } = await supabase
          .from('blocked_users')
          .insert({
            blocker_id: currentUser.id,
            blocked_id: user.id,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        setIsBlocked(true);
        toast.success('User blocked');
      }
    } catch (error) {
      console.error('Error updating block status:', error);
      toast.error('Failed to update block status');
    }
  };
  
  const handleMute = async () => {
    if (!currentUser || !user) return;
    
    try {
      if (isMuted) {
        // Unmute user
        const { error } = await supabase
          .from('muted_users')
          .delete()
          .eq('muter_id', currentUser.id)
          .eq('muted_id', user.id);
          
        if (error) throw error;
        
        setIsMuted(false);
        toast.success('Unmuted notifications from this user');
      } else {
        // Mute user
        const { error } = await supabase
          .from('muted_users')
          .insert({
            muter_id: currentUser.id,
            muted_id: user.id,
            created_at: new Date().toISOString()
          });
          
        if (error) throw error;
        
        setIsMuted(true);
        toast.success('Muted notifications from this user');
      }
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
  };
  
  const handleReport = () => {
    setReportDialogOpen(true);
  };
  
  const submitReport = async () => {
    if (!reportReason.trim() || !currentUser || !user) {
      toast.error('Please provide a reason for the report');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_reports')
        .insert({
          reporter_id: currentUser.id,
          reported_id: user.id,
          reason: reportReason,
          status: 'pending',
          created_at: new Date().toISOString()
        });
        
      if (error) throw error;
      
      toast.success('Report submitted successfully');
      setReportDialogOpen(false);
      setReportReason('');
    } catch (error) {
      console.error('Error submitting report:', error);
      toast.error('Failed to submit report');
    }
  };
  
  const handleEditProfile = () => {
    navigate('/settings/edit-profile');
  };
  
  const handleMessage = async () => {
    if (!currentUser || !user || isCurrentUser) return;
    
    try {
      // Check if there's an existing private conversation between the users
      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id,
          type,
          participants:conversation_participants!inner(user_id)
        `)
        .eq('type', 'private');
        
      if (error) throw error;
      
      // Find a conversation where both users are participants
      const existingConversation = data?.find(conv => {
        const participantIds = conv.participants.map((p: any) => p.user_id);
        return (
          participantIds.includes(currentUser.id) && 
          participantIds.includes(user.id) &&
          participantIds.length === 2 // Ensure it's just these two users
        );
      });
      
      if (existingConversation) {
        // Navigate to existing conversation
        navigate(`/conversation/${existingConversation.id}`);
        return;
      }
      
      // If no existing conversation, create a new one
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          type: 'private',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
        
      if (createError) throw createError;
      
      // Add both users to the conversation
      const { error: participantsError } = await supabase
        .from('conversation_participants')
        .insert([
          {
            conversation_id: newConversation.id,
            user_id: currentUser.id
          },
          {
            conversation_id: newConversation.id,
            user_id: user.id
          }
        ]);
        
      if (participantsError) throw participantsError;
      
      // Navigate to the new conversation
      navigate(`/conversation/${newConversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
      toast.error('Failed to start conversation');
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
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center">
            <button 
              className="p-1.5 rounded-full hover:bg-gray-100 mr-2"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-700" />
            </button>
            <h1 className="text-lg font-semibold text-gray-800">Profile</h1>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-gray-100">
                <MoreVertical className="w-5 h-5 text-gray-700" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {isCurrentUser ? (
                // Options for own profile
                <>
                  <DropdownMenuItem onClick={handleEditProfile}>
                    <Edit className="mr-2 h-4 w-4" />
                    <span>Edit Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share Profile</span>
                  </DropdownMenuItem>
                </>
              ) : (
                // Options for other users' profiles
                <>
                  <DropdownMenuItem onClick={handleBlock}>
                    <UserX className="mr-2 h-4 w-4" />
                    <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleMute}>
                    <BellOff className="mr-2 h-4 w-4" />
                    <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    <span>Share this profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleReport} className="text-red-500 focus:text-red-500">
                    <Flag className="mr-2 h-4 w-4" />
                    <span>Report</span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* User Info */}
        <div className="bg-white p-4 border-b border-gray-200">
          <div className="flex items-start">
            <Avatar className="h-20 w-20 rounded-full border-2 border-white shadow-sm">
              <AvatarImage 
                src={user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                alt={user.displayName} 
              />
              <AvatarFallback>{user.displayName.substring(0, 2)}</AvatarFallback>
            </Avatar>
            
            <div className="ml-4 flex-1">
              <div className="flex items-center">
                <h2 className="text-xl font-semibold text-gray-800">{user.displayName}</h2>
                {user.verificationStatus === 'verified' && (
                  <span className="ml-1 text-xs bg-blue-100 text-blue-500 px-1.5 py-0.5 rounded-full">
                    Verified
                  </span>
                )}
              </div>
              
              {user.university && (
                <p className="text-sm text-gray-500 mt-1">{user.university}</p>
              )}
              
              {user.bio && (
                <p className="text-sm text-gray-700 mt-2">{user.bio}</p>
              )}
              
              {!isCurrentUser && (
                <Button 
                  onClick={handleMessage}
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  disabled={isBlocked}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Message
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* User Posts */}
        <div className="flex-1 overflow-y-auto p-2">
          <h3 className="text-sm font-medium text-gray-500 px-2 py-2">Recent Posts</h3>
          
          {userPosts.length > 0 ? (
            <div className="space-y-4">
              {userPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center bg-white rounded-lg shadow-sm p-6">
              <p className="text-gray-500">No posts yet</p>
              <p className="text-sm text-gray-400 mt-1">This user hasn't posted anything yet</p>
            </div>
          )}
        </div>
      </div>
      
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
              className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Please explain why you're reporting this user..."
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
            />
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setReportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={submitReport}>
              Submit Report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default UserProfilePage;
