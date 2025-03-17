import React, { useState, useEffect } from 'react';
import { LogIn, Sparkles } from 'lucide-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import { useStore } from '../store/useStore';
import { useCardManagementStore } from '../store/useCardManagementStore';
import { CardManagementModal } from './card-management/CardManagementModal';
import { DroppableGrid } from './dnd/DroppableGrid';
import { DraggableCard } from './dnd/DraggableCard';
import { speak } from '../utils/speech';
import { supabase } from '../lib/supabase';
import { PictureCard } from '../types';

interface PictureGridProps {
  categoryId: string | null;
}

export const PictureGrid: React.FC<PictureGridProps> = ({ categoryId }) => {
  const { selectedCards, addCard, removeCard } = useStore();
  const { cards, deleteCard, reorderCards, isLoading, error, initialize } = useCardManagementStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log('Current user state:', user ? 'Logged in' : 'Not logged in');
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', session?.user ? 'Logged in' : 'Not logged in');
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (categoryId) {
      initialize();
    }
  }, [categoryId, initialize]);

  // Log user state whenever it changes
  useEffect(() => {
    console.log('User state updated:', user ? 'Logged in' : 'Not logged in');
  }, [user]);

  const selectedCardIds = new Set(selectedCards.map((card: PictureCard) => card.id));

  // Modified logic: Show system images for all users, but only show user-created images for logged-in users
  const filteredCards = categoryId
    ? cards.filter(card => {
        if (card.categoryId === categoryId) {
          // Always show system/native images to all users
          if (card.isSystem) {
            return true;
          }
          // Only show user-created images if the user is logged in
          return user ? true : false;
        }
        return false;
      }).sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Explicitly define all system category IDs
  const systemCategoryIds = [
    'social', 'actions', 'emotions', 'opinion', 'leisure', 'food', 
    'clothes', 'objects', 'places', 'body', 'animals', 'colors', 
    'numbers', 'weather'
  ];
  
  // A category is custom only if it's not in the system categories list
  const isCustomCategory = categoryId ? !systemCategoryIds.includes(categoryId) : false;
  
  console.log('Category details:', {
    categoryId,
    isSystemCategory: !isCustomCategory,
    isCustomCategory,
    isAuthenticated: !!user
  });

  const handleCardClick = (card: PictureCard) => {
    // Allow all users to click on cards (for speech functionality)
    addCard(card);
    speak(card.voiceLabel || card.label);
  };

  const handleDeleteCard = async (cardId: string) => {
    // Only logged-in users can delete cards (and only their own cards)
    if (!user) {
      return;
    }
    
    // Get the card to check if it's a system card
    const cardToDelete = cards.find(card => card.id === cardId);
    
    // Prevent deletion of system cards
    if (cardToDelete?.isSystem) {
      console.warn("System cards cannot be deleted");
      return;
    }
    
    try {
      await deleteCard(cardId);
      if (selectedCardIds.has(cardId)) {
        removeCard(cardId);
      }
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !categoryId || !user) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    reorderCards(categoryId, categoryId, sourceIndex, destinationIndex);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    if (categoryId) {
      initialize();
    }
  };

  // Check if user is authenticated before rendering
  const isAuthenticated = !!user;
  
  // Explicitly define system categories - this is the most direct approach
  const isSystemCategory = 
    categoryId === 'social' || 
    categoryId === 'actions' || 
    categoryId === 'emotions' || 
    categoryId === 'opinion' || 
    categoryId === 'leisure' || 
    categoryId === 'food' || 
    categoryId === 'clothes' || 
    categoryId === 'objects' || 
    categoryId === 'places' || 
    categoryId === 'body' || 
    categoryId === 'animals' || 
    categoryId === 'colors' || 
    categoryId === 'numbers' || 
    categoryId === 'weather';
  
  // Only show add button for non-system categories
  const showAddButton = isAuthenticated && categoryId && !isSystemCategory;
  
  console.log('Rendering with auth state:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
  console.log('Current category:', categoryId, 'Is system category:', isSystemCategory, 'Show add button:', showAddButton);

  return (
    <div className="space-y-6 mb-8">
      {showAddButton && (
        <div className="flex flex-wrap gap-3 py-4 px-2">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl border border-emerald-400 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
          >
            <FontAwesomeIcon icon={faLayerGroup} className="w-5 h-5" />
            <span className="font-medium">Adicionar Imagem</span>
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
          </div>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-64">
          <div className="p-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800">
            <div className="text-red-600 dark:text-red-400 font-medium">{error}</div>
          </div>
        </div>
      ) : categoryId ? (
        filteredCards.length > 0 ? (
          <DragDropContext onDragEnd={handleDragEnd}>
            <DroppableGrid droppableId={`category-${categoryId}`}>
              {filteredCards.map((card, index) => (
                <DraggableCard
                  key={card.id}
                  card={card}
                  index={index}
                  onClick={() => handleCardClick(card)}
                  onDeleteCard={() => handleDeleteCard(card.id)}
                  isSelected={selectedCardIds.has(card.id)}
                  isDraggable={!!user && !card.isSystem}
                />
              ))}
            </DroppableGrid>
          </DragDropContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-85 text-gray-600 dark:text-gray-400">
            <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <FontAwesomeIcon icon={faLayerGroup} className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Explorar Categorias?
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
              Selecione imagens para iniciar a comunicação.
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-85 text-gray-600 dark:text-gray-400">
          <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300">
            {!user ? (
              <>
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <LogIn className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Bem-vindo ao Autismus
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Inicie sessão com a sua conta Google.
                </p>
              </>
            ) : (
              <>
                <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                  <Sparkles className="w-10 h-10 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  Bem-vindo ao Autismus
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                  Personalize o Autismus à sua maneira
                </p>
              </>
            )}
          </div>
        </div>
      )}

      <CardManagementModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        categoryId={categoryId || ''}
        onAddCard={async (card) => {
          handleCardClick({
            ...card,
            id: Date.now().toString(),
            voiceLabel: card.label,
            isSystem: false
          });
        }}
      />
    </div>
  );
};