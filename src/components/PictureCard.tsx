import React from 'react';
import { PictureCard as PictureCardType } from '../types';
import { motion } from 'framer-motion';

interface PictureCardProps {
  card: PictureCardType;
  onClick?: () => void;
  isSelected?: boolean;
}

export const PictureCard: React.FC<PictureCardProps> = ({
  card,
  onClick,
  isSelected = false,
}) => {
  // Use display_name for visual label and name for voice
  const displayName = card.display_name || card.label;

  return (
    <motion.div
      onClick={onClick}
      className={`
        relative aspect-square w-full rounded-lg overflow-hidden cursor-pointer
        border-2 transition-all duration-200
        ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:border-blue-300'}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <img
        src={card.imageUrl}
        alt={displayName}
        className="w-full h-full object-cover"
        onError={(e) => {
          const img = e.target as HTMLImageElement;
          // Use a data URL for a simple colored placeholder instead of relying on an external file
          // This ensures it works even if the placeholder.png file is missing
          img.src = 'data:image/svg+xml;charset=utf-8,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 1 1%22 width%3D%22300%22 height%3D%22200%22%3E%3Crect width%3D%221%22 height%3D%221%22 fill%3D%22%23cccccc%22%2F%3E%3C%2Fsvg%3E';
          // Fallback to placeholder.png if available
          img.onerror = () => {
            img.src = '/placeholder.png';
            img.onerror = null; // Prevent infinite loop
          };
        }}
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/20 backdrop-blur-sm p-2">
        <p className="text-white text-sm font-medium truncate text-center">
          {displayName}
        </p>
      </div>
    </motion.div>
  );
};