import { writable } from 'svelte/store';
import { authService } from '../api/auth.js';
import { personService } from '../api/person.js';
import { apiClient } from '../api/client.js';
import type { AuthState, UserLogin, UserCreate } from '../api/index.js';

const initialState: AuthState = {
  user: null,
  person: null,
  token: null,
  isAuthenticated: false
};

export const authStore = writable<AuthState>(initialState);

export const authActions = {
  async init() {
    const token = localStorage.getItem('auth_token');
    if (token) {
      apiClient.setToken(token);
      try {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          // Fetch person profile
          console.log('Fetching person profile...');
          const personResponse = await personService.getCurrentUserProfile();
          console.log('Person response:', personResponse);
          
          authStore.set({
            user: userResponse.data,
            person: personResponse.success ? (personResponse.data || null) : null,
            token,
            isAuthenticated: true
          });
        } else {
          localStorage.removeItem('auth_token');
          apiClient.setToken(null);
          authStore.set(initialState);
        }
      } catch (error) {
        console.error('Error in auth init:', error);
        localStorage.removeItem('auth_token');
        apiClient.setToken(null);
        authStore.set(initialState);
      }
    }
  },

  async login(credentials: UserLogin) {
    const response = await authService.login(credentials);
    if (response.success && response.data) {
      const { user, access_token } = response.data;
      localStorage.setItem('auth_token', access_token);
      apiClient.setToken(access_token);
      
      // Fetch person profile
      console.log('Login: Fetching person profile...');
      const personResponse = await personService.getCurrentUserProfile();
      console.log('Login: Person response:', personResponse);
      
      authStore.set({
        user,
        person: personResponse.success ? (personResponse.data || null) : null,
        token: access_token,
        isAuthenticated: true
      });
      return { success: true };
    }
    return { success: false, error: response.error };
  },

  async register(userData: UserCreate) {
    const response = await authService.register(userData);
    if (response.success && response.data) {
      const { user, access_token } = response.data;
      localStorage.setItem('auth_token', access_token);
      apiClient.setToken(access_token);
      
      // Fetch person profile
      const personResponse = await personService.getCurrentUserProfile();
      
      authStore.set({
        user,
        person: personResponse.success ? (personResponse.data || null) : null,
        token: access_token,
        isAuthenticated: true
      });
      return { success: true };
    }
    return { success: false, error: response.error };
  },

  async logout() {
    await authService.logout();
    localStorage.removeItem('auth_token');
    apiClient.setToken(null);
    authStore.set(initialState);
  },

  async deleteAccount() {
    const response = await authService.deleteAccount();
    if (response.success) {
      authStore.set(initialState);
      return { success: true };
    }
    return { success: false, error: response.error };
  },

  async refreshPersonProfile() {
    const personResponse = await personService.getCurrentUserProfile();
    if (personResponse.success) {
      authStore.update((state: AuthState) => ({
        ...state,
        person: personResponse.data || null
      }));
    }
  }
};

// Helper to get current auth state
export function getCurrentAuthState(): AuthState {
  let currentState: AuthState = initialState;
  authStore.subscribe(state => currentState = state)();
  return currentState;
} 