import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { useCardManagementStore } from '@/store/useCardManagementStore';
import { supabase } from '@/lib/supabase';

interface FormState {
  name: string;
  icon: string;
  color: string;
}

interface Card {
  id: string;
  name: string;
  image_url: string;
  storage_path: string;
  category_id: string;
  user_id: string;
  order: number;
  created_at?: string;
  updated_at?: string;
}

interface DatabaseCategory {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categoryToEdit?: {
    id: string;
    name: string;
    icon: string;
    color?: string;
  };
}

const CATEGORY_ICONS = [
  '📁', '🎨', '🎮', '🎵', '🍽️', '👕', '🏠', '🚗', '📚', '🎭',
  '🌞', '🌙', '🌈', '🎪', '🎠', '🎡', '🎢', '🎯', '🎲', '🎰',
  '🎳', '🎼', '🎹', '🎸', '🎺', '🎻', '🎤', '🎧', '📱', '💻'
];

export const CategoryModal: React.FC<CategoryModalProps> = ({ isOpen, onClose, categoryToEdit }) => {
  const { addCustomCategory, updateCategory } = useCardManagementStore();
  const [formState, setFormState] = useState<FormState>({
    name: categoryToEdit?.name || '',
    icon: categoryToEdit?.icon || '📁',
    color: categoryToEdit?.color || '#3B82F6'
  });

  useEffect(() => {
    if (categoryToEdit) {
      setFormState({
        name: categoryToEdit.name,
        icon: categoryToEdit.icon,
        color: categoryToEdit.color || '#3B82F6'
      });
    }
  }, [categoryToEdit]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = formState.name.trim();

    if (!trimmedName) {
      setError('O nome da categoria é obrigatório');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      // Validate icon before sending
      if (!formState.icon || formState.icon.trim() === '') {
        setError('O ícone da categoria é obrigatório');
        return;
      }

      if (categoryToEdit) {
        // Update existing category
        await updateCategory({
          id: categoryToEdit.id,
          name: trimmedName,
          icon: formState.icon,
          color: formState.color || '#3B82F6'
        });
      } else {
        // Create new category
        await addCustomCategory({
          name: trimmedName,
          icon: formState.icon,
          color: formState.color || '#3B82F6'
        });
      }

      // Close modal on success
      handleClose();
    } catch (err) {
      console.error('Error creating category:', err);
      // Enhanced error handling
      if (err instanceof Error) {
        if (err.message.includes('icon')) {
          setError('Erro ao salvar o ícone da categoria. Por favor, tente outro ícone.');
        } else {
          setError(err.message);
        }
      } else {
        setError('Erro ao criar categoria. Por favor, tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormState({
      name: '',
      icon: '📁',
      color: '#3B82F6'
    });
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {categoryToEdit ? 'Editar Categoria' : 'Nova Categoria'}
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
              value={formState.name}
              onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Digite o nome da categoria"
              required
              disabled={isSubmitting}
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Ícone da Categoria
            </label>
            <div className="grid grid-cols-10 gap-2 p-2 border rounded-lg dark:border-gray-600">
              {CATEGORY_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setFormState(prev => ({ ...prev, icon }))}
                  className={`w-8 h-8 text-lg flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    formState.icon === icon ? 'bg-blue-100 dark:bg-blue-900' : ''
                  }`}
                >
                  {icon}
                </button>
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
              {isSubmitting ? (categoryToEdit ? 'Salvando...' : 'Criando...') : 
               (categoryToEdit ? 'Salvar Alterações' : 'Criar Categoria')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
