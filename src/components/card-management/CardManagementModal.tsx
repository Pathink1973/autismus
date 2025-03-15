import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useCardManagementStore } from '../../store/useCardManagementStore';

interface CardManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCard: (card: { categoryId: string; imageUrl: string; label: string; voiceLabel?: string }) => Promise<void>;
  categoryId: string | null;
}

export interface Category {
  id: string;
  name: string;
}

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_DIMENSION = 800; // Maximum width or height for better performance

export const compressImage = (file: File): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      // Check file type
      if (!file.type.startsWith('image/')) {
        reject(new Error('O arquivo selecionado não é uma imagem válida'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          
          // Calculate new dimensions while maintaining aspect ratio
          if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
            if (width > height) {
              height = (height / width) * MAX_DIMENSION;
              width = MAX_DIMENSION;
            } else {
              width = (width / height) * MAX_DIMENSION;
              height = MAX_DIMENSION;
            }
          }

          // Create canvas and draw image
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Erro ao processar a imagem'));
            return;
          }

          // Draw and compress
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob with quality adjustment
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Erro ao comprimir a imagem'));
                return;
              }
              
              // If still too large, compress more
              if (blob.size > MAX_IMAGE_SIZE) {
                canvas.toBlob(
                  (finalBlob) => {
                    if (!finalBlob) {
                      reject(new Error('Erro ao comprimir a imagem'));
                      return;
                    }
                    resolve(finalBlob);
                  },
                  file.type === 'image/png' ? 'image/png' : 'image/jpeg',
                  0.7 // Balanced compression for quality
                );
              } else {
                resolve(blob);
              }
            },
            file.type === 'image/png' ? 'image/png' : 'image/jpeg',
            0.9 // Initial compression quality
          );
        };
        img.onerror = () => reject(new Error('Erro ao carregar a imagem'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('Erro ao ler o arquivo'));
      reader.readAsDataURL(file);
    });
  };

