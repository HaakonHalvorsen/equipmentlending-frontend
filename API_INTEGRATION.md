# Equipment Lending API Integration

This document describes how to use the API client to connect to the Equipment Lending backend at `http://localhost:8000`.

## Features

- ✅ Full TypeScript support with OpenAPI-generated types
- ✅ Authentication handling with automatic token storage
- ✅ Comprehensive error handling
- ✅ Svelte store integration for state management
- ✅ Ready-to-use service classes for all endpoints
- ✅ Environment variable support for different deployments

## Quick Start

1. **Import the services you need:**

```typescript
import { authService, equipmentService, healthService } from '$lib';
```

2. **Use the authentication:**

```typescript
// Register a new user
const result = await authService.register({
  email: 'user@example.com',
  password: 'password123'
});

// Login
const loginResult = await authService.login({
  email: 'user@example.com', 
  password: 'password123'
});

// Check if authenticated
const isLoggedIn = authService.isAuthenticated();
```

3. **Manage equipment:**

```typescript
// Get all equipment
const equipmentResponse = await equipmentService.getAllEquipment();

// Create new equipment
const newEquipment = await equipmentService.createEquipment({
  barcode: 123456,
  type: 'Laptop',
  name: 'MacBook Pro',
  description: 'Company laptop for development',
  service_interval_days: 365,
  amount: 1
});

// Get equipment by barcode
const equipment = await equipmentService.getEquipmentByBarcode(123456);
```

## API Services

### Authentication Service (`authService`)

```typescript
// Registration
await authService.register({ email, password });

// Login  
await authService.login({ email, password });

// Logout
await authService.logout();

// Get current user
await authService.getCurrentUser();

// Refresh token
await authService.refreshToken(refreshToken);

// Email confirmation
await authService.confirmEmail(token);
await authService.resendConfirmation(email);

// Check authentication status
authService.isAuthenticated();
```

### Equipment Service (`equipmentService`)

```typescript
// CRUD operations
await equipmentService.createEquipment(equipmentData);
await equipmentService.getAllEquipment();
await equipmentService.getEquipmentById(id);
await equipmentService.updateEquipment(id, equipmentData);
await equipmentService.deleteEquipment(id);

// Specialized queries
await equipmentService.getEquipmentByBarcode(barcode);
await equipmentService.getEquipmentDueForService();

// Filter by status
await equipmentService.getAvailableEquipment();
await equipmentService.getLentEquipment();
await equipmentService.getEquipmentInService();
await equipmentService.getAllEquipment(EquipmentStatus.AVAILABLE);
```

### Health Service (`healthService`)

```typescript
// Health checks
await healthService.healthCheck();
await healthService.databaseHealthCheck();
await healthService.getApiInfo();
```

## Svelte Store Integration

### Authentication Store

The `authStore` provides reactive authentication state:

```svelte
<script>
  import { authStore, authActions } from '$lib';
  
  // Reactive variables
  $: user = $authStore.user;
  $: isAuthenticated = $authStore.isAuthenticated;
  $: token = $authStore.token;
  
  // Actions
  async function login() {
    const result = await authActions.login({ email, password });
    if (!result.success) {
      console.error(result.error);
    }
  }
  
  async function logout() {
    await authActions.logout();
  }
</script>

{#if isAuthenticated}
  <p>Welcome, {user.email}!</p>
  <button on:click={logout}>Logout</button>
{:else}
  <button on:click={login}>Login</button>
{/if}
```

### Store Actions

```typescript
// Initialize auth state on app start
await authActions.init();

// Login/Register
await authActions.login({ email, password });
await authActions.register({ email, password });

// Logout
await authActions.logout();

// Update user data
authActions.updateUser(updatedUser);
```

## Error Handling

All API calls return a standardized response:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Usage
const response = await equipmentService.getAllEquipment();
if (response.success) {
  console.log('Equipment:', response.data);
} else {
  console.error('Error:', response.error);
}
```

## TypeScript Types

The following types are available:

```typescript
// User types
interface User {
  id: string;
  email: string;
  created_at?: string;
  last_sign_in_at?: string;
}

interface UserCreate {
  email: string;
  password: string;
}

interface UserLogin {
  email: string;
  password: string;
}

// Equipment types
interface Equipment {
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

enum EquipmentStatus {
  AVAILABLE = 'available',
  LENT = 'lent',
  IN_SERVICE = 'in_service'
}
```

## Configuration

### Environment Variables

You can override the API base URL using environment variables:

```bash
# .env.local
VITE_API_BASE_URL=http://localhost:8000
```

### Custom Configuration

```typescript
import { ApiClient } from '$lib';

// Create custom client with different base URL
const customClient = new ApiClient('https://api.production.com');
```

## Example Component

See `src/lib/components/ApiExample.svelte` for a complete working example that demonstrates:

- Health checks
- User authentication (login/register/logout)  
- Equipment management (create/read)
- Error handling
- Loading states

## Authentication Flow

1. **Registration/Login**: Automatically stores JWT token in localStorage
2. **API Calls**: Token is automatically added to Authorization header
3. **Logout**: Token is cleared from localStorage and memory
4. **Token Refresh**: Use `authService.refreshToken()` when needed
5. **Persistence**: Token persists across browser sessions

## Error Scenarios

The API client handles various error scenarios:

- **Network errors**: Returns `{ success: false, error: 'Network error' }`
- **HTTP errors**: Returns `{ success: false, error: 'HTTP Error: 404' }`
- **Validation errors**: Returns detailed error from backend
- **Authentication errors**: Automatically handled with proper error messages

## Security

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- All API calls use HTTPS in production
- Tokens are automatically included in authenticated requests
- Logout clears all stored authentication data

## Testing

You can test the API integration by:

1. Starting your backend at `http://localhost:8000`
2. Running this frontend with `npm run dev` 
3. Visiting the example page to test all functionality
4. Using browser dev tools to inspect network requests

## Deployment

For different environments, set the appropriate base URL:

```bash
# Development
VITE_API_BASE_URL=http://localhost:8000

# Production  
VITE_API_BASE_URL=https://api.yourdomain.com
```

## Support

This API client supports all endpoints from the Equipment Lending API OpenAPI specification:

- Authentication endpoints (`/auth/*`)
- Equipment management (`/equipment/*`)
- Health checks (`/health/*`)
- Root API info (`/`)

For more details, refer to the OpenAPI documentation at your backend's `/docs` endpoint. 