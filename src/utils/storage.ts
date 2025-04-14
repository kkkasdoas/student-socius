import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const uploadPostImage = async (
  file: File,
  userId: string,
  postId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${postId}.${fileExt}`;
    const filePath = fileName;

    console.log('Uploading to path:', filePath);

    const { error: uploadError, data } = await supabase.storage
      .from('post-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error uploading post image:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('post-images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error in uploadPostImage:', error);
    return null;
  }
};

export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string | null> => {
  try {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/profile.${fileExt}`;
    
    console.log(`Uploading profile picture to profile-pictures/${filePath}`);
    
    const { error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error('Error uploading profile picture:', uploadError);
      return null;
    }
    
    const { data } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filePath);
    
    const publicUrl = data.publicUrl;
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ profile_picture_url: publicUrl })
      .eq('id', userId);
    
    if (updateError) {
      console.error('Error updating profile with new picture URL:', updateError);
    }
    
    return publicUrl;
  } catch (error) {
    console.error('Error in uploadProfilePicture:', error);
    return null;
  }
};

export const deletePostImage = async (userId: string, postId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('post-images')
      .remove([`${userId}/${postId}`]);

    if (error) {
      console.error('Error deleting post image:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deletePostImage:', error);
    return false;
  }
};

export const deleteProfilePicture = async (userId: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('profile-pictures')
      .remove([`${userId}/profile`]);

    if (error) {
      console.error('Error deleting profile picture:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteProfilePicture:', error);
    return false;
  }
};

export const uploadGalleryImage = async (
  file: File,
  userId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Generate a unique ID for the image
    const imageId = uuidv4();
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/gallery/${imageId}.${fileExt}`;
    
    // Upload the file to Supabase Storage
    const { error: uploadError, data } = await supabase.storage
      .from('user-gallery')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Error uploading gallery image:', uploadError);
      return { success: false, error: uploadError.message };
    }

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-gallery')
      .getPublicUrl(filePath);

    // Save the entry to the database
    const { error: dbError } = await supabase
      .from('user_gallery_images')
      .insert({
        user_id: userId,
        image_url: publicUrl,
        display_order: await getNextDisplayOrder(userId),
      });

    if (dbError) {
      console.error('Error saving gallery image metadata:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true, url: publicUrl };
  } catch (error) {
    console.error('Error in uploadGalleryImage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const deleteGalleryImage = async (
  imageId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get the image URL first to extract the file path
    const { data: imageData, error: fetchError } = await supabase
      .from('user_gallery_images')
      .select('image_url')
      .eq('id', imageId)
      .eq('user_id', userId)
      .single();

    if (fetchError || !imageData) {
      return { success: false, error: fetchError?.message || 'Image not found' };
    }

    // Extract file path from the URL
    const url = new URL(imageData.image_url);
    const pathParts = url.pathname.split('/');
    const filePath = pathParts.slice(pathParts.indexOf('user-gallery') + 1).join('/');

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('user-gallery')
      .remove([filePath]);

    if (storageError) {
      console.error('Error deleting gallery image file:', storageError);
      // Continue to delete the database entry even if storage delete fails
    }

    // Delete database entry
    const { error: dbError } = await supabase
      .from('user_gallery_images')
      .delete()
      .eq('id', imageId)
      .eq('user_id', userId);

    if (dbError) {
      console.error('Error deleting gallery image metadata:', dbError);
      return { success: false, error: dbError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in deleteGalleryImage:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const getUserGalleryImages = async (
  userId: string
): Promise<{ success: boolean; images?: any[]; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('user_gallery_images')
      .select('*')
      .eq('user_id', userId)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching gallery images:', error);
      return { success: false, error: error.message };
    }

    return { success: true, images: data };
  } catch (error) {
    console.error('Error in getUserGalleryImages:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

export const updateGalleryImageOrder = async (
  userId: string,
  imageId: string,
  newOrder: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('user_gallery_images')
      .update({ display_order: newOrder, updated_at: new Date().toISOString() })
      .eq('id', imageId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating image order:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in updateGalleryImageOrder:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

// Helper function to get the next display order for a user's gallery
const getNextDisplayOrder = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from('user_gallery_images')
    .select('display_order')
    .eq('user_id', userId)
    .order('display_order', { ascending: false })
    .limit(1);

  if (error || !data.length) {
    return 0; // Start with 0 if no images exist or there's an error
  }

  return data[0].display_order + 1;
}; 