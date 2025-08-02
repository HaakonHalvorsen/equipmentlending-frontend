// Export all types
export * from '../types/api.js';

// Export API client
export { apiClient } from './client.js';

// Export services
export { authService } from './auth.js';
export { equipmentService } from './equipment.js';
export { healthService } from './health.js';

// Re-export service classes for custom instantiation if needed
export { AuthService } from './auth.js';
export { EquipmentService } from './equipment.js';
export { HealthService } from './health.js';
export { ApiClient } from './client.js'; 