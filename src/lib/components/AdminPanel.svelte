<script lang="ts">
  import { onMount } from 'svelte';
  import { 
    personService,
    type Person, 
    type PersonUpdate, 
    PersonRole 
  } from '../api/index.js';

  let loading = false;
  let error = '';
  let success = '';
  let activeTab = 'users'; // 'users', 'admins'

  // Data
  let allPersons: Person[] = [];
  let adminPersons: Person[] = [];
  let userPersons: Person[] = [];
  
  // Form data
  let editingPerson: Person | null = null;
  let editForm: PersonUpdate = {};
  let showEditModal = false;

  onMount(async () => {
    await loadPersonData();
  });

  async function loadPersonData() {
    loading = true;
    error = '';

    try {
      const [allResponse, adminResponse, userResponse] = await Promise.all([
        personService.getAllPersons(),
        personService.getAllPersons(PersonRole.ADMIN),
        personService.getAllPersons(PersonRole.USER)
      ]);

      if (allResponse.success && allResponse.data) {
        allPersons = allResponse.data;
      }
      
      if (adminResponse.success && adminResponse.data) {
        adminPersons = adminResponse.data;
      }
      
      if (userResponse.success && userResponse.data) {
        userPersons = userResponse.data;
      }
    } catch (err) {
      error = 'Failed to load person data';
    } finally {
      loading = false;
    }
  }

  function openEditModal(person: Person) {
    editingPerson = person;
    editForm = {
      name: person.name,
      email: person.email,
      role: person.role,
      company: person.company,
      phone: person.phone,
      contact_person_name: person.contact_person_name,
      contact_person_email: person.contact_person_email,
      contact_person_phone: person.contact_person_phone
    };
    showEditModal = true;
    error = '';
    success = '';
  }

  function closeEditModal() {
    editingPerson = null;
    editForm = {};
    showEditModal = false;
    error = '';
    success = '';
  }

  async function handleUpdatePerson(event: SubmitEvent) {
    event.preventDefault();
    if (!editingPerson) return;

    loading = true;
    error = '';
    success = '';

    try {
      const response = await personService.updatePerson(editingPerson.id, editForm);
      if (response.success) {
        success = 'Person updated successfully!';
        closeEditModal();
        await loadPersonData();
      } else {
        error = response.error || 'Failed to update person';
      }
    } catch (err) {
      error = 'Failed to update person';
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

  function getRoleColor(role: PersonRole): string {
    return role === PersonRole.ADMIN ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800';
  }

  $: currentPersons = activeTab === 'admins' ? adminPersons : userPersons;
</script>

<div class="p-6 max-w-7xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Admin Panel</h1>
    <p class="text-gray-600 mt-2">Manage users and system administration</p>
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
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Total Users</p>
          <p class="text-2xl font-bold text-gray-900">{allPersons.length}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-purple-100 rounded-xl">
          <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Administrators</p>
          <p class="text-2xl font-bold text-gray-900">{adminPersons.length}</p>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
      <div class="flex items-center">
        <div class="p-3 bg-green-100 rounded-xl">
          <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        </div>
        <div class="ml-4">
          <p class="text-sm font-medium text-gray-600">Regular Users</p>
          <p class="text-2xl font-bold text-gray-900">{userPersons.length}</p>
        </div>
      </div>
    </div>
  </div>

  <!-- Tab Navigation -->
  <div class="border-b border-gray-200 mb-8">
    <nav class="-mb-px flex space-x-8">
      <button
        onclick={() => activeTab = 'users'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
          activeTab === 'users' 
            ? 'border-blue-500 text-blue-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Users ({userPersons.length})</span>
        </div>
      </button>
      
      <button
        onclick={() => activeTab = 'admins'}
        class="py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 {
          activeTab === 'admins' 
            ? 'border-purple-500 text-purple-600' 
            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
        }"
      >
        <div class="flex items-center space-x-2">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>Administrators ({adminPersons.length})</span>
        </div>
      </button>
    </nav>
  </div>

  <!-- Users Table -->
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-semibold text-gray-900">
        {activeTab === 'admins' ? 'Administrator' : 'User'} Management
      </h2>
      <button 
        onclick={loadPersonData}
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        Refresh
      </button>
    </div>

    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if currentPersons.length === 0}
      <div class="text-center py-12">
        <svg class="w-24 h-24 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        </svg>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No {activeTab}</h3>
        <p class="text-gray-600">No {activeTab} found in the system.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each currentPersons as person}
              <tr class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                      <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">{person.name}</div>
                      <div class="text-sm text-gray-500">{person.email}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full {getRoleColor(person.role)}">
                    {person.role}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {person.company || 'N/A'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(person.created_at)}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onclick={() => openEditModal(person)}
                    class="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Edit
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

<!-- Edit Modal -->
{#if showEditModal && editingPerson}
  <div class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
    <div class="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
      <div class="mt-3">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-medium text-gray-900">Edit User: {editingPerson.name}</h3>
          <button onclick={closeEditModal} class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onsubmit={handleUpdatePerson} class="space-y-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                bind:value={editForm.name}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                bind:value={editForm.email}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                bind:value={editForm.role}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value={PersonRole.USER}>User</option>
                <option value={PersonRole.ADMIN}>Admin</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Company</label>
              <input
                type="text"
                bind:value={editForm.company}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                bind:value={editForm.phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person Name</label>
              <input
                type="text"
                bind:value={editForm.contact_person_name}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person Email</label>
              <input
                type="email"
                bind:value={editForm.contact_person_email}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Contact Person Phone</label>
              <input
                type="tel"
                bind:value={editForm.contact_person_phone}
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
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
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if} 