<template>
  <span
    :class="[
      'inline-flex items-center gap-1 font-bold rounded-full select-none',
      sizeClasses,
      variantClasses
    ]"
  >
    <span
      v-if="icon"
      class="material-symbols-outlined text-[13px] leading-none"
    >
      {{ icon }}
    </span>
    <slot>{{ label }}</slot>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  variant: {
    type: String,
    default: 'found',
    validator: (v) => ['found', 'lost', 'claimed', 'primary', 'tertiary', 'neutral', 'warning'].includes(v)
  },
  size: {
    type: String,
    default: 'sm',
    validator: (s) => ['xs', 'sm', 'md'].includes(s)
  },
  icon: {
    type: String,
    default: ''
  },
  label: {
    type: String,
    default: ''
  }
});

const sizeClasses = computed(() => {
  switch (props.size) {
    case 'xs':
      return 'px-2 py-0.5 text-[10px] leading-[12px]';
    case 'md':
      return 'px-3 py-1 text-label-md';
    case 'sm':
    default:
      return 'px-2.5 py-0.5 text-label-sm';
  }
});

const variantClasses = computed(() => {
  switch (props.variant.toLowerCase()) {
    case 'found':
      return 'bg-tertiary/10 text-tertiary border border-tertiary/20';
    case 'lost':
      return 'bg-secondary-fixed text-on-secondary-fixed-variant border border-secondary-fixed-dim/40';
    case 'claimed':
      return 'bg-primary-fixed text-on-primary-fixed-variant border border-primary-fixed-dim/40';
    case 'primary':
      return 'bg-primary-fixed text-on-primary-fixed-variant';
    case 'tertiary':
      return 'bg-tertiary-fixed text-on-tertiary-fixed';
    case 'warning':
      return 'bg-amber-100 text-amber-900 border border-amber-300';
    case 'neutral':
    default:
      return 'bg-surface-variant text-on-surface-variant';
  }
});
</script>
