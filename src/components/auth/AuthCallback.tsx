import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  useEffect(() => {
    // Handle the OAuth callback
    const handleAuthCallback = async () => {
      try {
        console.log('Auth callback handling started');
        console.log('Current URL:', window.location.href);
        
        // Extract the code from URL query parameters
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
          console.log('Found authorization code in URL');
        }
        
        // First try to restore the session from URL hash (for implicit flow)
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
          console.warn('No session found after authentication callback');
          // If we have a code but no session, we might need to exchange the code
          if (code) {
            console.log('Attempting to exchange code for session');
            // The session should be automatically set by Supabase's internal handling
            // Just wait a moment for it to complete
            setTimeout(async () => {
              const { data: { session: newSession } } = await supabase.auth.getSession();
              if (newSession) {
                console.log('Session established after waiting');
                window.location.href = '/';
              } else {
                console.error('Failed to establish session after waiting');
                window.location.href = '/?auth=failed';
              }
            }, 2000);
            return;
          } else {
            throw new Error('No session or code found after authentication');
          }
        }
        
        console.log('Session successfully established');
        
        // Store session in localStorage for persistence
        window.localStorage.setItem('supabase.auth.token', JSON.stringify(session));
        
        // Redirect back to the main page
        window.location.href = '/';
      } catch (error) {
        console.error('Error in auth callback:', error);
        // Redirect to home page with error message
        window.location.href = '/?error=auth-callback-failed';
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
