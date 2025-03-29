
import React, { useState } from 'react';
import { ArrowLeft, UserX, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { mockUsers } from '@/utils/mockData';
import { User } from '@/types';

const BlockedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  // In a real app, we'd fetch this from the backend
  const [blockedUsers, setBlockedUsers] = useState<User[]>([
    mockUsers[2], // Simulating that user has blocked some users
    mockUsers[5]
  ]);

  const unblockUser = (userId: string) => {
    setBlockedUsers(blockedUsers.filter(user => user.id !== userId));
    toast.success("User unblocked successfully");
    // In a real app, this would call an API to unblock the user
  };

  return (
    <Layout hideNav>
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
        <div className="p-3 bg-white border-b border-gray-200 flex items-center sticky top-0 z-10">
          <button 
            className="p-1.5 rounded-full hover:bg-gray-100 mr-2"
            onClick={() => navigate('/settings')}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">Blocked Users</h1>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {blockedUsers.length > 0 ? (
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-500">
                  Blocked users won't be able to message you or see your posts
                </p>
              </div>
              
              {blockedUsers.map((user) => (
                <div 
                  key={user.id}
                  className="p-4 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage 
                        src={user.profilePictureUrl || 'https://i.pravatar.cc/150?img=default'} 
                        alt={user.displayName} 
                      />
                      <AvatarFallback>{user.displayName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{user.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {user.university || 'No university'}
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unblockUser(user.id)}
                    className="text-xs border-gray-200 hover:bg-gray-50"
                  >
                    Unblock
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 bg-white rounded-lg shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <UserX className="w-6 h-6 text-gray-400" />
              </div>
              <p className="text-gray-500 font-medium">No blocked users</p>
              <p className="text-xs text-gray-400 mt-1">
                You haven't blocked anyone yet
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default BlockedUsersPage;
