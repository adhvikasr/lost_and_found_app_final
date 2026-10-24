<template>
  <BaseModal
    :is-open="isOpen"
    :title="type === 'lost' ? 'File Lost Item Broadcast' : 'Log & Drop Off Found Item'"
    :subtitle="type === 'lost' ? 'Broadcast an alert immediately across university safety desks' : 'Log an unattended item to generate an instant drop-off QR'"
    :icon="type === 'lost' ? 'add_alert' : 'qr_code_scanner'"
    :icon-variant="type === 'lost' ? 'primary' : 'tertiary'"
    @close="handleClose"
  >
    <form @submit.prevent="handleSubmit" class="flex flex-col gap-3">
      <!-- Item Name -->
      <div class="flex flex-col gap-1">
        <label for="report-name" class="font-label-md text-xs font-semibold text-on-surface">
          Item Name *
        </label>
        <input
          id="report-name"
          v-model.trim="form.name"
          type="text"
          class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
          :placeholder="type === 'lost' ? 'e.g. Space Grey iPad Air in Pink Folio' : 'e.g. Black Car Key Fob on red lanyard'"
          required
        >
      </div>

      <!-- Category and Location Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <!-- Category -->
        <div class="flex flex-col gap-1">
          <label for="report-category" class="font-label-md text-xs font-semibold text-on-surface">
            Category *
          </label>
          <div class="relative">
            <select
              id="report-category"
              v-model="form.category"
              class="w-full h-11 pl-3 pr-8 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 appearance-none cursor-pointer"
              required
            >
              <option value="electronics">Electronics</option>
              <option value="bags-keys">Bags &amp; Keys</option>
              <option value="ids-cards">Student IDs &amp; Cards</option>
              <option value="books-supplies">Books &amp; Supplies</option>
              <option value="accessories">Accessories / Bottles</option>
              <option value="clothing">Clothing</option>
              <option value="other">Other Campus Item</option>
            </select>
            <span class="material-symbols-outlined pointer-events-none absolute right-2.5 top-3 text-[18px] text-outline">
              arrow_drop_down
            </span>
          </div>
        </div>

        <!-- Campus Location (Freeform Text Input) -->
        <div class="flex flex-col gap-1">
          <label for="report-location" class="font-label-md text-xs font-semibold text-on-surface">
            Campus Location *
          </label>
          <input
            id="report-location"
            v-model.trim="form.location"
            type="text"
            class="w-full h-11 px-3.5 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30"
            :placeholder="type === 'lost' ? 'e.g. Science Complex Room 204, Library 3rd Floor...' : 'e.g. Student Union Dining Hall, North Rec Gym...'"
            required
          >
        </div>
      </div>

      <!-- Description / Distinctive Features -->
      <div class="flex flex-col gap-1">
        <label for="report-desc" class="font-label-md text-xs font-semibold text-on-surface">
          Distinctive Features / Markings *
        </label>
        <textarea
          id="report-desc"
          v-model.trim="form.description"
          rows="3"
          class="w-full p-3 rounded-xl bg-surface-container-low text-on-surface font-body-md text-sm focus:outline-none focus:ring-2 focus:ring-primary border border-outline-variant/30 resize-none"
          placeholder="Mention stickers, scratches, lock screen details, engravings, or carabiner attachments..."
          required
        ></textarea>
      </div>

      <!-- Photo Picker / URL Option -->
      <div class="flex flex-col gap-1">
        <label class="font-label-md text-xs font-semibold text-on-surface">
          Item Photo (Optional)
        </label>
        <div class="grid grid-cols-4 gap-2">
          <button
            v-for="(photo, index) in samplePhotos"
            :key="index"
            type="button"
            class="h-16 rounded-lg overflow-hidden border-2 relative transition-all"
            :class="form.image_url === photo.url ? 'border-primary ring-2 ring-primary/40' : 'border-outline-variant/30 hover:border-primary/50'"
            @click="form.image_url = form.image_url === photo.url ? '' : photo.url"
          >
            <img :src="photo.url" :alt="photo.title" class="w-full h-full object-cover">
            <span class="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] py-0.5 text-center truncate">
              {{ photo.title }}
            </span>
          </button>
        </div>
      </div>

      <div
        v-if="errorMessage"
        class="p-2.5 rounded-lg bg-error-container text-on-error-container text-xs font-semibold flex items-center gap-1.5"
      >
        <span class="material-symbols-outlined text-[16px]">error</span>
        <span>{{ errorMessage }}</span>
      </div>
    </form>

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
        :class="[
          'h-11 px-6 rounded-xl text-white font-label-md text-label-md shadow-sm transition-all flex items-center justify-center gap-2 min-h-[44px]',
          type === 'lost' ? 'bg-primary hover:bg-primary-container' : 'bg-tertiary hover:bg-tertiary-container',
          isSubmitting ? 'opacity-60 cursor-not-allowed' : ''
        ]"
        @click="handleSubmit"
      >
        <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[18px]">progress_activity</span>
        <span v-else class="material-symbols-outlined text-[18px]">
          {{ type === 'lost' ? 'add_alert' : 'qr_code_scanner' }}
        </span>
        <span>{{ isSubmitting ? 'Submitting to SQLite...' : type === 'lost' ? 'Broadcast Alert ($0)' : 'Generate Instant Drop QR' }}</span>
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { reactive, ref, watch } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'lost'
  }
});

