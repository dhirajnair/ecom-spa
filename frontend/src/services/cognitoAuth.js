// AWS Cognito Authentication Service
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser, fetchAuthSession, signUp, confirmSignUp, resendSignUpCode, resetPassword, confirmResetPassword } from 'aws-amplify/auth';
import cognitoConfig, { amplifyConfig } from '../config/cognito';
import { authService } from './auth';

// Initialize Amplify only if Cognito is configured
if (cognitoConfig.isConfigured()) {
  try {
    Amplify.configure(amplifyConfig);
    console.log('✅ AWS Amplify configured for Cognito authentication');
  } catch (error) {
    console.error('❌ Failed to configure AWS Amplify:', error);
  }
}

// Cognito Authentication Service
export const cognitoAuthService = {
  // Check if Cognito is being used
  isUsingCognito: () => cognitoConfig.useCognito && cognitoConfig.isConfigured(),

  // Sign in with email and password
  signIn: async (email, password) => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      const { isSignedIn, nextStep } = await signIn({
        username: email,
        password: password
      });

      if (isSignedIn) {
        const user = await cognitoAuthService.getCurrentUser();
        return {
          success: true,
          user: user,
          nextStep: nextStep
        };
      } else {
        return {
          success: false,
          nextStep: nextStep,
          message: 'Additional steps required'
        };
      }
    } catch (error) {
      console.error('Cognito sign in error:', error);
      throw new Error(error.message || 'Sign in failed');
    }
  },

  // Sign up new user
  signUp: async (email, password, attributes = {}) => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      const { isSignUpComplete, userId, nextStep } = await signUp({
        username: email,
        password: password,
        options: {
          userAttributes: {
            email: email,
            ...attributes
          }
        }
      });

      return {
        success: true,
        isSignUpComplete: isSignUpComplete,
        userId: userId,
        nextStep: nextStep
      };
    } catch (error) {
      console.error('Cognito sign up error:', error);
      throw new Error(error.message || 'Sign up failed');
    }
  },

  // Confirm sign up with verification code
  confirmSignUp: async (email, confirmationCode) => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      const { isSignUpComplete, nextStep } = await confirmSignUp({
        username: email,
        confirmationCode: confirmationCode
      });

      return {
        success: true,
        isSignUpComplete: isSignUpComplete,
        nextStep: nextStep
      };
    } catch (error) {
      console.error('Cognito confirm sign up error:', error);
      throw new Error(error.message || 'Confirmation failed');
    }
  },

  // Resend confirmation code
  resendConfirmationCode: async (email) => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      await resendSignUpCode({ username: email });
      return { success: true };
    } catch (error) {
      console.error('Cognito resend code error:', error);
      throw new Error(error.message || 'Failed to resend confirmation code');
    }
  },

  // Reset password
  resetPassword: async (email) => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      const { nextStep } = await resetPassword({ username: email });
      return {
        success: true,
        nextStep: nextStep
      };
    } catch (error) {
      console.error('Cognito reset password error:', error);
      throw new Error(error.message || 'Failed to reset password');
    }
  },

  // Confirm password reset
  confirmResetPassword: async (email, confirmationCode, newPassword) => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: confirmationCode,
        newPassword: newPassword
      });
      return { success: true };
    } catch (error) {
      console.error('Cognito confirm reset password error:', error);
      throw new Error(error.message || 'Failed to confirm password reset');
    }
  },

  // Sign out
  signOut: async () => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      await signOut();
      return { success: true };
    } catch (error) {
      console.error('Cognito sign out error:', error);
      throw new Error(error.message || 'Sign out failed');
    }
  },

  // Get current authenticated user
  getCurrentUser: async () => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      const user = await getCurrentUser();
      return {
        id: user.userId,
        username: user.username,
        email: user.signInDetails?.loginId || user.username,
        attributes: user.attributes || {}
      };
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  },

  // Get authentication tokens
  getTokens: async () => {
    if (!cognitoAuthService.isUsingCognito()) {
      throw new Error('Cognito authentication is not configured');
    }

    try {
      const session = await fetchAuthSession();
      return {
        accessToken: session.tokens?.accessToken?.toString(),
        idToken: session.tokens?.idToken?.toString(),
        refreshToken: session.tokens?.refreshToken?.toString()
      };
    } catch (error) {
      console.error('Error getting tokens:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: async () => {
    if (!cognitoAuthService.isUsingCognito()) {
      return false;
    }

    try {
      await getCurrentUser();
      return true;
    } catch (error) {
      return false;
    }
  },

  // Get hosted UI URLs
  getHostedUIUrl: () => cognitoConfig.getHostedUIUrl(),
  getLogoutUrl: () => cognitoConfig.getLogoutUrl()
};

// Unified Authentication Service
// This service provides a unified interface that works with both Cognito and local development
export const unifiedAuthService = {
  // Check if user is authenticated
  isAuthenticated: async () => {
    if (cognitoAuthService.isUsingCognito()) {
      return await cognitoAuthService.isAuthenticated();
    } else {
      return authService.isAuthenticated();
    }
  },

  // Get current user
  getCurrentUser: async () => {
    if (cognitoAuthService.isUsingCognito()) {
      return await cognitoAuthService.getCurrentUser();
    } else {
      return authService.getCurrentUser();
    }
  },

  // Get authentication token
  getToken: async () => {
    if (cognitoAuthService.isUsingCognito()) {
      const tokens = await cognitoAuthService.getTokens();
      return tokens?.accessToken;
    } else {
      return authService.getToken();
    }
  },

  // Login user
  login: async (username, password) => {
    if (cognitoAuthService.isUsingCognito()) {
      const result = await cognitoAuthService.signIn(username, password);
      if (result.success) {
        return {
          access_token: (await cognitoAuthService.getTokens())?.accessToken,
          user_id: result.user.id,
          username: result.user.username
        };
      } else {
        throw new Error('Cognito authentication failed');
      }
    } else {
      return await authService.login(username, password);
    }
  },

  // Logout user
  logout: async () => {
    if (cognitoAuthService.isUsingCognito()) {
      await cognitoAuthService.signOut();
    } else {
      authService.logout();
    }
  },

  // Check if token is expired
  isTokenExpired: async () => {
    if (cognitoAuthService.isUsingCognito()) {
      try {
        const tokens = await cognitoAuthService.getTokens();
        if (!tokens?.accessToken) return true;
        
        // Parse JWT token to check expiration
        const payload = JSON.parse(atob(tokens.accessToken.split('.')[1]));
        const currentTime = Math.floor(Date.now() / 1000);
        return payload.exp < currentTime;
      } catch (error) {
        return true;
      }
    } else {
      return authService.isTokenExpired();
    }
  },

  // Get authentication type
  getAuthType: () => {
    return cognitoAuthService.isUsingCognito() ? 'cognito' : 'local';
  }
};

export default unifiedAuthService;
