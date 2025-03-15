import React, { useState, useEffect } from 'react';
import { Plus, LogIn } from 'lucide-react';
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
      setUser(user);
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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

  const selectedCardIds = new Set(selectedCards.map((card: PictureCard) => card.id));

  const filteredCards = categoryId && user
    ? cards.filter(card => card.categoryId === categoryId)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const handleCardClick = (card: PictureCard) => {
    if (!user) {
      return;
    }
    addCard(card);
    speak(card.voiceLabel || card.label);
  };

  const handleDeleteCard = async (cardId: string) => {
    if (!user) {
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
    if (!result.destination || !categoryId) return;

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

  return (
    <div className="space-y-6">
      {categoryId && (
        <div className="flex flex-wrap gap-3 py-4 px-2">
          {user && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white rounded-2xl border border-emerald-400 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span className="font-medium">Adicionar Imagem</span>
            </button>
          )}
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
        !user ? (
          <div className="flex flex-col items-center justify-center h-85 text-gray-600 dark:text-gray-400">
            <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <LogIn className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Entre com a sua conta Google
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Personalize o Autismus à sua maneira.
              </p>
            </div>
          </div>
        ) : filteredCards.length > 0 ? (
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
                />
              ))}
            </DroppableGrid>
          </DragDropContext>
        ) : (
          <div className="flex flex-col items-center justify-center h-85 text-gray-600 dark:text-gray-400">
            <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Plus className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Nenhuma imagem encontrada
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Clique em "Adicionar Imagem" para começar a criar seu conteúdo personalizado
              </p>
            </div>
          </div>
        )
      ) : (
        <div className="flex flex-col items-center justify-center h-85 text-gray-600 dark:text-gray-400">
          {!user ? (
            <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300">
              <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                <LogIn className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Faça login com a sua conta Google
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Personalize o Autismus à sua maneira.
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-4 p-8 rounded-2xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border border-gray-100 dark:border-gray-700 transform hover:scale-[1.02] transition-all duration-300">
              <div className="p-4 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
                <Plus className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Bem-vindo ao Autismus CAA
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-sm">
                Selecione uma categoria para explorar e criar conteúdo.
              </p>
            </div>
          )}
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