import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        // First try to restore the session from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          // Set the session manually if we have the tokens
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });
          
          if (setSessionError) throw setSessionError;
        }

        // Double-check we have a valid session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;

        if (!session) {
          throw new Error('No session found after authentication');
        }
        
        // Store session in localStorage for persistence
        window.localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        
        // Redirect back to the main page
        // Ensure we redirect to the correct port
        window.location.href = `${window.location.protocol}//${window.location.hostname}:4000/`;
      } catch (error) {
        console.error('Error in auth callback:', error);
        // Redirect to home page with error message
        window.location.href = `${window.location.protocol}//${window.location.hostname}:4000/?error=auth-callback-failed`;
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-300 dark:border-gray-600 border-t-blue-600 dark:border-t-blue-400"></div>
    </div>
  );
};

export default AuthCallback;
