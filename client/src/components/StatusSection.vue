<template>
  <section class="status-section">
    <div class="status-section-title">
      <span>System Status Verification</span>
    </div>
    <div class="status-grid">
      <!-- Frontend Status Card -->
      <div class="status-card">
        <div class="status-card-header">
          <span class="status-card-title">Frontend Client</span>
          <span class="badge badge-success">
            <span class="indicator-dot"></span> Vue 3 + Vite
          </span>
        </div>
        <div class="status-card-value">Single-File Components</div>
        <div class="status-card-meta">Mounted via Vite on #app</div>
      </div>

      <!-- Backend Status Card -->
      <div class="status-card">
        <div class="status-card-header">
          <span class="status-card-title">Backend API</span>
          <span :class="['badge', serverBadgeClass]">
            <span class="indicator-dot"></span> {{ serverBadgeText }}
          </span>
        </div>
        <div class="status-card-value">{{ serverValueText }}</div>
        <div class="status-card-meta">{{ serverMetaText }}</div>
      </div>

      <!-- Database Status Card -->
      <div class="status-card">
        <div class="status-card-header">
          <span class="status-card-title">Database Engine</span>
          <span :class="['badge', dbBadgeClass]">
            <span class="indicator-dot"></span> {{ dbBadgeText }}
          </span>
        </div>
        <div class="status-card-value">{{ dbValueText }}</div>
        <div class="status-card-meta">{{ dbMetaText }}</div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  serverStatus: {
    type: Object,
    required: true
  },
  dbStatus: {
    type: Object,
    required: true
  }
});

const serverBadgeClass = computed(() => {
  if (props.serverStatus.checking) return 'badge-warning';
  return props.serverStatus.online ? 'badge-success' : 'badge-danger';
});

const serverBadgeText = computed(() => {
  if (props.serverStatus.checking) return 'Checking...';
  return props.serverStatus.online ? 'Online' : 'Offline';
});

const serverValueText = computed(() => {
  if (props.serverStatus.checking) return 'Connecting...';
  if (!props.serverStatus.online) return 'Backend unreachable';
  return `${props.serverStatus.app || 'Campus Lost & Found'} (v${props.serverStatus.version || '1.0.0'})`;
});

const serverMetaText = computed(() => {
  if (props.serverStatus.checking) return 'Querying /api/health...';
  if (!props.serverStatus.online) return props.serverStatus.error || 'Check that Express server is running on port 3001';
  return `Response: ${props.serverStatus.latency}ms | Env: ${props.serverStatus.env}`;
});

const dbBadgeClass = computed(() => {
  if (props.serverStatus.checking) return 'badge-warning';
  return props.dbStatus.connected ? 'badge-success' : 'badge-danger';
});

const dbBadgeText = computed(() => {
  if (props.serverStatus.checking) return 'Checking...';
  return props.dbStatus.connected ? 'Connected' : 'Offline';
});

const dbValueText = computed(() => {
  if (props.serverStatus.checking) return 'SQLite Database';
  return props.dbStatus.connected
    ? `SQLite: ${props.dbStatus.totalItems} Items`
    : 'SQLite Disconnected';
});

const dbMetaText = computed(() => {
  return props.dbStatus.databaseFile || 'server/data/campus-lost-found.db';
});
</script>
