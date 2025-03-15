import React from 'react';
import { Droppable } from '@hello-pangea/dnd';

interface DroppableGridProps {
  droppableId: string;
  children: React.ReactNode;
}

export const DroppableGrid: React.FC<DroppableGridProps> = ({
  droppableId,
  children
}) => {
  return (
    <Droppable droppableId={droppableId} direction="horizontal">
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-4"
        >
          {children}
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};