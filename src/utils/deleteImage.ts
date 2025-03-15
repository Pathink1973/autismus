import { supabase, TABLES, STORAGE } from '../lib/supabase';
import { deleteFromCloudinary } from './cloudinary';

export interface DeleteImageResult {
  success: boolean;
  error?: string;
}

export const deleteImage = async (cardId: string): Promise<DeleteImageResult> => {
  try {
    // First, get the card data to access Cloudinary metadata
    const { data: card, error: fetchError } = await supabase
      .from(TABLES.CARDS)
      .select('*')
      .eq('id', cardId)
      .single();

    if (fetchError) {
      console.error('Error fetching card:', fetchError);
      return { success: false, error: 'Failed to fetch image data' };
    }

    if (!card) {
      return { success: false, error: 'Image not found' };
    }

    // Delete from Cloudinary if we have metadata
    if (card.cloudinary_metadata?.public_id) {
      try {
        await deleteFromCloudinary(card.cloudinary_metadata.public_id);
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError);
        // Continue with Supabase deletion even if Cloudinary fails
      }
    }

    // Delete from Supabase storage if path exists (shouldn't in new system, but handle for old data)
    if (card.storage_path) {
      const { error: storageError } = await supabase.storage
        .from(STORAGE.BUCKETS.CARD_IMAGES)
        .remove([card.storage_path]);

      if (storageError) {
        console.error('Error deleting from storage:', storageError);
        // Continue with database deletion even if storage deletion fails
      }
    }

    // Finally, delete the database record
    const { error: deleteError } = await supabase
      .from(TABLES.CARDS)
      .delete()
      .eq('id', cardId);

    if (deleteError) {
      console.error('Error deleting from database:', deleteError);
      return { success: false, error: 'Failed to delete image record' };
    }

    return { success: true };
  } catch (error) {
    console.error('Delete image error:', error);
    return { success: false, error: 'Unexpected error during deletion' };
  }
};