const emit = defineEmits(['close', 'created']);

const isSubmitting = ref(false);
const errorMessage = ref('');

const samplePhotos = [
  {
    title: 'Earbuds',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA7UAbMxsCJx-222C4ulQp_lWFHU_RXIyV0tP_pQ21JKPtIqSaRkeD2wo1eUnXBnqRPzNVfy_9AjoT1XSOYTAP-won5yo7hICEjmYR_2rj13EwmOgf41qJZBPLfzvCzDZFJG3OoAARHdLI8BCtSY6RUgokjo503CO01pZZ0QPJDa7TU1YP6M3d4n-xafljnAgDCLP6ZW6T6UkmdAZ7evdreDQkNCzje-WIgOBwyH7zhT0ibEe7ACdyJaQ'
  },
  {
    title: 'Flask',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBIOexeRjq6NqRYwK4xLC2PsoaEBueowU6Qb8LqunfBgY1UZ1AQ-13PIP68z6jkCCAJyMhnn8znT5BM2dhGbjb9y58Ag_30SzUfnorHaYdqArqEicXHfxGRp1o2qG-aHLRPKMuAwcMiWrVLzA8_Ni7o8UfKrK67kzyvH-WvNj3YDGPSzkdxw3XB1Ia4WUq74FnEoQ1rwW12Khq397bKs-BDH0TM2BhTA4B_BppQxTo_iZwhbUMrP0MDaA'
  },
  {
    title: 'Laptop',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD-3FJJYZrizcejypAbRcNPaFuOq3f2QXe-kXOO6ZtRZx4dJeMPnEeMr2yfB0tODRt-cBOeoskdalwXaA-oOkk4xx40_2irLNuXAK4PwS2d2jIV1qr96P0Arc-16Tl0RTMmgTWrNnE7mPjtdeqq4F8WN7AMCKyNehrhsOvQbOStZqDoyHbFG4uHCkyIQrtU3UEkKCaTK5ue54nElUSo9MLyudUI1wJLpr0d80eYmYesSQMFrvt26VEiMQ'
  },
  {
    title: 'Lanyard',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkOw5l179YIxoPBuGy76JXOxIB_mEqh4to0TOIgTFApWNTUkvzjBDRDfdouhKgML2KMhbVFGK_BrElguC79yI9jxK8vLaLsdUjK3x1UkhpnYAQW_2jstK6qaTdgkPmHsU-QSsJVq_aLf4NGEfVevLFltef0lln3vC1S0eK9mJ04shjs2vxqJLzGttXZmKNf5laOucUM-h6uXB-Uyy6z9TXjsi689_ikrcnGtwZjA8WRUcrkdJflveNDg'
  }
];

const form = reactive({
  name: '',
  category: 'electronics',
  location: '',
  description: '',
  image_url: ''
});

watch(
  () => props.isOpen,
  (val) => {
    if (val) {
      errorMessage.value = '';
      form.location = '';
    }
  }
);

function handleClose() {
  errorMessage.value = '';
  emit('close');
}

async function handleSubmit() {
  if (!form.name || !form.location || !form.description) {
    errorMessage.value = 'Please fill out item name, location, and description.';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = '';

  try {
    const payload = {
      name: form.name.trim(),
      category: form.category,
      location: form.location.trim(),
      status: props.type === 'lost' ? 'Lost' : 'Found',
      description: form.description.trim(),
      image_url: form.image_url || null,
      desk_location: null,
      reporter_name: props.type === 'lost' ? 'Student Member' : 'Campus Good Samaritan',
      contact: null
    };

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    // Reset fields
    form.name = '';
    form.location = '';
    form.description = '';
    form.image_url = '';

    emit('created', data.data);
    handleClose();
  } catch (err) {
    errorMessage.value = err.message || 'Failed to submit report. Please try again.';
  } finally {
    isSubmitting.value = false;
  }
}
</script>
