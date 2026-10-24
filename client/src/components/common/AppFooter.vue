<template>
  <footer class="w-full bg-surface-container-lowest mt-12 sm:mt-16 border-t border-outline-variant/30 shadow-[0_-1px_8px_rgba(0,0,0,0.02)]">
    <div class="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 pb-8">
        <!-- Brand Info -->
        <div class="flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary shadow-sm">
              <span class="material-symbols-outlined text-[18px]">explore</span>
            </div>
            <span class="font-headline-sm text-headline-sm font-bold text-on-surface">Campus Findr</span>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md">
            Official lost and found network connecting university students, faculty, campus safety, and campus union lost-and-found desks.
          </p>
          <div class="flex items-center gap-2 pt-1 text-xs text-outline">
            <span class="material-symbols-outlined text-[16px] text-tertiary">lock_reset</span>
            <span>Zero-theft verified student claim workflow</span>
          </div>
        </div>

        <!-- Support & Guidelines Links -->
        <div class="flex flex-col gap-2 md:items-end">
          <span class="font-label-lg text-label-lg font-bold text-on-surface mb-1">Support &amp; Guidelines</span>
          <a class="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors py-0.5" href="#faqs" @click.prevent="$emit('show-info', 'faq')">
            Campus Lost Item FAQs
          </a>
          <a class="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors py-0.5" href="#verification" @click.prevent="$emit('show-info', 'verification')">
            Verification &amp; Ownership Rules
          </a>
          <a class="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors py-0.5" href="#terms" @click.prevent="$emit('show-info', 'terms')">
            Terms of Service &amp; Privacy
          </a>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="pt-6 border-t border-outline-variant/20 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span class="font-body-sm text-body-sm text-on-surface-variant text-center sm:text-left">
          © 2025 State University Campus Life. All rights reserved.
        </span>

        <div class="flex items-center gap-4">
          <span class="font-label-sm text-label-sm text-on-surface-variant">Campus Findr v2.4</span>
          <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary-fixed text-on-tertiary-fixed font-label-sm text-label-sm font-semibold">
            <span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
            System Normal
          </span>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
defineEmits(['show-info']);
</script>
