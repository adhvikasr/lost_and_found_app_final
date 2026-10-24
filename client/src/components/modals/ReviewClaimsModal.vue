<template>
  <BaseModal
    :is-open="isOpen"
    title="Listing Ownership Claims"
    :subtitle="item ? `Review ownership claims for &quot;${item.name}&quot;` : 'Review claims'"
    icon="rate_review"
    icon-variant="primary"
    @close="handleClose"
  >
    <div v-if="item" class="flex flex-col gap-4">
      <!-- Item summary banner -->
      <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
        <div class="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="w-full h-full object-cover"
          >
          <span v-else class="material-symbols-outlined text-[20px] text-primary">inventory_2</span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <span class="font-label-md text-sm text-on-surface font-bold truncate">
              {{ item.name }}
            </span>
            <span
              :class="[
                'text-[10px] font-bold px-2 py-0.5 rounded-full uppercase',
                item.status === 'Found' ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' : 'bg-primary/10 text-primary border border-primary/20'
              ]"
            >
              {{ item.status }}
            </span>
          </div>
          <span class="font-body-sm text-xs text-outline flex items-center gap-1 mt-0.5">
            <span class="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
            <span class="truncate">{{ item.location }}</span>
          </span>
        </div>
      </div>

      <!-- Action status / Error notification -->
      <div
        v-if="errorMessage"
        class="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-[18px]">error</span>
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-if="successMessage"
        class="p-3 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/20 text-xs font-semibold flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-[18px]">check_circle</span>
        <span>{{ successMessage }}</span>
      </div>

      <!-- Loading claims spinner -->
      <div v-if="loading" class="py-8 flex flex-col items-center justify-center gap-2 text-outline">
        <span class="material-symbols-outlined animate-spin text-[24px] text-primary">progress_activity</span>
        <span class="text-xs">Loading submitted claims...</span>
      </div>

      <!-- Empty state -->
      <div
        v-else-if="claims.length === 0"
        class="p-6 text-center bg-surface-container-low rounded-xl border border-outline-variant/20 flex flex-col items-center justify-center gap-2"
      >
        <span class="material-symbols-outlined text-[32px] text-outline">inbox</span>
        <span class="font-label-md text-sm text-on-surface font-bold">No Claims Submitted Yet</span>
        <p class="font-body-sm text-xs text-on-surface-variant max-w-xs">
          When students verify and claim this found item, their ownership proofs will appear here for your review.
        </p>
      </div>

      <!-- Claims list -->
      <div v-else class="flex flex-col gap-3 max-h-[360px] overflow-y-auto pr-1">
        <div
          v-for="claim in claims"
          :key="claim.id"
          class="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex flex-col gap-2.5 transition-all"
        >
          <!-- Claim header: Claimant info and status -->
          <div class="flex items-start justify-between gap-2">
            <div class="flex flex-col">
              <span class="font-label-md text-sm text-on-surface font-bold">
                {{ claim.claimant_name }}
              </span>
              <span class="font-body-sm text-[11px] text-outline flex items-center gap-1">
                <span>Student ID: <strong>{{ claim.claimant_student_id }}</strong></span>
                <span>•</span>
                <span>{{ formatDate(claim.created_at) }}</span>
              </span>
            </div>

            <!-- Claim status badge -->
            <span
              v-if="claim.status === 'Pending'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200"
            >
              <span class="material-symbols-outlined text-[13px]">hourglass_empty</span>
              Pending Review
            </span>
            <span
              v-else-if="claim.status === 'Approved'"
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary text-[11px] font-bold border border-tertiary/20"
            >
              <span class="material-symbols-outlined text-[13px]">verified</span>
              Approved
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-error-container/40 text-error text-[11px] font-bold border border-error/20"
            >
              <span class="material-symbols-outlined text-[13px]">cancel</span>
              Rejected
            </span>
          </div>

          <!-- Proof details box -->
          <div class="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/20 text-xs text-on-surface leading-relaxed">
            <span class="font-semibold text-outline block text-[10px] uppercase tracking-wide mb-1">
              Submitted Ownership Proof:
            </span>
            {{ claim.verification_detail }}
          </div>

          <!-- Decision buttons if status is Pending -->
          <div v-if="claim.status === 'Pending'" class="flex items-center gap-2 pt-1 border-t border-outline-variant/20">
            <button
              type="button"
              :disabled="actionInProgress"
              class="flex-1 h-9 px-3 rounded-lg bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
              @click="handleApprove(claim.id)"
            >
              <span class="material-symbols-outlined text-[16px]">check_circle</span>
              <span>Approve Claim</span>
            </button>
            <button
              type="button"
              :disabled="actionInProgress"
              class="flex-1 h-9 px-3 rounded-lg border border-error/40 text-error hover:bg-error-container/30 font-label-md text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
              @click="handleReject(claim.id)"
            >
              <span class="material-symbols-outlined text-[16px]">close</span>
              <span>Reject Claim</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-11 px-5 rounded-xl bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md transition-colors"
        @click="handleClose"
      >
        Close
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  item: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'claim-approved', 'claim-rejected']);

const claims = ref([]);
const loading = ref(false);
const actionInProgress = ref(false);
const errorMessage = ref('');
const successMessage = ref('');

watch(
  () => props.isOpen,
  (val) => {
    if (val && props.item) {
      errorMessage.value = '';
      successMessage.value = '';
      fetchClaims();
    }
  }
);

async function fetchClaims() {
  if (!props.item) return;
  loading.value = true;
  errorMessage.value = '';

  try {
    const res = await fetch(`/api/items/${props.item.id}/claims`, {
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to load claims.');
    }
    claims.value = data.data || [];
  } catch (err) {
    errorMessage.value = err.message || 'Unable to fetch claims.';
  } finally {
    loading.value = false;
  }
}

async function handleApprove(claimId) {
  actionInProgress.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await fetch(`/api/claims/${claimId}/approve`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to approve claim.');
    }

    successMessage.value = 'Claim approved! Item has been moved to the Reunited Archive.';
    emit('claim-approved', { claimId, item: props.item });
    await fetchClaims();
  } catch (err) {
    errorMessage.value = err.message || 'Error approving claim.';
  } finally {
    actionInProgress.value = false;
  }
}

async function handleReject(claimId) {
  actionInProgress.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  try {
    const res = await fetch(`/api/claims/${claimId}/reject`, {
      method: 'POST',
      credentials: 'include'
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to reject claim.');
    }

    successMessage.value = 'Claim rejected. Item remains in active Found listings.';
    emit('claim-rejected', { claimId, item: props.item });
    await fetchClaims();
  } catch (err) {
    errorMessage.value = err.message || 'Error rejecting claim.';
  } finally {
    actionInProgress.value = false;
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
