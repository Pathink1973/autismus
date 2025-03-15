import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { ImageUpload } from "./ImageUpload";
import type { User } from "@supabase/supabase-js";
import type { ImageUpload as ImageUploadType } from "../../types/supabase";

interface Category {
  id: number;
  name: string;
  user_id: string;
  created_at: string;
}

export const CategoryManager = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        fetchCategories(user.id);
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchCategories(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchCategories = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error fetching categories');
    } finally {
      setLoading(false);
    }
  };

  const createCategory = async () => {
    if (!user || !newCategoryName.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .insert([
          {
            name: newCategoryName.trim(),
            user_id: user.id,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      setCategories([...categories, data as Category]);
      setNewCategoryName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creating category');
    } finally {
      setLoading(false);
    }
  };

  const deleteCategory = async (categoryId: number) => {
    if (!user) return;

    try {
      setLoading(true);

      // First, get all cards in this category
      const { data: cards } = await supabase
        .from('cards')
        .select('image_path')
        .eq('category_id', categoryId);

      // Delete images from storage
      if (cards && cards.length > 0) {
        const filePaths = cards.map(card => card.image_path);

        const { error: storageError } = await supabase.storage
          .from('card_images')
          .remove(filePaths);

        if (storageError) throw storageError;
      }

      // Delete category and its images from the database
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;

      setCategories(categories.filter(cat => cat.id !== categoryId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error deleting category');
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (image: ImageUploadType) => {
    await fetchCategories(user!.id);
  };

  if (!user) {
    return (
      <div className="text-center p-4">
        <p className="text-gray-600 dark:text-gray-400">Please sign in to manage categories and images</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* New Category Form */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          placeholder="Enter category name"
          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <button
          onClick={createCategory}
          disabled={loading || !newCategoryName.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Add Category
        </button>
      </div>

      {error && (
        <div className="p-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div
            key={category.id}
            className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {category.name}
              </h3>
              <button
                onClick={() => deleteCategory(category.id)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 
                         dark:hover:text-red-300 transition-colors"
              >
                Delete Category
              </button>
            </div>
            
            <ImageUpload 
              category={category.name} 
              categoryId={category.id}
              onUploadComplete={handleImageUpload}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
