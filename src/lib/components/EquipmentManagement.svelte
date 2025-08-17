<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    equipmentService,
    type Equipment, 
    EquipmentStatus 
  } from '../api/index.js';

  let loading = false;
  let error = '';
  let success = '';
  let searchQuery = '';

  // Data
  let allEquipment: Equipment[] = [];
  
  // Form data for adding new equipment
  let addingEquipment = false;
  let showAddModal = false;
  let equipmentForm: Omit<Equipment, 'id' | 'created_at' | 'status'> = {
    barcode: 0,
    type: '',
    name: '',
    description: '',
    service_interval_days: 365,
    amount: 1
  };

  // Editing equipment
  let editingEquipment: Equipment | null = null;
  let showEditModal = false;
  let editForm: Omit<Equipment, 'id' | 'created_at' | 'status'> = {
    barcode: 0,
    type: '',
    name: '',
    description: '',
    service_interval_days: 365,
    amount: 1
  };

  onMount(async () => {
    await loadEquipmentData();
  });

  async function loadEquipmentData() {
    loading = true;
    error = '';

    try {
      const response = await equipmentService.getAllEquipment();
      if (response.success && response.data) {
        allEquipment = response.data;
      }
    } catch (err) {
      error = 'Failed to load equipment data';
    } finally {
      loading = false;
    }
  }

  // Computed properties for different equipment counts and filtering
  $: availableEquipment = allEquipment.filter(e => e.status === EquipmentStatus.AVAILABLE);
  $: lentEquipment = allEquipment.filter(e => e.status === EquipmentStatus.LENT);
  $: serviceEquipment = allEquipment.filter(e => e.status === EquipmentStatus.IN_SERVICE);
  
  // Search functionality
  $: filteredEquipment = allEquipment.filter(equipment => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      equipment.name.toLowerCase().includes(query) ||
      equipment.description.toLowerCase().includes(query) ||
      equipment.type.toLowerCase().includes(query) ||
      equipment.barcode.toString().includes(query)
    );
  });

  function openAddModal() {
    equipmentForm = {
      barcode: 0,
      type: '',
      name: '',
      description: '',
      service_interval_days: 365,
      amount: 1
    };
    showAddModal = true;
    error = '';
    success = '';
  }

  function closeAddModal() {
    showAddModal = false;
    error = '';
    success = '';
  }

  function openEditModal(equipment: Equipment) {
    editingEquipment = equipment;
    editForm = {
      barcode: equipment.barcode,
      type: equipment.type,
      name: equipment.name,
      description: equipment.description,
      service_interval_days: equipment.service_interval_days,
      amount: equipment.amount,
      last_service: equipment.last_service,
      next_service: equipment.next_service
    };
    showEditModal = true;
    error = '';
    success = '';
  }

  function closeEditModal() {
    editingEquipment = null;
    showEditModal = false;
    error = '';
    success = '';
  }

  async function handleAddEquipment(event: SubmitEvent) {
    event.preventDefault();
    
    addingEquipment = true;
    error = '';
    success = '';

    try {
      const response = await equipmentService.createEquipment(equipmentForm);
      if (response.success) {
        success = 'Equipment added successfully!';
        closeAddModal();
        await loadEquipmentData();
      } else {
        error = response.error || 'Failed to add equipment';
      }
    } catch (err) {
      error = 'Failed to add equipment';
    } finally {
      addingEquipment = false;
    }
  }

  async function handleUpdateEquipment(event: SubmitEvent) {
    event.preventDefault();
    if (!editingEquipment) return;

    loading = true;
    error = '';
    success = '';

    try {
      const response = await equipmentService.updateEquipment(editingEquipment.id!, editForm);
      if (response.success) {
        success = 'Equipment updated successfully!';
        closeEditModal();
        await loadEquipmentData();
      } else {
        error = response.error || 'Failed to update equipment';
      }
    } catch (err) {
      error = 'Failed to update equipment';
    } finally {
      loading = false;
    }
  }

  async function handleDeleteEquipment(equipment: Equipment) {
    if (!confirm(`Are you sure you want to delete "${equipment.name}"? This action cannot be undone.`)) {
      return;
    }

    loading = true;
    error = '';
    success = '';

    try {
      const response = await equipmentService.deleteEquipment(equipment.id!);
      if (response.success) {
        success = 'Equipment deleted successfully!';
        await loadEquipmentData();
      } else {
        error = response.error || 'Failed to delete equipment';
      }
    } catch (err) {
      error = 'Failed to delete equipment';
    } finally {
      loading = false;
    }
  }

  function formatDate(dateString?: string) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function getStatusColor(status?: EquipmentStatus): string {
    switch (status) {
      case EquipmentStatus.AVAILABLE:
        return 'bg-green-100 text-green-800';
      case EquipmentStatus.LENT:
        return 'bg-blue-100 text-blue-800';
      case EquipmentStatus.IN_SERVICE:
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  function getStatusLabel(status?: EquipmentStatus): string {
    switch (status) {
      case EquipmentStatus.AVAILABLE:
        return 'Available';
      case EquipmentStatus.LENT:
        return 'Lent';
      case EquipmentStatus.IN_SERVICE:
        return 'In Service';
      default:
        return 'Unknown';
    }
  }
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Equipment Management</h1>
    <p class="text-gray-600 mt-2">Manage equipment inventory and specifications</p>
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
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-xl">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Equipment</p>
          <p class="text-2xl font-bold text-gray-900">{allEquipment.length}</p>
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
          <p class="text-sm font-medium text-gray-600">Available</p>
          <p class="text-2xl font-bold text-gray-900">{availableEquipment.length}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-xl">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Lent Out</p>
          <p class="text-2xl font-bold text-gray-900">{lentEquipment.length}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-orange-100 rounded-xl">
          <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">In Service</p>
          <p class="text-2xl font-bold text-gray-900">{serviceEquipment.length}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Controls -->
  <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
    <!-- Search Bar -->
    <div class="relative flex-1 max-w-md">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Search equipment by name, type, description, or barcode..."
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <button 
        onclick={loadEquipmentData}
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        Refresh
      </button>
      <button 
        onclick={openAddModal}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        Add Equipment
      </button>
    </div>
  </div>

  <!-- Equipment Table -->
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        All Equipment ({filteredEquipment.length} of {allEquipment.length})
      </h2>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if filteredEquipment.length === 0}
      <div class="text-center py-12">
        <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No equipment found</h3>
        <p class="text-gray-600">{searchQuery ? 'No equipment matches your search criteria.' : 'No equipment found in the system.'}</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barcode</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredEquipment as equipment}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{equipment.name}</div>
                      <div class="text-sm text-gray-500">{equipment.description}</div>
                      <div class="text-xs text-gray-400">Amount: {equipment.amount}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusColor(equipment.status)}">
                    {getStatusLabel(equipment.status)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {equipment.type}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  #{equipment.barcode}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Last: {formatDate(equipment.last_service)}</div>
                  <div>Next: {formatDate(equipment.next_service)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onclick={() => openEditModal(equipment)}
                    class="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
                  </button>
                  <button
                    onclick={() => handleDeleteEquipment(equipment)}
                    class="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>

<!-- Add Equipment Modal -->
{#if showAddModal}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Add New Equipment</h3>
          <button onclick={closeAddModal} class="text-gray-400 hover:text-gray-600" aria-label="Close modal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onsubmit={handleAddEquipment} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Name -->
            <div>
              <label for="name" class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                id="name"
                bind:value={equipmentForm.name}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Type -->
            <div>
              <label for="type" class="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <input
                type="text"
                id="type"
                bind:value={equipmentForm.type}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Barcode -->
            <div>
              <label for="barcode" class="block text-sm font-medium text-gray-700 mb-2">Barcode *</label>
              <input
                type="number"
                id="barcode"
                bind:value={equipmentForm.barcode}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Amount -->
            <div>
              <label for="amount" class="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <input
                type="number"
                id="amount"
                min="1"
                bind:value={equipmentForm.amount}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Service Interval -->
            <div class="md:col-span-2">
              <label for="service_interval" class="block text-sm font-medium text-gray-700 mb-2">Service Interval (days) *</label>
              <input
                type="number"
                id="service_interval"
                min="1"
                bind:value={equipmentForm.service_interval_days}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>


          </div>

          <!-- Description -->
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              id="description"
              bind:value={equipmentForm.description}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onclick={closeAddModal}
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addingEquipment}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
            >
              {addingEquipment ? 'Adding Equipment...' : 'Add Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<!-- Edit Equipment Modal -->
{#if showEditModal && editingEquipment}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Edit Equipment: {editingEquipment.name}</h3>
          <button onclick={closeEditModal} class="text-gray-400 hover:text-gray-600" aria-label="Close modal">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onsubmit={handleUpdateEquipment} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Name -->
            <div>
              <label for="edit_name" class="block text-sm font-medium text-gray-700 mb-2">Name *</label>
              <input
                type="text"
                id="edit_name"
                bind:value={editForm.name}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Type -->
            <div>
              <label for="edit_type" class="block text-sm font-medium text-gray-700 mb-2">Type *</label>
              <input
                type="text"
                id="edit_type"
                bind:value={editForm.type}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Barcode -->
            <div>
              <label for="edit_barcode" class="block text-sm font-medium text-gray-700 mb-2">Barcode *</label>
              <input
                type="number"
                id="edit_barcode"
                bind:value={editForm.barcode}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Amount -->
            <div>
              <label for="edit_amount" class="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
              <input
                type="number"
                id="edit_amount"
                min="1"
                bind:value={editForm.amount}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- Service Interval -->
            <div class="md:col-span-2">
              <label for="edit_service_interval" class="block text-sm font-medium text-gray-700 mb-2">Service Interval (days) *</label>
              <input
                type="number"
                id="edit_service_interval"
                min="1"
                bind:value={editForm.service_interval_days}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>


          </div>

          <!-- Description -->
          <div>
            <label for="edit_description" class="block text-sm font-medium text-gray-700 mb-2">Description *</label>
            <textarea
              id="edit_description"
              bind:value={editForm.description}
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onclick={closeEditModal}
              class="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50"
            >
              {loading ? 'Updating Equipment...' : 'Update Equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}
