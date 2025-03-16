import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback handling started');
        console.log('Current URL:', window.location.href);
        
        // First try to restore the session from URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          console.log('Found access token in URL hash');
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
        
        console.log('Session successfully established');
        
        // Store session in localStorage for persistence
        window.localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        
        // Determine the correct redirect URL based on the current hostname
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const redirectUrl = isLocalhost 
          ? window.location.origin 
          : 'https://autismus.netlify.app';
        
        console.log('Redirecting to:', redirectUrl);
        
        // Redirect back to the main page with the correct URL
        window.location.href = redirectUrl;
      } catch (error) {
        console.error('Error in auth callback:', error);
        // Determine the correct redirect URL based on the current hostname
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const redirectUrl = isLocalhost 
          ? window.location.origin 
          : 'https://autismus.netlify.app';
        
        // Redirect to home page with error message
        window.location.href = `${redirectUrl}?error=auth-callback-failed`;
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
