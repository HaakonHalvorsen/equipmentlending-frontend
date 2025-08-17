<script lang="ts">
  import { authStore, authActions } from '../stores/auth.js';
  import { authService, personService } from '../api/index.js';
  import type { PersonProfileUpdate, PasswordChange } from '../api/index.js';

  let loading = false;
  let error = '';
  let success = '';
  let activeTab = 'profile'; // 'profile', 'password', 'account'

  // Profile form
  let profileForm: PersonProfileUpdate = {
    name: '',
    company: '',
    phone: '',
    contact_person_name: '',
    contact_person_email: '',
    contact_person_phone: ''
  };

  // Password form
  let passwordForm: PasswordChange & { confirm_password: string } = {
    current_password: '',
    new_password: '',
    confirm_password: ''
  };

  // Account deletion
  let deleteConfirmText = '';
  let showDeleteConfirm = false;

  // Load current user profile data
  $: if ($authStore.person) {
    profileForm = {
      name: $authStore.person.name || '',
      company: $authStore.person.company || '',
      phone: $authStore.person.phone || '',
      contact_person_name: $authStore.person.contact_person_name || '',
      contact_person_email: $authStore.person.contact_person_email || '',
      contact_person_phone: $authStore.person.contact_person_phone || ''
    };
  }

  function clearMessages() {
    error = '';
    success = '';
  }

  async function handleProfileUpdate(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    clearMessages();

    try {
      const response = await personService.updateCurrentUserProfile(profileForm);
      if (response.success && response.data) {
        success = 'Profile updated successfully!';
        // Update the auth store with the new data
        authStore.update(state => ({
          ...state,
          person: response.data!
        }));
      } else {
        error = response.error || 'Failed to update profile';
      }
    } catch (err) {
      error = 'Failed to update profile';
    } finally {
      loading = false;
    }
  }

  async function handlePasswordChange(event: SubmitEvent) {
    event.preventDefault();
    loading = true;
    clearMessages();

    // Validation
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      error = 'New passwords do not match';
      loading = false;
      return;
    }

    if (passwordForm.new_password.length < 6) {
      error = 'New password must be at least 6 characters long';
      loading = false;
      return;
    }

    try {
      const passwordData: PasswordChange = {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password
      };

      const response = await authService.changePassword(passwordData);
      if (response.success) {
        success = 'Password changed successfully!';
        passwordForm = {
          current_password: '',
          new_password: '',
          confirm_password: ''
        };
      } else {
        error = response.error || 'Failed to change password';
      }
    } catch (err) {
      error = 'Failed to change password';
    } finally {
      loading = false;
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirmText !== 'DELETE') {
      error = 'Please type DELETE to confirm account deletion';
      return;
    }

    loading = true;
    clearMessages();

    try {
      const response = await authService.deleteAccount();
      if (response.success) {
        // The authService already clears the token, so we just need to update the store
        authStore.set({
          user: null,
          person: null,
          token: null,
          isAuthenticated: false
        });
        // Clear localStorage
        localStorage.removeItem('auth_token');
      } else {
        error = response.error || 'Failed to delete account';
      }
    } catch (err) {
      error = 'Failed to delete account';
    } finally {
      loading = false;
    }
  }

  function setActiveTab(tab: string) {
    activeTab = tab;
    clearMessages();
  }
</script>

