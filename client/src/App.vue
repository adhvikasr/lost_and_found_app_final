<template>
  <div class="min-h-screen flex flex-col bg-background font-body-md text-body-md text-on-surface antialiased selection:bg-primary-fixed selection:text-on-primary-fixed-variant">
    <!-- Fixed Header -->
    <AppHeader
      :is-online="serverStatus.online"
      :total-items="stats.total || items.length"
      @open-report="openReportModal"
      @open-keyword-alert="isKeywordModalOpen = true"
    />

    <!-- Main Content Container with Top Padding for Fixed Header -->
    <div class="pt-16 sm:pt-20 flex-1 flex flex-col w-full">
      <!-- Hero Workspace: Dual Interactive Action Launchpads -->
      <HeroWorkspace
        @open-report="openReportModal"
      />

      <!-- Instant Search & Faceted Filter Section -->
      <SearchFilterBar
        v-model="filters"
        v-model:active-tab="currentActiveTab"
        :stats="stats"
        @reset-filters="resetFilters"
        @search-change="fetchItemsDebounced"
      />

      <!-- Campus Advisory Banner (Optional Toggle) -->
      <div v-if="showAdvisory" class="w-full px-4 sm:px-6 lg:px-8 mt-4">
        <div class="max-w-7xl mx-auto bg-error-container/40 p-4 sm:p-5 rounded-2xl border border-error/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div class="flex items-center gap-3 text-error">
            <span class="material-symbols-outlined text-[26px] flex-shrink-0">gpp_maybe</span>
            <div>
              <span class="font-headline-sm text-sm sm:text-headline-sm font-bold block">
                CAMPUS ADVISORY: Midterms Period High Volume Alert
              </span>
              <span class="font-body-sm text-xs sm:text-body-sm text-on-surface">
                All found high-value items in Library &amp; Student Union are routed directly to <strong>Campus Safety Vault (Bldg 12)</strong>.
              </span>
            </div>
          </div>
          <button
            type="button"
            class="text-outline hover:text-on-surface p-1 rounded-md self-end sm:self-center"
            @click="showAdvisory = false"
          >
            <span class="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      </div>

      <!-- Active Campus Items Grid -->
      <ItemGrid
        :items="filteredItems"
        :is-loading="itemsLoading"
        v-model:sort-by="sortBy"
        @claim="openClaimModal"
        @spotted="openSpottedModal"
        @open-report="openReportModal"
        @reset-filters="resetFilters"
      />
    </div>

    <!-- Footer -->
    <AppFooter
      @show-info="openInfoModal"
    />

    <!-- Modals -->
    <ReportItemModal
      :is-open="isReportModalOpen"
      :type="reportModalType"
      @close="isReportModalOpen = false"
      @created="handleItemCreated"
    />

    <ClaimModal
      :is-open="isClaimModalOpen"
      :item="selectedItemForClaim"
      @close="isClaimModalOpen = false"
      @claimed="handleItemClaimed"
    />

    <SpottedModal
      :is-open="isSpottedModalOpen"
      :item="selectedItemForSpotted"
      @close="isSpottedModalOpen = false"
      @confirmed="handleSpottedConfirmed"
    />

    <KeywordAlertModal
      :is-open="isKeywordModalOpen"
      @close="isKeywordModalOpen = false"
      @activated="handleKeywordActivated"
    />

    <InfoModal
      :is-open="isInfoModalOpen"
      :content-type="infoModalType"
      @close="isInfoModalOpen = false"
    />

    <!-- Toast Notification -->
    <ToastNotification ref="toastRef" />
  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue';
import AppHeader from './components/common/AppHeader.vue';
import AppFooter from './components/common/AppFooter.vue';
import HeroWorkspace from './components/home/HeroWorkspace.vue';
import SearchFilterBar from './components/home/SearchFilterBar.vue';
import ItemGrid from './components/home/ItemGrid.vue';
import ReportItemModal from './components/modals/ReportItemModal.vue';
import ClaimModal from './components/modals/ClaimModal.vue';
import SpottedModal from './components/modals/SpottedModal.vue';
import KeywordAlertModal from './components/modals/KeywordAlertModal.vue';
import InfoModal from './components/modals/InfoModal.vue';
import ToastNotification from './components/common/ToastNotification.vue';

// Server health state
const serverStatus = reactive({
  online: false,
  checking: true,
  latency: 0
});

// Stats state
const stats = reactive({
  total: 0,
  found: 0,
  lost: 0,
  claimed: 0
});

// Items state
const items = ref([]);
const itemsLoading = ref(false);
const sortBy = ref('recent');
const showAdvisory = ref(false);

// Active Tab ('found' | 'lost' | 'claimed')
const currentActiveTab = ref('found');

// Filters
const filters = reactive({
  search: '',
  nameFilter: '',
  status: 'all',
  category: 'all',
  location: 'all'
});

// Modals State
const isReportModalOpen = ref(false);
const reportModalType = ref('lost');
const isClaimModalOpen = ref(false);
const selectedItemForClaim = ref(null);
const isSpottedModalOpen = ref(false);
const selectedItemForSpotted = ref(null);
const isKeywordModalOpen = ref(false);
const isInfoModalOpen = ref(false);
const infoModalType = ref('faq');

