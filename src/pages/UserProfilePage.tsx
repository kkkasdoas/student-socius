
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MoreVertical, UserX, Share2, BellOff, Flag } from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { mockUsers } from '@/utils/mockData';
import { User, Post } from '@/types';
import PostCard from '@/components/PostCard';

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
  
  useEffect(() => {
    if (!userId) return;
    
    // In a real app, fetch user and their posts from the API
    const foundUser = mockUsers.find(u => u.id === userId);
    if (foundUser) {
      setUser(foundUser);
      
      // Check if blocked (simulated)
      setIsBlocked(false);
      
      // Check if muted (simulated)
      setIsMuted(false);
      
      // Get recent posts by this user (simulated)
      // In a real app, this would be fetched from an API
      const recentPosts: Post[] = [];
      // This is a placeholder for the actual posts query
      setUserPosts(recentPosts);
    }
  }, [userId]);
  
  const handleBlock = () => {
    setIsBlocked(!isBlocked);
    toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    // In a real app, this would call an API to block/unblock the user
  };
  
  const handleMute = () => {
    setIsMuted(!isMuted);
    toast.success(isMuted ? 'Unmuted notifications from this user' : 'Muted notifications from this user');
    // In a real app, this would call an API to mute/unmute the user
  };
  
  const handleShare = () => {
    // In a real app, this would use the Web Share API or a custom share sheet
    toast.success('Profile sharing initiated');
  };
  
  const handleReport = () => {
    setReportDialogOpen(true);
  };
  
  const submitReport = () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason for the report');
      return;
    }
    
    // In a real app, this would call an API to submit the report
    toast.success('Report submitted successfully');
    setReportDialogOpen(false);
    setReportReason('');
  };
  
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
