// Simplified auth service for react-oidc-context integration
import cognitoConfig from '../config/cognito';

// Unified Authentication Service
// This service now only provides getAuthType since react-oidc-context handles the core OIDC flow
export const unifiedAuthService = {
  // Get authentication type
  getAuthType: () => {
    return cognitoConfig.useCognito && cognitoConfig.isConfigured() ? 'cognito' : 'local';
  }
};

export default unifiedAuthService;
