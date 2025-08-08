import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import ProductList from './components/ProductList';
import ProductDetail from './components/ProductDetail';
import Cart from './components/Cart';
import Login from './components/Login';
import AuthCallback from './components/AuthCallback';
import cognitoConfig from './config/cognito';

function App() {
  // Show product dashboard by default (no authentication required)

  return (
    <CartProvider>
        <div className="min-h-screen bg-gray-50">
          <Navigation />
          
          <main>
            <Routes>
              {/* Root: Show product dashboard (public) */}
                                   <Route path="/" element={<ProductList />} />
                     <Route path="/products/:productId" element={<ProductDetail />} />
                     <Route path="/login" element={<Login />} />
              
              {/* Auth callback - only if using Cognito */}
              {cognitoConfig.useCognito && cognitoConfig.isConfigured() && (
                <Route path="/auth/callback" element={<AuthCallback />} />
              )}
              
              {/* Protected Routes - only cart needs authentication */}
              <Route 
                path="/cart" 
                element={
                  <ProtectedRoute>
                    <Cart />
                  </ProtectedRoute>
                } 
              />
              
              {/* 404 Route */}
              <Route 
                path="*" 
                element={
                  <div className="container mx-auto px-4 py-8 text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
                    <p className="text-gray-600 mb-6">Page not found</p>
                    <a href="/" className="btn btn-primary">
                      Go Home
                    </a>
                  </div>
                } 
              />
            </Routes>
          </main>
          
          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 mt-16">
            <div className="container mx-auto px-4 py-8">
              <div className="text-center text-gray-600">
                <p>&copy; 2025 E-commerce SPA. Built with React and FastAPI microservices.</p>
                <p className="mt-2 text-sm">
                  Demo application showcasing modern web development practices.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </CartProvider>
  );
}

export default App;