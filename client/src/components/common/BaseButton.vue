<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    :class="[
      'inline-flex items-center justify-center font-semibold transition-all duration-150 select-none cursor-pointer',
      'focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-primary',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      // Mobile-friendly touch target
      'min-h-[44px]',
      sizeClasses,
      variantClasses,
      block ? 'w-full' : ''
    ]"
    @click="$emit('click', $event)"
  >
    <!-- Loading spinner -->
    <svg
      v-if="loading"
      class="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>

    <!-- Leading Icon -->
    <span
      v-else-if="icon"
      class="material-symbols-outlined text-[18px] mr-1.5 flex-shrink-0"
    >
      {{ icon }}
    </span>

    <slot></slot>

    <!-- Trailing Icon -->
    <span
      v-if="trailingIcon"
      class="material-symbols-outlined text-[18px] ml-1.5 flex-shrink-0"
    >
      {{ trailingIcon }}
    </span>
  </button>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'tertiary', 'secondary', 'outline', 'ghost', 'error'].includes(v)
  },
  size: {
    type: String,
    default: 'md',
    validator: (s) => ['sm', 'md', 'lg'].includes(s)
  },
  type: {
    type: String,
    default: 'button'
  },
  icon: {
    type: String,
    default: ''
  },
  trailingIcon: {
    type: String,
    default: ''
  },
  disabled: {
    type: Boolean,
    default: false
  },
  loading: {
    type: Boolean,
    default: false
  },
  block: {
    type: Boolean,
    default: false
  }
});

defineEmits(['click']);

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'sm':
      return 'h-10 px-3 text-label-md rounded-lg gap-1';
    case 'lg':
      return 'h-12 px-6 text-label-lg rounded-xl gap-2 text-base';
    case 'md':
    default:
      return 'h-11 px-4 text-label-md rounded-lg gap-1.5';
  }
});

const variantClasses = computed(() => {
  switch (props.variant) {
    case 'tertiary':
      return 'bg-tertiary hover:bg-tertiary-container text-on-tertiary shadow-sm active:scale-[0.98]';
    case 'secondary':
      return 'bg-secondary hover:bg-secondary-container text-on-secondary shadow-sm active:scale-[0.98]';
    case 'outline':
      return 'bg-surface-container-lowest hover:bg-surface-container-low text-on-surface border border-outline-variant/60 shadow-sm';
    case 'ghost':
      return 'bg-surface-container-low hover:bg-surface-container text-on-surface';
    case 'error':
      return 'bg-error hover:bg-red-700 text-on-error shadow-sm';
    case 'primary':
    default:
      return 'bg-primary hover:bg-primary-container text-on-primary shadow-sm active:scale-[0.98]';
  }
});
</script>
