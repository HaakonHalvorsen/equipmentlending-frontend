import { apiClient } from './client.js';
import type { 
  Lending, 
  LendingCreate, 
  ApiResponse 
} from '../types/api.js';

export class LendingService {
  async createLending(lending: LendingCreate): Promise<ApiResponse<Lending>> {
    return apiClient.post<Lending>('/lending/', lending);
  }

  async getAllLendings(): Promise<ApiResponse<Lending[]>> {
    return apiClient.get<Lending[]>('/lending/');
  }

  async getActiveLendings(): Promise<ApiResponse<Lending[]>> {
    return apiClient.get<Lending[]>('/lending/active');
  }

  async getLendingsByEquipment(equipmentId: number): Promise<ApiResponse<Lending[]>> {
    return apiClient.get<Lending[]>(`/lending/equipment/${equipmentId}`);
  }

  async getLendingsByPerson(personId: number): Promise<ApiResponse<Lending[]>> {
    return apiClient.get<Lending[]>(`/lending/person/${personId}`);
  }

  async getLendingById(id: number): Promise<ApiResponse<Lending>> {
    return apiClient.get<Lending>(`/lending/${id}`);
  }

  async updateLending(id: number, lending: Lending): Promise<ApiResponse<Lending>> {
    return apiClient.put<Lending>(`/lending/${id}`, lending);
  }

  async submitLending(id: number): Promise<ApiResponse<Lending>> {
    return apiClient.post<Lending>(`/lending/${id}/submit`);
  }

  async deleteLending(id: number): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.delete<Record<string, any>>(`/lending/${id}`);
  }
}

export const lendingService = new LendingService(); 