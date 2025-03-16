import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { PictureCard as PictureCardType } from '../../types';
import { PictureCard } from '../PictureCard';
import { Trash2 } from 'lucide-react';

interface DraggableCardProps {
  card: PictureCardType;
  index: number;
  onClick: () => void;
  onDeleteCard: () => void;
  isSelected: boolean;
  isDraggable?: boolean; // Optional prop to control draggability
}

export const DraggableCard: React.FC<DraggableCardProps> = ({
  card,
  index,
  onClick,
  onDeleteCard,
  isSelected,
  isDraggable = true, // Default to true for backward compatibility
}) => {
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onDeleteCard();
  };

  // If the card is not draggable, render it without Draggable wrapper
  if (!isDraggable) {
    return (
      <div className="relative group">
        <PictureCard
          card={card}
          onClick={onClick}
          isSelected={isSelected}
        />
        {!card.isSystem && (
          <button
            onClick={handleDelete}
            className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 active:bg-red-700 z-10"
            aria-label={`Excluir ${card.label}`}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={{
            ...provided.draggableProps.style,
            gridColumn: 'span 1'
          }}
          className={`relative group ${
            snapshot.isDragging ? 'z-50' : ''
          }`}
        >
          <PictureCard
            card={card}
            onClick={onClick}
            isSelected={isSelected}
          />
          {!card.isSystem && (
            <button
              onClick={handleDelete}
              className="absolute -top-2 -right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:bg-red-600 active:bg-red-700 z-10"
              aria-label={`Excluir ${card.label}`}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </Draggable>
  );
};