import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Home, Package } from 'lucide-react';
import { useCart } from '../contexts/CartContext';
import cognitoConfig from '../config/cognito';

const Navigation = () => {
  // Check authentication state from localStorage for local demo
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const { itemCount } = useCart();
  const location = useLocation();

  // Check auth state on mount and location changes
  useEffect(() => {
    const checkAuthState = () => {
      // For local development, check localStorage
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
    
    // Listen for auth changes (e.g., from login page)
    const handleStorageChange = (e) => {
      if (e.key === 'demo_auth') {
        checkAuthState();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [location]);

  const handleLogout = () => {
    // If using Cognito, redirect to logout URL
    if (cognitoConfig.useCognito && cognitoConfig.isConfigured()) {
      const logoutUrl = cognitoConfig.getLogoutUrl();
      if (logoutUrl) {
        window.location.href = logoutUrl;
      }
    } else {
      // Local logout - remove auth from localStorage
      localStorage.removeItem('demo_auth');
      localStorage.removeItem('ecom_cart'); // Also clear cart on logout
      setIsAuthenticated(false);
      setUser(null);
      // Refresh the page to reset app state
      window.location.href = '/';
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
              to="/"
              className={`flex items-center gap-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            {isAuthenticated ? (
              <>
                {/* Cart Link */}
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