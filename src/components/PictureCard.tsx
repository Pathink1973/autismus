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
        alt={card.label}
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-black/10 backdrop-blur-sm p-2">
        <p className="text-white text-sm font-medium truncate text-center">
          {card.label}
        </p>
      </div>
    </motion.div>
  );
};