<template>
  <BaseModal
    :is-open="isOpen"
    title="Keyword Campus Alerts"
    subtitle="Automated email matching on newly logged items"
    icon="notifications_active"
    icon-variant="primary"
    @close="handleClose"
  >
    <div class="flex flex-col gap-3">
      <p class="font-body-sm text-xs sm:text-body-sm text-on-surface-variant leading-relaxed">
        We run automated matches whenever campus desks or students scan new incoming items into Campus Findr.
      </p>

      <div class="flex flex-col gap-1">
        <label for="alert-keywords" class="font-label-md text-xs font-semibold text-on-surface">
          Keywords / Brand / Model *
        </label>
        <input
          id="alert-keywords"
          v-model.trim="keywords"
          type="text"
          placeholder="e.g. Sony XM5, Ray-ban, Car Keys Honda, Graphing Calc"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          required
        >
      </div>

      <div class="flex flex-col gap-1">
        <label for="alert-email" class="font-label-md text-xs font-semibold text-on-surface">
          Your Campus Email Address *
        </label>
        <input
          id="alert-email"
          v-model.trim="email"
          type="email"
          placeholder="alex.rivera@state.edu"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          required
        >
      </div>

      <div class="p-3 rounded-xl bg-surface-container-low text-xs text-outline flex items-center gap-2">
        <span class="material-symbols-outlined text-[16px] text-tertiary">check_circle</span>
        <span>You will receive an instant notification when a matching item is reported.</span>
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
        class="h-11 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px]"
        @click="handleSubmit"
      >
        <span class="material-symbols-outlined text-[18px]">notifications_active</span>
        <span>Activate Email Ping</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
import BaseModal from '../common/BaseModal.vue';

defineProps({
  isOpen: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['close', 'activated']);

const keywords = ref('');
const email = ref('alex.rivera@state.edu');

function handleClose() {
  emit('close');
}

function handleSubmit() {
  if (!keywords.value) {
    alert('Please enter at least one keyword.');
    return;
  }
  emit('activated', { keywords: keywords.value, email: email.value });
  keywords.value = '';
  handleClose();
}
</script>
