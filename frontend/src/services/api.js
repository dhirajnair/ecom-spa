import axios from 'axios';

// Read runtime config first (injected at runtime), fall back to build-time env
const rc = (typeof window !== 'undefined' && window.__RUNTIME_CONFIG__) || {};

// API base URLs
// For API Gateway deployments, use the stage root (e.g. https://.../dev)
const API_GATEWAY_URL = rc.REACT_APP_API_GATEWAY_URL || process.env.REACT_APP_API_GATEWAY_URL || '';
const USE_API_GATEWAY = API_GATEWAY_URL !== '';

// When using API Gateway, set baseURL to the stage root and include '/api/...'
// When running locally, baseURL points to each service directly at ':8001' / ':8002'
const PRODUCT_SERVICE_URL = USE_API_GATEWAY
  ? API_GATEWAY_URL
  : (process.env.REACT_APP_PRODUCT_SERVICE_URL || 'http://localhost:8001/api');

const CART_SERVICE_URL = USE_API_GATEWAY
  ? API_GATEWAY_URL
  : (process.env.REACT_APP_CART_SERVICE_URL || 'http://localhost:8002/api');

const AUTH_SERVICE_URL = USE_API_GATEWAY
  ? API_GATEWAY_URL
  : (process.env.REACT_APP_AUTH_SERVICE_URL || 'http://localhost:8002/api');

// Create axios instances
const productService = axios.create({
  baseURL: USE_API_GATEWAY ? `${PRODUCT_SERVICE_URL}/api` : PRODUCT_SERVICE_URL,
  timeout: 10000,
});

const cartService = axios.create({
  baseURL: USE_API_GATEWAY ? `${CART_SERVICE_URL}/api` : CART_SERVICE_URL,
  timeout: 10000,
});

const authService = axios.create({
  baseURL: USE_API_GATEWAY ? `${AUTH_SERVICE_URL}/api` : AUTH_SERVICE_URL,
  timeout: 10000,
});

// Logging for debugging
if ((rc.REACT_APP_DEBUG || process.env.REACT_APP_DEBUG) === 'true') {
  console.log('API Configuration:', {
    USE_API_GATEWAY,
    API_GATEWAY_URL,
    PRODUCT_SERVICE_URL,
    CART_SERVICE_URL,
    AUTH_SERVICE_URL
  });
}

// Request interceptor to add auth token
const addAuthToken = async (config) => {
  try {
    // Import dynamically to avoid circular dependencies
    const { unifiedAuthService } = await import('./cognitoAuth');
    const token = await unifiedAuthService.getToken();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    // Fallback to localStorage for backward compatibility
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
};

// Add interceptors
cartService.interceptors.request.use(addAuthToken);
authService.interceptors.request.use(addAuthToken);

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
authService.interceptors.response.use(handleResponse, handleError);

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
      const response = await authService.post('/auth/login', credentials);
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