<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    equipmentService, 
    lendingService,
    type Equipment, 
    type Lending,
    type LendingCreate,
    PersonRole 
  } from '../api/index.js';
  import { authStore } from '../stores/auth.js';

  let loading = true;
  let actionLoading = false;
  let error = '';
  let success = '';
  
  let equipmentStats = {
    total: 0,
    available: 0,
    lent: 0,
    inService: 0
  };
  let lendingStats = {
    activeCount: 0,
    totalCount: 0
  };
  let recentLendings: Lending[] = [];
  let activeLendings: Lending[] = [];
  let availableEquipment: Equipment[] = [];

  // Lending form
  let lendingForm: LendingCreate = {
    equipment_id: 0,
    description: '',
    is_service: false
  };
  let selectedEquipment: Equipment | null = null;
  let searchQuery = '';

  onMount(async () => {
    await loadDashboardData();
  });

  async function loadDashboardData() {
    loading = true;
    
    try {
      // Get current person ID
      const currentPerson = $authStore.person;
      
      // Load equipment statistics and other data
      const [allEquipment, allActiveLendings, allLendings, serviceDue, availableEquipmentData] = await Promise.all([
        equipmentService.getAllEquipment(),
        lendingService.getActiveLendings(),
        lendingService.getAllLendings(),
        equipmentService.getEquipmentDueForService(),
        equipmentService.getAvailableEquipment()
      ]);

      // Calculate equipment stats
      if (allEquipment.success && allEquipment.data) {
        const equipment = allEquipment.data;
        equipmentStats = {
          total: equipment.length,
          available: equipment.filter(e => e.status === 'available').length,
          lent: equipment.filter(e => e.status === 'lent').length,
          inService: equipment.filter(e => e.status === 'in_service').length
        };
      }

      // Load personal active lendings if user is logged in
      if (currentPerson?.id) {
        const personalLendingsData = await lendingService.getLendingsByPerson(currentPerson.id);
        if (personalLendingsData.success && personalLendingsData.data) {
          // Filter to only active lendings (no submit_time)
          activeLendings = personalLendingsData.data.filter(lending => !lending.submit_time);
        }
      } else {
        activeLendings = [];
      }

      // Set lending stats from all active lendings
      if (allActiveLendings.success && allActiveLendings.data) {
        lendingStats.activeCount = allActiveLendings.data.length;
      }
      
      if (allLendings.success && allLendings.data) {
        lendingStats.totalCount = allLendings.data.length;
        // Get recent lendings (last 5)
        recentLendings = allLendings.data
          .sort((a, b) => new Date(b.lend_time).getTime() - new Date(a.lend_time).getTime())
          .slice(0, 5);
      }

      // Service due equipment - data available but not currently displayed

      // Available equipment for lending
      if (availableEquipmentData.success && availableEquipmentData.data) {
        availableEquipment = availableEquipmentData.data;
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      loading = false;
    }
  }

  function selectEquipment(equipment: Equipment) {
    selectedEquipment = equipment;
    lendingForm.equipment_id = equipment.id!;
    searchQuery = ''; // Clear search when equipment is selected
    error = '';
    success = '';
    
    // Ensure regular users can only perform regular lending
    if (!canPerformService) {
      lendingForm.is_service = false;
    }
  }

  async function handleLendEquipment(event: SubmitEvent) {
    event.preventDefault();
    if (!selectedEquipment) return;

    // Additional security check: prevent regular users from creating service lendings
    if (lendingForm.is_service && !canPerformService) {
      error = 'You do not have permission to create service lendings';
      return;
    }

    actionLoading = true;
    error = '';
    success = '';

    try {
      const response = await lendingService.createLending(lendingForm);
      if (response.success) {
        success = `Equipment "${selectedEquipment.name}" has been ${lendingForm.is_service ? 'sent for service' : 'lent out'} successfully!`;
        
        // Reset form
        lendingForm = {
          equipment_id: 0,
          description: '',
          is_service: false
        };
        selectedEquipment = null;
        searchQuery = ''; // Clear search when form is reset

        // Refresh data
        await loadDashboardData();
      } else {
        error = response.error || 'Failed to create lending';
      }
    } catch (err) {
      error = 'Failed to create lending';
    } finally {
      actionLoading = false;
    }
  }

  async function handleReturnEquipment(lending: Lending) {
    actionLoading = true;
    error = '';
    success = '';

    try {
      const response = await lendingService.submitLending(lending.id!);
      if (response.success) {
        success = `Equipment has been returned successfully!`;
        
        // Refresh data
        await loadDashboardData();
      } else {
        error = response.error || 'Failed to return equipment';
      }
    } catch (err) {
      error = 'Failed to return equipment';
    } finally {
      actionLoading = false;
    }
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getEquipmentName(equipmentId: number): string {
    // Try to find in available equipment first
    let equipment = availableEquipment.find(eq => eq.id === equipmentId);
    
    // If not found, we could maintain a separate equipment cache or make API call
    // For now, return the ID if name not found
    return equipment?.name || `Equipment #${equipmentId}`;
  }

  // Filter equipment based on search query
  $: filteredEquipment = availableEquipment.filter(equipment => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      equipment.name.toLowerCase().includes(query) ||
      equipment.description.toLowerCase().includes(query) ||
      equipment.type.toLowerCase().includes(query) ||
      equipment.barcode.toString().includes(query)
    );
  });

  // Check if current user can perform service operations
  $: canPerformService = $authStore.person?.role === PersonRole.ADMIN || 
                         $authStore.person?.role === PersonRole.SERVICE_USER;
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Home</h1>
    <p class="text-gray-600 mt-2">Your personal equipment lending dashboard</p>
  </div>

  <!-- Status Messages -->
  {#if error}
    <div class="mb-6 bg-red-50 border-l-4 border-red-400 p-4 rounded-r-lg">
      <div class="flex">
        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
        </svg>
        <p class="ml-3 text-sm text-red-700 font-medium">{error}</p>
      </div>
    </div>
  {/if}

  {#if success}
    <div class="mb-6 bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
      <div class="flex">
        <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
        </svg>
        <p class="ml-3 text-sm text-green-700 font-medium">{success}</p>
      </div>
    </div>
  {/if}

  {#if loading}
    <div class="flex items-center justify-center h-64">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  {:else}
    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Total Equipment -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-xl">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Total Items</p>
            <p class="text-2xl font-bold text-gray-900">{equipmentStats.total}</p>
          </div>
        </div>
      </div>

      <!-- Available Equipment -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-green-100 rounded-xl">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Available Items</p>
            <p class="text-2xl font-bold text-gray-900">{equipmentStats.available}</p>
          </div>
        </div>
      </div>

      <!-- Lent Items -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-blue-100 rounded-xl">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Lent Items</p>
            <p class="text-2xl font-bold text-gray-900">{lendingStats.activeCount}</p>
          </div>
        </div>
      </div>

      <!-- Items in Service -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center">
          <div class="p-3 bg-orange-100 rounded-xl">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div class="ml-4">
            <p class="text-sm font-medium text-gray-600">Items in Service</p>
            <p class="text-2xl font-bold text-gray-900">{equipmentStats.inService}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      <!-- Lend Equipment Section -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Lend Equipment</h2>
        
        {#if !selectedEquipment}
          {#if availableEquipment.length === 0}
            <div class="text-center py-8">
              <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p class="text-gray-500">No equipment available for lending</p>
            </div>
          {:else}
            <!-- Search Input -->
            <div class="mb-4">
              <div class="relative">
                <svg class="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search equipment by name, type, description, or barcode..."
                  bind:value={searchQuery}
                  class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                />
                {#if searchQuery}
                  <button
                    onclick={() => searchQuery = ''}
                    class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    aria-label="Clear search"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                {/if}
              </div>
            </div>

            <!-- Equipment List -->
            <div class="space-y-3 max-h-80 overflow-y-auto">
              {#if filteredEquipment.length === 0}
                <div class="text-center py-6">
                  <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p class="text-gray-500">No equipment found matching "{searchQuery}"</p>
                  <button
                    onclick={() => searchQuery = ''}
                    class="mt-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    Clear search
                  </button>
                </div>
              {:else}
                {#each filteredEquipment.slice(0, 10) as equipment}
                  <button
                    onclick={() => selectEquipment(equipment)}
                    class="w-full text-left p-3 border rounded-lg transition-all duration-200 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  >
                    <h3 class="font-medium text-gray-900">{equipment.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">{equipment.description}</p>
                    <div class="flex items-center justify-between mt-2">
                      <div class="flex items-center space-x-3 text-xs text-gray-500">
                        <span>#{equipment.barcode}</span>
                        <span>{equipment.type}</span>
                      </div>
                      <span class="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                        Available
                      </span>
                    </div>
                  </button>
                {/each}
                {#if filteredEquipment.length > 10}
                  <p class="text-sm text-gray-500 text-center py-2">
                    Showing first 10 of {filteredEquipment.length} results
                    {#if searchQuery}
                      for "{searchQuery}"
                    {/if}
                  </p>
                {/if}
              {/if}
            </div>
          {/if}
        {:else}
          <div class="space-y-4">
            <!-- Selected Equipment Display -->
            <div class="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-medium text-blue-900">Selected Equipment</h3>
                  <p class="text-blue-700 mt-1">{selectedEquipment.name}</p>
                  <p class="text-sm text-blue-600 mt-1">{selectedEquipment.description}</p>
                </div>
                <button
                  onclick={() => { selectedEquipment = null; lendingForm.equipment_id = 0; searchQuery = ''; }}
                  class="text-blue-600 hover:text-blue-800"
                  aria-label="Deselect equipment"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <!-- Lending Form -->
            <form onsubmit={handleLendEquipment} class="space-y-4">
              <!-- Lending Type -->
              {#if canPerformService}
                <fieldset>
                  <legend class="block text-sm font-medium text-gray-700 mb-2">Lending Type</legend>
                  <div class="grid grid-cols-2 gap-3">
                    <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors duration-200 {
                      !lendingForm.is_service ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }">
                      <input 
                        type="radio" 
                        bind:group={lendingForm.is_service} 
                        value={false}
                        class="text-blue-600"
                      />
                      <div>
                        <div class="font-medium text-gray-900 text-sm">Regular</div>
                        <div class="text-xs text-gray-600">Lend to person</div>
                      </div>
                    </label>
                    
                    <label class="flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors duration-200 {
                      lendingForm.is_service ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:bg-gray-50'
                    }">
                      <input 
                        type="radio" 
                        bind:group={lendingForm.is_service} 
                        value={true}
                        class="text-orange-600"
                      />
                      <div>
                        <div class="font-medium text-gray-900 text-sm">Service</div>
                        <div class="text-xs text-gray-600">Maintenance</div>
                      </div>
                    </label>
                  </div>
                </fieldset>
              {:else}
                <!-- Regular users only see regular lending -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div class="flex items-center space-x-3">
                    <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg class="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <div class="font-medium text-blue-900 text-sm">Regular Lending</div>
                      <div class="text-xs text-blue-700">Equipment will be lent to you</div>
                    </div>
                  </div>
                </div>
              {/if}

              <!-- Description -->
              <div>
                <label for="lending-description" class="block text-sm font-medium text-gray-700 mb-2">
                  {canPerformService && lendingForm.is_service ? 'Service Description' : 'Purpose'} *
                </label>
                <textarea 
                  id="lending-description"
                  bind:value={lendingForm.description}
                  placeholder={canPerformService && lendingForm.is_service ? 'Describe the service needed...' : 'Describe the purpose of this lending...'}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="2"
                  required
                ></textarea>
              </div>

              <!-- Submit Button -->
              <button 
                type="submit" 
                disabled={actionLoading || !selectedEquipment}
                class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {#if actionLoading}
                  Processing...
                {:else}
                  {canPerformService && lendingForm.is_service ? 'Lend for conducting Service' : 'Lend Equipment'}
                {/if}
              </button>
            </form>
          </div>
        {/if}
      </div>

      <!-- My Active Lendings -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900">My Active Lendings</h2>
          {#if activeLendings.length > 0}
            <span class="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {activeLendings.length}
            </span>
          {/if}
        </div>

        {#if activeLendings.length === 0}
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500">No active lendings</p>
          </div>
        {:else}
          <div class="space-y-4 max-h-80 overflow-y-auto">
            {#each activeLendings as lending}
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <h3 class="font-medium text-gray-900">
                    {getEquipmentName(lending.equipment_id)}
                  </h3>
                  <span class="px-2 py-1 text-xs font-medium rounded-full {
                    lending.is_service 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                  }">
                    {lending.is_service ? 'Service' : 'Lent'}
                  </span>
                </div>
                
                <p class="text-sm text-gray-600 mb-2">{lending.description}</p>
                
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500">
                    {formatDate(lending.lend_time)}
                  </span>
                  <button
                    onclick={() => handleReturnEquipment(lending)}
                    disabled={actionLoading}
                    class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors duration-200 disabled:opacity-50"
                  >
                    Return
                  </button>
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Bottom Content Grid -->
    <div class="mb-8">
      <!-- Recent Lendings -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-xl font-semibold text-gray-900">Recent Lendings</h2>
          <span class="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
            {lendingStats.totalCount} Total
          </span>
        </div>

        {#if recentLendings.length === 0}
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500">No recent lendings</p>
          </div>
        {:else}
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {#each recentLendings as lending}
              <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                  <p class="font-medium text-gray-900">Equipment #{lending.equipment_id}</p>
                  <p class="text-sm text-gray-600 truncate">{lending.description}</p>
                  <p class="text-xs text-gray-500">{formatDate(lending.lend_time)}</p>
                </div>
                <span class="px-2 py-1 text-xs font-medium rounded-full {
                  lending.submit_time 
                    ? 'bg-gray-100 text-gray-800' 
                    : lending.is_service 
                      ? 'bg-orange-100 text-orange-800' 
                      : 'bg-blue-100 text-blue-800'
                }">
                  {lending.submit_time 
                    ? 'Returned' 
                    : lending.is_service 
                      ? 'Service' 
                      : 'Active'
                  }
                </span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div> 