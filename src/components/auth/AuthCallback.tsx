import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(true);

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
          console.log('Found authorization code in URL:', code);
          
          try {
            // Explicitly exchange the code for a session - this is more reliable on Netlify
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Error exchanging code for session:', error);
              throw error;
            }
            
            if (data.session) {
              console.log('Session successfully established via code exchange');
              window.location.href = '/';
              return;
            } else {
              // Fall back to the original method if the explicit exchange fails
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
              
              if (sessionError) {
                console.error('Error getting session:', sessionError);
                throw sessionError;
              }
              
              if (sessionData.session) {
                console.log('Session established via getSession');
                window.location.href = '/';
                return;
              }
              
              console.log('No session found, waiting for session to be established...');
              
              // Wait a bit and try again - sometimes there's a delay
              setTimeout(async () => {
                try {
                  const { data: retryData, error: retryError } = await supabase.auth.getSession();
                  
                  if (retryError) throw retryError;
                  
                  if (retryData.session) {
                    console.log('Session established on retry');
                    window.location.href = '/';
                  } else {
                    console.error('Failed to establish session after retry');
                    setError('Failed to establish session. Please try logging in again.');
                    setProcessing(false);
                    setTimeout(() => {
                      window.location.href = '/';
                    }, 3000);
                  }
                } catch (retryError) {
                  console.error('Error in retry:', retryError);
                  setError('Authentication error. Please try again.');
                  setProcessing(false);
                  setTimeout(() => {
                    window.location.href = '/';
                  }, 3000);
                }
              }, 2000);
              return;
            }
          } catch (exchangeError) {
            console.error('Error during authentication:', exchangeError);
            setError('Authentication error. Please try again.');
            setProcessing(false);
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }
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
          
          console.log('Session set from tokens');
          window.location.href = '/';
          return;
        }

        // If we get here without a code or tokens, something went wrong
        console.error('No code or tokens found in callback URL');
        setError('Authentication failed. Please try again.');
        setProcessing(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
        
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError('Authentication error. Please try again.');
        setProcessing(false);
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {error ? 'Authentication Error' : 'Processing Authentication'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {error || 'Please wait while we log you in...'}
          </p>
        </div>
        
        {processing && !error && (
          <div className="flex justify-center mt-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
