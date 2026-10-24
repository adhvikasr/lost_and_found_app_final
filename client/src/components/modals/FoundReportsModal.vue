<template>
  <BaseModal
    :is-open="isOpen"
    title="Found Reports Center"
    subtitle="Review reports on your lost belongings or track your submissions"
    icon="rate_review"
    icon-variant="primary"
    @close="handleClose"
  >
    <div class="flex flex-col gap-4">
      <!-- Top Tab Switcher: Owner Reports vs My Submissions vs Notifications -->
      <div class="flex items-center gap-1.5 p-1 bg-surface-container-low rounded-xl border border-outline-variant/20 overflow-x-auto no-scrollbar">
        <button
          type="button"
          :class="[
            'flex-1 min-w-[130px] py-2 px-3 rounded-lg font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'owner'
              ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          ]"
          @click="activeTab = 'owner'"
        >
          <span class="material-symbols-outlined text-[16px]">inbox</span>
          <span>Reports on My Items</span>
          <span
            v-if="ownerPendingCount > 0"
            class="px-1.5 py-0.2 bg-error text-white font-extrabold text-[10px] rounded-full"
          >
            {{ ownerPendingCount }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex-1 min-w-[130px] py-2 px-3 rounded-lg font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'finder'
              ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          ]"
          @click="activeTab = 'finder'"
        >
          <span class="material-symbols-outlined text-[16px]">outbox</span>
          <span>My Submitted Reports</span>
          <span
            v-if="finderReports.length > 0"
            class="px-1.5 py-0.2 bg-surface-container text-on-surface-variant font-semibold text-[10px] rounded-full"
          >
            {{ finderReports.length }}
          </span>
        </button>

        <button
          type="button"
          :class="[
            'flex-1 min-w-[110px] py-2 px-3 rounded-lg font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1.5 transition-all cursor-pointer whitespace-nowrap',
            activeTab === 'notifications'
              ? 'bg-surface-container-lowest text-primary font-bold shadow-xs'
              : 'text-on-surface-variant hover:text-on-surface'
          ]"
          @click="activeTab = 'notifications'"
        >
          <span class="material-symbols-outlined text-[16px]">notifications</span>
          <span>Notifications</span>
          <span
            v-if="unreadNotifsCount > 0"
            class="px-1.5 py-0.2 bg-error text-white font-extrabold text-[10px] rounded-full"
          >
            {{ unreadNotifsCount }}
          </span>
        </button>
      </div>

      <!-- Feedback messages -->
      <div
        v-if="errorMessage"
        class="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="successMessage"
        class="p-3 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/20 text-xs font-semibold flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-[18px] flex-shrink-0">check_circle</span>
        <span>{{ successMessage }}</span>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 1: OWNER VIEW - REPORTS ON MY LOST ITEMS -->
      <!-- ======================================================== -->
      <div v-if="activeTab === 'owner'" class="flex flex-col gap-3">
        <!-- Item filter toggle if initialItem was provided -->
        <div v-if="filterItem" class="p-2.5 bg-surface-container-low rounded-xl border border-primary/20 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 min-w-0">
            <span class="material-symbols-outlined text-primary text-[18px]">filter_alt</span>
            <span class="text-xs text-on-surface font-semibold truncate">
              Showing reports for: <strong>{{ filterItem.name }}</strong>
            </span>
          </div>
          <button
            type="button"
            class="text-[11px] text-primary hover:underline font-bold whitespace-nowrap"
            @click="filterItem = null"
          >
            Show All My Items
          </button>
        </div>

        <!-- Status Filter Sub-tabs -->
        <div class="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          <button
            type="button"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              ownerStatusFilter === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            ]"
            @click="ownerStatusFilter = 'all'"
          >
            All ({{ displayedOwnerReports.length }})
          </button>
          <button
            type="button"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1',
              ownerStatusFilter === 'Pending'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            ]"
            @click="ownerStatusFilter = 'Pending'"
          >
            <span>Pending</span>
            <span v-if="ownerPendingCount > 0" class="px-1.5 py-0.2 bg-white/30 text-white rounded-full text-[10px]">
              {{ ownerPendingCount }}
            </span>
          </button>
          <button
            type="button"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              ownerStatusFilter === 'Confirmed'
                ? 'bg-tertiary text-on-tertiary shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            ]"
            @click="ownerStatusFilter = 'Confirmed'"
          >
            Confirmed (Reunited)
          </button>
          <button
            type="button"
            :class="[
              'px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
              ownerStatusFilter === 'Rejected'
                ? 'bg-error text-on-error shadow-xs'
                : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
            ]"
            @click="ownerStatusFilter = 'Rejected'"
          >
            Rejected
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="loadingOwnerReports" class="py-10 flex flex-col items-center justify-center gap-2 text-outline">
          <span class="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
          <span class="text-xs">Loading found reports...</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="filteredOwnerReports.length === 0"
          class="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center gap-2.5"
        >
          <span class="material-symbols-outlined text-[36px] text-outline">inbox</span>
          <span class="font-label-md text-sm text-on-surface font-bold">No Found Reports Found</span>
          <p class="font-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
            <template v-if="ownerStatusFilter !== 'all'">
              No reports currently matching the "{{ ownerStatusFilter }}" filter.
            </template>
            <template v-else>
              When a student spots or finds one of your lost items and submits a report, it will appear here for you to verify and confirm reunion.
            </template>
          </p>
        </div>

        <!-- Reports List -->
        <div v-else class="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          <div
            v-for="report in filteredOwnerReports"
            :key="report.id"
            class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-3 transition-all hover:border-outline-variant/60"
          >
            <!-- Header: Associated Item & Status Badge -->
            <div class="flex items-start justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    v-if="report.item_image_url"
                    :src="report.item_image_url"
                    :alt="report.item_name"
                    class="w-full h-full object-cover"
                  >
                  <span v-else class="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
                </div>
                <div class="min-w-0">
                  <span class="font-label-md text-xs sm:text-sm text-on-surface font-bold block truncate">
                    {{ report.item_name }}
                  </span>
                  <span class="font-body-sm text-[11px] text-outline flex items-center gap-1 truncate">
                    <span>Lost at: {{ report.item_lost_location }}</span>
                  </span>
                </div>
              </div>

              <!-- Status badge -->
              <span
                v-if="report.status === 'Pending'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 flex-shrink-0"
              >
                <span class="material-symbols-outlined text-[13px]">hourglass_empty</span>
                Pending Review
              </span>
              <span
                v-else-if="report.status === 'Confirmed'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-[11px] font-bold border border-tertiary/20 flex-shrink-0"
              >
                <span class="material-symbols-outlined text-[13px]">check_circle</span>
                Confirmed &amp; Reunited
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container/40 text-error text-[11px] font-bold border border-error/20 flex-shrink-0"
              >
                <span class="material-symbols-outlined text-[13px]">cancel</span>
                Rejected
              </span>
            </div>

            <!-- Finder identity & submission date -->
            <div class="flex items-center justify-between text-xs text-on-surface-variant flex-wrap gap-1">
              <div class="flex items-center gap-1.5">
                <span class="material-symbols-outlined text-[16px] text-primary">person</span>
                <span>Found by: <strong class="text-on-surface">{{ report.finder_name }}</strong></span>
                <span class="px-1.5 py-0.5 bg-surface-container font-mono text-[10px] rounded text-outline font-semibold">
                  ID: {{ report.finder_student_id }}
                </span>
              </div>
              <span class="text-[11px] text-outline flex items-center gap-1">
                <span class="material-symbols-outlined text-[13px]">schedule</span>
                <span>{{ formatDate(report.created_at) }}</span>
              </span>
            </div>

            <!-- Where found details card -->
            <div class="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2 text-xs">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">
                  📍 Where it was found:
                </span>
                <p class="font-medium text-on-surface leading-relaxed">
                  {{ report.location }}
                </p>
              </div>

              <div class="pt-1.5 border-t border-outline-variant/15">
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">
                  📝 Finder's Additional Details:
                </span>
                <p class="text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {{ report.additional_details }}
                </p>
              </div>
            </div>

            <!-- Decision timestamp if decided -->
            <div v-if="report.decided_at" class="text-[11px] text-outline flex items-center gap-1">
              <span class="material-symbols-outlined text-[13px]">history</span>
              <span>
                {{ report.status === 'Confirmed' ? 'Confirmed on' : 'Rejected on' }}
                {{ formatDate(report.decided_at) }}
              </span>
            </div>

            <!-- Owner Decision Action Buttons (Only when Pending) -->
            <div v-if="report.status === 'Pending'" class="flex items-center gap-2 pt-1 border-t border-outline-variant/15">
              <button
                type="button"
                :disabled="actionInProgress"
                class="flex-1 h-9.5 px-3 rounded-lg bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
                title="Confirm match and immediately mark item as physically reunited"
                @click="handleConfirm(report.id)"
              >
                <span class="material-symbols-outlined text-[16px]">check_circle</span>
                <span>Confirm &amp; Mark Reunited</span>
              </button>

              <button
                type="button"
                :disabled="actionInProgress"
                class="flex-1 h-9.5 px-3 rounded-lg border border-error/40 text-error hover:bg-error-container/30 font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                title="Reject this report"
                @click="handleReject(report.id)"
              >
                <span class="material-symbols-outlined text-[16px]">close</span>
                <span>Reject</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 2: FINDER VIEW - MY SUBMITTED REPORTS -->
      <!-- ======================================================== -->
      <div v-else-if="activeTab === 'finder'" class="flex flex-col gap-3">
        <!-- Loading spinner -->
        <div v-if="loadingFinderReports" class="py-10 flex flex-col items-center justify-center gap-2 text-outline">
          <span class="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
          <span class="text-xs">Loading your submitted reports...</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="finderReports.length === 0"
          class="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center gap-2.5"
        >
          <span class="material-symbols-outlined text-[36px] text-outline">volunteer_activism</span>
          <span class="font-label-md text-sm text-on-surface font-bold">No Reports Submitted Yet</span>
          <p class="font-body-sm text-xs text-on-surface-variant max-w-sm leading-relaxed">
            When you spot or pick up someone's lost belongings on campus, click <strong>"I Found This"</strong> on that lost item card to notify the owner.
          </p>
        </div>

        <!-- Finder Reports List -->
        <div v-else class="flex flex-col gap-3 max-h-[420px] overflow-y-auto pr-1">
          <div
            v-for="report in finderReports"
            :key="report.id"
            class="p-4 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-3"
          >
            <!-- Header: Associated Item & Status -->
            <div class="flex items-start justify-between gap-2 border-b border-outline-variant/15 pb-2.5">
              <div class="flex items-center gap-2.5 min-w-0">
                <div class="w-10 h-10 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    v-if="report.item_image_url"
                    :src="report.item_image_url"
                    :alt="report.item_name"
                    class="w-full h-full object-cover"
                  >
                  <span v-else class="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
                </div>
                <div class="min-w-0">
                  <span class="font-label-md text-xs sm:text-sm text-on-surface font-bold block truncate">
                    {{ report.item_name }}
                  </span>
                  <span class="font-body-sm text-[11px] text-outline flex items-center gap-1 truncate">
                    <span>Lost near: {{ report.item_lost_location }}</span>
                  </span>
                </div>
              </div>

              <!-- Status badge -->
              <span
                v-if="report.status === 'Pending'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-300 flex-shrink-0"
              >
                <span class="material-symbols-outlined text-[13px]">hourglass_empty</span>
                Pending Review
              </span>
              <span
                v-else-if="report.status === 'Confirmed'"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-[11px] font-bold border border-tertiary/20 flex-shrink-0"
              >
                <span class="material-symbols-outlined text-[13px]">check_circle</span>
                Confirmed &amp; Reunited!
              </span>
              <span
                v-else
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container/40 text-error text-[11px] font-bold border border-error/20 flex-shrink-0"
              >
                <span class="material-symbols-outlined text-[13px]">cancel</span>
                Rejected
              </span>
            </div>

            <!-- Details box -->
            <div class="p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/20 flex flex-col gap-2 text-xs">
              <div>
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">
                  📍 Where you found it:
                </span>
                <p class="font-medium text-on-surface leading-relaxed">
                  {{ report.location }}
                </p>
              </div>

              <div class="pt-1.5 border-t border-outline-variant/15">
                <span class="text-[10px] font-bold uppercase tracking-wider text-outline block mb-0.5">
                  📝 Your details provided:
                </span>
                <p class="text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {{ report.additional_details }}
                </p>
              </div>
            </div>

            <!-- Submission & decision meta footer -->
            <div class="flex items-center justify-between text-[11px] text-outline flex-wrap gap-1">
              <span>Submitted: {{ formatDate(report.created_at) }}</span>
              <span v-if="report.decided_at" class="font-medium">
                Decision: {{ formatDate(report.decided_at) }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- ======================================================== -->
      <!-- TAB 3: NOTIFICATIONS VIEW -->
      <!-- ======================================================== -->
      <div v-else-if="activeTab === 'notifications'" class="flex flex-col gap-3">
        <div class="flex items-center justify-between">
          <span class="text-xs text-on-surface-variant font-semibold">
            Recent Activity &amp; Alerts
          </span>
          <button
            v-if="unreadNotifsCount > 0"
            type="button"
            class="text-xs text-primary hover:underline font-bold cursor-pointer"
            @click="handleMarkAllRead"
          >
            Mark All as Read
          </button>
        </div>

        <!-- Loading spinner -->
        <div v-if="loadingNotifications" class="py-10 flex flex-col items-center justify-center gap-2 text-outline">
          <span class="material-symbols-outlined animate-spin text-[28px] text-primary">progress_activity</span>
          <span class="text-xs">Loading notifications...</span>
        </div>

        <!-- Empty state -->
        <div
          v-else-if="notifications.length === 0"
          class="p-8 text-center bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center gap-2.5"
        >
          <span class="material-symbols-outlined text-[36px] text-outline">notifications_off</span>
          <span class="font-label-md text-sm text-on-surface font-bold">No Notifications</span>
          <p class="font-body-sm text-xs text-on-surface-variant max-w-sm">
            Activity on your listings and submissions will be recorded here.
          </p>
        </div>

        <!-- Notifications list -->
        <div v-else class="flex flex-col gap-2 max-h-[420px] overflow-y-auto pr-1">
          <div
            v-for="notif in notifications"
            :key="notif.id"
            :class="[
              'p-3 rounded-xl border transition-all flex items-start gap-3',
              notif.is_read
                ? 'bg-surface-container-low border-outline-variant/20'
                : 'bg-primary/5 border-primary/20 shadow-xs'
            ]"
          >
            <div
              :class="[
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                notif.type === 'found_report_confirmed'
                  ? 'bg-tertiary/20 text-tertiary'
                  : notif.type === 'found_report_rejected'
                  ? 'bg-error-container text-error'
                  : 'bg-primary/10 text-primary'
              ]"
            >
              <span class="material-symbols-outlined text-[18px]">
                {{
                  notif.type === 'found_report_confirmed'
                    ? 'check_circle'
                    : notif.type === 'found_report_rejected'
                    ? 'cancel'
                    : 'notifications'
                }}
              </span>
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <span class="font-label-md text-xs font-bold text-on-surface truncate">
                  {{ notif.title }}
                </span>
                <span class="text-[10px] text-outline flex-shrink-0">
                  {{ formatDate(notif.created_at) }}
                </span>
              </div>
              <p class="font-body-sm text-xs text-on-surface-variant mt-0.5 leading-relaxed">
                {{ notif.message }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-11 px-5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors min-h-[44px] cursor-pointer"
        @click="handleClose"
      >
        Close
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  initialItem: {
    type: Object,
    default: null
  },
  initialTab: {
    type: String,
    default: 'owner'
  },
  currentUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'report-confirmed', 'report-rejected', 'refresh']);

