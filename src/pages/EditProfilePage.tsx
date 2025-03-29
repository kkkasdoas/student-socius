
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronLeft, Camera, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Layout from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

const EditProfilePage: React.FC = () => {
  const { currentUser, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(currentUser?.profilePictureUrl || null);
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    if (currentUser) {
      setDisplayName(currentUser.displayName || '');
      setBio(currentUser.bio || '');
      setProfileImage(currentUser.profilePictureUrl || null);
    }
  }, [currentUser]);
  
  const handleImageClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const imageUrl = URL.createObjectURL(file);
      setProfileImage(imageUrl);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let profilePictureUrl = currentUser?.profilePictureUrl;
      
      // Upload new profile image if it exists
      if (profileImageFile && currentUser) {
        const fileExt = profileImageFile.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `profile-pictures/${currentUser.id}/${fileName}`;
        
        // Upload the file to Supabase Storage
        const { error: uploadError } = await supabase.storage
          .from('profiles')
          .upload(filePath, profileImageFile);
        
        if (uploadError) {
          throw uploadError;
        }
        
        // Get the public URL
        const { data } = supabase.storage
          .from('profiles')
          .getPublicUrl(filePath);
        
        profilePictureUrl = data.publicUrl;
      }
      
      // Update user profile
      await updateUserProfile({
        displayName,
        bio,
        profilePictureUrl
      });
      
      toast.success('Profile updated successfully');
      navigate(-1);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Header */}
        <div className="flex items-center p-4 bg-white border-b border-gray-200">
          <button 
            onClick={() => navigate(-1)}
            className="mr-2 p-1 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">Edit Profile</h1>
        </div>
        
        {/* Content */}
        <div className="flex-1 p-4">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              <div className="relative mb-4">
                <div 
                  className="w-24 h-24 rounded-full overflow-hidden border-2 border-white shadow-md bg-gray-200 flex items-center justify-center"
                  onClick={handleImageClick}
                >
                  {profileImage ? (
                    <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl font-medium text-gray-400">
                      {currentUser?.displayName?.substring(0, 2) || 'U'}
                    </span>
                  )}
                </div>
                <button 
                  type="button"
                  className="absolute bottom-0 right-0 bg-cendy-primary text-white rounded-full p-2 shadow-md"
                  onClick={handleImageClick}
                >
                  <Camera className="h-4 w-4" />
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageChange}
                />
              </div>
              <button 
                type="button"
                className="text-cendy-primary text-sm font-medium flex items-center"
                onClick={handleImageClick}
              >
                <Edit className="h-3 w-3 mr-1" />
                Change profile picture
              </button>
            </div>
            
            {/* Profile Info */}
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Profile Information
              </label>
              
              <div>
                <label htmlFor="displayName" className="block text-xs text-gray-500 mb-1">
                  Display Name
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cendy-primary/50"
                  placeholder="Your display name"
                />
              </div>
              
              <div>
                <label htmlFor="bio" className="block text-xs text-gray-500 mb-1">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cendy-primary/50 min-h-[100px]"
                  placeholder="Tell others about yourself..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bio.length}/200 characters
                </p>
              </div>
            </div>
            
            {/* Submit Button */}
            <div className="pt-4">
              <Button
                type="submit"
                className="w-full h-12"
                disabled={isProcessing}
              >
                {isProcessing ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
};

export default EditProfilePage;
