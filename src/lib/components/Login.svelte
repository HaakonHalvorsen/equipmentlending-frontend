<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    equipmentService, 
    authService,
    type Equipment,
    type User 
  } from '../api/index.js';
  import { authStore, authActions } from '../stores/auth.js';

  let equipment: Equipment[] = [];
  let currentUser: User | null = null;
  let loading = false;
  let error = '';
  let showRegister = false;

  // Auth form data
  let loginForm = { email: '', password: '' };
  let registerForm = { email: '', password: '' };

  // Equipment form data
  let equipmentForm = {
    barcode: 0,
    type: '',
    name: '',
    description: '',
    service_interval_days: 30,
    amount: 1
  };

  // Subscribe to auth store
  $: currentUser = $authStore.user;
  $: isAuthenticated = $authStore.isAuthenticated;

  onMount(async () => {
    await authActions.init();
  });

  async function loadEquipment() {
    if (!isAuthenticated) {
      error = 'Please login first to view equipment';
      return;
    }

    loading = true;
    error = '';
    
    try {
      const response = await equipmentService.getAllEquipment();
      if (response.success && response.data) {
        equipment = response.data;
      } else {
        error = response.error || 'Failed to load equipment';
      }
    } catch (err) {
      error = 'Failed to load equipment';
    } finally {
      loading = false;
    }
  }

  async function handleLogin(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = '';
    
    try {
      const result = await authActions.login(loginForm);
      if (!result.success) {
        error = result.error || 'Login failed';
      } else {
        loginForm = { email: '', password: '' };
      }
    } catch (err) {
      error = 'Login failed';
    } finally {
      loading = false;
    }
  }

  async function handleRegister(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    error = '';
    
    try {
      const result = await authActions.register(registerForm);
      if (!result.success) {
        error = result.error || 'Registration failed';
      } else {
        registerForm = { email: '', password: '' };
        showRegister = false;
      }
    } catch (err) {
      error = 'Registration failed';
    } finally {
      loading = false;
    }
  }

  async function handleLogout() {
    await authActions.logout();
    equipment = [];
  }

  async function addEquipment(event: SubmitEvent) {
    event.preventDefault();
    if (!isAuthenticated) {
      error = 'Please login first';
      return;
    }

    loading = true;
    error = '';
    
    try {
      const response = await equipmentService.createEquipment(equipmentForm);
      if (response.success) {
        // Reset form and reload equipment
        equipmentForm = {
          barcode: 0,
          type: '',
          name: '',
          description: '',
          service_interval_days: 30,
          amount: 1
        };
        await loadEquipment();
      } else {
        error = response.error || 'Failed to add equipment';
      }
    } catch (err) {
      error = 'Failed to add equipment';
    } finally {
      loading = false;
    }
  }
</script>

