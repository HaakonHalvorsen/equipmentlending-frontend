import { apiClient } from './client.js';
import type { 
  Person, 
  PersonUpdate, 
  PersonProfileUpdate,
  PersonRole,
  ApiResponse 
} from '../types/api.js';

export class PersonService {
  // Admin endpoints
  async getAllPersons(role?: PersonRole): Promise<ApiResponse<Person[]>> {
    const params = role ? `?role=${role}` : '';
    return apiClient.get<Person[]>(`/person/${params}`);
  }

  async getPersonById(id: number): Promise<ApiResponse<Person>> {
    return apiClient.get<Person>(`/person/${id}`);
  }

  async getPersonByEmail(email: string): Promise<ApiResponse<Person>> {
    return apiClient.get<Person>(`/person/email/${email}`);
  }

  async getPersonByUserId(userId: string): Promise<ApiResponse<Person>> {
    return apiClient.get<Person>(`/person/user/${userId}`);
  }

  async updatePerson(id: number, personData: PersonUpdate): Promise<ApiResponse<Person>> {
    return apiClient.put<Person>(`/person/${id}`, personData);
  }

  // Current user endpoints
  async getCurrentUserProfile(): Promise<ApiResponse<Person>> {
    return apiClient.get<Person>('/person/me/profile');
  }

  async updateCurrentUserProfile(personData: PersonProfileUpdate): Promise<ApiResponse<Person>> {
    return apiClient.put<Person>('/person/me/profile', personData);
  }
}

export const personService = new PersonService(); 