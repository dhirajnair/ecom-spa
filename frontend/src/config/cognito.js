// AWS Cognito Configuration
// This configuration supports both local development and production environments

const rc = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};

const cognitoConfig = {
  // Environment flag
  useCognito: (rc.REACT_APP_USE_COGNITO_AUTH ?? process.env.REACT_APP_USE_COGNITO_AUTH) === 'true',
  
  // AWS Region
  region: rc.REACT_APP_AWS_REGION || process.env.REACT_APP_AWS_REGION || 'ap-south-1',
  
  // Cognito User Pool configuration
  userPoolId: rc.REACT_APP_USER_POOL_ID || process.env.REACT_APP_USER_POOL_ID,
  userPoolWebClientId: rc.REACT_APP_USER_POOL_WEB_CLIENT_ID || process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
  identityPoolId: rc.REACT_APP_IDENTITY_POOL_ID || process.env.REACT_APP_IDENTITY_POOL_ID,
  
  // Optional: Cognito Domain for hosted UI
  domain: rc.REACT_APP_USER_POOL_DOMAIN || process.env.REACT_APP_USER_POOL_DOMAIN,
  
  // Validation
  isConfigured() {
    if (!this.useCognito) {
      return false; // Local development mode
    }
    
    return !!(
      this.userPoolId &&
      this.userPoolWebClientId &&
      this.region
    );
  },
  
  // Get hosted UI URL for sign in (stage-aware)
  getHostedUIUrl() {
    if (!this.domain) {
      return null;
    }
    // Use absolute API Gateway URL with stage prefix when provided by server runtime config
    const base = rc.REACT_APP_API_GATEWAY_URL || window.location.origin;
    const redirectUri = encodeURIComponent(base.replace(/\/$/, '') + '/auth/callback');
    const responseType = 'code';
    const scope = 'email+openid+profile';
    
    return `https://${this.domain}.auth.${this.region}.amazoncognito.com/login?` +
           `client_id=${this.userPoolWebClientId}&` +
           `response_type=${responseType}&` +
           `scope=${scope}&` +
           `redirect_uri=${redirectUri}`;
  },

  // Get hosted UI URL for sign up (stage-aware)
  getSignUpUrl() {
    if (!this.domain) {
      return null;
    }
    const base = rc.REACT_APP_API_GATEWAY_URL || window.location.origin;
    const redirectUri = encodeURIComponent(base.replace(/\/$/, '') + '/auth/callback');
    const responseType = 'code';
    const scope = 'email+openid+profile';
    
    return `https://${this.domain}.auth.${this.region}.amazoncognito.com/signup?` +
           `client_id=${this.userPoolWebClientId}&` +
           `response_type=${responseType}&` +
           `scope=${scope}&` +
           `redirect_uri=${redirectUri}`;
  },
  
  // Get logout URL (stage-aware)
  getLogoutUrl() {
    // Centralize logout at the server route
    return '/logout';
  }
};



export default cognitoConfig;