const activeTab = ref('owner');
const filterItem = ref(null);
const ownerStatusFilter = ref('all');

const ownerReports = ref([]);
const finderReports = ref([]);
const notifications = ref([]);

const loadingOwnerReports = ref(false);
const loadingFinderReports = ref(false);
const loadingNotifications = ref(false);
const actionInProgress = ref(false);

const errorMessage = ref('');
const successMessage = ref('');

const ownerPendingCount = computed(() => {
  return ownerReports.value.filter((r) => r.status === 'Pending').length;
});

const unreadNotifsCount = computed(() => {
  return notifications.value.filter((n) => !n.is_read).length;
});

const displayedOwnerReports = computed(() => {
  if (filterItem.value) {
    return ownerReports.value.filter((r) => r.item_id === filterItem.value.id);
  }
  return ownerReports.value;
});

const filteredOwnerReports = computed(() => {
  let list = displayedOwnerReports.value;
  if (ownerStatusFilter.value !== 'all') {
    list = list.filter((r) => r.status === ownerStatusFilter.value);
  }
  return list;
});

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = '';
      successMessage.value = '';
      activeTab.value = props.initialTab || 'owner';
      filterItem.value = props.initialItem || null;
      ownerStatusFilter.value = 'all';
      fetchAllData();
    }
  }
);

