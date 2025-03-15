import { PictureCard } from '../types';

// Default system categories
const DEFAULT_CATEGORIES = [
  'actions', 'animals', 'body', 'clothes', 'colors', 'emotions',
  'food', 'social', 'numbers', 'objects', 'places', 'weather',
  'leisure', 'opinion'
];

export async function loadPublicImages(): Promise<PictureCard[]> {
  const cards: PictureCard[] = [];
  const categories = DEFAULT_CATEGORIES;

  console.log('Loading public images...', { categories });

  try {
    // Import all images from the public directory
    const publicImages = Object.entries(
      import.meta.glob('/public/images/**/*.{png,jpg,jpeg,webp}', {
        eager: true,
        as: 'url'
      })
    );

    console.log('Initial image paths found:', publicImages.length);
    console.log('Raw paths:', JSON.stringify(publicImages.map(([path]) => path), null, 2));
    
    if (publicImages.length === 0) {
      console.warn('No images found in any of the searched paths!');
      return [];
    }

    const images = publicImages;
    
    console.log('After deduplication:', images.length, 'images');
    console.log('Normalized paths:', JSON.stringify(images.map(([path]) => path), null, 2));

    for (const category of categories) {
      try {
        // Filter images for current category
        const categoryImages = images
          .filter(([path]) => {
            return path.toLowerCase().includes(`/public/images/${category.toLowerCase()}/`);
          })
          .map(([path, url]) => {
            const fileName = path.split('/').pop()?.split('.')[0] || '';
            // Format the label: replace hyphens with spaces and capitalize each word
            const label = fileName
              .replace(/-/g, ' ')
              .split(' ')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
              .join(' ');
            console.log(`Creating card for image: ${path} -> ${url}`);
            
            // Ensure the URL is properly formatted
            const imageUrl = (url as string).startsWith('/')
              ? url
              : `/${url.replace(/^\.\.\/|\.\//g, '')}`;

            console.log(`Processing image URL: ${imageUrl} (original: ${url})`);
            
            return {
              id: `public-${category}-${fileName}`,
              categoryId: category,
              imageUrl,
              name: label,
              label: label, // Add label field for display
              description: label,
              audioDescription: label, // Use formatted label for audio
              isSystem: true,
              order: 0,
              createdAt: new Date().toISOString()
            };
          });

        console.log(`Found ${categoryImages.length} images in category ${category}`);
        if (categoryImages.length === 0) {
          console.warn(`No images found for category: ${category}`);
        }

        cards.push(...categoryImages);
      } catch (error) {
        console.error(`Error loading images for category ${category}:`, error);
      }
    }

    console.log(`Total public images loaded: ${cards.length}`);
    if (cards.length === 0) {
      console.warn('No cards were created! This might indicate a problem with image paths or categories.');
      console.log('Available categories:', categories);
    }
    return cards;
  } catch (error) {
    console.error('Failed to load public images:', error);
    return [];
  }
}
