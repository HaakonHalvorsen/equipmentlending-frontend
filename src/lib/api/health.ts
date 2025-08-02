import { apiClient } from './client.js';
import type { ApiResponse } from '../types/api.js';

export class HealthService {
  async healthCheck(): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.get<Record<string, any>>('/health/');
  }

  async databaseHealthCheck(): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.get<Record<string, any>>('/health/database');
  }

  async getApiInfo(): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.get<Record<string, any>>('/');
  }
}

export const healthService = new HealthService(); 