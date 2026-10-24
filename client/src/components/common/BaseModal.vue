<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 overflow-y-auto bg-inverse-surface/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4"
        tabindex="-1"
        role="dialog"
        aria-modal="true"
        @keydown.esc="$emit('close')"
      >
        <!-- Overlay backdrop click handler -->
        <div class="fixed inset-0" @click="$emit('close')"></div>

        <!-- Modal Box -->
        <Transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="scale-95 opacity-0"
          enter-to-class="scale-100 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="scale-100 opacity-100"
          leave-to-class="scale-95 opacity-0"
        >
          <div
            v-if="isOpen"
            class="relative bg-surface-container-lowest rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl flex flex-col gap-4 z-10 max-h-[92vh] overflow-y-auto"
            @click.stop
          >
            <!-- Header -->
            <div class="flex items-center justify-between pb-1 border-b border-outline-variant/20">
              <div class="flex items-center gap-2.5 min-w-0">
                <div
                  v-if="icon"
                  :class="[
                    'w-10 h-10 rounded-xl flex items-center justify-center text-on-primary flex-shrink-0 shadow-sm',
                    iconBgClass
                  ]"
                >
                  <span class="material-symbols-outlined text-[22px]">{{ icon }}</span>
                </div>
                <div class="truncate">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface truncate">
                    <slot name="title">{{ title }}</slot>
                  </h3>
                  <p v-if="subtitle" class="font-body-sm text-body-sm text-outline truncate">
                    {{ subtitle }}
                  </p>
                </div>
              </div>

              <!-- Close button (min 44px tap area) -->
              <button
                type="button"
                aria-label="Close dialog"
                class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors flex-shrink-0"
                @click="$emit('close')"
              >
                <span class="material-symbols-outlined text-[22px]">close</span>
              </button>
            </div>

            <!-- Body -->
            <div class="flex flex-col gap-3 text-on-surface">
              <slot></slot>
            </div>

            <!-- Footer -->
            <div
              v-if="$slots.footer"
              class="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-outline-variant/30"
            >
              <slot name="footer"></slot>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  icon: {
    type: String,
    default: ''
  },
  iconVariant: {
    type: String,
    default: 'primary'
  }
});

const emit = defineEmits(['close']);

const iconBgClass = computed(() => {
  switch (props.iconVariant) {
    case 'tertiary':
      return 'bg-tertiary';
    case 'secondary':
      return 'bg-secondary';
    case 'error':
      return 'bg-error';
    case 'primary':
    default:
      return 'bg-primary';
  }
});

function handleKeydown(e) {
  if (e.key === 'Escape' && props.isOpen) {
    emit('close');
  }
}

watch(
  () => props.isOpen,
  (val) => {
    if (typeof document !== 'undefined') {
      if (val) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    }
  }
);

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
  if (typeof document !== 'undefined') {
    document.body.style.overflow = '';
  }
});
</script>
