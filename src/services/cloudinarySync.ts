import { supabase, TABLES } from '../lib/supabase';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinary';

interface CloudinaryMetadata {
  public_id: string;
  cloudinary_url: string;
}

// Add a new column to track Cloudinary metadata
const setupCloudinaryColumn = async () => {
  const { error } = await supabase.rpc('add_cloudinary_metadata_column');
  if (error && !error.message.includes('already exists')) {
    console.error('Error setting up cloudinary metadata column:', error);
    throw error;
  }
};

// Function to process a single image
const processImage = async (imageId: string, imageUrl: string) => {
  try {
    // Upload to Cloudinary
    const { public_id, secure_url } = await uploadToCloudinary(imageUrl);

    // Update Supabase with Cloudinary information
    const metadata: CloudinaryMetadata = {
      public_id,
      cloudinary_url: secure_url
    };

    const { error } = await supabase
      .from(TABLES.CARDS)
      .update({ cloudinary_metadata: metadata })
      .eq('id', imageId);

    if (error) {
      console.error('Error updating Supabase with Cloudinary metadata:', error);
      // Try to cleanup Cloudinary if Supabase update fails
      await deleteFromCloudinary(public_id);
      throw error;
    }

    return metadata;
  } catch (error) {
    console.error('Error processing image:', error);
    throw error;
  }
};

// Function to sync images that haven't been processed yet
const syncNewImages = async () => {
  const { data: unprocessedImages, error } = await supabase
    .from(TABLES.CARDS)
    .select('id, image_url')
    .is('cloudinary_metadata', null);

  if (error) {
    console.error('Error fetching unprocessed images:', error);
    return;
  }

  for (const image of unprocessedImages) {
    try {
      await processImage(image.id, image.image_url);
      console.log(`Successfully processed image ${image.id}`);
    } catch (error) {
      console.error(`Failed to process image ${image.id}:`, error);
    }
  }
};

// Function to handle image deletions
const handleImageDeletion = async (imageId: string, metadata: CloudinaryMetadata) => {
  try {
    await deleteFromCloudinary(metadata.public_id);
    console.log(`Successfully deleted image ${imageId} from Cloudinary`);
  } catch (error) {
    console.error(`Failed to delete image ${imageId} from Cloudinary:`, error);
  }
};

// Set up real-time sync for deletions
const setupRealtimeSync = () => {
  const subscription = supabase
    .channel('cloudinary-sync')
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: TABLES.CARDS
      },
      async (payload: any) => {
        if (payload.old && payload.old.cloudinary_metadata) {
          await handleImageDeletion(
            payload.old.id,
            payload.old.cloudinary_metadata as CloudinaryMetadata
          );
        }
      }
    )
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
};

// Initialize the sync system
export const initializeCloudinarySync = async () => {
  try {
    // Set up the database column first
    await setupCloudinaryColumn();

    // Set up realtime sync for deletions
    setupRealtimeSync();

    // Do initial sync
    await syncNewImages();

    // Set up periodic sync every 5 minutes
    const syncInterval = setInterval(syncNewImages, 5 * 60 * 1000);

    // Return cleanup function
    return () => {
      clearInterval(syncInterval);
    };
  } catch (error) {
    console.error('Failed to initialize Cloudinary sync:', error);
    throw error;
  }
};
