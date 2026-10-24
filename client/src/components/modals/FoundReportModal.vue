<template>
  <BaseModal
    :is-open="isOpen"
    title="I Found This Item"
    subtitle="Submit found location and details to notify the owner"
    icon="volunteer_activism"
    icon-variant="tertiary"
    @close="handleClose"
  >
    <div v-if="item" class="flex flex-col gap-4">
      <!-- Item summary banner -->
      <div class="p-3.5 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
        <div class="w-14 h-14 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center border border-outline-variant/20">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="w-full h-full object-cover"
          >
          <span v-else class="material-symbols-outlined text-[24px] text-tertiary">
            {{ getCategoryIcon(item.category) }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <span class="font-label-md text-sm sm:text-base text-on-surface font-bold truncate">
              {{ item.name }}
            </span>
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant text-[11px] font-bold border border-secondary-fixed-dim/40">
              <span class="material-symbols-outlined text-[13px]">warning</span>
              <span>Lost Item</span>
            </span>
          </div>
          <p class="font-body-sm text-xs text-outline flex items-center gap-1 mt-1">
            <span class="material-symbols-outlined text-[15px] text-error">near_me</span>
            <span class="truncate">Reported lost near: <strong>{{ item.location }}</strong></span>
          </p>
        </div>
      </div>

      <!-- Authenticated Finder Identity Badge -->
      <div v-if="currentUser" class="px-3.5 py-2.5 bg-surface-container-low rounded-xl border border-outline-variant/20 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-[18px] text-tertiary">badge</span>
          <span class="text-on-surface-variant">
            Submitting as: <strong class="text-on-surface">{{ currentUser.fullName }}</strong>
          </span>
        </div>
        <span class="px-2 py-0.5 bg-tertiary/10 text-tertiary font-mono font-bold rounded text-[11px]">
          ID: {{ currentUser.studentId }}
        </span>
      </div>

      <!-- Error alert -->
      <div
        v-if="errorMessage"
        class="p-3 rounded-xl bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-2"
      >
        <span class="material-symbols-outlined text-[18px] flex-shrink-0">error</span>
        <span>{{ errorMessage }}</span>
      </div>

      <!-- Required Field 1: Where did you find it? -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label for="found-location" class="font-label-md text-xs font-semibold text-on-surface">
            Where did you find it? <span class="text-error">*</span>
          </label>
          <span class="text-[11px] text-outline">{{ location.length }}/500</span>
        </div>
        <input
          id="found-location"
          v-model="location"
          type="text"
          maxlength="500"
          placeholder="e.g. Central Library, second floor near study pod 4"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30"
          required
        >
        <span class="text-[11px] text-outline">
          Specify the campus building, room, or desk location where you found the item.
        </span>
      </div>

      <!-- Required Field 2: Additional details -->
      <div class="flex flex-col gap-1.5">
        <div class="flex items-center justify-between">
          <label for="found-details" class="font-label-md text-xs font-semibold text-on-surface">
            Additional details <span class="text-error">*</span>
          </label>
          <span class="text-[11px] text-outline">{{ additionalDetails.length }}/2000</span>
        </div>
        <textarea
          id="found-details"
          v-model="additionalDetails"
          rows="4"
          maxlength="2000"
          placeholder="Describe the item found, its condition, stickers, case details, marks, or any identifying features that help the owner verify the match..."
          class="w-full p-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30 resize-none leading-relaxed"
          required
        ></textarea>
        <span class="text-[11px] text-outline">
          Provide identifying information so the owner can confirm this is indeed their item.
        </span>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-11 px-4 rounded-xl text-on-surface-variant hover:bg-surface-container font-label-md text-label-md transition-colors min-h-[44px] cursor-pointer"
        :disabled="isSubmitting"
        @click="handleClose"
      >
        Cancel
      </button>

      <button
        type="button"
        :disabled="isSubmitting || !isFormValid"
        class="h-11 px-6 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="material-symbols-outlined text-[18px] animate-spin">
          progress_activity
        </span>
        <span v-else class="material-symbols-outlined text-[18px]">send</span>
        <span>{{ isSubmitting ? 'Submitting Report...' : 'Submit Found Report' }}</span>
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
  item: {
    type: Object,
    default: null
  },
  currentUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['close', 'submitted']);

const location = ref('');
const additionalDetails = ref('');
const errorMessage = ref('');
const isSubmitting = ref(false);

const isFormValid = computed(() => {
  return location.value.trim().length > 0 && additionalDetails.value.trim().length > 0;
});

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      location.value = '';
      additionalDetails.value = '';
      errorMessage.value = '';
      isSubmitting.value = false;
    }
  }
);

function getCategoryIcon(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('elect')) return 'headphones';
  if (c.includes('key')) return 'key';
  if (c.includes('bag')) return 'backpack';
  if (c.includes('id') || c.includes('card')) return 'badge';
  if (c.includes('book') || c.includes('suppl')) return 'calculate';
  if (c.includes('cloth')) return 'apparel';
  if (c.includes('water') || c.includes('bottle')) return 'local_cafe';
  return 'inventory_2';
}

function handleClose() {
  if (isSubmitting.value) return;
  errorMessage.value = '';
  emit('close');
}

async function handleSubmit() {
  errorMessage.value = '';

  const locTrimmed = location.value.trim();
  const detailsTrimmed = additionalDetails.value.trim();

  if (!locTrimmed) {
    errorMessage.value = 'Please provide where you found the item.';
    return;
  }
  if (!detailsTrimmed) {
    errorMessage.value = 'Please provide additional details describing the item found.';
    return;
  }
  if (!props.item || !props.item.id) {
    errorMessage.value = 'Invalid item selected.';
    return;
  }

  isSubmitting.value = true;

  try {
    const res = await fetch(`/api/items/${props.item.id}/found-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        location: locTrimmed,
        additional_details: detailsTrimmed
      })
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
      throw new Error(data?.error || `Failed to submit found report (HTTP ${res.status}).`);
    }

    emit('submitted', {
      report: data.data,
      item: props.item
    });
    handleClose();
  } catch (err) {
    errorMessage.value = err.message || 'Error submitting report. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
