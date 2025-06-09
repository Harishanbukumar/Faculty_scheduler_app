import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Add a request interceptor to attach the JWT token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Don't redirect if we're already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // Format the error message in a consistent way
    const errorMessage = error.response?.data?.error || 
                         error.response?.statusText || 
                         error.message || 
                         'Unknown error occurred';
    
    // Create a standardized error object
    const formattedError = {
      error: errorMessage,
      status: error.response?.status || 500,
      timestamp: new Date().toISOString()
    };
    
    // Log the error for debugging (could be replaced with a logging service)
    console.error('API Error:', formattedError);
    
    // Return the error for handling in the components
    return Promise.reject(formattedError);
  }
);

// Generic API methods
const apiService = {
  get: async (url, params = {}) => {
    try {
      const response = await api.get(url, { params });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  post: async (url, data = {}) => {
    try {
      const response = await api.post(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  put: async (url, data = {}) => {
    try {
      const response = await api.put(url, data);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  delete: async (url) => {
    try {
      const response = await api.delete(url);
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Helper method to handle API pagination
  getPaginated: async (url, page = 1, limit = 20, params = {}) => {
    try {
      const response = await api.get(url, { 
        params: {
          ...params,
          page,
          limit
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  },
  
  // Helper method to upload files
  uploadFile: async (url, formData) => {
    try {
      const response = await api.post(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response;
    } catch (error) {
      throw error;
    }
  }
};

export default apiService;