<div class="max-w-4xl mx-auto p-6 space-y-6">
  <h1 class="text-2xl font-bold text-center">Equipment Lending System</h1>
  
  <!-- Error Display -->
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
      {error}
    </div>
  {/if}

  <!-- Authentication Section -->
  <div class="bg-white p-4 rounded-lg shadow">
    {#if currentUser}
      <div class="space-y-2">
        <p><strong>Logged in as:</strong> {currentUser.email}</p>
        <p><strong>User ID:</strong> {currentUser.id}</p>
        <button 
          onclick={handleLogout}
          class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Logout
        </button>
      </div>
    {:else}
      {#if !showRegister}
        <!-- Login Form -->
        <div class="max-w-md mx-auto">
          <form onsubmit={handleLogin} class="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              bind:value={loginForm.email}
              class="w-full p-3 border rounded-lg"
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              bind:value={loginForm.password}
              class="w-full p-3 border rounded-lg"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              class="w-full px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
          
          <!-- Registration prompt -->
          <p class="text-center text-gray-600 mt-4">
            If you haven't registered yet, 
            <button 
              onclick={() => showRegister = true}
              class="text-blue-500 hover:text-blue-700 underline font-medium"
            >
              register here now!
            </button>
          </p>
        </div>
      {:else}
        <!-- Register Form -->
        <div class="max-w-md mx-auto">
          <h3 class="text-lg font-medium mb-4 text-center">Create Account</h3>
          <form onsubmit={handleRegister} class="space-y-4">
            <input 
              type="email" 
              placeholder="Email" 
              bind:value={registerForm.email}
              class="w-full p-3 border rounded-lg"
              required
            />
            <input 
              type="password" 
              placeholder="Password" 
              bind:value={registerForm.password}
              class="w-full p-3 border rounded-lg"
              required
            />
            <button 
              type="submit" 
              disabled={loading}
              class="w-full px-4 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 font-medium"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          
          <!-- Back to login -->
          <p class="text-center text-gray-600 mt-4">
            Already have an account? 
            <button 
              onclick={() => showRegister = false}
              class="text-blue-500 hover:text-blue-700 underline font-medium"
            >
              Login here
            </button>
          </p>
        </div>
      {/if}
    {/if}
  </div>

  <!-- Equipment Section -->
  {#if isAuthenticated}
    <div class="bg-white p-4 rounded-lg shadow">
      <h2 class="text-lg font-semibold mb-4">Equipment Management</h2>
      
      <!-- Add Equipment Form -->
      <div class="mb-4 p-4 bg-gray-50 rounded">
        <h3 class="font-medium mb-2">Add New Equipment</h3>
        <form onsubmit={addEquipment} class="grid grid-cols-2 gap-2">
          <input 
            type="number" 
            placeholder="Barcode" 
            bind:value={equipmentForm.barcode}
            class="p-2 border rounded"
            required
          />
          <input 
            type="text" 
            placeholder="Type" 
            bind:value={equipmentForm.type}
            class="p-2 border rounded"
            required
          />
          <input 
            type="text" 
            placeholder="Name" 
            bind:value={equipmentForm.name}
            class="p-2 border rounded"
            required
          />
          <input 
            type="text" 
            placeholder="Description" 
            bind:value={equipmentForm.description}
            class="p-2 border rounded"
            required
          />
          <input 
            type="number" 
            placeholder="Service Interval (days)" 
            bind:value={equipmentForm.service_interval_days}
            class="p-2 border rounded"
            min="1"
            required
          />
          <input 
            type="number" 
            placeholder="Amount" 
            bind:value={equipmentForm.amount}
            class="p-2 border rounded"
            min="1"
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            class="col-span-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Adding...' : 'Add Equipment'}
          </button>
        </form>
      </div>

      <!-- Load Equipment -->
      <button 
        onclick={loadEquipment} 
        disabled={loading}
        class="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Loading...' : 'Load Equipment'}
      </button>

      <!-- Equipment List -->
      {#if equipment.length > 0}
        <div class="space-y-2">
          <h3 class="font-medium">Equipment List ({equipment.length} items)</h3>
          <div class="grid gap-2">
            {#each equipment as item}
              <div class="p-3 border rounded bg-gray-50">
                <div class="flex justify-between items-start">
                  <div>
                    <h4 class="font-medium">{item.name}</h4>
                    <p class="text-sm text-gray-600">{item.description}</p>
                    <p class="text-xs text-gray-500">
                      Type: {item.type} | Barcode: {item.barcode} | Status: {item.status} | Amount: {item.amount}
                    </p>
                  </div>
                  <span class="text-xs px-2 py-1 rounded {
                    item.status === 'available' ? 'bg-green-100 text-green-800' :
                    item.status === 'lent' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }">
                    {item.status}
                  </span>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {:else if equipment.length === 0 && !loading}
        <p class="text-gray-500">No equipment found. Add some equipment or check your connection.</p>
      {/if}
    </div>
  {/if}
</div> 