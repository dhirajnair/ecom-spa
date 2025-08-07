import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hub } from 'aws-amplify/utils';
import { useAuth } from '../contexts/AuthContext';
import { unifiedAuthService } from '../services/cognitoAuth';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check if user is authenticated after OAuth callback
        const isAuth = await unifiedAuthService.isAuthenticated();
        
        if (isAuth) {
          const user = await unifiedAuthService.getCurrentUser();
          
          // Simulate login success for AuthContext
          await login(user.username, 'oauth-callback');
          
          toast.success('Successfully signed in with Cognito!');
          navigate('/', { replace: true });
        } else {
          throw new Error('Authentication failed');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast.error('Authentication failed. Please try again.');
        navigate('/login', { replace: true });
      }
    };

    // Listen for Amplify Auth events
    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      const { event } = payload;
      
      if (event === 'signInWithRedirect') {
        handleAuthCallback();
      } else if (event === 'signInWithRedirect_failure') {
        console.error('OAuth sign in failed:', payload);
        toast.error('Sign in failed. Please try again.');
        navigate('/login', { replace: true });
      }
    });

    // Handle initial callback
    handleAuthCallback();

    return () => unsubscribe();
  }, [navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="loading mb-4"></div>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Completing sign in...
        </h2>
        <p className="text-gray-600">
          Please wait while we complete your authentication.
        </p>
      </div>
    </div>
  );
};

export default AuthCallback;
