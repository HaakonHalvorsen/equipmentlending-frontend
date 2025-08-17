<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    lendingService,
    equipmentService,
    personService,
    type Lending,
    type Equipment,
    type Person
  } from '../api/index.js';

  let loading = false;
  let error = '';
  let searchQuery = '';

  // Data
  let allLendings: Lending[] = [];
  let allEquipment: Equipment[] = [];
  let allPersons: Person[] = [];

  // Maps for quick lookups
  let equipmentMap: Map<number, Equipment> = new Map();
  let personMap: Map<number, Person> = new Map();

  onMount(async () => {
    await loadData();
  });

  async function loadData() {
    loading = true;
    error = '';

    try {
      // Load all data in parallel
      const [lendingResponse, equipmentResponse, personResponse] = await Promise.all([
        lendingService.getAllLendings(),
        equipmentService.getAllEquipment(),
        personService.getAllPersons()
      ]);

      if (lendingResponse.success && lendingResponse.data) {
        allLendings = lendingResponse.data;
      }

      if (equipmentResponse.success && equipmentResponse.data) {
        allEquipment = equipmentResponse.data;
        equipmentMap = new Map(allEquipment.map(eq => [eq.id!, eq]));
      }

      if (personResponse.success && personResponse.data) {
        allPersons = personResponse.data;
        personMap = new Map(allPersons.map(person => [person.id!, person]));
      }
    } catch (err) {
      error = 'Failed to load lending history data';
    } finally {
      loading = false;
    }
  }

  // Filter lendings based on search query
  $: filteredLendings = allLendings.filter(lending => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    const equipment = equipmentMap.get(lending.equipment_id);
    const person = personMap.get(lending.person_id);
    
    return (
      equipment?.name.toLowerCase().includes(query) ||
      equipment?.type.toLowerCase().includes(query) ||
      equipment?.barcode.toString().includes(query) ||
      person?.name.toLowerCase().includes(query) ||
      person?.email?.toLowerCase().includes(query) ||
      person?.company?.toLowerCase().includes(query) ||
      lending.description.toLowerCase().includes(query)
    );
  }).sort((a, b) => new Date(b.lend_time).getTime() - new Date(a.lend_time).getTime());

  // Statistics
  $: totalLendings = allLendings.length;
  $: serviceLendings = allLendings.filter(l => l.is_service).length;
  $: regularLendings = allLendings.filter(l => !l.is_service).length;
  $: submittedLendings = allLendings.filter(l => l.submit_time).length;

  function getEquipmentName(equipmentId: number): string {
    const equipment = equipmentMap.get(equipmentId);
    return equipment?.name || `Equipment #${equipmentId}`;
  }

  function getPersonName(personId: number): string {
    const person = personMap.get(personId);
    return person?.name || `Person #${personId}`;
  }

  function getPersonEmail(personId: number): string {
    const person = personMap.get(personId);
    return person?.email || '';
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatDuration(lendTime: string, submitTime?: string): string {
    if (!submitTime) return 'Active';
    
    const start = new Date(lendTime);
    const end = new Date(submitTime);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      return '< 1h';
    }
  }

  function getLendingTypeColor(isService: boolean): string {
    return isService ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
  }

  function getLendingTypeLabel(isService: boolean): string {
    return isService ? 'Service' : 'Regular';
  }

  function getStatusColor(submitTime?: string): string {
    return submitTime ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  }

  function getStatusLabel(submitTime?: string): string {
    return submitTime ? 'Returned' : 'Active';
  }
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Lending History</h1>
    <p class="text-gray-600 mt-2">Complete history of all equipment lendings and services</p>
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

  <!-- Summary Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-blue-100 rounded-xl">
          <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Lendings</p>
          <p class="text-2xl font-bold text-gray-900">{totalLendings}</p>
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
          <p class="text-sm font-medium text-gray-600">Regular Lendings</p>
          <p class="text-2xl font-bold text-gray-900">{regularLendings}</p>
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
          <p class="text-sm font-medium text-gray-600">Services</p>
          <p class="text-2xl font-bold text-gray-900">{serviceLendings}</p>
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
          <p class="text-2xl font-bold text-gray-900">{submittedLendings}</p>
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
        placeholder="Search by equipment, person, company, or description..."
        class="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
      />
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3">
      <button 
        onclick={loadData}
        class="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        Refresh
      </button>
    </div>
  </div>

  <!-- Lending History Table -->
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        Lending History ({filteredLendings.length} of {allLendings.length})
      </h2>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if filteredLendings.length === 0}
      <div class="text-center py-12">
        <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No lending history found</h3>
        <p class="text-gray-600">{searchQuery ? 'No lendings match your search criteria.' : 'No lending history available.'}</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Person</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each filteredLendings as lending}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{getEquipmentName(lending.equipment_id)}</div>
                      <div class="text-sm text-gray-500">#{equipmentMap.get(lending.equipment_id)?.barcode || 'N/A'}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">{getPersonName(lending.person_id)}</div>
                    <div class="text-sm text-gray-500">{getPersonEmail(lending.person_id)}</div>
                    <div class="text-xs text-gray-400">{personMap.get(lending.person_id)?.company || ''}</div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getLendingTypeColor(lending.is_service)}">
                    {getLendingTypeLabel(lending.is_service)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getStatusColor(lending.submit_time)}">
                    {getStatusLabel(lending.submit_time)}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDuration(lending.lend_time, lending.submit_time)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div>Lent: {formatDate(lending.lend_time)}</div>
                  {#if lending.submit_time}
                    <div>Returned: {formatDate(lending.submit_time)}</div>
                  {/if}
                </td>
                <td class="px-6 py-4">
                  <div class="text-sm text-gray-900 max-w-xs truncate" title={lending.description}>
                    {lending.description}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>
</div>
