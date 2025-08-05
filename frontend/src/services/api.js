import axios from 'axios';

// API base URLs
const API_BASE_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:3001/api';
const PRODUCT_SERVICE_URL = process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:8001/api';
const CART_SERVICE_URL = process.env.REACT_APP_CART_SERVICE_URL || 'http://localhost:8002/api';

// Create axios instances
const apiGateway = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

const productService = axios.create({
  baseURL: PRODUCT_SERVICE_URL,
  timeout: 10000,
});

const cartService = axios.create({
  baseURL: CART_SERVICE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
const addAuthToken = (config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

// Add interceptors
cartService.interceptors.request.use(addAuthToken);
apiGateway.interceptors.request.use(addAuthToken);

// Response interceptor for error handling
const handleResponse = (response) => response;
const handleError = (error) => {
  if (error.response?.status === 401) {
    // Handle unauthorized - redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
  return Promise.reject(error);
};

cartService.interceptors.response.use(handleResponse, handleError);
apiGateway.interceptors.response.use(handleResponse, handleError);

// API functions
export const api = {
  // Product API
  products: {
    getAll: async (params = {}) => {
      const response = await productService.get('/products', { params });
      return response.data;
    },
    
    getById: async (id) => {
      const response = await productService.get(`/products/${id}`);
      return response.data;
    },
    
    getCategories: async () => {
      const response = await productService.get('/categories');
      return response.data;
    },
    
    // Health check
    healthCheck: async () => {
      const response = await productService.get('/health');
      return response.data;
    }
  },

  // Auth API
  auth: {
    login: async (credentials) => {
      const response = await cartService.post('/auth/login', credentials);
      return response.data;
    },
    
    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Cart API
  cart: {
    get: async () => {
      const response = await cartService.get('/cart');
      return response.data;
    },
    
    add: async (productId, quantity = 1) => {
      const response = await cartService.post('/cart/add', {
        product_id: productId,
        quantity
      });
      return response.data;
    },
    
    remove: async (productId) => {
      const response = await cartService.delete(`/cart/remove/${productId}`);
      return response.data;
    },
    
    clear: async () => {
      const response = await cartService.delete('/cart/clear');
      return response.data;
    },
    
    // Health check
    healthCheck: async () => {
      const response = await cartService.get('/health');
      return response.data;
    }
  }
};

export default api;