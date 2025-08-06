import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { unifiedAuthService } from '../services/cognitoAuth';

// Auth state
const initialState = {
  isAuthenticated: false,
  user: null,
  loading: true,
  error: null
};

// Auth actions
const authActions = {
  SET_LOADING: 'SET_LOADING',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_ERROR: 'LOGIN_ERROR',
  LOGOUT: 'LOGOUT',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case authActions.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: null
      };
    
    case authActions.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        loading: false,
        error: null
      };
    
    case authActions.LOGIN_ERROR:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: action.payload
      };
    
    case authActions.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        loading: false,
        error: null
      };
    
    case authActions.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };
    
    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const isAuth = await unifiedAuthService.isAuthenticated();
        const isExpired = await unifiedAuthService.isTokenExpired();
        
        if (isAuth && !isExpired) {
          const user = await unifiedAuthService.getCurrentUser();
          dispatch({
            type: authActions.LOGIN_SUCCESS,
            payload: { user }
          });
        } else {
          // Token expired or doesn't exist
          await unifiedAuthService.logout();
          dispatch({ type: authActions.LOGOUT });
        }
      } catch (error) {
        console.error('Auth check error:', error);
        await unifiedAuthService.logout();
        dispatch({ type: authActions.LOGOUT });
      } finally {
        dispatch({ type: authActions.SET_LOADING, payload: false });
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (username, password) => {
    dispatch({ type: authActions.SET_LOADING, payload: true });
    
    try {
      const response = await unifiedAuthService.login(username, password);
      const user = {
        id: response.user_id,
        username: response.username
      };
      
      dispatch({
        type: authActions.LOGIN_SUCCESS,
        payload: { user }
      });
      
      return response;
    } catch (error) {
      const errorMessage = error.response?.data?.detail || error.message || 'Login failed';
      dispatch({
        type: authActions.LOGIN_ERROR,
        payload: errorMessage
      });
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    await unifiedAuthService.logout();
    dispatch({ type: authActions.LOGOUT });
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: authActions.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    logout,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;