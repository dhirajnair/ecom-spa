import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import toast from 'react-hot-toast';

// Simple AWS-aligned AuthCallback component
const AuthCallback = () => {
  const navigate = useNavigate();
  const auth = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Set timeout for callback processing
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('⏰ Auth callback timeout reached');
      setTimeoutReached(true);
    }, 10000); // 10 second timeout

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    console.log('=== AUTH CALLBACK DEBUG ===');
    console.log('Auth state:', {
      isAuthenticated: auth.isAuthenticated,
      isLoading: auth.isLoading,
      error: auth.error,
      user: !!auth.user,
      activeNavigator: auth.activeNavigator,
      retryCount,
      timeoutReached
    });

    // Log URL params for debugging
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    console.log('URL params:', {
      code: authCode,
      state: urlParams.get('state'),
      error: urlParams.get('error')
    });

    // Success case
    if (auth.user && auth.isAuthenticated) {
      console.log('✅ User authenticated:', auth.user.profile);
      console.log('✅ User came from signup or login - both are handled the same way');
      
      // Store auth data following AWS pattern
      const authData = {
        user: {
          username: auth.user.profile?.name || auth.user.profile?.email || 'Cognito User',
          email: auth.user.profile?.email,
          sub: auth.user.profile?.sub
        },
        timestamp: Date.now(),
        accessToken: auth.user.access_token,
        idToken: auth.user.id_token,
        tokenType: 'Bearer'
      };
      
      localStorage.setItem('demo_auth', JSON.stringify(authData));
      
      if (auth.user.access_token) {
        localStorage.setItem('authToken', auth.user.access_token);
      }
      
      // Check if this is a new user (signup) vs returning user (login)
      const isNewUser = auth.user.profile?.email_verified === false || 
                        (auth.user.profile?.['custom:isNewUser'] === 'true');
                   
             toast.success(isNewUser ? 'Account created and signed in successfully!' : 'Successfully signed in!');
             navigate('/home', { replace: true });
      return;
    }

    // Error case
    if (auth.error) {
      console.error('❌ Auth error:', auth.error);
      toast.error('Authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    // Still loading - wait unless timeout reached
    if (auth.isLoading && !timeoutReached) {
      console.log('⏳ Still loading...');
      return;
    }

    // Simplified retry mechanism - only try once if needed
    if (authCode && !auth.isAuthenticated && !auth.isLoading && retryCount < 1 && !timeoutReached) {
      console.log(`🔄 Retry attempt ${retryCount + 1}/1 - triggering signin callback`);
      setRetryCount(prev => prev + 1);
      
      // Single retry strategy
      setTimeout(() => {
        try {
          console.log('🎯 Single retry: Direct signinCallback');
          if (auth.signinCallback) {
            auth.signinCallback();
          }
        } catch (error) {
          console.error('❌ Retry failed:', error);
        }
      }, 1000); // 1 second delay
      return;
    }

    // Final fallback - not loading, not authenticated, no error or timeout reached
    if ((!auth.isAuthenticated && !auth.isLoading && !auth.error) || timeoutReached) {
      console.warn('Auth callback completed but no user found or timeout reached');
      //toast.error('Authentication failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [auth, navigate, retryCount, timeoutReached]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
          {retryCount > 0 && (
            <span className="block mt-2 text-sm text-blue-600">
              Retry attempt {retryCount}/1
            </span>
          )}
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;