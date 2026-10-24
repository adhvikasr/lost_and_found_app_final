<template>
  <div id="app">
    <!-- Header -->
    <header class="header">
      <div class="header-container">
        <div class="logo-wrapper">
          <div class="logo-icon">🔍</div>
          <div class="logo-text">
            <h1>Campus Lost &amp; Found</h1>
            <span>Smart Campus Recovery System (Vue 3 + SQLite)</span>
          </div>
        </div>
        <div class="header-status">
          <span class="badge badge-success">
            <span class="indicator-dot"></span> Vue 3 Active
          </span>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="container">
      <section class="welcome-card">
        <h2>Welcome to Campus Lost &amp; Found</h2>
        <p>
          The application frontend is built with <strong>Vue 3 + Vite</strong> Single-File Components, connected to an Express backend and persistent <strong>SQLite</strong> database (<code>better-sqlite3</code>).
        </p>
      </section>

      <!-- System Status Cards -->
      <StatusSection
        :server-status="serverStatus"
        :db-status="dbStatus"
      />

      <!-- Report Form Component -->
      <ItemForm @item-created="handleItemCreated" />

      <!-- Items Table Component -->
      <ItemsTable
        :items="items"
        :is-loading="itemsLoading"
        :error="itemsError"
        @refresh="fetchItems"
        @filter-change="handleFilterChange"
      />

      <!-- Diagnostics Section -->
      <section class="actions-card">
        <h3 class="status-section-title" style="margin-bottom: 0.25rem;">Diagnostics &amp; Endpoints</h3>
        <div class="actions-buttons">
          <button class="btn btn-primary" type="button" @click="fetchHealth">
            🔄 Re-test /api/health
          </button>
          <a href="/api/health" target="_blank" class="btn btn-secondary">
            🌐 Raw /api/health
          </a>
          <a href="/api/items" target="_blank" class="btn btn-secondary">
            📦 Raw /api/items
          </a>
        </div>
      </section>

      <!-- Live API Response Output -->
      <section class="log-card">
        <h3>Live API Response Output</h3>
        <pre>{{ rawResponse }}</pre>
      </section>
    </main>

    <!-- Footer -->
    <footer class="footer">
      Campus Lost &amp; Found &bull; Vue 3 (Vite) + Express + SQLite (better-sqlite3)
    </footer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import StatusSection from './components/StatusSection.vue';
import ItemForm from './components/ItemForm.vue';
import ItemsTable from './components/ItemsTable.vue';

// Server & DB Status state
const serverStatus = reactive({
  online: false,
  checking: true,
  app: '',
  version: '',
  env: '',
  latency: 0,
  error: ''
});

const dbStatus = reactive({
  connected: false,
  totalItems: 0,
  databaseFile: ''
});

const rawResponse = ref('Contacting backend health check...');

// Items State
const items = ref([]);
const itemsLoading = ref(false);
const itemsError = ref('');
const currentFilters = reactive({
  search: '',
  category: 'all',
  status: 'all'
});

async function fetchHealth() {
  serverStatus.checking = true;
  rawResponse.value = 'Contacting /api/health...';
  const startTime = performance.now();

  try {
    const res = await fetch('/api/health');
    const elapsed = Math.round(performance.now() - startTime);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    const data = await res.json();
    serverStatus.online = true;
    serverStatus.checking = false;
    serverStatus.app = data.app;
    serverStatus.version = data.version;
    serverStatus.env = data.environment;
    serverStatus.latency = elapsed;
    serverStatus.error = '';

    dbStatus.connected = data.services?.database === 'connected';
    dbStatus.totalItems = data.services?.totalItems || 0;
    dbStatus.databaseFile = data.services?.databaseFile || '';

    rawResponse.value = JSON.stringify(data, null, 2);
  } catch (err) {
    const elapsed = Math.round(performance.now() - startTime);
    serverStatus.online = false;
    serverStatus.checking = false;
    serverStatus.latency = elapsed;
    serverStatus.error = err.message;

    dbStatus.connected = false;
    rawResponse.value = `Failed to connect to /api/health:\n${err.message}`;
  }
}

async function fetchItems() {
  itemsLoading.value = true;
  itemsError.value = '';

  const params = new URLSearchParams();
  if (currentFilters.search) params.append('search', currentFilters.search);
  if (currentFilters.category && currentFilters.category !== 'all') {
    params.append('category', currentFilters.category);
  }
  if (currentFilters.status && currentFilters.status !== 'all') {
    params.append('status', currentFilters.status);
  }

  const query = params.toString() ? `?${params.toString()}` : '';

  try {
    const res = await fetch(`/api/items${query}`);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const result = await res.json();
    items.value = result.data || [];
  } catch (err) {
    itemsError.value = err.message;
  } finally {
    itemsLoading.value = false;
  }
}

function handleFilterChange(newFilters) {
  currentFilters.search = newFilters.search;
  currentFilters.category = newFilters.category;
  currentFilters.status = newFilters.status;
  fetchItems();
}

function handleItemCreated(newItem) {
  fetchItems();
  fetchHealth();
}

onMounted(() => {
  fetchHealth();
  fetchItems();
});
</script>
