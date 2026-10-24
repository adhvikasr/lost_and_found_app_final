<template>
  <BaseModal
    :is-open="isOpen"
    title="Claim Belonging Verification"
    subtitle="Zero-theft verified university ownership claim process"
    icon="verified_user"
    icon-variant="primary"
    @close="handleClose"
  >
    <div v-if="item" class="flex flex-col gap-3">
      <!-- Item summary banner -->
      <div class="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
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
          <span class="font-label-md text-sm text-on-surface font-bold block truncate">
            {{ item.name }}
          </span>
          <span class="font-body-sm text-xs text-outline flex items-center gap-1 mt-0.5">
            <span class="material-symbols-outlined text-[14px] text-primary">pin_drop</span>
            <span class="truncate">Currently held at: {{ item.desk_location || item.location }}</span>
          </span>
        </div>
      </div>

      <p class="font-body-sm text-xs sm:text-body-sm text-on-surface-variant leading-relaxed">
        To prevent theft and unauthorized claims, please verify ownership with your State University Student ID and distinctive marks:
      </p>

      <div class="flex flex-col gap-1">
        <label for="claim-student-id" class="font-label-md text-xs font-semibold text-on-surface">
          State University ID # *
        </label>
        <input
          id="claim-student-id"
          v-model.trim="studentId"
          type="text"
          placeholder="State University ID # (e.g. 8839210)"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          required
        >
      </div>

      <div class="flex flex-col gap-1">
        <label for="claim-name" class="font-label-md text-xs font-semibold text-on-surface">
          Your Full Legal Name *
        </label>
        <input
          id="claim-name"
          v-model.trim="claimerName"
          type="text"
          placeholder="e.g. Alex Rivera"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          required
        >
      </div>

      <div class="flex flex-col gap-1">
        <label for="claim-proof" class="font-label-md text-xs font-semibold text-on-surface">
          Ownership Proof Details *
        </label>
        <textarea
          id="claim-proof"
          v-model.trim="verificationDetail"
          rows="3"
          placeholder="Describe distinctive marks, serial hints, wallpaper image, key count, or passcode..."
          class="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 resize-none"
          required
        ></textarea>
      </div>

      <div
        v-if="errorMessage"
        class="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-1.5"
      >
        <span class="material-symbols-outlined text-[16px]">error</span>
        <span>{{ errorMessage }}</span>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-11 px-4 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors min-h-[44px]"
        @click="handleClose"
      >
        Cancel
      </button>

      <button
        type="button"
        :disabled="isSubmitting"
        class="h-11 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px]"
        :class="isSubmitting ? 'opacity-60 cursor-not-allowed' : ''"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        <span v-else class="material-symbols-outlined text-[18px]">verified</span>
        <span>{{ isSubmitting ? 'Verifying with SQLite...' : 'Submit Claim Verification' }}</span>
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

const emit = defineEmits(['close', 'claimed']);

const studentId = ref('');
const claimerName = ref('');
const verificationDetail = ref('');
const isSubmitting = ref(false);
const errorMessage = ref('');

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = '';
      studentId.value = '';
      claimerName.value = '';
      verificationDetail.value = '';
    }
  }
);

function handleClose() {
  errorMessage.value = '';
  emit('close');
}

async function handleSubmit() {
  if (!studentId.value || !claimerName.value || !verificationDetail.value) {
    errorMessage.value = 'Please provide Student ID, your name, and verification details.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const res = await fetch(`/api/items/${props.item.id}/claim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_id: studentId.value.trim(),
        claimer_name: claimerName.value.trim(),
        verification_detail: verificationDetail.value.trim()
      })
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    emit('claimed', data.data);
    handleClose();
  } catch (err) {
    errorMessage.value = err.message || 'Failed to submit claim. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
