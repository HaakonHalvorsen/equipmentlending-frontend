<script lang="ts">
  import { authStore, authActions } from '../stores/auth.js';
  import type { User, Person, PersonRole } from '../api/index.js';
  import { PersonRole as Role } from '../api/index.js';

  export let currentPage = 'home';
  export let onNavigate: (page: string) => void;

  let currentUser: User | null = null;
  let currentPerson: Person | null = null;
  let isCollapsed = false;

  // Subscribe to auth store
  $: currentUser = $authStore.user;
  $: currentPerson = $authStore.person;
  $: isAdmin = currentPerson?.role === Role.ADMIN;

  // Debug logging
  $: if (currentPerson) {
    console.log('Current person:', currentPerson);
    console.log('Person role:', currentPerson.role);
    console.log('Role.ADMIN:', Role.ADMIN);
    console.log('Is admin?', currentPerson.role === Role.ADMIN);
  }

  async function handleLogout() {
    await authActions.logout();
  }

  function navigate(page: string) {
    onNavigate(page);
  }

  const menuItems = [
    {
      id: 'home',
      label: 'Home',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6'
    }
  ];

  const adminItems = [
    {
      id: 'admin',
      label: 'Admin Panel',
      icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
    }
  ];

  const bottomItems = [
    {
      id: 'settings',
      label: 'Settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
    }
  ];
</script>

<nav class="fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg z-40 transition-all duration-300 {isCollapsed ? 'w-16' : 'w-64'}">
  <div class="flex flex-col h-full">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200">
      <div class="flex items-center justify-between">
        {#if !isCollapsed}
          <div class="flex items-center space-x-3">
            <div class="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h1 class="text-lg font-bold text-gray-900">ELS</h1>
          </div>
        {/if}
        
        <button 
          onclick={() => isCollapsed = !isCollapsed}
          class="p-1.5 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={isCollapsed ? "M9 5l7 7-7 7" : "M15 19l-7-7 7-7"} />
          </svg>
        </button>
      </div>
    </div>

    <!-- User Info -->
    {#if currentUser && !isCollapsed}
      <div class="p-4 border-b border-gray-200">
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">
              {currentPerson?.name || currentUser?.name || currentUser?.email || 'User'}
            </p>
            <p class="text-xs text-gray-500 truncate">
              {(currentPerson?.name || currentUser?.name) ? (currentPerson?.email || currentUser?.email) : ''}
            </p>
          </div>
        </div>
      </div>
    {/if}

    <!-- Main Navigation -->
    <div class="flex-1 py-4">
      <ul class="space-y-1 px-3">
        {#each menuItems as item}
          <li>
            <button
              onclick={() => navigate(item.id)}
              class="w-full flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 {
                currentPage === item.id 
                  ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
                  : 'text-gray-700 hover:bg-gray-100'
              }"
            >
              <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
              </svg>
              {#if !isCollapsed}
                <span>{item.label}</span>
              {/if}
            </button>
          </li>
        {/each}

        <!-- Admin Section -->
        {#if isAdmin}
          <li class="pt-4">
            {#if !isCollapsed}
              <div class="px-3 mb-2">
                <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Admin</p>
              </div>
            {/if}
            {#each adminItems as item}
              <button
                onclick={() => navigate(item.id)}
                class="w-full flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 {
                  currentPage === item.id 
                    ? 'bg-purple-50 text-purple-700 border-r-2 border-purple-700' 
                    : 'text-gray-700 hover:bg-gray-100'
                }"
              >
                <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
                </svg>
                {#if !isCollapsed}
                  <span>{item.label}</span>
                {/if}
              </button>
            {/each}
          </li>
        {/if}
      </ul>
    </div>

    <!-- Bottom Actions -->
    <div class="border-t border-gray-200 p-3 space-y-1">
      {#each bottomItems as item}
        <button
          onclick={() => navigate(item.id)}
          class="w-full flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 {
            currentPage === item.id 
              ? 'bg-gray-50 text-gray-900' 
              : 'text-gray-700 hover:bg-gray-100'
          }"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={item.icon} />
          </svg>
          {#if !isCollapsed}
            <span>{item.label}</span>
          {/if}
        </button>
      {/each}

      <!-- Logout -->
      <button
        onclick={handleLogout}
        class="w-full flex items-center {isCollapsed ? 'justify-center' : 'space-x-3'} px-3 py-2.5 text-sm font-medium rounded-lg transition-colors duration-200 text-red-700 hover:bg-red-50"
      >
        <svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
        {#if !isCollapsed}
          <span>Logout</span>
        {/if}
      </button>
    </div>
  </div>
</nav> 