<template>
  <header class="fixed top-0 w-full z-40 bg-surface-container-lowest/95 backdrop-blur-xl border-b border-outline-variant/30 shadow-[0_1px_8px_rgba(0,0,0,0.03)] transition-all">
    <div class="h-16 sm:h-20 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 flex items-center justify-between gap-2 sm:gap-6">
      <!-- Left: Logo & University Badge -->
      <div class="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 sm:flex-initial">
        <a href="#" class="flex items-center gap-2 group focus:outline-none focus:ring-2 focus:ring-primary rounded-xl" title="Campus Findr Home">
          <div class="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary shadow-sm group-hover:bg-primary-container transition-colors flex-shrink-0">
            <span class="material-symbols-outlined text-[20px] sm:text-[24px]">explore</span>
          </div>
          <span class="font-headline-md text-base sm:text-headline-md font-bold tracking-tight text-on-surface truncate">
            Campus Findr
          </span>
        </a>

        <!-- Campus Pill Badge (Hidden on mobile & small tablets, visible from md up) -->
        <div class="hidden md:flex items-center gap-1.5 px-3 py-1 bg-surface-container-low rounded-full text-on-surface-variant font-label-sm text-label-sm border border-outline-variant/20 truncate">
          <span class="material-symbols-outlined text-[15px] text-primary flex-shrink-0">school</span>
          <span class="truncate">State University • All Campuses</span>
        </div>
      </div>

      <!-- Right: Live System Status & Action Buttons -->
      <div class="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
        <!-- Live System Status indicator (Tablet/Desktop) -->
        <div
          class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
          :class="isOnline ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 'bg-amber-100 text-amber-800 border border-amber-200'"
          :title="isOnline ? `SQLite Database Online • ${totalItems} Items Logged` : 'Connecting to campus database...'"
        >
          <span class="relative flex h-2 w-2">
            <span
              v-if="isOnline"
              class="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"
            ></span>
            <span
              class="relative inline-flex rounded-full h-2 w-2"
              :class="isOnline ? 'bg-tertiary' : 'bg-amber-600'"
            ></span>
          </span>
          <span class="font-label-sm">
            {{ isOnline ? `${totalItems} Active` : 'Offline' }}
          </span>
        </div>

        <!-- Primary Action: Report Button -->
        <button
          type="button"
          class="h-9 sm:h-11 px-2.5 sm:px-4 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition-all duration-150 active:scale-95 min-h-[38px] sm:min-h-[44px]"
          @click="$emit('open-report', 'lost')"
        >
          <span class="material-symbols-outlined text-[18px]">add_alert</span>
          <span class="hidden sm:inline">Report Item</span>
          <span class="sm:hidden text-xs">Report</span>
        </button>

        <!-- Current Authenticated Student Identity & Logout -->
        <div v-if="currentUser" class="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low rounded-xl border border-outline-variant/30 text-xs font-semibold text-on-surface">
          <span class="material-symbols-outlined text-[16px] text-primary">account_circle</span>
          <span class="truncate max-w-[120px]">{{ currentUser.fullName }}</span>
          <span class="text-outline">({{ currentUser.studentId }})</span>
        </div>

        <button
          v-if="currentUser"
          type="button"
          class="h-9 sm:h-11 px-2.5 sm:px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface-variant hover:text-error font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1 border border-outline-variant/30 transition-colors cursor-pointer"
          title="Sign Out of Campus Findr"
          @click="$emit('logout')"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span class="hidden sm:inline">Sign Out</span>
        </button>

        <!-- Mobile Drawer Toggle -->
        <button
          type="button"
          class="md:hidden w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface flex items-center justify-center transition-colors min-h-[38px]"
          aria-label="Toggle navigation menu"
          @click="mobileMenuOpen = !mobileMenuOpen"
        >
          <span class="material-symbols-outlined text-[20px]">
            {{ mobileMenuOpen ? 'close' : 'menu' }}
          </span>
        </button>
      </div>
    </div>

    <!-- Mobile Drawer Menu (Visible when hamburger is clicked on <= 768px screens) -->
    <div
      v-if="mobileMenuOpen"
      class="md:hidden border-t border-outline-variant/30 bg-surface-container-lowest px-4 py-3 flex flex-col gap-2.5 animate-slide-down shadow-lg"
    >
      <div class="flex items-center gap-2 px-1 py-1 text-on-surface-variant text-xs">
        <span class="material-symbols-outlined text-[16px] text-primary">school</span>
        <span>State University • All Campuses</span>
      </div>

      <div class="flex items-center justify-between px-2 py-2 bg-surface-container-low rounded-lg text-xs">
        <span class="text-on-surface font-semibold">Database Status:</span>
        <span class="inline-flex items-center gap-1 text-tertiary font-bold">
          <span class="w-2 h-2 rounded-full bg-tertiary"></span>
          {{ isOnline ? `Online (${totalItems} items in SQLite)` : 'Reconnecting...' }}
        </span>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-1">
        <button
          type="button"
          class="h-11 px-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 font-label-md text-label-md flex items-center justify-center gap-1.5"
          @click="mobileMenuOpen = false; $emit('open-report', 'lost')"
        >
          <span class="material-symbols-outlined text-[18px]">add_alert</span>
          <span>Lost Alert</span>
        </button>
        <button
          type="button"
          class="h-11 px-3 rounded-lg bg-tertiary/10 text-tertiary hover:bg-tertiary/20 font-label-md text-label-md flex items-center justify-center gap-1.5"
          @click="mobileMenuOpen = false; $emit('open-report', 'found')"
        >
          <span class="material-symbols-outlined text-[18px]">qr_code_scanner</span>
          <span>Log Found</span>
        </button>
      </div>

      <!-- Mobile User Info & Sign Out -->
      <div v-if="currentUser" class="pt-2 border-t border-outline-variant/30 flex flex-col gap-2">
        <div class="flex items-center gap-2 px-1 text-xs text-on-surface font-semibold">
          <span class="material-symbols-outlined text-[18px] text-primary">account_circle</span>
          <span>{{ currentUser.fullName }} ({{ currentUser.studentId }})</span>
        </div>
        <button
          type="button"
          class="h-10 px-3 rounded-lg bg-error-container/20 text-error font-label-md text-xs font-semibold flex items-center justify-center gap-1.5"
          @click="mobileMenuOpen = false; $emit('logout')"
        >
          <span class="material-symbols-outlined text-[18px]">logout</span>
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  isOnline: {
    type: Boolean,
    default: true
  },
  totalItems: {
    type: Number,
    default: 0
  },
  currentUser: {
    type: Object,
    default: null
  }
});

defineEmits(['open-report', 'open-keyword-alert', 'logout']);

const mobileMenuOpen = ref(false);
</script>
