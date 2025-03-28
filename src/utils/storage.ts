
import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from "uuid";

// The bucket names for different content types
export const PROFILES_BUCKET = "profiles";
export const POSTS_BUCKET = "posts";

/**
 * Upload a file to a specific bucket
 * @param file The file to upload
 * @param bucket The bucket name
 * @param path Optional path within the bucket
 * @returns The public URL of the uploaded file
 */
export const uploadFile = async (
  file: File,
  bucket: string,
  path?: string
): Promise<string | null> => {
  try {
    // Generate a unique filename
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = path ? `${path}/${fileName}` : fileName;

    // Upload the file
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    // Get the public URL of the file
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error("Error uploading file:", error);
    return null;
  }
};

/**
 * Upload a profile picture
 * @param file The image file
 * @param userId The user ID
 * @returns The public URL of the uploaded image
 */
export const uploadProfilePicture = async (
  file: File,
  userId: string
): Promise<string | null> => {
  return uploadFile(file, PROFILES_BUCKET, userId);
};

/**
 * Upload a post image
 * @param file The image file
 * @param userId The user ID
 * @returns The public URL of the uploaded image
 */
export const uploadPostImage = async (
  file: File,
  userId: string
): Promise<string | null> => {
  return uploadFile(file, POSTS_BUCKET, userId);
};

/**
 * Delete a file from storage
 * @param bucket The bucket name
 * @param path The file path
 * @returns Success status
 */
export const deleteFile = async (
  bucket: string,
  path: string
): Promise<boolean> => {
  try {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting file:", error);
    return false;
  }
};
