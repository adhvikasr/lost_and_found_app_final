<template>
  <section class="items-card">
    <div class="status-section-title">
      <span>Persistent Records ({{ items.length }} items)</span>
      <button
        class="btn btn-secondary"
        style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"
        :disabled="isLoading"
        @click="$emit('refresh')"
      >
        {{ isLoading ? 'Refreshing...' : '🔄 Refresh' }}
      </button>
    </div>

    <!-- Filter Bar -->
    <div class="items-filter-bar">
      <input
        v-model="searchQuery"
        type="text"
        class="form-input"
        placeholder="Search name or location..."
        style="max-width: 260px;"
        @input="emitFilters"
      />
      <select
        v-model="statusFilter"
        class="form-select"
        style="max-width: 140px;"
        @change="emitFilters"
      >
        <option value="all">All Statuses</option>
        <option value="Lost">Lost</option>
        <option value="Found">Found</option>
      </select>
      <select
        v-model="categoryFilter"
        class="form-select"
        style="max-width: 160px;"
        @change="emitFilters"
      >
        <option value="all">All Categories</option>
        <option value="electronics">Electronics</option>
        <option value="accessories">Accessories</option>
        <option value="id-cards">ID Cards</option>
        <option value="keys">Keys</option>
        <option value="clothing">Clothing</option>
        <option value="stationery">Stationery</option>
        <option value="other">Other</option>
      </select>
    </div>

    <!-- Items Table -->
    <div class="items-table-wrapper">
      <table class="items-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Status</th>
            <th>Item Name</th>
            <th>Category</th>
            <th>Location</th>
            <th>Reported At</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="isLoading">
            <td colspan="6" class="empty-state">Loading items from SQLite...</td>
          </tr>
          <tr v-else-if="error">
            <td colspan="6" class="empty-state" style="color: var(--danger);">
              Failed to load records from SQLite: {{ error }}
            </td>
          </tr>
          <tr v-else-if="items.length === 0">
            <td colspan="6" class="empty-state">
              No matching items found in SQLite database.
            </td>
          </tr>
          <tr v-for="item in items" :key="item.id">
            <td><strong>#{{ item.id }}</strong></td>
            <td>
              <span :class="['badge', item.status === 'Lost' ? 'badge-lost' : 'badge-found']">
                {{ item.status }}
              </span>
            </td>
            <td><strong>{{ item.name }}</strong></td>
            <td><span style="text-transform: capitalize;">{{ item.category }}</span></td>
            <td>📍 {{ item.location }}</td>
            <td style="color: var(--text-muted); font-size: 0.8rem;">
              {{ formatDate(item.created_at) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  items: {
    type: Array,
    required: true
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
});

const emit = defineEmits(['refresh', 'filter-change']);

const searchQuery = ref('');
const statusFilter = ref('all');
const categoryFilter = ref('all');

let debounceTimer = null;
function emitFilters() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    emit('filter-change', {
      search: searchQuery.value,
      status: statusFilter.value,
      category: categoryFilter.value
    });
  }, 200);
}

function formatDate(dateStr) {
  if (!dateStr) return 'Just now';
  return dateStr.replace('T', ' ').slice(0, 19);
}
</script>
