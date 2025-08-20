// API Configuration
export const API_CONFIG = {
  BASE_URL: 'http://localhost:8000',
  TIMEOUT: 10000, // 10 seconds
} as const;

// You can override the base URL via environment variables
export const getApiBaseUrl = (): string => {
  // Check for environment variable first (useful for different environments)
  if (typeof window !== 'undefined') {
    // Client-side: check if there's a base URL set in the window object (for runtime config)
    return (window as any).__API_BASE_URL__ || API_CONFIG.BASE_URL;
  }
  
  // Server-side or build-time: use environment variable or default (Vite style)
  return import.meta.env.VITE_API_BASE_URL || API_CONFIG.BASE_URL;
};

// For Azure Web App: This function can be used to set runtime configuration
export const setRuntimeApiBaseUrl = (url: string): void => {
  if (typeof window !== 'undefined') {
    (window as any).__API_BASE_URL__ = url;
  }
}; 