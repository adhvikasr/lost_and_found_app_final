<template>
  <BaseModal
    :is-open="isOpen"
    title="I Spotted or Found This Item"
    subtitle="Connect with owner via campus verified drop desk"
    icon="thumb_up"
    icon-variant="tertiary"
    @close="handleClose"
  >
    <div v-if="item" class="flex flex-col gap-3">
      <!-- Item summary banner -->
      <div class="p-3 bg-surface-container-low rounded-xl border border-outline-variant/30 flex items-start gap-3">
        <div class="w-12 h-12 rounded-lg bg-surface-container-high overflow-hidden flex-shrink-0 flex items-center justify-center">
          <img
            v-if="item.image_url"
            :src="item.image_url"
            :alt="item.name"
            class="w-full h-full object-cover"
          >
          <span v-else class="material-symbols-outlined text-[20px] text-tertiary">near_me</span>
        </div>
        <div class="flex-1 min-w-0">
          <span class="font-label-md text-sm text-on-surface font-bold block truncate">
            {{ item.name }}
          </span>
          <span class="font-body-sm text-xs text-outline flex items-center gap-1 mt-0.5">
            <span class="material-symbols-outlined text-[14px] text-tertiary">check_circle</span>
            <span class="truncate">Reported lost near: {{ item.location }}</span>
          </span>
        </div>
      </div>

      <p class="font-body-sm text-xs sm:text-body-sm text-on-surface-variant leading-relaxed">
        Where are you dropping off this item to facilitate safe return?
      </p>

      <div class="flex flex-col gap-1">
        <label for="spotted-desk" class="font-label-md text-xs font-semibold text-on-surface">
          Select Drop-off Desk / Status *
        </label>
        <div class="relative">
          <select
            id="spotted-desk"
            v-model="deskChoice"
            class="w-full h-11 pl-3 pr-8 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30 appearance-none cursor-pointer"
          >
            <option value="Student Union Desk">Dropping at Student Union Desk</option>
            <option value="Library Desk #4">Dropping at Library Desk #4</option>
            <option value="Campus Security HQ">Handed to Campus Security Officer</option>
            <option value="Direct Student Safe Meetup">Still with me (Direct Student Safe Meetup)</option>
          </select>
          <span class="material-symbols-outlined pointer-events-none absolute right-2.5 top-3 text-[18px] text-outline">
            arrow_drop_down
          </span>
        </div>
      </div>

      <div class="flex flex-col gap-1">
        <label for="spotted-contact" class="font-label-md text-xs font-semibold text-on-surface">
          Your Phone or Campus Email for Notification *
        </label>
        <input
          id="spotted-contact"
          v-model.trim="contact"
          type="text"
          placeholder="e.g. 555-019-4821 or student@state.edu"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30"
          required
        >
      </div>

      <div class="flex flex-col gap-1">
        <label for="spotted-notes" class="font-label-md text-xs font-semibold text-on-surface">
          Additional Notes (Optional)
        </label>
        <textarea
          id="spotted-notes"
          v-model.trim="notes"
          rows="2"
          placeholder="e.g. Left in front row of Lecture Hall B10 with attendant"
          class="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-tertiary border border-outline-variant/30 resize-none"
        ></textarea>
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
        class="h-11 px-6 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px]"
        :class="isSubmitting ? 'opacity-60 cursor-not-allowed' : ''"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        <span v-else class="material-symbols-outlined text-[18px]">handshake</span>
        <span>{{ isSubmitting ? 'Submitting...' : 'Confirm Handoff Notice' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref } from 'vue';
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

const emit = defineEmits(['close', 'confirmed']);

const deskChoice = ref('Student Union Desk');
const contact = ref('');
const notes = ref('');
const isSubmitting = ref(false);

function handleClose() {
  emit('close');
}

function handleSubmit() {
  if (!contact.value) {
    alert('Please enter your phone or campus email.');
    return;
  }

  isSubmitting.value = true;
  setTimeout(() => {
    isSubmitting.value = false;
    emit('confirmed', {
      itemId: props.item.id,
      desk: deskChoice.value,
      contact: contact.value,
      notes: notes.value
    });
    handleClose();
  }, 300);
}
</script>
