<template>
  <section class="w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
    <div class="max-w-7xl mx-auto flex flex-col gap-6">
      <!-- Editorial Title & Value Prop -->
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div class="max-w-3xl">
          <div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm mb-3 shadow-xs">
            <span class="material-symbols-outlined text-[14px]">shield</span>
            Official State University Lost &amp; Found Portal
          </div>
          <h1 class="font-headline-xl text-2xl sm:text-headline-xl text-on-surface tracking-tight font-extrabold leading-tight">
            Lost something on campus? <br class="hidden sm:inline">Or holding someone's gear?
          </h1>
          <p class="font-body-lg text-sm sm:text-body-lg text-on-surface-variant mt-2 max-w-2xl leading-relaxed">
            How it works: If you've misplaced an item, create a lost alert or browse recent reports below. If you found something unattended on campus, log it to notify the community and facilitate a safe return.
          </p>
        </div>
      </div>

      <!-- Dual Split Hero Action Banners -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <!-- Left Action: I Lost Something -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container/10 via-surface-container-lowest to-surface-container-low p-5 sm:p-6 shadow-sm hover:shadow-md border border-primary/10 transition-all flex flex-col justify-between gap-6 group">
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-1.5">
              <span class="font-label-sm text-label-sm uppercase tracking-wider text-primary font-bold">
                Student Urgent Request
              </span>
              <h2 class="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface">
                I Lost Something
              </h2>
              <p class="font-body-md text-sm text-on-surface-variant max-w-md">
                Broadcast an active query, notify campus safety desks and student hubs instantly.
              </p>
            </div>
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-primary text-on-primary flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-[28px] sm:text-[32px]">manage_search</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              class="h-12 px-6 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-98 min-h-[44px]"
              @click="$emit('open-report', 'lost')"
            >
              <span class="material-symbols-outlined text-[20px]">add_alert</span>
              <span>Create Lost Item Alert</span>
            </button>
            <span class="font-body-sm text-xs sm:text-body-sm text-on-surface-variant flex items-center gap-1.5 px-1 py-1">
              <span class="material-symbols-outlined text-[16px] text-tertiary flex-shrink-0">check_circle</span>
              <span>Instant broadcast to library &amp; dorm desks</span>
            </span>
          </div>
        </div>

        <!-- Right Action: I Found an Item -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-tertiary-container/10 via-surface-container-lowest to-surface-container-low p-5 sm:p-6 shadow-sm hover:shadow-md border border-tertiary/15 transition-all flex flex-col justify-between gap-6 group">
          <div class="flex items-start justify-between gap-4">
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center gap-2">
                <span class="font-label-sm text-label-sm uppercase tracking-wider text-tertiary font-bold">
                  Good Samaritan Fast-Track
                </span>
              </div>
              <h2 class="font-headline-lg text-xl sm:text-headline-lg font-bold text-on-surface">
                I Found an Item
              </h2>
              <p class="font-body-md text-sm text-on-surface-variant max-w-md">
                Snap a 10-second photo, or hand off immediately to any verified campus concierge desk.
              </p>
            </div>
            <div class="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-tertiary text-on-tertiary flex items-center justify-center shadow-md flex-shrink-0 group-hover:scale-105 transition-transform">
              <span class="material-symbols-outlined text-[28px] sm:text-[32px]">handshake</span>
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
            <button
              type="button"
              class="h-12 px-6 rounded-xl bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-lg text-label-lg flex items-center justify-center gap-2 shadow-sm transition-all duration-150 active:scale-98 min-h-[44px]"
              @click="$emit('open-report', 'found')"
            >
              <span class="material-symbols-outlined text-[20px]">qr_code_scanner</span>
              <span>Log a Found Item</span>
            </button>
            <span class="font-body-sm text-xs sm:text-body-sm text-on-surface-variant flex items-center gap-1.5 px-1 py-1">
              <span class="material-symbols-outlined text-[16px] text-tertiary flex-shrink-0">verified</span>
              <span>Drop off QR generated in 1 click</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
defineEmits(['open-report']);
</script>
