import { create } from 'zustand';
import { supabase, TABLES, DB_ERRORS } from '../lib/supabase';
import { Card, Category } from '../types';
import { categories as defaultCategories } from '../data/categories';
import { loadPublicImages } from '../utils/publicImageLoader';
import { PostgrestError } from '@supabase/supabase-js';
import { deleteImage } from '../utils/deleteImage';
import { uploadToCloudinary, CloudinaryUploadResult } from '../utils/cloudinary';

// Helper function to handle Supabase errors
const handleSupabaseError = (error: PostgrestError | null, customMessage?: string) => {
  if (!error) return null;
  
  console.error(`${customMessage || 'Database error'}:`, error);
  
  // Only return user-facing errors for critical issues
  if (error.code === '403' || error.code === '42501') {
    return DB_ERRORS.PERMISSION;
  } else if (error.message?.toLowerCase().includes('network')) {
    return DB_ERRORS.NETWORK;
  }
  
  // Log other errors but don't show to user
  return null;
};

// Mark default categories as system categories
const systemCategories = defaultCategories.map((category: Category) => ({
  ...category,
  isSystem: true
}));

interface CardManagementState {
  cards: Card[];
  categories: Category[];
  temporaryCategory: Category | null;
  isLoading: boolean;
  error: string | null;
}

interface CardManagementActions {
  setTemporaryCategory: (category: Category | null) => void;
  addCustomCard: (card: Omit<Card, 'id'>) => Promise<Card>;
  addCustomCards: (cards: Omit<Card, 'id'>[]) => Promise<Card[]>;
  addCustomCategory: (category: Omit<Category, 'id'>) => Promise<Category>;
  updateCategory: (category: { id: string; name: string; icon: string; color?: string }) => Promise<Category>;
  deleteCategory: (categoryId: string) => Promise<void>;
  deleteCard: (cardId: string) => Promise<void>;
  initialize: () => Promise<void>;
  reorderCards: (sourceCategory: string, targetCategory: string, sourceIndex: number, targetIndex: number) => Promise<void>;
}

type CardManagementStore = CardManagementState & CardManagementActions;

