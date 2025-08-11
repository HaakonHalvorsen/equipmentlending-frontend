// API Types based on OpenAPI schema

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  company?: string;
  phone?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  created_at?: string;
  last_sign_in_at?: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name: string;
  role?: string;
  company: string;
  phone?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface UserResponse {
  user: User;
  access_token: string;
  token_type?: string;
}

export enum EquipmentStatus {
  AVAILABLE = 'available',
  LENT = 'lent',
  IN_SERVICE = 'in_service'
}

export interface Equipment {
  id?: number;
  barcode: number;
  type: string;
  name: string;
  description: string;
  service_interval_days: number;
  last_service?: string;
  next_service?: string;
  status?: EquipmentStatus;
  amount: number;
  created_at?: string;
}

// Lending types
export interface Lending {
  id?: number;
  equipment_id: number;
  person_id: number;
  description: string;
  is_service: boolean;
  lend_time: string;
  submit_time?: string;
  created_at?: string;
}

export interface LendingCreate {
  equipment_id: number;
  description: string;
  is_service: boolean;
  lend_time?: string;
}

// Person types
export enum PersonRole {
  USER = 'user',
  ADMIN = 'admin'
}

export interface Person {
  id: number;
  user_id: string;
  name: string;
  email?: string;
  role: PersonRole;
  company?: string;
  phone?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
  created_at?: string;
}

export interface PersonUpdate {
  name?: string;
  email?: string;
  role?: PersonRole;
  company?: string;
  phone?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
}

export interface PersonProfileUpdate {
  name?: string;
  company?: string;
  phone?: string;
  contact_person_name?: string;
  contact_person_email?: string;
  contact_person_phone?: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

// Authentication context
export interface AuthState {
  user: User | null;
  person: Person | null;
  token: string | null;
  isAuthenticated: boolean;
} 