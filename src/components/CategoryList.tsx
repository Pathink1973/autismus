import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCardManagementStore } from '../store/useCardManagementStore';
import { Category } from '../types';
import { speak } from '../utils/speech';
import { NewCategoryModal } from './card-management/NewCategoryModal';
import { Edit2, Trash2, Plus, Lock } from 'lucide-react';
import { Button } from './ui/Button';
import { supabase } from '../lib/supabase';

interface CategoryListProps {
  selectedCategory: string | null;
  onSelect: (categoryId: string) => void;
}

const SELECT_CATEGORY_ID = 'select-category';

export const CategoryList: React.FC<CategoryListProps> = React.memo(({
  selectedCategory,
  onSelect,
}) => {
  const {
    categories,
    temporaryCategory,
    deleteCategory,
  } = useCardManagementStore();

  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthenticated(!!user);
    };
    checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session?.user);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Sort categories by group and name
  const displayCategories = useMemo(() => {
    let allCategories = [...categories];
    
    // Only show system categories if not authenticated
    if (!isAuthenticated) {
      allCategories = allCategories.filter(cat => cat.isSystem);
    }
    
    if (temporaryCategory) {
      // Find similar system category to determine group
      const similarCategory = categories.find((cat: Category) => 
        cat.isSystem && 
        (cat.name.toLowerCase().includes(temporaryCategory.name.toLowerCase()) ||
         temporaryCategory.name.toLowerCase().includes(cat.name.toLowerCase()))
      );
      
      // Add temporary category with the same group as similar category
      allCategories.push({
        ...temporaryCategory,
        group: similarCategory?.group || 'social'
      });
    }

    const selectCategory: Category = {
      id: SELECT_CATEGORY_ID,
      name: isAuthenticated ? 'Selecione uma categoria' : 'Categorias Bloqueadas',
      icon: isAuthenticated ? '📋' : '🔒',
      color: '#6b7280',
      isSystem: true,
      group: 'actions'
    };

    // Sort categories by group and then by name
    return [selectCategory, ...allCategories].sort((a, b) => {
      // Special handling for "Categorias Bloqueadas"
      if (!isAuthenticated) {
        if (a.id === SELECT_CATEGORY_ID) return -1;
        if (b.id === SELECT_CATEGORY_ID) return 1;
      }

      // Then sort by group and name
      if (a.group === b.group) {
        // For the actions group, ensure "Categorias Bloqueadas" comes first
        if (a.group === 'actions') {
          if (a.id === SELECT_CATEGORY_ID) return -1;
          if (b.id === SELECT_CATEGORY_ID) return 1;
        }
        return a.name.localeCompare(b.name);
      }
      return (a.group || '').localeCompare(b.group || '');
    });
  }, [categories, temporaryCategory, isAuthenticated]);



  const handleCategoryClick = (categoryId: string) => {
    if (!isAuthenticated && categoryId !== SELECT_CATEGORY_ID) {
      return;
    }
    onSelect(categoryId);
    const category = displayCategories.find(c => c.id === categoryId);
    if (category) {
      speak(category.name);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!isAuthenticated) {
      return;
    }
    if (window.confirm('Tem certeza que deseja excluir esta categoria?')) {
      try {
        await deleteCategory(categoryId);
      } catch (error) {
        console.error('Error deleting category:', error);
      }
    }
  };



  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Categorias</h2>
        {isAuthenticated && (
          <Button
            onClick={() => setIsNewCategoryModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Nova Categoria
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 pb-4">
        <AnimatePresence>
          {displayCategories.map((category) => (
            <CategoryButton
              key={category.id}
              category={category}
              isSelected={selectedCategory === category.id}
              onClick={() => handleCategoryClick(category.id)}
              onEdit={isAuthenticated && !category.isSystem ? () => setEditingCategory(category) : undefined}
              onDelete={isAuthenticated && !category.isSystem ? () => handleDeleteCategory(category.id) : undefined}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isNewCategoryModalOpen && (
          <NewCategoryModal
            isOpen={true}
            onClose={() => setIsNewCategoryModalOpen(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingCategory && (
          <NewCategoryModal
            isOpen={true}
            onClose={() => setEditingCategory(null)}
            editCategory={editingCategory}
          />
        )}
      </AnimatePresence>
    </>
  );
});

interface CategoryButtonProps {
  category: Category;
  isSelected: boolean;
  onClick: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isAuthenticated: boolean;
}

export const CategoryButton: React.FC<CategoryButtonProps> = React.memo(({ 
  category, 
  isSelected, 
  onClick,
  onEdit,
  onDelete,
  isAuthenticated
}) => {
  const isCustom = !category.isSystem;
  const showLockIcon = !isAuthenticated && category.id !== SELECT_CATEGORY_ID;

  return (
    <motion.div
      layout
      className="relative group"
    >
      <motion.div
        onClick={onClick}
        role="button"
        tabIndex={0}
        className={`
          relative
          flex flex-col items-center justify-center gap-2 p-3 h-[100px]
          bg-white dark:bg-gray-800 rounded-lg shadow-sm cursor-pointer
          ${isCustom ? 'bg-gradient-to-br from-purple-50 to-white dark:from-purple-950 dark:to-gray-800 border-2 border-purple-200 dark:border-purple-800' : ''}
          ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
          ${showLockIcon ? 'opacity-60' : ''}
          transition-all duration-200
        `}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onKeyPress={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClick();
          }
        }}
      >
        {showLockIcon && (
          <div className="absolute top-2 right-2 p-1 rounded-full bg-gray-100 dark:bg-gray-700 transform transition-all duration-200 group-hover:scale-110 group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
            <Lock className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400 transition-colors duration-200 group-hover:text-gray-600 dark:group-hover:text-gray-300" />
          </div>
        )}
        <div
          className="flex items-center justify-center w-12 h-12 rounded-full mb-1 transition-transform group-hover:scale-110"
          style={{ 
            backgroundColor: `${category.color}15`,
            boxShadow: `0 0 0 2px ${category.color}10`
          }}
        >
          <span className="text-2xl" style={{ color: category.color }}>{category.icon}</span>
        </div>
        <span className="text-sm font-medium text-center text-gray-900 dark:text-gray-100 line-clamp-2">
          {category.name}
        </span>
        
        {isCustom && (
          <div className="absolute top-2 right-2 flex gap-1">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
        
        {isSelected && (
          <motion.div
            className="absolute inset-0 ring-2 ring-blue-500 rounded-lg"
            layoutId="outline"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </motion.div>
    </motion.div>
  );
});