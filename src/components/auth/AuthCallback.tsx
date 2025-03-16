import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
            // Explicitly exchange the code for a session
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            
            if (error) {
              console.error('Error exchanging code for session:', error);
              throw error;
            }
            
            if (data.session) {
              console.log('Session successfully established via code exchange');
              
              // Store the session in localStorage
              localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
              
              // Use React Router's navigate instead of window.location for a cleaner transition
              navigate('/', { replace: true });
              return;
            } else {
              console.error('No session returned after code exchange');
              throw new Error('Failed to establish session after code exchange');
            }
          } catch (exchangeError) {
            console.error('Error during code exchange:', exchangeError);
            setError('Authentication error. Please try again.');
            setLoading(false);
            
            // Use React Router's navigate for redirection after error
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 3000);
            return;
          }
        }
        
        // If no code is found, check for tokens in the URL hash (implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          console.log('Found access token in URL hash');
          try {
            // Set the session manually if we have the tokens
            const { error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken || '',
            });
            
            if (setSessionError) throw setSessionError;
            
            console.log('Session set from tokens');
            
            // Use React Router's navigate for redirection
            navigate('/', { replace: true });
            return;
          } catch (tokenError) {
            console.error('Error setting session from tokens:', tokenError);
            setError('Authentication error. Please try again.');
            setLoading(false);
            
            // Use React Router's navigate for redirection after error
            setTimeout(() => {
              navigate('/', { replace: true });
            }, 3000);
            return;
          }
        }

        // If we get here without a code or tokens, something went wrong
        console.error('No code or tokens found in callback URL');
        setError('Authentication failed. Please try again.');
        setLoading(false);
        
        // Use React Router's navigate for redirection after error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
        
      } catch (error) {
        console.error('Error in auth callback:', error);
        setError('Authentication error. Please try again.');
        setLoading(false);
        
        // Use React Router's navigate for redirection after error
        setTimeout(() => {
          navigate('/', { replace: true });
        }, 3000);
      }
    };

    handleAuthCallback();
  }, [navigate]);

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
        
        {loading && !error && (
          <div className="flex justify-center mt-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
