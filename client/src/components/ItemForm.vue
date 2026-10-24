<template>
  <section class="form-card">
    <h3 class="status-section-title" style="margin-bottom: 0.25rem;">Report a Lost or Found Item</h3>
    <p style="font-size: 0.88rem; color: var(--text-muted);">
      Submits directly to <code>POST /api/items</code> using parameterized SQL into <code>campus-find.db</code>.
    </p>
    <form @submit.prevent="handleSubmit">
      <div class="form-grid">
        <div class="form-group">
          <label for="item-name">Item Name *</label>
          <input
            id="item-name"
            v-model.trim="form.name"
            type="text"
            class="form-input"
            placeholder="e.g. Blue Hydro Flask"
            required
            :disabled="isSubmitting"
          />
        </div>
        <div class="form-group">
          <label for="item-category">Category *</label>
          <select
            id="item-category"
            v-model="form.category"
            class="form-select"
            required
            :disabled="isSubmitting"
          >
            <option value="electronics">Electronics</option>
            <option value="accessories">Accessories</option>
            <option value="id-cards">ID Cards</option>
            <option value="keys">Keys</option>
            <option value="clothing">Clothing</option>
            <option value="stationery">Stationery</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="item-location">Location *</label>
          <input
            id="item-location"
            v-model.trim="form.location"
            type="text"
            class="form-input"
            placeholder="e.g. Science Library Room 102"
            required
            :disabled="isSubmitting"
          />
        </div>
        <div class="form-group">
          <label for="item-status">Status *</label>
          <select
            id="item-status"
            v-model="form.status"
            class="form-select"
            required
            :disabled="isSubmitting"
          >
            <option value="Lost">Lost</option>
            <option value="Found">Found</option>
          </select>
        </div>
      </div>
      <div class="form-submit-row">
        <button type="submit" class="btn btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Saving...' : '➕ Save Item to SQLite' }}
        </button>
        <span
          v-if="feedback.message"
          class="form-feedback"
          :style="{ color: feedback.type === 'error' ? 'var(--danger)' : 'var(--success)' }"
        >
          {{ feedback.message }}
        </span>
      </div>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';

const emit = defineEmits(['item-created']);

const isSubmitting = ref(false);
const feedback = reactive({ message: '', type: 'success' });

const form = reactive({
  name: '',
  category: 'accessories',
  location: '',
  status: 'Lost'
});

async function handleSubmit() {
  if (!form.name || !form.location) return;

  isSubmitting.value = true;
  feedback.message = 'Saving to SQLite database...';
  feedback.type = 'info';

  try {
    const res = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        name: form.name,
        category: form.category,
        location: form.location,
        status: form.status
      })
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`);
    }

    feedback.type = 'success';
    feedback.message = `✓ Successfully saved item #${data.data.id} to SQLite!`;

    // Reset fields
    form.name = '';
    form.location = '';

    emit('item-created', data.data);

    setTimeout(() => {
      if (feedback.type === 'success') {
        feedback.message = '';
      }
    }, 4000);
  } catch (err) {
    feedback.type = 'error';
    feedback.message = `✗ Failed to save: ${err.message}`;
  } finally {
    isSubmitting.value = false;
  }
}
</script>
