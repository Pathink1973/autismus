import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

const AuthCallback = () => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState<string>('Please wait while we log you in...');
  const [attempts, setAttempts] = useState(0);
  const MAX_ATTEMPTS = 5;
  
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
          await processAuthCode(code);
          return;
        }
        
        // First try to restore the session from URL hash (for implicit flow)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken) {
          console.log('Found access token in URL hash');
          await processTokens(accessToken, refreshToken || '');
          return;
        }

        // If we get here without a code or tokens, something went wrong
        console.error('No code or tokens found in callback URL');
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        redirectToHome(3000);
      } catch (error) {
        console.error('Error in auth callback:', error);
        setStatus('error');
        setMessage('Authentication error. Please try again.');
        redirectToHome(3000);
      }
    };

    const processAuthCode = async (code: string) => {
      try {
        // Explicitly exchange the code for a session - this is more reliable on Netlify
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('Error exchanging code for session:', error);
          // Don't throw error immediately, try the fallback approach
        } else if (data.session) {
          console.log('Session successfully established via code exchange');
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          redirectToHome(1000);
          return;
        }
        
        // Fall back to the original method if the explicit exchange fails
        await checkForSession();
      } catch (exchangeError) {
        console.error('Error during code exchange:', exchangeError);
        await checkForSession();
      }
    };

    const processTokens = async (accessToken: string, refreshToken: string) => {
      try {
        // Set the session manually if we have the tokens
        const { error: setSessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (setSessionError) {
          console.error('Error setting session from tokens:', setSessionError);
          await checkForSession();
          return;
        }
        
        console.log('Session set from tokens');
        setStatus('success');
        setMessage('Login successful! Redirecting...');
        redirectToHome(1000);
      } catch (error) {
        console.error('Error processing tokens:', error);
        await checkForSession();
      }
    };

    const checkForSession = async () => {
      try {
        // Try to get the session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        } else if (data.session) {
          console.log('Session established via getSession');
          setStatus('success');
          setMessage('Login successful! Redirecting...');
          redirectToHome(1000);
          return;
        }
        
        // If we've tried too many times, give up
        if (attempts >= MAX_ATTEMPTS) {
          console.error('Failed to establish session after maximum attempts');
          setStatus('error');
          setMessage('Failed to establish session. Please try logging in again.');
          redirectToHome(3000);
          return;
        }
        
        // Wait and try again
        console.log(`No session found, retrying... (Attempt ${attempts + 1}/${MAX_ATTEMPTS})`);
        setMessage(`Verifying your login... (${attempts + 1}/${MAX_ATTEMPTS})`);
        setAttempts(prev => prev + 1);
        
        // Wait a bit longer between each retry
        setTimeout(checkForSession, 1500);
      } catch (error) {
        console.error('Error checking for session:', error);
        setStatus('error');
        setMessage('Authentication error. Please try again.');
        redirectToHome(3000);
      }
    };

    const redirectToHome = (delay: number) => {
      setTimeout(() => {
        window.location.href = '/';
      }, delay);
    };

    handleAuthCallback();
  }, [attempts]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-white dark:bg-gray-800 rounded-xl shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {status === 'error' ? 'Authentication Error' : 
             status === 'success' ? 'Authentication Successful' : 
             'Processing Authentication'}
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        </div>
        
        {status === 'processing' && (
          <div className="flex justify-center mt-5">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex justify-center mt-5">
            <svg className="w-12 h-12 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
        )}
        
        {status === 'error' && (
          <div className="flex justify-center mt-5">
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthCallback;
