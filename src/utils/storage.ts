import { supabase } from '@/integrations/supabase/client';

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