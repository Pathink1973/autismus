import { useState, useEffect } from "react";
import { supabase, TABLES, STORAGE } from "../../lib/supabase";
import { uploadToCloudinary } from "../../utils/cloudinary";
import type { Card } from "../../types/supabase";
import type { User } from "@supabase/supabase-js";

const UPLOAD_ERRORS = {
  AUTH: 'Por favor, faça login para fazer upload de imagens',
  FILE_SIZE: 'Arquivo muito grande. Limite máximo: 2MB',
  FILE_TYPE: 'Tipo de arquivo não suportado. Use: jpg, png, gif',
  UPLOAD: 'Erro ao fazer upload da imagem. Verifique se você tem permissão.',
  DATABASE: 'Erro ao salvar informações da imagem no banco de dados',
  CATEGORY: 'Categoria não encontrada',
  STORAGE: 'Erro no armazenamento. Bucket pode não existir.',
  CLOUDINARY: 'Erro ao sincronizar com Cloudinary',
  CLEANUP: 'Erro ao limpar arquivo temporário',
  UNKNOWN: 'Ocorreu um erro durante o upload'
} as const;

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

interface ImageUploadProps {
  category: string;
  categoryId: string;
  onUploadComplete?: (card: Card) => void;
}

export const ImageUpload = ({ category, categoryId, onUploadComplete }: ImageUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Reset states when component unmounts or dependencies change
  useEffect(() => {
    const cleanup = () => {
      setError(null);
      setUploadProgress(0);
      setIsUploading(false);
    };

    cleanup();
    return cleanup;
  }, [category, categoryId]);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        setIsLoadingUser(true);
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.error('Auth error:', authError);
          if (mounted) setError(UPLOAD_ERRORS.AUTH);
          return;
        }

        if (mounted) setUser(user);
      } catch (err) {
        console.error('Failed to get user:', err);
        if (mounted) setError(UPLOAD_ERRORS.AUTH);
      } finally {
        if (mounted) setIsLoadingUser(false);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setError(null);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!user) {
      setError(UPLOAD_ERRORS.AUTH);
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError(UPLOAD_ERRORS.FILE_SIZE);
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError(UPLOAD_ERRORS.FILE_TYPE);
      return;
    }

    try {
      setIsUploading(true);
      setError(null);
      setUploadProgress(0);

      // Create a unique file path within the category
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${category}/${fileName}`;

      // Verify if category exists
      const { data: categoryExists, error: categoryError } = await supabase
        .from(TABLES.CATEGORIES)
        .select('id')
        .eq('id', categoryId)
        .single();

      if (categoryError || !categoryExists) {
        console.error('Category error:', categoryError);
        setError(UPLOAD_ERRORS.CATEGORY);
        return;
      }

      // Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(STORAGE.BUCKETS.CARD_IMAGES)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Storage upload error:', uploadError);
        if (uploadError.message?.includes('bucket')) {
          setError(UPLOAD_ERRORS.STORAGE);
        } else if (uploadError.message?.includes('permission')) {
          setError(UPLOAD_ERRORS.UPLOAD);
        } else {
          setError(UPLOAD_ERRORS.UNKNOWN);
        }
        return;
      }

      setUploadProgress(50); // Supabase upload complete

      // Get the public URL of the uploaded image
      const { data: { publicUrl } } = supabase.storage
        .from(STORAGE.BUCKETS.CARD_IMAGES)
        .getPublicUrl(filePath);

      // Upload to Cloudinary
      let cloudinaryData = null;
      try {
        cloudinaryData = await uploadToCloudinary(publicUrl);
        setUploadProgress(75); // Cloudinary upload complete
        
        // After successful Cloudinary upload, remove from Supabase storage
        const { error: removeError } = await supabase.storage
          .from(STORAGE.BUCKETS.CARD_IMAGES)
          .remove([filePath]);
          
        if (removeError) {
          console.error('Failed to remove file from Supabase:', removeError);
          setError(UPLOAD_ERRORS.CLEANUP);
          // Don't return, we still want to save the Cloudinary URL
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload error:', cloudinaryError);
        setError(UPLOAD_ERRORS.CLOUDINARY);
        
        // Clean up the Supabase file since Cloudinary failed
        await supabase.storage
          .from(STORAGE.BUCKETS.CARD_IMAGES)
          .remove([filePath])
          .catch(cleanupError => {
            console.error('Failed to cleanup uploaded file:', cleanupError);
          });
        return; // Don't proceed if Cloudinary upload failed
      }

      // Insert the image record into the database
      const { data: imageData, error: dbError } = await supabase
        .from(TABLES.CARDS)
        .insert([
          {
            user_id: user.id,
            image_url: cloudinaryData.secure_url, // Only use Cloudinary URL
            category_id: categoryId,
            storage_path: null, // No Supabase storage path since we deleted it
            name: file.name.split('.')[0],
            order: 0,
            cloudinary_metadata: cloudinaryData
          },
        ])
        .select()
        .single();

      if (dbError) {
        console.error('Database error:', dbError);
        console.error('Error details:', {
          code: dbError.code,
          message: dbError.message,
          details: dbError.details,
          hint: dbError.hint
        });
        
        // Try to cleanup the uploaded files
        await Promise.all([
          supabase.storage
            .from(STORAGE.BUCKETS.CARD_IMAGES)
            .remove([filePath])
            .catch(cleanupError => {
              console.error('Failed to cleanup uploaded file:', cleanupError);
            }),
          cloudinaryData?.public_id && uploadToCloudinary(cloudinaryData.public_id)
            .catch(cleanupError => {
              console.error('Failed to cleanup Cloudinary image:', cleanupError);
            })
        ]);
          
        if (dbError.code === '23503') {
          setError(UPLOAD_ERRORS.CATEGORY);
        } else if (dbError.code === '42501') {
          setError(UPLOAD_ERRORS.UPLOAD);
        } else {
          setError(UPLOAD_ERRORS.DATABASE);
        }
        return;
      }

      setUploadProgress(100);
      if (onUploadComplete && imageData) {
        onUploadComplete(imageData);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(UPLOAD_ERRORS.UNKNOWN);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={handleUpload}
        disabled={isUploading || isLoadingUser || !user}
        className="hidden"
        id={`file-upload-${categoryId}`}
      />
      <label
        htmlFor={`file-upload-${categoryId}`}
        className={`inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg cursor-pointer
          ${(isUploading || isLoadingUser || !user) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'}`}
      >
        {isUploading ? 'Enviando...' : 'Adicionar Imagem'}
      </label>
      
      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {isUploading && (
        <div className="mt-2">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {uploadProgress}% completo
          </p>
        </div>
      )}
    </div>
  );
};
