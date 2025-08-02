import { apiClient } from './client.js';
import { EquipmentStatus } from '../types/api.js';
import type { 
  Equipment, 
  ApiResponse 
} from '../types/api.js';

export class EquipmentService {
  async createEquipment(equipment: Omit<Equipment, 'id' | 'created_at'>): Promise<ApiResponse<Equipment>> {
    return apiClient.post<Equipment>('/equipment/', equipment);
  }

  async getAllEquipment(status?: EquipmentStatus): Promise<ApiResponse<Equipment[]>> {
    const endpoint = status ? `/equipment/?status=${status}` : '/equipment/';
    return apiClient.get<Equipment[]>(endpoint);
  }

  async getEquipmentById(id: number): Promise<ApiResponse<Equipment>> {
    return apiClient.get<Equipment>(`/equipment/${id}`);
  }

  async getEquipmentByBarcode(barcode: number): Promise<ApiResponse<Equipment>> {
    return apiClient.get<Equipment>(`/equipment/barcode/${barcode}`);
  }

  async updateEquipment(id: number, equipment: Omit<Equipment, 'id' | 'created_at'>): Promise<ApiResponse<Equipment>> {
    return apiClient.put<Equipment>(`/equipment/${id}`, equipment);
  }

  async deleteEquipment(id: number): Promise<ApiResponse<Record<string, any>>> {
    return apiClient.delete<Record<string, any>>(`/equipment/${id}`);
  }

  async getEquipmentDueForService(): Promise<ApiResponse<Equipment[]>> {
    return apiClient.get<Equipment[]>('/equipment/service/due');
  }

  // Utility methods for filtering
  async getAvailableEquipment(): Promise<ApiResponse<Equipment[]>> {
    return this.getAllEquipment(EquipmentStatus.AVAILABLE);
  }

  async getLentEquipment(): Promise<ApiResponse<Equipment[]>> {
    return this.getAllEquipment(EquipmentStatus.LENT);
  }

  async getEquipmentInService(): Promise<ApiResponse<Equipment[]>> {
    return this.getAllEquipment(EquipmentStatus.IN_SERVICE);
  }
}

export const equipmentService = new EquipmentService(); 