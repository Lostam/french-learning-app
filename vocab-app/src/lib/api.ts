import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth on 401 only if we're in the browser
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        // Use dynamic import to avoid circular dependency with useAuthStore
        // Dispatch custom event so the store can handle logout
        const event = new CustomEvent('auth:logout');
        window.dispatchEvent(event);

        // Redirect to login after a short delay to allow event processing
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