export const CardManagementModal: React.FC<CardManagementModalProps> = ({
  isOpen,
  onClose,
  // onAddCard is handled by addCustomCard from the store
  onAddCard: _onAddCard,
  categoryId,
}) => {
  type UploadMethod = 'url' | 'file';

  interface FormState {
    categoryId: string;
    label: string;
    voiceLabel: string;
    imageUrl: string;
    previewUrl: string;
    uploadMethod: UploadMethod;
  }

  // Initialize form state with category ID if provided
  const initialState: FormState = {
    categoryId: categoryId || '',
    label: '',
    voiceLabel: '',
    imageUrl: '',
    previewUrl: '',
    uploadMethod: 'url' as const,
  };

  const [formState, setFormState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    categories,
    temporaryCategory,
    addCustomCard,
    initialize
  } = useCardManagementStore();

  // Combine regular categories with temporary category if it exists
  const allCategories: Category[] = useMemo(() => {
    if (temporaryCategory) {
      return [...categories, temporaryCategory];
    }
    return categories;
  }, [categories, temporaryCategory]);



  useEffect(() => {
    if (isOpen) {
      setFormState(prev => ({
        ...initialState,
        categoryId: categoryId || prev.categoryId || ''
      }));
      setError(null);
      setIsSubmitting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [isOpen, categoryId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    const { categoryId, label, voiceLabel, imageUrl, previewUrl, uploadMethod } = formState;
    
    if (!categoryId) {
      setError('Por favor, selecione uma categoria');
      return;
    }

    if (!label) {
      setError('Por favor, insira um nome para a imagem');
      return;
    }

    const finalImageUrl = uploadMethod === 'url' ? imageUrl : previewUrl;
    if (!finalImageUrl) {
      setError('Por favor, selecione uma imagem');
      return;
    }

    try {
      setIsSubmitting(true);

      // Use voiceLabel as name if provided, otherwise use label
      const cardName = voiceLabel || label;

      // Add card to Supabase
      await addCustomCard({
        name: cardName, // This will be used for voice reading
        image_url: finalImageUrl,
        storage_path: '', // Will be set by the store if needed
        category_id: categoryId,
        order: 0,
        display_name: label // Store the display name separately
      });
      
      // Refresh the store data to get the new card
      await initialize();
      
      handleClose();
    } catch (err) {
      console.error('Error adding card:', err);
      setError(err instanceof Error ? err.message : 'Falha ao adicionar imagem');
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormState(initialState);
    setError(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Adicionar Nova Imagem</h2>
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
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              id="categoryId"
              value={formState.categoryId}
              onChange={(e) => setFormState(prev => ({ ...prev, categoryId: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2"
              required
              disabled={isSubmitting}
            >
              <option value="">Selecione uma categoria</option>
              {allCategories.map((category: Category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="label" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome para Exibição
            </label>
            <Input
              id="label"
              type="text"
              value={formState.label}
              onChange={(e) => setFormState(prev => ({ ...prev, label: e.target.value }))}
              placeholder="Digite o nome para exibição"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label htmlFor="voiceLabel" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nome para Voz (opcional)
            </label>
            <Input
              id="voiceLabel"
              type="text"
              value={formState.voiceLabel}
              onChange={(e) => setFormState(prev => ({ ...prev, voiceLabel: e.target.value }))}
              placeholder="Digite como a voz deve pronunciar"
              disabled={isSubmitting}
            />
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Se não preenchido, será usado o nome de exibição
            </p>
          </div>

          <div>
            <div className="flex gap-2 mb-2">
              <Button
                type="button"
                variant={formState.uploadMethod === 'url' ? 'primary' : 'secondary'}
                onClick={() => setFormState(prev => ({ ...prev, uploadMethod: 'url' as const, previewUrl: '' }))}
                disabled={isSubmitting}
              >
                URL
              </Button>
              <Button
                type="button"
                variant={formState.uploadMethod === 'file' ? 'primary' : 'secondary'}
                onClick={() => setFormState(prev => ({ ...prev, uploadMethod: 'file' as const, imageUrl: '' }))}
                disabled={isSubmitting}
              >
                Arquivo
              </Button>
            </div>

            {formState.uploadMethod === 'url' ? (
              <Input
                type="url"
                value={formState.imageUrl}
                onChange={(e) => setFormState(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://exemplo.com/imagem.jpg"
                required={formState.uploadMethod === 'url'}
                disabled={isSubmitting}
              />
            ) : (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      try {
                        // Only compress if image is too large
                        const processedImage = file.size > MAX_IMAGE_SIZE ? 
                          await compressImage(file) : file;
                        
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setFormState(prev => ({
                            ...prev,
                            previewUrl: reader.result as string
                          }));
                        };
                        reader.onerror = () => {
                          setError('Erro ao ler a imagem. Por favor, tente novamente.');
                        };
                        reader.readAsDataURL(processedImage);
                      } catch (error) {
                        console.error('Error processing image:', error);
                        const errorMessage = error instanceof Error ? error.message : 
                          'Erro ao processar a imagem. Por favor, tente uma imagem menor ou em outro formato (JPG, PNG).';
                        setError(errorMessage);
                      }
                    }
                  }}
                  accept="image/*"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2"
                  required={formState.uploadMethod === 'file'}
                  disabled={isSubmitting}
                />
              </div>
            )}
          </div>

          {(formState.previewUrl || formState.imageUrl) && (
            <div className="mt-4">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pré-visualização:
              </p>
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-gray-50 dark:bg-gray-900">
                <img
                  src={formState.previewUrl || formState.imageUrl}
                  alt="Preview"
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://via.placeholder.com/400x300?text=Imagem+Inválida';
                  }}
                />
              </div>
            </div>
          )}

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
              {isSubmitting ? 'Adicionando...' : 'Adicionar Imagem'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};