watch(activeTab, (tab) => {
  errorMessage.value = '';
  successMessage.value = '';
  if (tab === 'notifications' && unreadNotifsCount.value > 0) {
    handleMarkAllRead();
  }
});

async function fetchAllData() {
  await Promise.all([fetchOwnerReports(), fetchFinderReports(), fetchNotifications()]);
}

async function fetchOwnerReports() {
  loadingOwnerReports.value = true;
  try {
    const res = await fetch('/api/found-reports/owner', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load reports.');
    const json = await res.json();
    ownerReports.value = json.data || [];
  } catch (err) {
    console.error('Error loading owner reports:', err);
  } finally {
    loadingOwnerReports.value = false;
  }
}

async function fetchFinderReports() {
  loadingFinderReports.value = true;
  try {
    const res = await fetch('/api/found-reports/my', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load my reports.');
    const json = await res.json();
    finderReports.value = json.data || [];
  } catch (err) {
    console.error('Error loading finder reports:', err);
  } finally {
    loadingFinderReports.value = false;
  }
}

async function fetchNotifications() {
  loadingNotifications.value = true;
  try {
    const res = await fetch('/api/notifications', { credentials: 'include' });
    if (!res.ok) throw new Error('Failed to load notifications.');
    const json = await res.json();
    notifications.value = json.data || [];
  } catch (err) {
    console.error('Error loading notifications:', err);
  } finally {
    loadingNotifications.value = false;
  }
}

async function handleConfirm(reportId) {
  actionInProgress.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await fetch(`/api/found-reports/${reportId}/confirm`, {
      method: 'POST',
      credentials: 'include'
    });
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`Server returned status ${res.status}: ${text.slice(0, 80)}`);
    }

    if (!res.ok) {
      throw new Error(data?.error || `Failed to confirm found report (HTTP ${res.status}).`);
    }

    successMessage.value = 'Report confirmed! Item marked as physically reunited in the archive.';
    emit('report-confirmed', data.data);
    await fetchAllData();
  } catch (err) {
    errorMessage.value = err.message || 'Error confirming report.';
  } finally {
    actionInProgress.value = false;
  }
}

async function handleReject(reportId) {
  actionInProgress.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await fetch(`/api/found-reports/${reportId}/reject`, {
      method: 'POST',
      credentials: 'include'
    });
    let data = null;
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      throw new Error(`Server returned status ${res.status}: ${text.slice(0, 80)}`);
    }

    if (!res.ok) {
      throw new Error(data?.error || `Failed to reject found report (HTTP ${res.status}).`);
    }

    successMessage.value = 'Report rejected. Item remains in active Lost listings.';
    emit('report-rejected', data.data);
    await fetchAllData();
  } catch (err) {
    errorMessage.value = err.message || 'Error rejecting report.';
  } finally {
    actionInProgress.value = false;
  }
}

async function handleMarkAllRead() {
  try {
    await fetch('/api/notifications/read', {
      method: 'POST',
      credentials: 'include'
    });
    notifications.value.forEach((n) => (n.is_read = 1));
    emit('refresh');
  } catch (err) {
    console.error('Failed to mark notifications read:', err);
  }
}

function handleClose() {
  errorMessage.value = '';
  successMessage.value = '';
  emit('close');
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z'));
  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
</script>
