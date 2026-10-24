<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="translate-y-4 opacity-0"
      enter-to-class="translate-y-0 opacity-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="translate-y-0 opacity-100"
      leave-to-class="translate-y-4 opacity-0"
    >
      <div
        v-if="visible"
        class="fixed bottom-6 right-6 z-50 max-w-sm sm:max-w-md w-[calc(100%-3rem)] bg-surface-container-lowest border border-outline-variant/40 rounded-xl p-4 shadow-xl flex items-start gap-3"
      >
        <div
          :class="[
            'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white',
            type === 'error' ? 'bg-error' : type === 'info' ? 'bg-primary' : 'bg-tertiary'
          ]"
        >
          <span class="material-symbols-outlined text-[18px]">
            {{ type === 'error' ? 'error' : type === 'info' ? 'info' : 'check_circle' }}
          </span>
        </div>
        <div class="flex-1 min-w-0">
          <h4 class="font-headline-sm text-sm font-bold text-on-surface truncate">
            {{ title }}
          </h4>
          <p class="font-body-sm text-xs text-on-surface-variant mt-0.5 break-words">
            {{ message }}
          </p>
        </div>
        <button
          type="button"
          class="text-outline hover:text-on-surface p-1 rounded-md"
          @click="visible = false"
        >
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';

const visible = ref(false);
const title = ref('');
const message = ref('');
const type = ref('success');
let timer = null;

function show({ t = 'Success', m = '', variant = 'success', duration = 4000 }) {
  title.value = t;
  message.value = m;
  type.value = variant;
  visible.value = true;

  clearTimeout(timer);
  timer = setTimeout(() => {
    visible.value = false;
  }, duration);
}

defineExpose({ show });
</script>
