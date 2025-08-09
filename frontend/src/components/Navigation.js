import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Home, Package } from 'lucide-react';
import { useAuth } from 'react-oidc-context';
import { useCart } from '../contexts/CartContext';
import cognitoConfig from '../config/cognito';

const Navigation = () => {
  // Check authentication state from localStorage for local demo
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const { itemCount } = useCart();
  const location = useLocation();
  
  // Always call useAuth hook (Rules of Hooks requirement)
  const auth = useAuth();
  
  // Check if Cognito is configured and auth is available
  const isAuthAvailable = cognitoConfig.useCognito && cognitoConfig.isConfigured() && auth;

  // Check auth state on mount and location changes
  useEffect(() => {
    const checkAuthState = () => {
      // Check localStorage for both local and Cognito auth
      const localAuth = localStorage.getItem('demo_auth');
      if (localAuth) {
        try {
          const authData = JSON.parse(localAuth);
          setIsAuthenticated(true);
          setUser(authData.user || { username: 'Demo User' });
        } catch (e) {
          setIsAuthenticated(false);
          setUser(null);
        }
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    };

    checkAuthState();
    
    // Listen for auth changes (e.g., from login page or Cognito callback)
    const handleStorageChange = (e) => {
      if (e.key === 'demo_auth') {
        checkAuthState();
      }
    };
    
    // Also check on navigation changes in case auth state changed
    const handleFocus = () => {
      checkAuthState();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [location]);

  const handleLogout = async () => {
    console.log('🚪 Starting logout process...');
    console.log('🚪 Current location:', {
      href: window.location.href,
      pathname: window.location.pathname,
      origin: window.location.origin
    });
    
    // If no OIDC user and no token, just go home (avoid Cognito /login bounce)
    const hasOidcUser = !!auth?.user;
    const hasLocalToken = !!localStorage.getItem('authToken');
    if (!hasOidcUser && !hasLocalToken) {
      console.log('🚪 No active session detected; skipping Cognito and going home');
      localStorage.removeItem('demo_auth');
      localStorage.removeItem('ecom_cart');
      setIsAuthenticated(false);
      setUser(null);
      window.location.href = '/home';
      return;
    }

    // Clear all auth-related data first
    localStorage.removeItem('demo_auth');
    localStorage.removeItem('authToken');
    localStorage.removeItem('ecom_cart'); // Also clear cart on logout
    setIsAuthenticated(false);
    setUser(null);
    console.log('🚪 Current location:', {
      href: window.location.href,
      pathname: window.location.pathname,
      origin: window.location.origin
    });
    // For Cognito, use server-side /logout route (centralized)
    if (cognitoConfig.useCognito && cognitoConfig.isConfigured() && isAuthAvailable) {
      console.log('🚪 Using server-side /logout route (centralized)');
      
      // Clear OIDC user storage first (non-blocking)
      if (auth && auth.removeUser) {
        try {
          await auth.removeUser();
          console.log('🚪 OIDC user removed from storage');
        } catch (error) {
          console.warn('🚪 Failed to remove OIDC user:', error);
        }
      }
      
      // STAGE-AWARE: Build the correct /dev/logout URL
      const currentPath = window.location.pathname; // e.g., "/dev/home"
      const pathParts = currentPath.split('/').filter(Boolean); // ["dev", "home"]
      const stage = pathParts[0] || 'dev'; // Extract stage
      const stageLogoutUrl = `/${stage}/logout`; // "/dev/logout"
      
      console.log('🚪 Using stage-aware logout URL');
      console.log('🚪 Stage detected:', stage, 'Logout URL:', stageLogoutUrl);
      
      // Alert for debugging
      //alert(`🚪 STAGE-AWARE!!!! LOGOUT:\nCurrent: ${currentPath}\nStage: ${stage}\nLogout URL: ${stageLogoutUrl}`);
      
      // Use stage-aware logout URL
      window.location.href = stageLogoutUrl;
    } else {
      // Local logout - redirect to home
      console.log('🏠 Local logout - redirecting to home');
      window.location.href = '/home';
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-gray-800">
            <Package className="w-6 h-6 text-blue-600" />
            E-commerce
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
                               <Link
                     to="/home"
                     className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                       isActive('/home') || isActive('/') 
                         ? 'bg-blue-100 text-blue-700' 
                         : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                     }`}
                   >
                     <Home className="w-4 h-4" />
                     Home
                   </Link>

            {/* Cart Link - Always visible */}
            <Link
              to="/cart"
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors relative ${
                isActive('/cart') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              Cart
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <>
                {/* User Menu */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600">
                    <User className="w-4 h-4" />
                    <span>Hello, {user?.username}</span>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive('/login') 
                      ? 'bg-blue-100 text-blue-700' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-4 h-4" />
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;