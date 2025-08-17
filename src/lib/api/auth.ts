import { apiClient } from './client.js';
import type { 
  UserCreate, 
  UserLogin, 
  UserResponse, 
  User, 
  PasswordChange,
  ApiResponse 
} from '../types/api.js';

export class AuthService {
  async register(userData: UserCreate): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<UserResponse>('/auth/register', userData);
    
    if (response.success && response.data) {
      // Store the token automatically on successful registration
      apiClient.setToken(response.data.access_token);
    }
    
    return response;
  }

  async login(credentials: UserLogin): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<UserResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store the token automatically on successful login
      apiClient.setToken(response.data.access_token);
    }
    
    return response;
  }

  async logout(): Promise<ApiResponse<Record<string, any>>> {
    const response = await apiClient.post<Record<string, any>>('/auth/logout');
    
    // Clear the token regardless of response
    apiClient.setToken(null);
    
    return response;
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return apiClient.get<User>('/auth/me');
  }

  async changePassword(passwordData: PasswordChange): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.put<Record<string, any>>('/auth/change-password', passwordData);
  }

  async deleteAccount(): Promise<ApiResponse<Record<string, any>>> {
    const response = await apiClient.delete<Record<string, any>>('/auth/me');
    
    // Clear the token after account deletion
    if (response.success) {
      apiClient.setToken(null);
    }
    
    return response;
  }

  async refreshToken(refreshToken: string): Promise<ApiResponse<UserResponse>> {
    const response = await apiClient.post<UserResponse>(
      `/auth/refresh?refresh_token=${encodeURIComponent(refreshToken)}`
    );
    
    if (response.success && response.data) {
      // Update the stored token
      apiClient.setToken(response.data.access_token);
    }
    
    return response;
  }

  async confirmEmail(token: string): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.post<Record<string, any>>(
      `/auth/confirm-email?token=${encodeURIComponent(token)}`
    );
  }

  async resendConfirmation(email: string): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.post<Record<string, any>>(
      `/auth/resend-confirmation?email=${encodeURIComponent(email)}`
    );
  }

  isAuthenticated(): boolean {
    return apiClient.getToken() !== null;
  }
}

export const authService = new AuthService(); 