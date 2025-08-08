import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, AuthProvider } from 'react-oidc-context';
import toast from 'react-hot-toast';
import cognitoConfig from '../config/cognito';

const AuthCallbackInner = () => {
  const navigate = useNavigate();
  const oidcAuth = useAuth();

  useEffect(() => {
    if (oidcAuth.isAuthenticated) {
      toast.success('Successfully signed in!');
      navigate('/', { replace: true });
    } else if (oidcAuth.error) {
      console.error('OIDC Auth callback error:', oidcAuth.error);
      toast.error('Authentication failed. Please try again.');
      navigate('/login', { replace: true });
    }
  }, [oidcAuth.isAuthenticated, oidcAuth.error, navigate]);

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

const AuthCallback = () => {
  // Get the basename for the OIDC config
  const basename = (() => {
    const apiUrl = window.__RUNTIME_CONFIG__?.REACT_APP_API_GATEWAY_URL || process.env.REACT_APP_API_GATEWAY_URL || '';
    try {
      if (apiUrl) {
        const u = new URL(apiUrl);
        let p = u.pathname || '/';
        if (p.endsWith('/')) p = p.slice(0, -1);
        return p;
      }
    } catch (_) {}
    return '';
  })();

  const oidcConfig = {
    authority: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`,
    client_id: cognitoConfig.userPoolWebClientId,
    redirect_uri: `${window.location.origin}${basename}/auth/callback`,
    response_type: "code",
    scope: "email openid profile",
    post_logout_redirect_uri: `${window.location.origin}${basename}/`,
    metadata: {
      end_session_endpoint: cognitoConfig.getLogoutUrl()
    }
  };

  return (
    <AuthProvider {...oidcConfig}>
      <AuthCallbackInner />
    </AuthProvider>
  );
};

export default AuthCallback;
