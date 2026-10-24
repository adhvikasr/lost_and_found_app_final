<template>
  <main class="flex-1 flex flex-col relative w-full bg-surface pt-safe pb-safe min-h-screen items-center justify-center">
    <div class="flex flex-col w-full items-center justify-center py-6 px-4">
      <!-- Primary Collegiate Authentication Card -->
      <div class="w-full max-w-sm bg-surface-container-lowest rounded-xl shadow-md p-6 sm:p-8 flex flex-col relative overflow-hidden">
        <!-- Subtle collegiate accent strip at top edge -->
        <div class="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary-container to-secondary"></div>

        <!-- Header & Seal -->
        <div class="flex flex-col items-center text-center mt-2 mb-6">
          <div class="relative w-16 h-16 rounded-full bg-surface-container-low p-1 shadow-sm mb-3.5 flex items-center justify-center">
            <img
              alt="Campus Lost and Found Official Crest"
              class="w-14 h-14 object-contain rounded-full"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAqfa2QuhoAf-DJqpfc4jl4JdoJ5KPHUkujtnA5wQGY_ooW5A54TZsVaf54wM5UfBW6VGn_gIQ7GDjos2DTfWqMN9OdG2KpPXmr7LGmU7oXtpdQ1jck9jg_XlgrIFpZizN54JingAYVWHLc0yFIx1q-OzF5jIfhonylxyZ-Q_sk0ANoKUtxYWQE53EcoBkWjWHveQkhzxIok2HCkihsq9bdqsWKVwlujhjt0q9xCXQNBMSdwaB-wfbb"
            >
          </div>
          <h1 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface tracking-tight">
            Welcome Back
          </h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1.5 max-w-xs">
            Sign in to access your Campus Lost &amp; Found account.
          </p>
        </div>

        <!-- Error Alert Banner -->
        <div
          v-if="errorMessage"
          id="error-banner"
          class="mb-5 bg-error-container text-on-error-container rounded-lg p-3.5 flex items-start gap-2.5 transition-all duration-200"
        >
          <span class="material-symbols-outlined text-error text-xl shrink-0 mt-0.5">error</span>
          <div class="flex flex-col flex-1 min-w-0">
            <span class="font-label-sm text-label-sm text-error font-semibold">Authentication Failed</span>
            <span class="font-body-sm text-body-sm text-on-error-container leading-tight mt-0.5">
              {{ errorMessage }}
            </span>
          </div>
        </div>

        <!-- Login Form -->
        <form id="login-form" class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
          <!-- Username Field -->
          <div class="flex flex-col gap-1.5 text-left">
            <label class="font-label-md text-label-md text-on-surface" for="username-input">
              Username
            </label>
            <div
              id="username-wrapper"
              class="relative flex items-center bg-surface-container-lowest rounded-lg shadow-xs transition-all duration-150"
            >
              <div
                id="username-icon-container"
                class="absolute left-3 flex items-center pointer-events-none transition-colors"
                :class="isUsernameFocused ? 'text-primary' : 'text-outline'"
              >
                <span class="material-symbols-outlined text-xl">badge</span>
              </div>
              <input
                id="username-input"
                v-model.trim="username"
                autocomplete="username"
                class="w-full font-body-md text-body-md rounded-lg pl-10 pr-3.5 py-2.5 outline-none transition-all placeholder:text-outline-variant"
                :class="isUsernameFocused ? 'bg-surface-container-lowest shadow-md text-on-surface' : 'bg-surface-container-low text-on-surface'"
                name="username"
                placeholder="Enter your username"
                type="text"
                @focus="isUsernameFocused = true"
                @blur="isUsernameFocused = false"
              >
            </div>
          </div>

          <!-- Password Field -->
          <div class="flex flex-col gap-1.5 text-left">
            <label class="font-label-md text-label-md text-on-surface" for="password-input">
              Password
            </label>
            <div
              id="password-wrapper"
              class="relative flex items-center bg-surface-container-lowest rounded-lg shadow-xs transition-all duration-150"
            >
              <div
                id="password-icon-container"
                class="absolute left-3 flex items-center pointer-events-none transition-colors"
                :class="isPasswordFocused ? 'text-primary' : 'text-outline'"
              >
                <span class="material-symbols-outlined text-xl">lock</span>
              </div>
              <input
                id="password-input"
                v-model="password"
                autocomplete="current-password"
                class="w-full font-body-md text-body-md rounded-lg pl-10 pr-11 py-2.5 outline-none transition-all placeholder:text-outline-variant"
                :class="isPasswordFocused ? 'bg-surface-container-lowest shadow-md text-on-surface' : 'bg-surface-container-low text-on-surface'"
                name="password"
                placeholder="Enter your password"
                :type="isPasswordRevealed ? 'text' : 'password'"
                @focus="isPasswordFocused = true"
                @blur="isPasswordFocused = false"
              >
              <button
                id="toggle-password-btn"
                aria-label="Toggle password visibility"
                class="absolute right-2 p-1.5 flex items-center text-outline hover:text-on-surface transition-colors focus:outline-none"
                type="button"
                @click="isPasswordRevealed = !isPasswordRevealed"
              >
                <span
                  id="password-eye-icon"
                  class="material-symbols-outlined text-xl transition-colors"
                  :class="isPasswordRevealed ? 'text-primary' : ''"
                >
                  {{ isPasswordRevealed ? 'visibility_off' : 'visibility' }}
                </span>
              </button>
            </div>
          </div>

          <!-- Action Button -->
          <div class="mt-2 flex flex-col">
            <button
              id="submit-btn"
              class="w-full bg-primary-container text-on-primary font-label-lg text-label-lg rounded-xl py-3 px-4 flex items-center justify-center gap-2 shadow-sm hover:shadow-md active:scale-[0.99] transition-all cursor-pointer"
              :class="isLoading ? 'opacity-75 cursor-not-allowed' : ''"
              :disabled="isLoading"
              type="submit"
            >
              <span v-if="isLoading" id="btn-spinner">
                <svg class="animate-spin h-5 w-5 text-on-primary" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"></path>
                </svg>
              </span>
              <span id="btn-text">{{ isLoading ? 'Signing in...' : 'Sign In' }}</span>
            </button>
          </div>
        </form>

        <!-- Academic Community Security Trustmark -->
        <div class="mt-6 pt-4 flex flex-col items-center justify-center text-center">
          <div class="flex items-center gap-1.5 text-on-surface-variant font-label-sm text-label-sm">
            <span class="material-symbols-outlined text-secondary text-base">verified_user</span>
            <span>Campus Lost &amp; Found Demo Access</span>
          </div>
          <p class="font-body-sm text-body-sm text-outline mt-1">
            Campus Lost &amp; Found · Student Community
          </p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref } from 'vue';

const emit = defineEmits(['login-success']);

const username = ref('');
const password = ref('');
const isPasswordRevealed = ref(false);
const isUsernameFocused = ref(false);
const isPasswordFocused = ref(false);
const isLoading = ref(false);
const errorMessage = ref('');

async function handleSubmit() {
  errorMessage.value = '';

  if (!username.value || !password.value) {
    errorMessage.value = 'Please enter both username and password.';
    return;
  }

  isLoading.value = true;

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        username: username.value,
        password: password.value
      })
    });

    const contentType = res.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      if (!res.ok) {
        throw new Error(
          res.status === 404
            ? 'Authentication service endpoint not found (HTTP 404). Please ensure the backend server is running.'
            : `Server returned unexpected non-JSON response (HTTP ${res.status}): ${text.slice(0, 100)}`
        );
      }
      throw new Error('Received unexpected non-JSON response from server.');
    }

    if (!res.ok) {
      throw new Error(data?.error || 'Authentication failed. Please check your credentials.');
    }

    emit('login-success', data.user);
  } catch (err) {
    errorMessage.value = err.message || 'Authentication failed. Please check your credentials and try again.';
  } finally {
    isLoading.value = false;
  }
}
</script>