// Toast
const toastRef = ref(null);

// Filtered and Sorted Items
const filteredItems = computed(() => {
  let list = [...items.value];

  // Tab filter: if tab is explicitly selected, prioritize tab status
  if (currentActiveTab.value === 'found') {
    list = list.filter(i => (i.status || '').toLowerCase() === 'found');
  } else if (currentActiveTab.value === 'lost') {
    list = list.filter(i => (i.status || '').toLowerCase() === 'lost');
  } else if (currentActiveTab.value === 'claimed') {
    list = list.filter(i => (i.status || '').toLowerCase() === 'claimed');
  }

  // Name filter
  if (filters.nameFilter && filters.nameFilter.trim()) {
    const q = filters.nameFilter.trim().toLowerCase();
    list = list.filter(i => (i.name || '').toLowerCase().includes(q));
  }

  // Sort
  if (sortBy.value === 'name') {
    list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  } else if (sortBy.value === 'location') {
    list.sort((a, b) => (a.location || '').localeCompare(b.location || ''));
  } else {
    // Most recent
    list.sort((a, b) => (b.id || 0) - (a.id || 0));
  }

  return list;
});

// When active tab changes, update or clear status filter to match
watch(currentActiveTab, () => {
  fetchItems();
});

async function fetchHealth() {
  serverStatus.checking = true;
  const start = performance.now();
  try {
    const res = await fetch('/api/health');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    serverStatus.online = data.status === 'ok';
    serverStatus.latency = Math.round(performance.now() - start);
  } catch {
    serverStatus.online = false;
  } finally {
    serverStatus.checking = false;
  }
}

async function fetchStats() {
  try {
    const res = await fetch('/api/stats');
    if (!res.ok) return;
    const json = await res.json();
    if (json.data) {
      stats.total = json.data.total;
      stats.found = json.data.found;
      stats.lost = json.data.lost;
      stats.claimed = json.data.claimed;
    }
  } catch (err) {
    console.error('Failed to fetch stats:', err);
  }
}

async function fetchItems() {
  itemsLoading.value = true;
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.category && filters.category !== 'all') params.append('category', filters.category);
  if (filters.location && filters.location !== 'all') params.append('location', filters.location);

  // If status dropdown is specifically chosen
  if (filters.status && filters.status !== 'all') {
    params.append('status', filters.status);
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await fetch(`/api/items${query}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    items.value = json.data || [];
  } catch (err) {
    console.error('Failed to load items:', err);
  } finally {
    itemsLoading.value = false;
  }
}

let debounceTimer = null;
function fetchItemsDebounced() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    fetchItems();
  }, 250);
}

function resetFilters() {
  filters.search = '';
  filters.nameFilter = '';
  filters.status = 'all';
  filters.category = 'all';
  filters.location = 'all';
  currentActiveTab.value = 'found';
  fetchItems();
  fetchStats();
  if (toastRef.value) {
    toastRef.value.show({
      t: 'Filters Reset',
      m: 'All search queries and category filters cleared.',
      variant: 'info'
    });
  }
}

function openReportModal(type) {
  reportModalType.value = type;
  isReportModalOpen.value = true;
}

function openClaimModal(item) {
  selectedItemForClaim.value = item;
  isClaimModalOpen.value = true;
}

function openSpottedModal(item) {
  selectedItemForSpotted.value = item;
  isSpottedModalOpen.value = true;
}

function openInfoModal(type) {
  infoModalType.value = type;
  isInfoModalOpen.value = true;
}

function handleItemCreated(newItem) {
  fetchItems();
  fetchStats();
  // Automatically switch tab to match newly created item
  if (newItem.status === 'Lost') {
    currentActiveTab.value = 'lost';
  } else {
    currentActiveTab.value = 'found';
  }
  if (toastRef.value) {
    toastRef.value.show({
      t: newItem.status === 'Lost' ? 'Lost Item Broadcasted!' : 'Found Item Logged!',
      m: `Item "${newItem.name}" was saved directly to the SQLite registry.`,
      variant: 'success'
    });
  }
}

function handleItemClaimed(updatedItem) {
  fetchItems();
  fetchStats();
  currentActiveTab.value = 'claimed';
  if (toastRef.value) {
    toastRef.value.show({
      t: 'Claim Verification Recorded!',
      m: `Ownership verification for "${updatedItem.name}" was recorded in SQLite.`,
      variant: 'success'
    });
  }
}

function handleSpottedConfirmed(info) {
  fetchItems();
  fetchStats();
  if (toastRef.value) {
    toastRef.value.show({
      t: 'Handoff Notice Confirmed!',
      m: `Handoff instructions for item #${info.itemId} recorded at ${info.desk}.`,
      variant: 'success'
    });
  }
}

function handleKeywordActivated(info) {
  if (toastRef.value) {
    toastRef.value.show({
      t: 'Campus Alerts Activated!',
      m: `Keyword ping registered for "${info.keywords}" to ${info.email}.`,
      variant: 'success'
    });
  }
}

onMounted(() => {
  fetchHealth();
  fetchStats();
  fetchItems();
});
</script>