<div class="p-6 max-w-4xl mx-auto">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">Settings</h1>
    <p class="text-gray-600 mt-2">Manage your account settings and preferences</p>
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

  <!-- Tab Navigation -->
  <div class="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
    <div class="border-b border-gray-200">
      <nav class="flex">
        <button
          onclick={() => setActiveTab('profile')}
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 {
            activeTab === 'profile' 
              ? 'border-blue-500 text-blue-600 bg-blue-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }"
        >
          Profile Information
        </button>
        <button
          onclick={() => setActiveTab('password')}
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 {
            activeTab === 'password' 
              ? 'border-blue-500 text-blue-600 bg-blue-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }"
        >
          Change Password
        </button>
        <button
          onclick={() => setActiveTab('account')}
          class="px-6 py-4 text-sm font-medium border-b-2 transition-colors duration-200 {
            activeTab === 'account' 
              ? 'border-red-500 text-red-600 bg-red-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }"
        >
          Account Management
        </button>
      </nav>
    </div>

    <div class="p-6">
      <!-- Profile Information Tab -->
      {#if activeTab === 'profile'}
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Profile Information</h2>
            <p class="text-gray-600">Update your personal details and contact information.</p>
          </div>

          <form onsubmit={handleProfileUpdate} class="space-y-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Name -->
              <div>
                <label for="name" class="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  id="name"
                  bind:value={profileForm.name}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <!-- Company -->
              <div>
                <label for="company" class="block text-sm font-medium text-gray-700 mb-2">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  bind:value={profileForm.company}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- Phone -->
              <div>
                <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  bind:value={profileForm.phone}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- Contact Person Name -->
              <div>
                <label for="contact_person_name" class="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Name
                </label>
                <input
                  type="text"
                  id="contact_person_name"
                  bind:value={profileForm.contact_person_name}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- Contact Person Email -->
              <div>
                <label for="contact_person_email" class="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Email
                </label>
                <input
                  type="email"
                  id="contact_person_email"
                  bind:value={profileForm.contact_person_email}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <!-- Contact Person Phone -->
              <div>
                <label for="contact_person_phone" class="block text-sm font-medium text-gray-700 mb-2">
                  Contact Person Phone
                </label>
                <input
                  type="tel"
                  id="contact_person_phone"
                  bind:value={profileForm.contact_person_phone}
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div class="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Updating...' : 'Update Profile'}
              </button>
            </div>
          </form>
        </div>

      <!-- Change Password Tab -->
      {:else if activeTab === 'password'}
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Change Password</h2>
            <p class="text-gray-600">Update your account password for better security.</p>
          </div>

          <form onsubmit={handlePasswordChange} class="space-y-4 max-w-md">
            <!-- Current Password -->
            <div>
              <label for="current_password" class="block text-sm font-medium text-gray-700 mb-2">
                Current Password *
              </label>
              <input
                type="password"
                id="current_password"
                bind:value={passwordForm.current_password}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <!-- New Password -->
            <div>
              <label for="new_password" class="block text-sm font-medium text-gray-700 mb-2">
                New Password *
              </label>
              <input
                type="password"
                id="new_password"
                bind:value={passwordForm.new_password}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minlength="6"
              />
              <p class="text-xs text-gray-500 mt-1">Password must be at least 6 characters long</p>
            </div>

            <!-- Confirm New Password -->
            <div>
              <label for="confirm_password" class="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password *
              </label>
              <input
                type="password"
                id="confirm_password"
                bind:value={passwordForm.confirm_password}
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
                minlength="6"
              />
            </div>

            <div class="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Changing...' : 'Change Password'}
              </button>
            </div>
          </form>
        </div>

      <!-- Account Management Tab -->
      {:else if activeTab === 'account'}
        <div class="space-y-6">
          <div>
            <h2 class="text-xl font-semibold text-gray-900 mb-2">Account Management</h2>
            <p class="text-gray-600">Permanently delete your account and all associated data.</p>
          </div>

          <div class="bg-red-50 border border-red-200 rounded-lg p-6">
            <div class="flex items-start space-x-3">
              <svg class="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div class="flex-1">
                <h3 class="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                <p class="text-red-700 mb-4">
                  This action is permanent and cannot be undone. All your data, including lending history and profile information, will be permanently deleted.
                </p>

                {#if !showDeleteConfirm}
                  <button
                    onclick={() => showDeleteConfirm = true}
                    class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Delete Account
                  </button>
                {:else}
                  <div class="space-y-4">
                    <div>
                      <label for="delete_confirm" class="block text-sm font-medium text-red-800 mb-2">
                        Type "DELETE" to confirm account deletion:
                      </label>
                      <input
                        type="text"
                        id="delete_confirm"
                        bind:value={deleteConfirmText}
                        class="w-full max-w-xs px-3 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        placeholder="DELETE"
                      />
                    </div>

                    <div class="flex space-x-3">
                      <button
                        onclick={handleDeleteAccount}
                        disabled={loading || deleteConfirmText !== 'DELETE'}
                        class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? 'Deleting...' : 'Confirm Delete'}
                      </button>
                      <button
                        onclick={() => { showDeleteConfirm = false; deleteConfirmText = ''; }}
                        disabled={loading}
                        class="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded-lg transition-colors duration-200"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                {/if}
              </div>
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>