export const useCardManagementStore = create<CardManagementStore>((set) => ({
  cards: [],
  categories: [],
  temporaryCategory: null,
  isLoading: true,
  error: null,

  setTemporaryCategory: (category: Category | null) => {
    set({ temporaryCategory: category });
  },

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      // Load system categories and public images first
      let allCategories = [...systemCategories];
      let publicImages: Card[] = [];
      
      try {
        publicImages = await loadPublicImages();
        console.log('Loaded public images:', publicImages.length);
      } catch (imageError) {
        console.error('Error loading public images:', imageError);
      }

      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('Authentication error:', authError);
        set({ 
          categories: allCategories,
          cards: publicImages,
          error: null,
          isLoading: false 
        });
        return;
      }
      
      if (!user) {
        set({
          categories: allCategories,
          cards: publicImages,
          error: null,
          isLoading: false
        });
        return;
      }

      // Load user categories
      const { data: dbCategories, error: categoriesError } = await supabase
        .from(TABLES.CATEGORIES)
        .select('*')
        .eq('user_id', user.id);

      if (categoriesError) {
        console.error('Error loading categories:', categoriesError);
        throw categoriesError;
      }

      const userCategories = dbCategories?.map(cat => ({
        ...cat,
        isSystem: false
      })) || [];
      
      // Add user categories to allCategories
      allCategories = [...allCategories, ...userCategories];
      
      // Load user's custom cards
      const { data: dbCards, error: cardsError } = await supabase
        .from(TABLES.CARDS)
        .select('*')
        .eq('user_id', user.id);

      if (cardsError) {
        console.error('Error loading cards:', cardsError);
        throw cardsError;
      }

      // Process user's cards
      const userCards = (dbCards || []).map((card: any) => {
        const [displayName, voiceName] = card.name.split('|');
        return {
          ...card,
          display_name: displayName,
          name: voiceName || displayName,
          imageUrl: card.image_url,
          categoryId: card.category_id,
          label: displayName
        };
      });

      // Combine and sort all cards
      const sortedCards = [...publicImages, ...userCards].sort((a, b) => {
        if (a.categoryId === b.categoryId) {
          return (a.order || 0) - (b.order || 0);
        }
        return 0;
      });
      
      console.log('Total cards after processing:', sortedCards.length);

      set({ 
        categories: allCategories,
        cards: sortedCards,
        isLoading: false,
        error: null,
        temporaryCategory: null
      });

    } catch (error) {
      console.error('Error initializing store:', error);
      set({ 
        categories: [],
        cards: [],
        error: null,
        isLoading: false 
      });
    }
  },

  addCustomCard: async (card) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      let imageUrl = card.image_url;
      let cloudinaryMetadata;

      // If the image is a base64 data URL, upload it directly to Cloudinary
      if (card.image_url.startsWith('data:image')) {
        try {
          // Upload to Cloudinary
          const result: CloudinaryUploadResult = await uploadToCloudinary(card.image_url);
          imageUrl = result.secure_url;
          // Store Cloudinary metadata
          cloudinaryMetadata = {
            public_id: result.public_id
          };
        } catch (error) {
          console.error('Error processing image upload:', error);
          throw new Error('Erro ao processar upload da imagem');
        }
      }

      // Transform the card data to match database schema
      const displayName = card.display_name || card.name;
      const voiceName = card.name;
      const combinedName = displayName === voiceName ? displayName : `${displayName}|${voiceName}`;

      const cardData = {
        name: combinedName,
        image_url: imageUrl,
        category_id: card.category_id,
        user_id: user.id,
        order: card.order || 0,
        cloudinary_metadata: cloudinaryMetadata
      };

      console.log('Creating card with data:', cardData);

      // Add card to Supabase
      const { data: newCard, error } = await supabase
        .from(TABLES.CARDS)
        .insert([cardData])
        .select()
        .single();

      if (error) {
        console.error('Failed to add custom card:', error);
        const dbError = handleSupabaseError(error, 'Failed to add custom card');
        throw new Error(dbError || 'Failed to add card');
      }

      // Process the card for local state
      const [cardDisplayName, cardVoiceName] = newCard.name.split('|');
      const processedCard = {
        ...newCard,
        display_name: cardDisplayName,
        name: cardVoiceName || cardDisplayName,
        imageUrl: imageUrl // Ensure we use the Cloudinary URL
      };

      // Update local state with the new card
      set(state => ({
        cards: [...state.cards, processedCard],
        error: null
      }));

      return processedCard;
    } catch (error) {
      console.error('Failed to add custom card:', error);
      const errorMessage = error instanceof Error ? error.message : DB_ERRORS.UNKNOWN;
      set({ error: errorMessage });
      throw error;
    }
  },

  addCustomCards: async (cards: Omit<Card, 'id'>[]) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Transform the cards data to match database schema
      const cardsData = cards.map(card => ({
        name: card.name,
        image_url: card.imageUrl,
        category_id: card.categoryId,
        user_id: user.id,
        order: card.order || 0
      }));

      // Add cards to Supabase
      const { data: newCards, error } = await supabase
        .from(TABLES.CARDS)
        .insert(cardsData)
        .select();

      const dbError = handleSupabaseError(error, 'Failed to add custom cards');
      if (dbError) {
        set({ error: dbError });
        throw new Error(dbError);
      }

      set(state => ({
        cards: [...state.cards, ...(newCards || [])],
        error: null
      }));

      return newCards || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : DB_ERRORS.UNKNOWN;
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  addCustomCategory: async (category: Omit<Category, 'id'>) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Add category to database
      const { data: categoryData, error: categoryError } = await supabase
        .from(TABLES.CATEGORIES)
        .insert([{
          name: category.name,
          user_id: user.id,
          icon: category.icon || '📁'
        }])
        .select()
        .single();

      if (categoryError) {
        console.error('Supabase category error details:', categoryError);
        const errorMessage = handleSupabaseError(categoryError, 'Failed to add custom category');
        throw new Error(errorMessage || `Failed to add category: ${categoryError.message}`);
      }

      if (!categoryData) {
        throw new Error('No category data returned');
      }

      // Update local state with the new category
      const newCategory = {
        ...categoryData,
        icon: category.icon || '📁',
        color: category.color || '#3B82F6',
        isSystem: false
      };

      set(state => ({
        categories: [...state.categories.filter(c => c.id !== categoryData.id), newCategory],
        error: null,
        temporaryCategory: null
      }));

      return newCategory;
    } catch (error) {
      console.error('Failed to add custom category:', error);
      throw error;
    }
  },

  updateCategory: async (category: { id: string; name: string; icon: string; color?: string }) => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Update category in database
      const { data: updatedCategory, error: updateError } = await supabase
        .from(TABLES.CATEGORIES)
        .update({
          name: category.name,
          icon: category.icon
        })
        .eq('id', category.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (updateError) {
        console.error('Supabase category error details:', updateError);
        const errorMessage = handleSupabaseError(updateError, 'Failed to update category');
        throw new Error(errorMessage || `Failed to update category: ${updateError.message}`);
      }

      if (!updatedCategory) {
        throw new Error('No category data returned');
      }

      // Update local state
      const newCategory = {
        ...updatedCategory,
        icon: category.icon || '📁',
        color: category.color || '#3B82F6',
        isSystem: false
      };

      set(state => ({
        categories: [...state.categories.filter(c => c.id !== category.id), newCategory],
        error: null
      }));

      return newCategory;
    } catch (error) {
      console.error('Failed to update category:', error);
      throw error;
    }
  },

  deleteCategory: async (categoryId: string) => {
    const state = useCardManagementStore.getState();
    const categoryToDelete = state.categories.find((category: Category) => category.id === categoryId);

    if (!categoryToDelete) {
      console.error('Category not found:', categoryId);
      console.log('Available categories:', state.categories);
      throw new Error('Categoria não encontrada');
    }

    if (categoryToDelete.isSystem) {
      throw new Error('Não é possível excluir categorias do sistema');
    }

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // First update the local state to provide immediate feedback
      set(state => ({
        categories: state.categories.filter(c => c.id !== categoryId),
        cards: state.cards.filter(c => c.category_id !== categoryId),
        error: null
      }));

      // Delete associated cards first
      const { error: cardsError } = await supabase
        .from(TABLES.CARDS)
        .delete()
        .eq('category_id', categoryId)
        .eq('user_id', user.id);

      if (cardsError) {
        // Revert state if error occurs
        set(state => ({
          categories: [...state.categories, categoryToDelete],
          cards: state.cards,
          error: 'Erro ao excluir cartões da categoria'
        }));
        throw new Error('Erro ao excluir cartões da categoria');
      }

      // Then delete the category
      const { error: categoryError } = await supabase
        .from(TABLES.CATEGORIES)
        .delete()
        .eq('id', categoryId)
        .eq('user_id', user.id);

      if (categoryError) {
        // Revert state if error occurs
        set(state => ({
          categories: [...state.categories, categoryToDelete],
          cards: state.cards,
          error: 'Erro ao excluir categoria'
        }));
        throw new Error('Erro ao excluir categoria');
      }

    } catch (error) {
      console.error('Error deleting category:', error);
      const errorMessage = error instanceof Error ? error.message : DB_ERRORS.UNKNOWN;
      set({ error: errorMessage });
      throw error;
    }
  },

  deleteCard: async (cardId: string) => {
    try {
      const { cards } = useCardManagementStore.getState();
      const cardToDelete = cards.find((card: Card) => card.id === cardId);
      
      if (!cardToDelete) {
        throw new Error('Cartão não encontrado');
      }

      // Don't allow deletion of system cards
      if (cardToDelete.isSystem) {
        throw new Error('Não é possível excluir cartões do sistema');
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Delete image from both Cloudinary and Supabase
      const { success, error: deleteError } = await deleteImage(cardId);
      if (!success) {
        console.error('Failed to delete image:', deleteError);
        throw new Error(deleteError || 'Erro ao excluir imagem');
      }

      // Delete card from database
      const { error } = await supabase
        .from(TABLES.CARDS)
        .delete()
        .eq('id', cardId)
        .eq('user_id', user.id);

      const dbError = handleSupabaseError(error, 'Failed to delete card');
      if (dbError) {
        set({ error: dbError });
        throw new Error(dbError);
      }
      
      // Update state
      set(state => ({
        cards: state.cards.filter(c => c.id !== cardId),
        error: null
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : DB_ERRORS.UNKNOWN;
      set({ error: errorMessage });
      throw new Error(errorMessage);
    }
  },

  reorderCards: async (sourceCategory: string, targetCategory: string, sourceIndex: number, targetIndex: number) => {
    try {
      // Get current user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user || authError) {
        set({ error: null });
        return;
      }

      set({ isLoading: true, error: null });

      // Update state optimistically
      set(state => {
        const newCards = [...state.cards];
        const sourceCards = newCards.filter((card: Card) => card.categoryId === sourceCategory);
        const [movedCard] = sourceCards.splice(sourceIndex, 1);
        
        if (movedCard) {
          // Update card's category and order
          movedCard.categoryId = targetCategory;
          const targetCards = newCards.filter((card: Card) => card.categoryId === targetCategory);
          targetCards.splice(targetIndex, 0, movedCard);
          
          // Update order for all affected cards
          targetCards.forEach((card: Card, index: number) => {
            card.order = index;
          });

          // Return updated state
          return {
            ...state,
            cards: newCards
          };
        }
        return state;
      });

      // Get updated state
      const state = useCardManagementStore.getState();
      const movedCard = state.cards.find((card: Card) => 
        card.categoryId === targetCategory && card.order === targetIndex
      );

      if (!movedCard) {
        throw new Error('Failed to find moved card');
      }

      // Update card position in database
      const { error: moveError } = await supabase
        .from(TABLES.CARDS)
        .update({
          category_id: targetCategory,
          order: targetIndex,
          user_id: user.id
        })
        .eq('id', movedCard.id)
        .eq('user_id', user.id);

      if (moveError) {
        const dbError = handleSupabaseError(moveError, 'Failed to update card position');
        if (dbError) {
          set({ error: dbError });
          return;
        }
      }

      // Update order for other affected cards
      const targetCards = state.cards.filter((card: Card) => card.categoryId === targetCategory);
      
      for (const card of targetCards) {
        const { error: updateError } = await supabase
          .from(TABLES.CARDS)
          .update({ order: card.order })
          .eq('id', card.id)
          .eq('user_id', user.id);

        if (updateError) {
          const dbError = handleSupabaseError(updateError, 'Failed to update card order');
          if (dbError) {
            set({ error: dbError });
            return;
          }
        }
      }

      set({ isLoading: false });
    } catch (error) {
      console.error('Error reordering cards:', error);
      const errorMessage = error instanceof Error ? error.message : DB_ERRORS.UNKNOWN;
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },
}));

// Initialize the store when the module loads
useCardManagementStore.getState().initialize();