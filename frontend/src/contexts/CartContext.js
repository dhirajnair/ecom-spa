import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { api } from '../services/api';

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
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  UPDATE_ITEM: 'UPDATE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  SET_ERROR: 'SET_ERROR',
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
        ...action.payload,
        loading: false,
        error: null
      };

    case cartActions.ADD_ITEM: {
      const existingItem = state.items.find(item => item.product_id === action.payload.product_id);
      let newItems;
      
      if (existingItem) {
        newItems = state.items.map(item =>
          item.product_id === action.payload.product_id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newItems = [...state.items, action.payload];
      }
      
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        loading: false,
        error: null
      };
    }

    case cartActions.REMOVE_ITEM: {
      const newItems = state.items.filter(item => item.product_id !== action.payload);
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        loading: false,
        error: null
      };
    }

    case cartActions.UPDATE_ITEM: {
      const newItems = state.items.map(item =>
        item.product_id === action.payload.product_id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const newTotal = newItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      
      return {
        ...state,
        items: newItems,
        total: newTotal,
        loading: false,
        error: null
      };
    }

    case cartActions.CLEAR_CART:
      return {
        ...initialState
      };

    case cartActions.SET_ERROR:
      return {
        ...state,
        loading: false,
        error: action.payload
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

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (state.items.length > 0 || state.total > 0) {
      localStorage.setItem('ecom_cart', JSON.stringify({
        items: state.items,
        total: state.total
      }));
    }
  }, [state.items, state.total]);

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ecom_cart');
      if (savedCart) {
        const cartData = JSON.parse(savedCart);
        dispatch({
          type: cartActions.SET_CART,
          payload: cartData
        });
      }
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
    }
  }, []);

  // Add item to cart with real product data
  const addToCart = useCallback(async (productId, quantity = 1) => {
    dispatch({ type: cartActions.SET_LOADING, payload: true });
    
    try {
      // Fetch actual product details from the API
      const product = await api.products.getById(productId);
      
      const cartItem = {
        product_id: productId,
        name: product.name,
        description: product.description,
        price: product.price,
        image_url: product.image_url,
        category: product.category,
        stock: product.stock,
        quantity: quantity
      };
      
      dispatch({ 
        type: cartActions.ADD_ITEM, 
        payload: cartItem
      });
      
      toast.success(`Added ${product.name} to cart`);
    } catch (error) {
      console.error('Error adding to cart:', error);
      dispatch({
        type: cartActions.SET_ERROR,
        payload: 'Failed to add item to cart'
      });
      toast.error('Failed to add item to cart');
    }
  }, []);

  // Remove item from cart
  const removeFromCart = useCallback((productId) => {
    dispatch({ type: cartActions.REMOVE_ITEM, payload: productId });
    toast.success('Removed item from cart');
  }, []);

  // Update item quantity
  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      dispatch({
        type: cartActions.UPDATE_ITEM,
        payload: { product_id: productId, quantity }
      });
    }
  }, [removeFromCart]);

  // Clear cart
  const clearCart = useCallback(() => {
    dispatch({ type: cartActions.CLEAR_CART });
    localStorage.removeItem('ecom_cart');
    toast.success('Cart cleared');
  }, []);

  // Get item quantity
  const getItemQuantity = useCallback((productId) => {
    const item = state.items.find(item => item.product_id === productId);
    return item ? item.quantity : 0;
  }, [state.items]);

  // Check if item is in cart
  const isInCart = useCallback((productId) => {
    return state.items.some(item => item.product_id === productId);
  }, [state.items]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: cartActions.CLEAR_ERROR });
  }, []);

  const value = {
    // State
    ...state,
    
    // Actions
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getItemQuantity,
    isInCart,
    clearError,
    
    // Helper getters
    itemCount: state.items.reduce((count, item) => count + item.quantity, 0),
    hasItems: state.items.length > 0
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

export default CartProvider;