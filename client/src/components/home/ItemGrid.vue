<template>
  <main class="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex-1">
    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      <!-- Feed Meta Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-outline-variant/20 pb-3">
        <div class="flex items-center gap-2">
          <h3 class="font-headline-sm text-lg sm:text-headline-sm text-on-surface font-bold">
            Active Campus Items
          </h3>
          <span class="font-label-sm text-label-sm px-2.5 py-0.5 rounded-full bg-surface-variant text-on-surface-variant font-semibold">
            Showing {{ items.length }} {{ items.length === 1 ? 'match' : 'matches' }}
          </span>
        </div>

        <div class="flex items-center gap-3 text-on-surface-variant font-label-sm text-xs sm:text-label-sm">
          <span>Sort by:</span>
          <div class="relative inline-block">
            <select
              :value="sortBy"
              class="font-semibold text-primary bg-transparent border-0 pr-5 cursor-pointer focus:outline-none"
              @change="$emit('update:sortBy', $event.target.value)"
            >
              <option value="recent">Most Recent</option>
              <option value="name">Name (A-Z)</option>
              <option value="location">Location</option>
            </select>
            <span class="material-symbols-outlined pointer-events-none absolute right-0 top-0.5 text-[16px] text-primary">
              expand_more
            </span>
          </div>
        </div>
      </div>

      <!-- Loading Skeleton State -->
      <div
        v-if="isLoading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <div
          v-for="n in 6"
          :key="n"
          class="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 flex flex-col gap-4 animate-pulse"
        >
          <div class="flex items-center justify-between">
            <div class="h-5 w-20 bg-surface-container-high rounded-full"></div>
            <div class="h-4 w-16 bg-surface-container-high rounded"></div>
          </div>
          <div class="flex items-center gap-4">
            <div class="w-20 h-20 bg-surface-container-high rounded-xl flex-shrink-0"></div>
            <div class="flex-1 flex flex-col gap-2">
              <div class="h-5 w-3/4 bg-surface-container-high rounded"></div>
              <div class="h-4 w-1/2 bg-surface-container-high rounded"></div>
              <div class="h-3 w-2/3 bg-surface-container-high rounded"></div>
            </div>
          </div>
          <div class="h-14 bg-surface-container-low rounded-xl"></div>
          <div class="h-10 bg-surface-container-high rounded-lg mt-1"></div>
        </div>
      </div>

      <!-- High Density Responsive Card Grid -->
      <div
        v-else-if="items.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6"
      >
        <ItemCard
          v-for="item in items"
          :key="item.id"
          :item="item"
          :current-user="currentUser"
          @claim="$emit('claim', $event)"
          @spotted="$emit('spotted', $event)"
          @review-claims="$emit('review-claims', $event)"
          @found-this="$emit('found-this', $event)"
          @review-found-reports="$emit('review-found-reports', $event)"
          @view-reunion-record="$emit('view-reunion-record', $event)"
        />
      </div>

      <!-- Empty State -->
      <div
        v-else
        class="bg-surface-container-lowest p-8 sm:p-12 rounded-2xl border border-outline-variant/30 shadow-sm text-center flex flex-col items-center justify-center py-14 sm:py-16"
      >
        <div class="w-16 h-16 rounded-2xl bg-surface-container-low flex items-center justify-center text-outline mb-4">
          <span class="material-symbols-outlined text-[36px]">search_off</span>
        </div>
        <h4 class="font-headline-md text-xl sm:text-headline-md text-on-surface font-bold mb-1">
          No Matching Items Found
        </h4>
        <p class="font-body-md text-sm sm:text-body-md text-on-surface-variant max-w-md mb-6">
          There are no reported lost or found items matching your selected criteria in the Campus Findr registry.
        </p>
        <div class="flex items-center gap-3 flex-wrap justify-center">
          <button
            type="button"
            class="h-11 px-5 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-colors min-h-[44px]"
            @click="$emit('open-report', 'lost')"
          >
            Post Lost Item Alert
          </button>
          <button
            type="button"
            class="h-11 px-4 rounded-xl bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md transition-colors min-h-[44px]"
            @click="$emit('reset-filters')"
          >
            Clear All Filters
          </button>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import ItemCard from './ItemCard.vue';

defineProps({
  items: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  sortBy: {
    type: String,
    default: 'recent'
  },
  currentUser: {
    type: Object,
    default: null
  }
});

defineEmits([
  'claim',
  'spotted',
  'open-report',
  'reset-filters',
  'update:sortBy',
  'review-claims',
  'found-this',
  'review-found-reports',
  'view-reunion-record'
]);
</script>
