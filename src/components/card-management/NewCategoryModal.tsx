import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCardManagementStore } from '../../store/useCardManagementStore';
import { Category } from '../../types';

interface NewCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editCategory?: Category;
}

const ICONS = ['👥', '🏃', '😊', '💭', '🎮', '🍎', '👕', '📱', '🏠', '👤', '🐾', '🎨', '🔢', '☀️', '📚', '🎵', '🎪', '🚗'];
const COLORS = ['purple', 'blue', 'yellow', 'sky', 'indigo', 'red', 'green', 'gray', 'pink', 'amber', 'violet', 'teal'] as const;
const COLOR_MAP: Record<typeof COLORS[number], string> = {
  'purple': '#9333ea',
  'blue': '#3b82f6',
  'yellow': '#eab308',
  'sky': '#0ea5e9',
  'indigo': '#6366f1',
  'red': '#ef4444',
  'green': '#22c55e',
  'gray': '#6b7280',
  'pink': '#ec4899',
  'amber': '#f59e0b',
  'violet': '#8b5cf6',
  'teal': '#14b8a6'
};

export const NewCategoryModal: React.FC<NewCategoryModalProps> = ({
  isOpen,
  onClose,
  editCategory
}) => {
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0]);
  const [selectedColor, setSelectedColor] = useState<typeof COLORS[number]>(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { addCustomCategory, updateCategory } = useCardManagementStore();

  useEffect(() => {
    if (editCategory) {
      setName(editCategory.name);
      setSelectedIcon(editCategory.icon);
      const color = COLORS.find(c => COLOR_MAP[c] === editCategory.color) || COLORS[0];
      setSelectedColor(color);
    }
  }, [editCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor, insira um nome para a categoria');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editCategory) {
        await updateCategory({
          id: editCategory.id,
          name: name.trim(),
          icon: selectedIcon,
          color: COLOR_MAP[selectedColor]
        });
      } else {
        await addCustomCategory({
          name: name.trim(),
          icon: selectedIcon,
          color: COLOR_MAP[selectedColor],
        });
      }
      handleClose();
    } catch (err) {
      console.error('Error managing category:', err);
      setError('Falha ao gerenciar categoria. Por favor, tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setSelectedIcon(ICONS[0]);
    setSelectedColor(COLORS[0]);
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {editCategory ? 'Editar Categoria' : 'Nova Categoria'}
          </h2>
          <button
            onClick={handleClose}
            type="button"
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            disabled={isSubmitting}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome da Categoria
            </label>
            <Input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome da categoria"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Ícone
            </label>
            <div className="grid grid-cols-6 gap-2">
              {ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={`
                    p-2 rounded-lg text-2xl
                    ${selectedIcon === icon
                      ? 'bg-blue-100 dark:bg-blue-900 ring-2 ring-blue-500'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }
                  `}
                  disabled={isSubmitting}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Cor
            </label>
            <div className="grid grid-cols-6 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`
                    w-full aspect-square rounded-lg
                    ${selectedColor === color
                      ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-800'
                      : ''
                    }
                  `}
                  style={{ backgroundColor: COLOR_MAP[color] }}
                  disabled={isSubmitting}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting 
                ? (editCategory ? 'Salvando...' : 'Criando...') 
                : (editCategory ? 'Salvar' : 'Criar Categoria')}
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
