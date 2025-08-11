<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    lendingService, 
    equipmentService,
    type Lending, 
    type Equipment
  } from '../api/index.js';

  let activeTab = 'history'; // 'history', 'all', 'equipment'
  let loading = false;
  let error = '';
  let success = '';

  // Data
  let allLendings: Lending[] = [];
  let allEquipment: Equipment[] = [];
  let selectedEquipmentId: number | null = null;
  let equipmentLendings: Lending[] = [];

  onMount(async () => {
    await Promise.all([
      loadAllLendings(),
      loadAllEquipment()
    ]);
  });

  async function loadAllLendings() {
    const response = await lendingService.getAllLendings();
    if (response.success && response.data) {
      allLendings = response.data;
    }
  }

  async function loadAllEquipment() {
    const response = await equipmentService.getAllEquipment();
    if (response.success && response.data) {
      allEquipment = response.data;
    }
  }

  async function loadEquipmentLendings(equipmentId: number) {
    loading = true;
    const response = await lendingService.getLendingsByEquipment(equipmentId);
    if (response.success && response.data) {
      equipmentLendings = response.data;
    }
    loading = false;
  }

  function selectEquipment(equipmentId: number) {
    selectedEquipmentId = equipmentId;
    loadEquipmentLendings(equipmentId);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getEquipmentName(equipmentId: number): string {
    let equipment = allEquipment.find(eq => eq.id === equipmentId);
    return equipment?.name || `Equipment #${equipmentId}`;
  }

  function getStatusColor(lending: Lending): string {
    if (lending.submit_time) {
      return 'bg-gray-100 text-gray-800';
    } else if (lending.is_service) {
      return 'bg-orange-100 text-orange-800';
    } else {
      return 'bg-blue-100 text-blue-800';
    }
  }

  function getStatusLabel(lending: Lending): string {
    if (lending.submit_time) {
      return 'Returned';
    } else if (lending.is_service) {
      return 'In Service';
    } else {
      return 'Active';
    }
  }

  $: sortedLendings = allLendings.sort((a, b) => 
    new Date(b.lend_time).getTime() - new Date(a.lend_time).getTime()
  );

  $: activeLendings = allLendings.filter(l => !l.submit_time);
  $: completedLendings = allLendings.filter(l => l.submit_time);
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Lending Management</h1>
    <p class="text-gray-600 mt-2">View and manage all lending records</p>
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

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-xl">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Lendings</p>
          <p class="text-2xl font-bold text-gray-900">{allLendings.length}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-yellow-100 rounded-xl">
          <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Active</p>
          <p class="text-2xl font-bold text-gray-900">{activeLendings.length}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-green-100 rounded-xl">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Completed</p>
          <p class="text-2xl font-bold text-gray-900">{completedLendings.length}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="border-b border-gray-200 mb-8">
    <nav class="-mb-px flex space-x-8">
      <button
        onclick={() => activeTab = 'history'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
          activeTab === 'history' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>All History</span>
        </div>
      </button>
      
      <button
        onclick={() => activeTab = 'equipment'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
          activeTab === 'equipment' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>By Equipment</span>
        </div>
      </button>
    </nav>
  </div>

  <!-- Tab Content -->
  {#if activeTab === 'history'}
    <!-- All History Tab -->
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-xl font-semibold text-gray-900">Complete Lending History</h2>
        <button 
          onclick={loadAllLendings}
          class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
        >
          Refresh
        </button>
      </div>

      {#if sortedLendings.length === 0}
        <div class="text-center py-12">
          <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 class="text-lg font-medium text-gray-900 mb-2">No lending history</h3>
          <p class="text-gray-600">Start lending equipment to see history here.</p>
        </div>
      {:else}
        <div class="grid gap-4 max-h-96 overflow-y-auto">
          {#each sortedLendings as lending}
            <div class="border border-gray-200 rounded-xl p-6">
              <div class="flex justify-between items-start">
                <div class="flex-1">
                  <div class="flex items-center space-x-3 mb-3">
                    <h3 class="text-lg font-semibold text-gray-900">
                      {getEquipmentName(lending.equipment_id)}
                    </h3>
                    <span class="px-3 py-1 text-xs font-medium rounded-full {getStatusColor(lending)}">
                      {getStatusLabel(lending)}
                    </span>
                  </div>
                  
                  <p class="text-gray-700 mb-3">{lending.description}</p>
                  
                  <div class="flex items-center space-x-6 text-sm text-gray-500">
                    <span class="flex items-center">
                      <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                      </svg>
                      Lent: {formatDate(lending.lend_time)}
                    </span>
                    {#if lending.submit_time}
                      <span class="flex items-center">
                        <svg class="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" />
                        </svg>
                        Returned: {formatDate(lending.submit_time)}
                      </span>
                    {/if}
                  </div>
                </div>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

  {:else if activeTab === 'equipment'}
    <!-- By Equipment Tab -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <!-- Equipment List -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Equipment</h2>
        
        {#if allEquipment.length === 0}
          <div class="text-center py-8">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p class="text-gray-500">No equipment found</p>
          </div>
        {:else}
          <div class="space-y-3 max-h-96 overflow-y-auto">
            {#each allEquipment as equipment}
              <button
                onclick={() => selectEquipment(equipment.id!)}
                class="w-full text-left p-4 border rounded-xl transition-all duration-200 {
                  selectedEquipmentId === equipment.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }"
              >
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-medium text-gray-900">{equipment.name}</h3>
                    <p class="text-sm text-gray-600 mt-1">{equipment.description}</p>
                    <div class="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <span>#{equipment.barcode}</span>
                      <span>{equipment.type}</span>
                    </div>
                  </div>
                  <span class="px-2 py-1 text-xs font-medium rounded-full {
                    equipment.status === 'available' ? 'bg-green-100 text-green-800' :
                    equipment.status === 'lent' ? 'bg-blue-100 text-blue-800' :
                    'bg-orange-100 text-orange-800'
                  }">
                    {equipment.status}
                  </span>
                </div>
              </button>
            {/each}
          </div>
        {/if}
      </div>

      <!-- Equipment Lending History -->
      <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 class="text-xl font-semibold text-gray-900 mb-4">Equipment History</h2>
        
        {#if !selectedEquipmentId}
          <div class="text-center py-8">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v16l-3.5-2-3.5 2V1a1 1 0 011-1h2a1 1 0 011 1v3z" />
            </svg>
            <p class="text-gray-500">Select equipment to view its lending history</p>
          </div>
        {:else if loading}
          <div class="flex items-center justify-center py-8">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        {:else if equipmentLendings.length === 0}
          <div class="text-center py-8">
            <svg class="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p class="text-gray-500">No lending history for this equipment</p>
          </div>
        {:else}
          <div class="space-y-4 max-h-80 overflow-y-auto">
            {#each equipmentLendings as lending}
              <div class="border border-gray-200 rounded-lg p-4">
                <div class="flex justify-between items-start mb-2">
                  <span class="px-2 py-1 text-xs font-medium rounded-full {getStatusColor(lending)}">
                    {getStatusLabel(lending)}
                  </span>
                </div>
                
                <p class="text-sm text-gray-700 mb-2">{lending.description}</p>
                
                <div class="text-xs text-gray-500 space-y-1">
                  <div class="flex items-center">
                    <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4" />
                    </svg>
                    Lent: {formatDate(lending.lend_time)}
                  </div>
                  {#if lending.submit_time}
                    <div class="flex items-center">
                      <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16" />
                      </svg>
                      Returned: {formatDate(lending.submit_time)}
                    </div>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div> 