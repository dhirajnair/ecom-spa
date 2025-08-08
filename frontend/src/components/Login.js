import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { User, Lock, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { unifiedAuthService } from '../services/cognitoAuth';
import cognitoConfig from '../config/cognito';
import toast from 'react-hot-toast';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  // No global auth state - login works without it
  const isAuthenticated = false;
  const loading = false;
  const error = null;
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';
  const authType = unifiedAuthService.getAuthType();
  const isUsingCognito = authType === 'cognito';
  const hostedUIUrl = cognitoConfig.getHostedUIUrl();
  const signUpUrl = cognitoConfig.getSignUpUrl();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm();

  const onSubmit = async (data) => {
    if (!isUsingCognito) {
      // Handle local demo login
      try {
        // Set auth state in localStorage for local demo
        const authData = {
          user: { username: data.username || 'Demo User' },
          timestamp: Date.now()
        };
        localStorage.setItem('demo_auth', JSON.stringify(authData));
        
        toast.success('Login successful!');
        navigate(from, { replace: true });
      } catch (error) {
        console.error('Login failed:', error);
      }
    } else {
      // For Cognito, redirect to hosted UI
      if (hostedUIUrl) {
        window.location.href = hostedUIUrl;
      } else {
        toast.error('Cognito configuration not found');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="loading mb-4"></div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-gray-600">
            {isUsingCognito ? 
              'Sign in with AWS Cognito or use local demo credentials.' : 
              'Welcome back! Please enter your demo credentials.'
            }
          </p>
        </div>

        {/* Cognito Hosted UI Option */}
        {isUsingCognito && hostedUIUrl && (
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Sign up or sign in with</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <a
                  href={hostedUIUrl || '#'}
                  onClick={(e) => {
                    if (!hostedUIUrl) {
                      e.preventDefault();
                      unifiedAuthService.oauthRedirectSignIn();
                    }
                  }}
                className="w-full flex justify-center items-center px-4 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Sign In
              </a>
              
              {signUpUrl && (
                <a
                  href={signUpUrl}
                  className="w-full flex justify-center items-center px-4 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Sign Up
                </a>
              )}
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with demo credentials</span>
              </div>
            </div>
          </div>
        )}

        {/* Demo Credentials */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">
            {isUsingCognito ? 'Local Demo Credentials:' : 'Demo Credentials:'}
          </h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Admin:</strong> username: admin, password: admin123</p>
            <p><strong>User:</strong> username: user, password: user123</p>
            {isUsingCognito && (
              <p className="text-xs mt-2 text-blue-600">
                Note: Demo credentials work in development mode only.
              </p>
            )}
          </div>
        </div>

        {/* Login Form */}
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="space-y-4">
            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('username', { 
                    required: 'Username is required',
                    minLength: {
                      value: 2,
                      message: 'Username must be at least 2 characters'
                    }
                  })}
                  type="text"
                  autoComplete="username"
                  className={`input pl-10 ${errors.username ? 'border-red-300' : ''}`}
                  placeholder="Enter your username"
                />
              </div>
              {errors.username && (
                <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: {
                      value: 3,
                      message: 'Password must be at least 3 characters'
                    }
                  })}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`input pl-10 pr-10 ${errors.password ? 'border-red-300' : ''}`}
                  placeholder="Enter your password"
                />
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
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary w-full flex items-center justify-center"
          >
            {isSubmitting ? (
              <>
                <div className="loading mr-2"></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Back to Home */}
          <div className="text-center">
            <a href="/" className="text-blue-600 hover:text-blue-500 text-sm">
              ← Back to Products
            </a>
          </div>
        </form>

        {/* Additional Info */}
        <div className="text-center text-sm text-gray-600">
          <p>
            This is a demo application. In a real application, you would have proper 
            user registration and password reset functionality.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;