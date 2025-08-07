// AWS Cognito Configuration
// This configuration supports both local development and production environments

const cognitoConfig = {
  // Environment flag
  useCognito: process.env.REACT_APP_USE_COGNITO_AUTH === 'true',
  
  // AWS Region
  region: process.env.REACT_APP_AWS_REGION || 'us-west-2',
  
  // Cognito User Pool configuration
  userPoolId: process.env.REACT_APP_USER_POOL_ID,
  userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID,
  identityPoolId: process.env.REACT_APP_IDENTITY_POOL_ID,
  
  // Optional: Cognito Domain for hosted UI
  domain: process.env.REACT_APP_USER_POOL_DOMAIN,
  
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
  
  // Get hosted UI URL for sign in
  getHostedUIUrl() {
    if (!this.domain) {
      return null;
    }
    
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const responseType = 'code';
    const scope = 'email+openid+profile';
    
    return `https://${this.domain}.auth.${this.region}.amazoncognito.com/login?` +
           `client_id=${this.userPoolWebClientId}&` +
           `response_type=${responseType}&` +
           `scope=${scope}&` +
           `redirect_uri=${redirectUri}`;
  },

  // Get hosted UI URL for sign up
  getSignUpUrl() {
    if (!this.domain) {
      return null;
    }
    
    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const responseType = 'code';
    const scope = 'email+openid+profile';
    
    return `https://${this.domain}.auth.${this.region}.amazoncognito.com/signup?` +
           `client_id=${this.userPoolWebClientId}&` +
           `response_type=${responseType}&` +
           `scope=${scope}&` +
           `redirect_uri=${redirectUri}`;
  },
  
  // Get logout URL
  getLogoutUrl() {
    if (!this.domain) {
      return null;
    }
    
    const logoutUri = encodeURIComponent(window.location.origin);
    
    return `https://${this.domain}.auth.${this.region}.amazoncognito.com/logout?` +
           `client_id=${this.userPoolWebClientId}&` +
           `logout_uri=${logoutUri}`;
  }
};

// Amplify configuration object (used when initializing AWS Amplify)
export const amplifyConfig = {
  Auth: {
    region: cognitoConfig.region,
    userPoolId: cognitoConfig.userPoolId,
    userPoolWebClientId: cognitoConfig.userPoolWebClientId,
    identityPoolId: cognitoConfig.identityPoolId,
    
    // Optional configurations
    authenticationFlowType: 'USER_SRP_AUTH',
    
    // OAuth configuration for hosted UI
    oauth: cognitoConfig.domain ? {
      domain: `${cognitoConfig.domain}.auth.${cognitoConfig.region}.amazoncognito.com`,
      scope: ['email', 'openid', 'profile'],
      redirectSignIn: window.location.origin + '/auth/callback',
      redirectSignOut: window.location.origin,
      responseType: 'code'
    } : undefined
  }
};

export default cognitoConfig;
