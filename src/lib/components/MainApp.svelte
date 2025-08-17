<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, authActions } from '../stores/auth.js';
  import Navigation from './Navigation.svelte';
  import Home from './Home.svelte';
  import UserManagement from './UserManagement.svelte';
  import EquipmentManagement from './EquipmentManagement.svelte';
  import LendingHistory from './LendingHistory.svelte';
  import Settings from './Settings.svelte';
  import Login from './Login.svelte';

  let currentPage = 'home';
  let isAuthenticated = false;

  // Subscribe to auth store
  $: isAuthenticated = $authStore.isAuthenticated;

  // Ensure home page is shown when user becomes authenticated
  $: if (isAuthenticated) {
    currentPage = 'home';
  }

  onMount(async () => {
    await authActions.init();
  });

  function handleNavigation(page: string) {
    currentPage = page;
  }

  function renderCurrentPage() {
    switch (currentPage) {
      case 'home':
        return Home;
      case 'history':
        return LendingHistory;
      case 'admin':
        return UserManagement;
      case 'equipment':
        return EquipmentManagement;
      case 'settings':
        return Settings;
      default:
        return Home;
    }
  }
</script>

{#if !isAuthenticated}
  <Login />
{:else}
  <div class="flex min-h-screen bg-gray-50">
    <!-- Navigation Sidebar -->
    <Navigation {currentPage} onNavigate={handleNavigation} />
    
    <!-- Main Content -->
    <div class="flex-1 ml-64 transition-all duration-300">
      <main class="min-h-screen">
        <svelte:component this={renderCurrentPage()} />
      </main>
    </div>
  </div>
{/if} 