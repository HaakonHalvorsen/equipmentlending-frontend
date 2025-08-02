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

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
  <div class="max-w-6xl mx-auto px-4 py-8 space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-2 tracking-tight">Equipment Lending System</h1>
      <p class="text-lg text-gray-600">Manage your equipment inventory with ease</p>
    </div>
    
    <!-- Error Display -->
    {#if error}
      <div class="max-w-md mx-auto">
        <div class="bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg shadow-sm">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm text-red-700 font-medium">{error}</p>
            </div>
          </div>
        </div>
      </div>
    {/if}

    <!-- Authentication Section -->
    <div class="max-w-md mx-auto">
      {#if currentUser}
        <!-- User Dashboard -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div class="text-center mb-6">
            <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900">Welcome back!</h2>
            <p class="text-gray-600 mt-1">{currentUser.email}</p>
            <p class="text-sm text-gray-500 mt-1">User ID: {currentUser.id}</p>
          </div>
          
          <button 
            onclick={handleLogout}
            class="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200 border border-gray-200"
          >
            Sign Out
          </button>
        </div>
      {:else}
        {#if !showRegister}
          <!-- Login Form -->
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">Sign In</h2>
              <p class="text-gray-600 mt-2">Welcome back to your dashboard</p>
            </div>

            <form onsubmit={handleLogin} class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  bind:value={loginForm.email}
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  placeholder="Enter your password" 
                  bind:value={loginForm.password}
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                class="w-full px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if loading}
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing In...
                  </span>
                {:else}
                  Sign In
                {/if}
              </button>
            </form>
            
            <!-- Registration prompt -->
            <div class="mt-6 text-center">
              <p class="text-gray-600">
                Don't have an account? 
                <button 
                  onclick={() => showRegister = true}
                  class="text-blue-600 hover:text-blue-800 font-semibold transition-colors duration-200 ml-1"
                >
                  Create one now!
                </button>
              </p>
            </div>
          </div>
        {:else}
          <!-- Register Form -->
          <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
            <div class="text-center mb-8">
              <div class="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h2 class="text-2xl font-bold text-gray-900">Create Account</h2>
              <p class="text-gray-600 mt-2">Join us to start managing equipment</p>
            </div>

            <form onsubmit={handleRegister} class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  bind:value={registerForm.email}
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <input 
                  type="password" 
                  placeholder="Create a password" 
                  bind:value={registerForm.password}
                  class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                  required
                />
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                class="w-full px-4 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if loading}
                  <span class="flex items-center justify-center">
                    <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating Account...
                  </span>
                {:else}
                  Create Account
                {/if}
              </button>
            </form>
            
            <!-- Back to login -->
            <div class="mt-6 text-center">
              <p class="text-gray-600">
                Already have an account? 
                <button 
                  onclick={() => showRegister = false}
                  class="text-green-600 hover:text-green-800 font-semibold transition-colors duration-200 ml-1"
                >
                  Sign in here
                </button>
              </p>
            </div>
          </div>
        {/if}
      {/if}
    </div>

    <!-- Equipment Section -->
    {#if isAuthenticated}
      <div class="max-w-4xl mx-auto space-y-6">
        <!-- Equipment Management Header -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-2xl font-bold text-gray-900">Equipment Management</h2>
              <p class="text-gray-600 mt-1">Add and manage your equipment inventory</p>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Add Equipment Form -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Add New Equipment</h3>
          <form onsubmit={addEquipment} class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Barcode</label>
              <input 
                type="number" 
                placeholder="Equipment barcode" 
                bind:value={equipmentForm.barcode}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <input 
                type="text" 
                placeholder="Equipment type" 
                bind:value={equipmentForm.type}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input 
                type="text" 
                placeholder="Equipment name" 
                bind:value={equipmentForm.name}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <input 
                type="text" 
                placeholder="Equipment description" 
                bind:value={equipmentForm.description}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Service Interval (days)</label>
              <input 
                type="number" 
                placeholder="30" 
                bind:value={equipmentForm.service_interval_days}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                min="1"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Amount</label>
              <input 
                type="number" 
                placeholder="1" 
                bind:value={equipmentForm.amount}
                class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                min="1"
                required
              />
            </div>
            
            <div class="md:col-span-2 pt-2">
              <button 
                type="submit" 
                disabled={loading}
                class="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Adding Equipment...' : 'Add Equipment'}
              </button>
            </div>
          </form>
        </div>

        <!-- Equipment List -->
        <div class="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-semibold text-gray-900">Equipment Inventory</h3>
            <button 
              onclick={loadEquipment} 
              disabled={loading}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>

          {#if equipment.length > 0}
            <div class="space-y-3">
              <p class="text-sm text-gray-600 mb-4">{equipment.length} items in inventory</p>
              <div class="grid gap-4">
                {#each equipment as item}
                  <div class="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200 bg-gradient-to-r from-gray-50 to-white">
                    <div class="flex justify-between items-start">
                      <div class="flex-1">
                        <h4 class="font-semibold text-gray-900 text-lg">{item.name}</h4>
                        <p class="text-gray-600 mt-1">{item.description}</p>
                        <div class="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                          <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            {item.type}
                          </span>
                          <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h4" />
                            </svg>
                            #{item.barcode}
                          </span>
                          <span class="flex items-center">
                            <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                            </svg>
                            Qty: {item.amount}
                          </span>
                        </div>
                      </div>
                      <span class="px-3 py-1 text-xs font-semibold rounded-full {
                        item.status === 'available' ? 'bg-green-100 text-green-800' :
                        item.status === 'lent' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }">
                        {item.status?.charAt(0).toUpperCase() + item.status?.slice(1).replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                {/each}
              </div>
            </div>
          {:else if equipment.length === 0 && !loading}
            <div class="text-center py-12">
              <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 class="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
              <p class="text-gray-600">Add some equipment to get started with your inventory management.</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div> 