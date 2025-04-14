import { useEffect, useState } from 'react';
import { userProfileService } from '@/services/UserProfileService';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface UserGalleryProps {
  userId: string;
  isOwnProfile: boolean;
  onUploadTrigger?: (uploadHandler: (file: File) => Promise<void>) => void;
}

interface GalleryImage {
  id: string;
  user_id: string;
  image_url: string;
  caption?: string;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export const UserGallery = ({ userId, isOwnProfile, onUploadTrigger }: UserGalleryProps) => {
  const { currentUser } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const fetchGalleryImages = async () => {
    setLoading(true);
    const { success, images, error } = await userProfileService.getUserGalleryImages(userId);
    if (success && images) {
      setImages(images);
    } else if (error) {
      toast.error(`Failed to load gallery: ${error}`);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchGalleryImages();
  }, [userId]);

  // Handler to process a single file upload
  const handleFileUpload = async (file: File) => {
    if (!currentUser) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }
    
    setUploading(true);
    
    try {
      const { success, url, error } = await userProfileService.uploadGalleryImage(file, currentUser.id);
      
      if (success && url) {
        toast.success('Image uploaded successfully');
        fetchGalleryImages(); // Refresh the gallery
      } else if (error) {
        toast.error(`Failed to upload image: ${error}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error uploading image:', error);
    } finally {
      setUploading(false);
    }
  };

  // Original handler for input change events
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    
    await handleFileUpload(e.target.files[0]);
    // Reset the input
    e.target.value = '';
  };

  // Register the upload handler with the parent component
  useEffect(() => {
    if (onUploadTrigger && isOwnProfile) {
      onUploadTrigger(handleFileUpload);
    }
  }, [onUploadTrigger, isOwnProfile]);

  const handleDeleteImage = async (imageId: string) => {
    if (!currentUser) return;
    
    if (!confirm('Are you sure you want to delete this image?')) return;
    
    try {
      const { success, error } = await userProfileService.deleteGalleryImage(imageId, currentUser.id);
      
      if (success) {
        toast.success('Image deleted successfully');
        setImages(images.filter(img => img.id !== imageId));
      } else if (error) {
        toast.error(`Failed to delete image: ${error}`);
      }
    } catch (error) {
      toast.error('An unexpected error occurred');
      console.error('Error deleting image:', error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Loading gallery...</p>
      </div>
    );
  }

  return (
    <div className="mt-4">
      {images.length === 0 ? (
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-500">
            {isOwnProfile 
              ? "You haven't added any photos to your gallery yet." 
              : "This user hasn't added any photos to their gallery yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 md:gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative group aspect-square">
              <img
                src={image.image_url}
                alt={image.caption || "Gallery image"}
                className="w-full h-full object-cover rounded-lg"
              />
              {isOwnProfile && (
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete image"
                >
                  <Trash2 size={16} />
                </button>
              )}
              {image.caption && (
                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-b-lg truncate">
                  {image.caption}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}; 