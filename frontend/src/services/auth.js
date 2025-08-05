import { api } from './api';

export const authService = {
  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('authToken');
    const user = localStorage.getItem('user');
    return !!(token && user);
  },

  // Get current user
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Get auth token
  getToken: () => {
    return localStorage.getItem('authToken');
  },

  // Login user
  login: async (username, password) => {
    try {
      const response = await api.auth.login({ username, password });
      
      // Store token and user info
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('user', JSON.stringify({
        id: response.user_id,
        username: response.username
      }));
      
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    api.auth.logout();
  },

  // Check if token is expired (basic check)
  isTokenExpired: () => {
    const token = localStorage.getItem('authToken');
    if (!token) return true;

    try {
      // Basic JWT payload extraction (without verification)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.error('Error checking token expiration:', error);
      return true;
    }
  }
};

export default authService;