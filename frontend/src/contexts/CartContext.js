import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

// Cart state
const initialState = {
  items: [],
  total: 0,
  loading: false,
  error: null
};

// Cart actions
const cartActions = {
  SET_LOADING: 'SET_LOADING',
  SET_CART: 'SET_CART',
  SET_ERROR: 'SET_ERROR',
  CLEAR_CART: 'CLEAR_CART',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case cartActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    
    case cartActions.SET_CART:
      return {
        ...state,
        items: action.payload.items || [],
        total: action.payload.total || 0,
        loading: false,
        error: null
      };
    
    case cartActions.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
      };
    
    case cartActions.CLEAR_CART:
      return {
        ...state,
        items: [],
        total: 0,
        loading: false,
        error: null
      };
    
    case cartActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const CartContext = createContext();

// Cart provider component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { isAuthenticated } = useAuth();

  // Load cart when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadCart();
    } else {
      dispatch({ type: cartActions.CLEAR_CART });
    }
  }, [isAuthenticated]);

  // Load cart from API
  const loadCart = async () => {
    if (!isAuthenticated) return;

    dispatch({ type: cartActions.SET_LOADING, payload: true });
    
    try {
      const cartData = await api.cart.get();
      dispatch({
        type: cartActions.SET_CART,
        payload: cartData
      });
    } catch (error) {
      console.error('Error loading cart:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to load cart';
      dispatch({
        type: cartActions.SET_ERROR,
        payload: errorMessage
      });
    }
  };

  // Add item to cart
  const addToCart = async (productId, quantity = 1) => {
    if (!isAuthenticated) {
      toast.error('Please login to add items to cart');
      return;
    }

    dispatch({ type: cartActions.SET_LOADING, payload: true });
    
    try {
      await api.cart.add(productId, quantity);
      await loadCart(); // Reload cart to get updated data
      toast.success('Product added to cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to add product to cart';
      dispatch({
        type: cartActions.SET_ERROR,
        payload: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  // Remove item from cart
  const removeFromCart = async (productId) => {
    if (!isAuthenticated) return;

    dispatch({ type: cartActions.SET_LOADING, payload: true });
    
    try {
      await api.cart.remove(productId);
      await loadCart(); // Reload cart to get updated data
      toast.success('Product removed from cart');
    } catch (error) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to remove product from cart';
      dispatch({
        type: cartActions.SET_ERROR,
        payload: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  // Clear cart
  const clearCart = async () => {
    if (!isAuthenticated) return;

    dispatch({ type: cartActions.SET_LOADING, payload: true });
    
    try {
      await api.cart.clear();
      dispatch({ type: cartActions.CLEAR_CART });
      toast.success('Cart cleared');
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to clear cart';
      dispatch({
        type: cartActions.SET_ERROR,
        payload: errorMessage
      });
      toast.error(errorMessage);
    }
  };

  // Clear error
  const clearError = () => {
    dispatch({ type: cartActions.CLEAR_ERROR });
  };

  // Get cart item count
  const getItemCount = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0);
  };

  // Check if product is in cart
  const isInCart = (productId) => {
    return state.items.some(item => item.product_id === productId);
  };

  // Get item quantity in cart
  const getItemQuantity = (productId) => {
    const item = state.items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  };

  const value = {
    ...state,
    addToCart,
    removeFromCart,
    clearCart,
    clearError,
    loadCart,
    getItemCount,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;