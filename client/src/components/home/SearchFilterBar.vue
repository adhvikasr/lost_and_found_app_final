<template>
  <section class="w-full px-3 sm:px-6 lg:px-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-4 bg-surface-container-lowest p-3.5 sm:p-6 rounded-2xl border border-outline-variant/30 shadow-sm">
      <!-- Primary Keyboard-Enabled Search Bar -->
      <div class="relative w-full">
        <div class="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
          <span class="material-symbols-outlined text-[22px] sm:text-[24px]">search</span>
        </div>
        <input
          ref="searchInputRef"
          :value="modelValue.search"
          type="text"
          class="w-full h-11 sm:h-14 pl-11 pr-16 sm:pr-28 rounded-xl bg-surface-container-low text-on-surface placeholder:text-outline font-body-md text-xs sm:text-base focus:bg-surface-container-lowest focus:outline-none focus:ring-2 focus:ring-primary shadow-inner transition-all"
          placeholder="Search AirPods, Hydro Flask, Student ID, Calc..."
          @input="onSearchInput"
        >
        <!-- Shortcut badge or clear button -->
        <div class="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center gap-1.5">
          <button
            v-if="modelValue.search"
            type="button"
            class="text-outline hover:text-on-surface p-1 rounded-md"
            title="Clear search"
            @click="clearSearch"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
          <kbd class="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[11px] font-mono font-semibold text-outline bg-surface-container rounded border border-outline-variant/40">
            <span>⌘</span>K
          </kbd>
        </div>
      </div>

      <!-- Controls Row: Tabs & Facet Dropdowns -->
      <div class="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 pt-1">
        <!-- Status View Tabs Container: Two Categories (All Items & Reunited List) -->
        <div class="w-full lg:w-auto overflow-x-auto no-scrollbar py-0.5">
          <div class="inline-flex p-1 bg-surface-container-low rounded-xl min-w-max">
            <!-- All Items (Not Reunited) Tab -->
            <button
              type="button"
              :class="[
                'px-3 sm:px-4 py-2 rounded-lg font-label-md text-xs sm:text-label-md transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] cursor-pointer',
                activeTab === 'active'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              ]"
              @click="selectTab('active')"
            >
              <span class="w-2 h-2 rounded-full bg-primary"></span>
              <span>All Items</span>
              <span class="bg-surface-container px-1.5 py-0.5 rounded text-on-surface font-semibold text-[11px]">
                {{ (stats.found || 0) + (stats.lost || 0) }}
              </span>
            </button>

            <!-- Reunited List Tab -->
            <button
              type="button"
              :class="[
                'px-3 sm:px-4 py-2 rounded-lg font-label-md text-xs sm:text-label-md transition-all flex items-center gap-1.5 whitespace-nowrap min-h-[38px] cursor-pointer',
                activeTab === 'claimed'
                  ? 'bg-surface-container-lowest text-primary font-bold shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              ]"
              @click="selectTab('claimed')"
            >
              <span class="w-2 h-2 rounded-full bg-tertiary"></span>
              <span>Reunited List</span>
              <span class="bg-surface-container px-1.5 py-0.5 rounded text-on-surface font-semibold text-[11px]">
                {{ stats.claimed || 0 }}
              </span>
            </button>
          </div>
        </div>

        <!-- Quick Filters Grid (Responsive for Mobile 360-390px) -->
        <div class="grid grid-cols-2 sm:flex sm:items-center sm:flex-wrap gap-2 w-full lg:w-auto">
          <!-- Filter by Name -->
          <div class="col-span-2 sm:flex-none">
            <input
              :value="modelValue.nameFilter"
              type="text"
              placeholder="Filter by Name..."
              class="h-10 pl-3 pr-3 rounded-lg bg-surface-container-low text-on-surface font-label-md text-xs sm:text-label-md placeholder:text-outline focus:outline-none focus:ring-1 focus:ring-primary border-0 w-full sm:w-36 lg:w-40 min-h-[40px]"
              @input="onNameInput"
            >
          </div>

          <!-- Status Select (Lost / Found filter) -->
          <div class="relative w-full sm:w-auto">
            <select
              :value="modelValue.status"
              class="w-full sm:w-auto h-10 pl-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-md text-xs sm:text-label-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer min-h-[40px]"
              @change="onFilterChange('status', $event.target.value)"
            >
              <option value="all">All Statuses</option>
              <option value="lost">Lost</option>
              <option value="found">Found</option>
            </select>
            <span class="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[18px] text-outline">
              arrow_drop_down
            </span>
          </div>

          <!-- Category Select -->
          <div class="relative w-full sm:w-auto">
            <select
              :value="modelValue.category"
              class="w-full sm:w-auto h-10 pl-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-md text-xs sm:text-label-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer min-h-[40px]"
              @change="onFilterChange('category', $event.target.value)"
            >
              <option value="all">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="bags-keys">Bags &amp; Keys</option>
              <option value="ids-cards">IDs &amp; Cards</option>
              <option value="books-supplies">Books &amp; Supplies</option>
              <option value="accessories">Accessories</option>
              <option value="clothing">Clothing</option>
            </select>
            <span class="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[18px] text-outline">
              arrow_drop_down
            </span>
          </div>

          <!-- Location Select -->
          <div class="relative col-span-1 sm:w-auto">
            <select
              :value="modelValue.location"
              class="w-full sm:w-auto h-10 pl-3 pr-8 rounded-lg bg-surface-container-low text-on-surface font-label-md text-xs sm:text-label-md focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer min-h-[40px]"
              @change="onFilterChange('location', $event.target.value)"
            >
              <option value="all">All Locations</option>
              <option value="Library">Library</option>
              <option value="Student Union">Student Union</option>
              <option value="Science">Science Building</option>
              <option value="Dormitories">Dormitories</option>
              <option value="Rec Center">Rec Center</option>
              <option value="Engineering">Engineering</option>
            </select>
            <span class="material-symbols-outlined pointer-events-none absolute right-2 top-2.5 text-[18px] text-outline">
              arrow_drop_down
            </span>
          </div>

          <!-- Refresh Button -->
          <button
            type="button"
            class="col-span-1 sm:w-auto h-10 px-3 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1.5 transition-colors min-h-[40px]"
            title="Refresh item feed"
            @click="$emit('reset-filters')"
          >
            <span class="material-symbols-outlined text-[18px] text-outline">refresh</span>
            <span>Refresh</span>
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  activeTab: {
    type: String,
    default: 'active'
  },
  stats: {
    type: Object,
    default: () => ({ found: 0, lost: 0, claimed: 0 })
  }
});

const emit = defineEmits(['update:modelValue', 'update:activeTab', 'reset-filters', 'search-change']);

const searchInputRef = ref(null);

function onSearchInput(e) {
  emit('update:modelValue', {
    ...props.modelValue,
    search: e.target.value
  });
  emit('search-change');
}

function clearSearch() {
  emit('update:modelValue', {
    ...props.modelValue,
    search: ''
  });
  emit('search-change');
  if (searchInputRef.value) searchInputRef.value.focus();
}

function onNameInput(e) {
  emit('update:modelValue', {
    ...props.modelValue,
    nameFilter: e.target.value
  });
  emit('search-change');
}

function onFilterChange(field, val) {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: val
  });
  emit('search-change');
}

function selectTab(tab) {
  emit('update:activeTab', tab);
}

function handleGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    if (searchInputRef.value) searchInputRef.value.focus();
  } else if (e.key === '/' && document.activeElement !== searchInputRef.value && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
    e.preventDefault();
    if (searchInputRef.value) searchInputRef.value.focus();
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleGlobalKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
});
</script>
