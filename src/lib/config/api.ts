// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000, // 10 seconds
} as const;

// You can override the base URL via environment variables
export const getApiBaseUrl = (): string => {
  // Check for environment variable first (useful for different environments)
  if (typeof window !== 'undefined') {
    // Client-side: check if there's a base URL set in the window object
    return (window as any).__API_BASE_URL__ || API_CONFIG.BASE_URL;
  }
  
  // Server-side: use environment variable or default (Vite style)
  return import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL;
}; 