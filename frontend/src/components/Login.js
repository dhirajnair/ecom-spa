import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { unifiedAuthService } from '../services/cognitoAuth';
import cognitoConfig from '../config/cognito';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Always call useAuth hook (Rules of Hooks requirement)
  const auth = useAuth();
  
  // Check if Cognito is configured and auth is available
  const isAuthAvailable = cognitoConfig.useCognito && cognitoConfig.isConfigured() && auth;

  const from = location.state?.from?.pathname || '/';
  const authType = unifiedAuthService.getAuthType();
  const isUsingCognito = authType === 'cognito';

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  // Auto-trigger Cognito flow ONLY when Cognito is configured and available
  useEffect(() => {
    if (isUsingCognito && isAuthAvailable) {
      console.log('🔄 Auto-triggering Cognito flow for login...');
      // Small delay to ensure component is mounted
      const timer = setTimeout(() => {
        handleCognitoLogin();
      }, 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isUsingCognito, isAuthAvailable]);

  const onSubmit = async (data) => {
    if (!isUsingCognito) {
      // Handle local demo login only (no signup for local)
      try {
        const authData = {
          user: { username: data.username || 'Demo User' },
          timestamp: Date.now()
        };
        localStorage.setItem('demo_auth', JSON.stringify(authData));
        
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } catch (error) {
        console.error('Login failed:', error);
        toast.error('Login failed. Please try again.');
      }
    } else {
      // For Cognito, use OIDC signinRedirect (AWS pattern)
      await handleCognitoLogin();
    }
  };

  const handleCognitoLogin = async () => {
    console.log('🎯 Starting Cognito login...');
    console.log('Auth object available:', !!auth);
    console.log('Auth signinRedirect available:', !!auth?.signinRedirect);
    console.log('isAuthAvailable:', isAuthAvailable);
    
    if (isAuthAvailable && auth.signinRedirect) {
      console.log('🎯 Using OIDC signinRedirect (AWS pattern)');
      try {
        await auth.signinRedirect();
      } catch (error) {
        console.error('❌ OIDC signin redirect failed:', error);
        toast.error('Login failed. Please try again.');
      }
    } else {
      console.log('⚠️ OIDC not available, using fallback');
      const hostedUIUrl = cognitoConfig.getHostedUIUrl();
      if (hostedUIUrl) {
        window.location.href = hostedUIUrl;
      } else {
        toast.error('Authentication service not available');
      }
    }
  };

  if (auth?.isLoading || (isUsingCognito && isAuthAvailable)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">
            {isUsingCognito && isAuthAvailable
              ? 'Redirecting to sign in...'
              : 'Checking authentication...'
            }
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to continue
          </p>
        </div>

        {/* Auth type indicator */}
        <div className="text-center">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            {isUsingCognito ? 'Cognito Authentication' : 'Local Demo Mode'}
          </span>
        </div>

        {/* Sign in form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="username" className="sr-only">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', { 
                    required: !isUsingCognito ? 'Username is required' : false 
                  })}
                  type="text"
                  placeholder={isUsingCognito ? 'Not required for Cognito' : 'Username'}
                  disabled={isUsingCognito}
                  className={`input pl-10 ${isUsingCognito ? 'bg-gray-100' : ''}`}
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', { 
                    required: !isUsingCognito ? 'Password is required' : false 
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isUsingCognito ? 'Not required for Cognito' : 'Password'}
                  disabled={isUsingCognito}
                  className={`input pl-10 pr-10 ${isUsingCognito ? 'bg-gray-100' : ''}`}
                />
                {!isUsingCognito && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                    )}
                  </button>
                )}
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <div>
            {isUsingCognito ? (
              <button
                type="button"
                onClick={handleCognitoLogin}
                disabled={isSubmitting}
                className="btn btn-primary w-full flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Sign in with Cognito
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn btn-primary w-full"
              >
                {isSubmitting ? 'Signing in...' : 'Sign in'}
              </button>
            )}
          </div>

          {/* Additional options */}
          <div className="text-center space-y-2">
            {isUsingCognito && cognitoConfig.getSignUpUrl() && (
              <div>
                <a
                  href={cognitoConfig.getSignUpUrl()}
                  className="text-sm text-blue-600 hover:text-blue-500 flex items-center justify-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Create new account
                </a>
              </div>
            )}
            
            <div className="border-t border-gray-200 pt-4">
              <Link
                to="/home"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                ← Back to Products
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;