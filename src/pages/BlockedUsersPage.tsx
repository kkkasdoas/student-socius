
import React, { useState, useEffect } from 'react';
import { ArrowLeft, UserX } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const BlockedUsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);

  // Query to fetch blocked users
  const { data: blockedUsers = [], isLoading: isFetchingBlocked } = useQuery({
    queryKey: ['blockedUsers', currentUser?.id],
    queryFn: async () => {
      if (!currentUser) return [];

      const { data: blockedData, error } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', currentUser.id);

      if (error) {
        console.error('Error fetching blocked users:', error);
        toast.error('Failed to load blocked users');
        return [];
      }

      if (!blockedData.length) return [];

      // Get full user profiles for the blocked users
      const blockedIds = blockedData.map(item => item.blocked_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', blockedIds);

      if (profilesError) {
        console.error('Error fetching blocked profiles:', profilesError);
        toast.error('Failed to load user profiles');
        return [];
      }

      return profilesData as User[];
    },
    enabled: !!currentUser?.id,
  });

  // Mutation to unblock a user
  const unblockUserMutation = useMutation({
    mutationFn: async (blockedId: string) => {
      if (!currentUser) throw new Error('You must be logged in');
      
      setIsLoading(true);
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('blocker_id', currentUser.id)
        .eq('blocked_id', blockedId);
      
      if (error) throw new Error(error.message);
      return blockedId;
    },
    onSuccess: (blockedId) => {
      queryClient.invalidateQueries({ queryKey: ['blockedUsers', currentUser?.id] });
      toast.success("User unblocked successfully");
      setIsLoading(false);
    },
    onError: (error) => {
      console.error('Error unblocking user:', error);
      toast.error('Failed to unblock user');
      setIsLoading(false);
    }
  });

  const handleUnblock = (userId: string) => {
    unblockUserMutation.mutate(userId);
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
          {isFetchingBlocked ? (
            <div className="p-4 flex justify-center">
              <p className="text-gray-500">Loading blocked users...</p>
            </div>
          ) : blockedUsers.length > 0 ? (
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
                    onClick={() => handleUnblock(user.id)}
                    disabled={isLoading}
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
