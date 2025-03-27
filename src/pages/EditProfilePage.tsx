
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { ChevronLeft, Camera, Loader } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const EditProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName);
      setBio(currentUser.bio || '');
      setProfileImage(currentUser.profilePictureUrl || null);
    }
  }, [currentUser]);
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSave = async () => {
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // In a real app, we would send this data to the API
      // Here, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Saving profile:', {
        displayName,
        bio,
        profilePictureUrl: profileImage
      });
      
      toast.success('Profile updated successfully');
      navigate('/settings');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Layout>
      <div className="h-screen flex flex-col bg-white">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 flex items-center p-4 z-10">
          <Button 
            variant="ghost" 
            size="icon" 
            className="mr-2" 
            onClick={() => navigate('/settings')}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          
          <h1 className="text-xl font-semibold flex-1">Edit Profile</h1>
          
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !displayName.trim()}
            className="bg-cendy-primary hover:bg-cendy-primary/90"
          >
            {isSaving ? (
              <>
                <Loader className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
        
        {/* Profile Picture */}
        <div className="p-6 flex flex-col items-center">
          <div className="relative">
            <Avatar className="w-24 h-24 border-2 border-white shadow-lg">
              <AvatarImage 
                src={profileImage || "https://i.pravatar.cc/150?img=default"} 
                alt={displayName} 
              />
              <AvatarFallback>{displayName.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            
            <label htmlFor="profile-picture" className="absolute bottom-0 right-0 bg-cendy-primary text-white p-2 rounded-full cursor-pointer">
              <Camera className="h-4 w-4" />
              <input 
                id="profile-picture" 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleImageChange}
              />
            </label>
          </div>
          
          <p className="text-sm text-gray-500 mt-3">
            Tap on the camera icon to change your profile picture
          </p>
        </div>
        
        {/* Form */}
        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <Input
              id="display-name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your display name"
              className="w-full"
            />
          </div>
          
          <div>
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-1">
              Bio
            </label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              className="w-full min-h-[120px]"
            />
            <p className="text-xs text-gray-500 mt-1">
              {bio.length}/200 characters
            </p>
          </div>
          
          <div className="pt-4">
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Account Details
            </label>
            
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="text-sm">{currentUser?.loginEmail || 'Not set'}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">University</div>
                <div className="text-sm">{currentUser?.university || 'Not set'}</div>
              </div>
              
              <div>
                <div className="text-xs text-gray-500">Account Status</div>
                <div className="text-sm flex items-center">
                  {currentUser?.verificationStatus === 'verified' ? (
                    <>
                      <span className="text-green-600">Verified</span>
                      <span className="ml-1 text-green-600">✓</span>
                    </>
                  ) : (
                    <span className="text-yellow-600">Unverified</span>
                  )}
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              These details cannot be modified from this screen.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfilePage;
