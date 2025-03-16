import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { User } from "@supabase/supabase-js";

// Error messages for different scenarios
const ERROR_MESSAGES = {
  NETWORK: 'Erro de conexão',
  AUTH: 'Erro de autenticação',
  LOGOUT: 'Erro ao sair',
} as const;

const AuthComponent = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let errorTimeout: NodeJS.Timeout;

    async function initializeAuth() {
      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (mounted) {
            const currentUser = session?.user ?? null;
            if (currentUser) {
              console.log('User metadata:', currentUser.user_metadata);
              console.log('Avatar URL:', currentUser.user_metadata?.avatar_url);
            }
            setUser(currentUser);
            setLoading(false);

            // Handle specific auth events
            switch (event) {
              case 'SIGNED_IN':
                console.log('User signed in:', session?.user?.email);
                break;
              case 'SIGNED_OUT':
                console.log('User signed out');
                clearUserData();
                break;

              case 'TOKEN_REFRESHED':
                console.log('Session token refreshed');
                break;
            }
          }
        });

        return () => {
          mounted = false;
          subscription.unsubscribe();
          if (errorTimeout) clearTimeout(errorTimeout);
        };
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initializeAuth();
  }, []);

  const clearUserData = () => {
    // Clear auth-related data
    window.localStorage.removeItem('supabase.auth.token');
    
    // Clear any user-specific data
    const userKeys = Object.keys(window.localStorage)
      .filter(key => key.startsWith('user_') || key.includes('auth'));
    userKeys.forEach(key => window.localStorage.removeItem(key));
  };

  const showError = (message: string) => {
    setError(message);
    // Auto-hide error after 3 seconds
    setTimeout(() => setError(null), 3000);
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'https://autismus.netlify.app/auth/v1/callback'
        }
      });
      
      if (error) throw error;
    } catch (error) {
      console.error("Login error:", error);
      // Only show network errors to user
      if (error instanceof Error && error.message.includes('network')) {
        showError(ERROR_MESSAGES.NETWORK);
      } else {
        showError(ERROR_MESSAGES.AUTH);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear user state and data
      setUser(null);
      clearUserData();
    } catch (error) {
      console.error("Logout error:", error);
      // Only show network errors
      if (error instanceof Error && error.message.includes('network')) {
        showError(ERROR_MESSAGES.NETWORK);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {loading ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 dark:border-gray-600 border-t-blue-600"></div>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {user ? 'Saindo...' : 'Conectando...'}
          </span>
        </div>
      ) : user ? (
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-xl transition-colors group"
        >
          {(user.user_metadata?.picture || user.user_metadata?.avatar_url) ? (
            <img
              src={
                // Try to get a properly sized image URL
                (user.user_metadata.picture || user.user_metadata.avatar_url)?.includes('googleusercontent.com')
                  ? `${user.user_metadata.picture || user.user_metadata.avatar_url}`.replace(/=s\d+-c$/, '=s48-c')
                  : user.user_metadata.picture || user.user_metadata.avatar_url
              }
              alt={user.user_metadata?.full_name || user.email || 'Usuário'}
              className="w-6 h-6 rounded-full ring-1 ring-gray-200 dark:ring-gray-700 object-cover"
              onError={(e) => {
                const url = user.user_metadata.picture || user.user_metadata.avatar_url;
                console.error('Failed to load avatar image:', url);
                // If image fails to load, show fallback
                const target = e.currentTarget;
                target.style.display = 'none';
                // If image fails, show initials fallback
                setUser({...user, user_metadata: {...user.user_metadata, picture: null, avatar_url: null}});
              }}
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
              <span className="text-sm text-blue-600 dark:text-blue-300">
                {(user.email?.[0] || 'U').toUpperCase()}
              </span>
            </div>
          )}
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
            {user.user_metadata?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
          </span>
        </button>
      ) : (
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] group"
        >
          {!loading && (
            <svg className="w-5 h-5 text-white group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"
              />
            </svg>
          )}
          <span className="text-sm font-medium group-hover:scale-105 transition-transform">
            {loading ? 'Conectando...' : 'Entrar com Google'}
          </span>
        </button>
      )}
      {error && (
        <div className="absolute top-full right-0 mt-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-xs">
          {error}
        </div>
      )}
    </div>
  );
};

export default AuthComponent;
