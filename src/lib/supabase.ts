import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://oisjitofsoltrvixkife.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9pc2ppdG9mc29sdHJ2aXhraWZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEyOTM5ODAsImV4cCI6MjA1Njg2OTk4MH0.OKFVoPcsxwpLlmeMnFZfEup9niV3aBUuUbQKMO4SlB8";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase URL or Anon Key');
}

// Verify database connection and permissions
async function checkDatabaseAccess() {
  const checkTable = async (tableName: string) => {
    const { error } = await supabase
      .from(tableName)
      .select('count')
      .limit(1);

    if (error) {
      console.error(`${tableName} table access error:`, error);
      if (error.code === '42P01') { // Table does not exist
        throw new Error(`A tabela '${tableName}' não existe. Por favor, verifique se o banco de dados foi configurado corretamente.`);
      } else if (error.code === '42501') { // Permission denied
        throw new Error(`Sem permissão para acessar a tabela '${tableName}'. Verifique as políticas de segurança do Supabase.`);
      } else {
        throw error;
      }
    }
    return true;
  };

  const checkStorageBucket = async (bucketName: string) => {
    const { error } = await supabase
      .storage
      .getBucket(bucketName);

    if (error) {
      console.error(`${bucketName} bucket access error:`, error);
      if (error.statusCode === 404) {
        throw new Error(`O bucket de armazenamento '${bucketName}' não existe. Por favor, crie o bucket no console do Supabase.`);
      } else if (error.statusCode === 403) {
        throw new Error(`Sem permissão para acessar o bucket '${bucketName}'. Verifique as políticas de armazenamento do Supabase.`);
      } else {
        throw error;
      }
    }
    return true;
  };

  try {
    // Check database tables
    await checkTable(TABLES.CATEGORIES);
    await checkTable(TABLES.CARDS);

    // Check storage bucket
    await checkStorageBucket(STORAGE.BUCKETS.CARD_IMAGES);

    console.log('✅ Database access check successful');
    return true;
  } catch (error) {
    console.error('❌ Database access check failed:', error);
    
    // Map specific error types to user-friendly messages
    if (error instanceof Error) {
      // If it's already a user-friendly error from our checks, pass it through
      if (error.message.includes('tabela') || error.message.includes('bucket')) {
        throw error;
      }

      // Otherwise map to generic errors
      if (error.message?.includes('404') || error.message?.includes('42P01')) {
        throw new Error(DB_ERRORS.NOT_FOUND);
      } else if (error.message?.includes('409')) {
        throw new Error(DB_ERRORS.CONFLICT);
      } else if (error.message?.includes('403') || error.message?.includes('42501')) {
        throw new Error(DB_ERRORS.PERMISSION);
      } else if (error.message?.includes('network') || error.message?.includes('Failed to fetch')) {
        throw new Error(DB_ERRORS.NETWORK);
      }
    }

    // Fallback error
    throw new Error(DB_ERRORS.UNKNOWN);
  }
}

// Database schema constants
export const TABLES = {
  CATEGORIES: 'categories',  // Table for storing card categories
  CARDS: 'cards',  // Table for storing user's cards
} as const;

export const STORAGE = {
  BUCKETS: {
    CARD_IMAGES: 'card_images',  // Bucket for storing card images
  },
} as const;

// Error messages with SQL hints
export const DB_ERRORS = {
  NOT_FOUND: `Recurso não encontrado. Verifique se as tabelas foram criadas corretamente.

Dica: Execute os seguintes comandos no SQL Editor do Supabase:

-- Criar tabela de categorias
CREATE TABLE categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT DEFAULT '📁',
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar tabela de cards
CREATE TABLE cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  image_url TEXT,
  storage_path TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  "order" INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar políticas de acesso
CREATE POLICY "Users can view their own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own cards"
  ON cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cards"
  ON cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON cards FOR DELETE
  USING (auth.uid() = user_id);`,
  PERMISSION: 'Erro de permissão. Verifique as políticas de acesso do Supabase.',
  CONFLICT: 'Conflito ao acessar o recurso. A tabela pode já existir ou haver um conflito de chaves.',
  NETWORK: 'Erro de conexão. Verifique sua internet.',
  UNKNOWN: 'Ocorreu um erro inesperado. Tente novamente.',
} as const;

// Initialize Supabase client with robust error handling and session management
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storage: window.localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'x-client-info': 'let-me-talk-pecs'
    }
  }
});

// Helper function to get the correct redirect URL based on the environment
export const getRedirectUrl = () => {
  // For production (Netlify)
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return 'https://autismus.netlify.app';
  }
  // For local development
  return window.location.origin;
};

// Export a helper function for Google sign-in that includes the correct redirect URL
export const signInWithGoogle = async () => {
  try {
    // Determine the correct redirect URL based on the environment
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const redirectTo = isLocalhost 
      ? `${window.location.origin}/auth/callback`
      : `${getRedirectUrl()}/auth/v1/callback`;
    
    console.log('Signing in with Google, redirectTo:', redirectTo);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('Login error:', error);
    return { data: null, error };
  }
};

export { supabase };
