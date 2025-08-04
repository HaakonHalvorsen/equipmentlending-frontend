import { writable } from 'svelte/store';
import { authService, apiClient } from '../api/index.js';
import type { AuthState, User, UserLogin, UserCreate } from '../api/index.js';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false
};

// Create the store
export const authStore = writable<AuthState>(initialState);

// Auth actions
export const authActions = {
  // Initialize auth state from stored token
  async init() {
    const token = authService.isAuthenticated();
    if (token) {
      const response = await authService.getCurrentUser();
      if (response.success && response.data) {
        authStore.set({
          user: response.data,
          token: apiClient.getToken(),
          isAuthenticated: true
        });
      } else {
        // Invalid token, clear it
        authService.logout();
        authStore.set(initialState);
      }
    }
  },

  // Login
  async login(credentials: UserLogin) {
    const response = await authService.login(credentials);
    
    if (response.success && response.data) {
      authStore.set({
        user: response.data.user,
        token: response.data.access_token,
        isAuthenticated: true
      });
      return { success: true };
    }
    
    return { success: false, error: response.error };
  },

  // Register
  async register(userData: UserCreate) {
    const response = await authService.register(userData);
    
    if (response.success && response.data) {
      authStore.set({
        user: response.data.user,
        token: response.data.access_token,
        isAuthenticated: true
      });
      return { success: true };
    }
    
    return { success: false, error: response.error };
  },

  // Logout
  async logout() {
    await authService.logout();
    authStore.set(initialState);
  },

  // Delete Account
  async deleteAccount() {
    const response = await authService.deleteAccount();
    
    if (response.success) {
      authStore.set(initialState);
      return { success: true };
    }
    
    return { success: false, error: response.error };
  },

  // Update user data
  updateUser(user: User) {
    authStore.update(state => ({
      ...state,
      user
    }));
  }
};

// Helper to get current auth state
export function getCurrentAuthState(): AuthState {
  let currentState: AuthState = initialState;
  authStore.subscribe(state => currentState = state)();
  return currentState;
} 