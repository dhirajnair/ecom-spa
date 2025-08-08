import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from 'react-oidc-context';
import './index.css';
import App from './App';
import cognitoConfig from './config/cognito';

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Determine basename for BrowserRouter based on multiple sources
const getBasename = () => {
  // Method 1: Check runtime config if available
  const apiUrl = window.__RUNTIME_CONFIG__?.REACT_APP_API_GATEWAY_URL || process.env.REACT_APP_API_GATEWAY_URL || '';
  if (apiUrl) {
    try {
      const u = new URL(apiUrl);
      let p = u.pathname || '/';
      if (p.endsWith('/')) p = p.slice(0, -1);
      console.log('Basename from API URL:', p);
      return p;
    } catch (_) {}
  }
  
  // Method 2: Check <base> tag set by server
  const baseElement = document.querySelector('base');
  if (baseElement && baseElement.href) {
    try {
      const baseUrl = new URL(baseElement.href);
      let p = baseUrl.pathname || '/';
      if (p.endsWith('/')) p = p.slice(0, -1);
      console.log('Basename from <base> tag:', p);
      return p;
    } catch (_) {}
  }
  
  // Method 3: Infer from current URL path
  const currentPath = window.location.pathname;
  if (currentPath && currentPath !== '/') {
    // If we're at /dev/something, basename is /dev
    const segments = currentPath.split('/').filter(Boolean);
    if (segments.length > 0) {
      const inferredBasename = '/' + segments[0];
      console.log('Basename inferred from URL:', inferredBasename);
      // Only use this if it looks like a stage name
      if (/^\/[a-zA-Z0-9_-]+$/.test(inferredBasename)) {
        return inferredBasename;
      }
    }
  }
  
  console.log('Basename defaulting to empty');
  return ''; // No base path for local or root deployment
};

const basename = getBasename();
console.log('Final basename for BrowserRouter:', basename);
console.log('Current location:', window.location.href);

// OIDC Configuration following AWS pattern
const getOidcConfig = () => {
  // Only configure OIDC if Cognito is enabled and configured
  if (!cognitoConfig.useCognito || !cognitoConfig.isConfigured()) {
    return null;
  }

  return {
    authority: `https://cognito-idp.${cognitoConfig.region}.amazonaws.com/${cognitoConfig.userPoolId}`,
    client_id: cognitoConfig.userPoolWebClientId,
    redirect_uri: `${window.location.origin}${basename}/auth/callback`,
    response_type: "code",
    scope: "email openid profile",
    post_logout_redirect_uri: `${window.location.origin}${basename}/`,
    automaticSilentRenew: false,
    loadUserInfo: false,
             // Enhanced debugging and state cleanup
         onSigninCallback: (user) => {
           console.log('🎯 ROOT OIDC signin callback triggered with user:', user);
           console.log('🎯 ROOT callback user profile:', user?.profile);
           console.log('🎯 ROOT callback tokens:', {
             access_token: !!user?.access_token,
             id_token: !!user?.id_token,
             refresh_token: !!user?.refresh_token
           });
           
           // Clear the URL of auth params for cleaner navigation
           const url = new URL(window.location);
           url.searchParams.delete('code');
           url.searchParams.delete('state');
           window.history.replaceState({}, document.title, url.pathname);
         },
    onSigninError: (error) => {
      console.error('❌ ROOT OIDC signin error:', error);
      console.error('❌ ROOT error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    },
    onUserLoaded: (user) => {
      console.log('✅ ROOT OIDC user loaded:', user);
      console.log('✅ ROOT user profile loaded:', user?.profile);
    },
    onUserUnloaded: () => {
      console.log('ℹ️ ROOT OIDC user unloaded');
    },
    onAccessTokenExpiring: () => {
      console.log('⚠️ ROOT OIDC access token expiring');
    },
    onAccessTokenExpired: () => {
      console.log('❌ ROOT OIDC access token expired');
    },
    onSilentRenewError: (error) => {
      console.error('❌ ROOT OIDC silent renew error:', error);
    }
  };
};

const oidcConfig = getOidcConfig();
console.log('Root OIDC Config:', oidcConfig);

const root = ReactDOM.createRoot(document.getElementById('root'));

// Conditionally wrap with AuthProvider for Cognito, but keep app public
const AppWithProviders = () => (
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter basename={basename}>
        {/* Only wrap with AuthProvider if Cognito is configured, otherwise run without auth */}
        {oidcConfig ? (
          <AuthProvider {...oidcConfig}>
            <App />
          </AuthProvider>
        ) : (
          <App />
        )}
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);

root.render(<AppWithProviders />);