import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { DraggableCard } from './DraggableCard';
import { PictureCard } from '../../types';

interface DroppableGridProps {
  categoryId: string;
  cards: PictureCard[];
  onCardClick: (card: PictureCard) => void;
  onDeleteCard: (cardId: string) => void;
  selectedCardIds: Set<string>;
}

export const DroppableGrid: React.FC<DroppableGridProps> = ({
  categoryId,
  cards,
  onCardClick,
  onDeleteCard,
  selectedCardIds,
}) => {
  return (
    <Droppable droppableId={`category-${categoryId}`} direction="horizontal">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {cards.map((card, index) => (
            <DraggableCard
              key={card.id}
              card={card}
              index={index}
              onClick={() => onCardClick(card)}
              onDeleteCard={() => onDeleteCard(card.id)}
              isSelected={selectedCardIds.has(card.id)}
            />
          ))}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};