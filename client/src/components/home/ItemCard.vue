<template>
  <article
    :class="[
      'bg-surface-container-lowest rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md border border-outline-variant/30 transition-all duration-200 flex flex-col justify-between gap-4 group',
      item.status === 'Claimed' ? 'opacity-95' : ''
    ]"
  >
    <div class="flex flex-col gap-3">
      <!-- Status Badge & Relative Time Row -->
      <div class="flex items-start justify-between gap-2">
        <div class="flex items-center gap-1.5 flex-wrap">
          <!-- Status Pill -->
          <span
            v-if="item.status === 'Found'"
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-tertiary/10 text-tertiary font-label-sm text-label-sm font-bold border border-tertiary/20"
          >
            <span class="material-symbols-outlined text-[14px]">check_circle</span>
            <span>Found</span>
          </span>

          <span
            v-else-if="item.status === 'Lost'"
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold border border-secondary-fixed-dim/40"
          >
            <span class="material-symbols-outlined text-[14px]">warning</span>
            <span>Lost</span>
          </span>

          <span
            v-else
            class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold border border-primary-fixed-dim/40"
          >
            <span class="material-symbols-outlined text-[14px]">task_alt</span>
            <span>Claimed</span>
          </span>

          <!-- Owner Indicator Badge -->
          <span
            v-if="isOwner"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-[11px] font-semibold border border-primary/20"
            title="You created this listing"
          >
            <span class="material-symbols-outlined text-[13px]">person</span>
            <span>Your Listing</span>
          </span>
        </div>

        <!-- Relative Time -->
        <span class="font-body-sm text-xs text-outline flex items-center gap-1 flex-shrink-0">
          <span class="material-symbols-outlined text-[14px]">schedule</span>
          <span>{{ formatTimeAgo(item.created_at) }}</span>
        </span>
      </div>

      <!-- Media & Details row -->
      <div class="flex items-center gap-3 sm:gap-4">
        <!-- Thumbnail -->
        <div class="w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-surface-container-low flex-shrink-0 relative border border-outline-variant/20">
          <img
            v-if="item.image_url && !imgError"
            :src="item.image_url"
            :alt="item.name"
            class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            @error="imgError = true"
          >
          <div
            v-else
            class="w-full h-full flex flex-col items-center justify-center text-outline bg-surface-container-low"
          >
            <span class="material-symbols-outlined text-[28px] text-primary">
              {{ getCategoryIcon(item.category) }}
            </span>
          </div>

          <!-- Verified Overlay if Claimed -->
          <div
            v-if="item.status === 'Claimed'"
            class="absolute inset-0 bg-tertiary/20 backdrop-blur-[1px] flex items-center justify-center"
          >
            <span class="material-symbols-outlined text-white text-[24px] drop-shadow-sm">verified</span>
          </div>
        </div>

        <!-- Details Column -->
        <div class="flex flex-col min-w-0 flex-1">
          <h4 class="font-headline-sm text-sm sm:text-headline-sm font-bold text-on-surface truncate" :title="item.name">
            {{ item.name }}
          </h4>

          <p class="font-body-sm text-xs sm:text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5">
            <span
              class="material-symbols-outlined text-[15px] flex-shrink-0"
              :class="item.status === 'Lost' ? 'text-error' : item.status === 'Claimed' ? 'text-tertiary' : 'text-primary'"
            >
              {{ item.status === 'Lost' ? 'near_me' : item.status === 'Claimed' ? 'check_circle' : 'pin_drop' }}
            </span>
            <span class="truncate">{{ item.location }}</span>
          </p>

          <!-- Desk or Reporter meta -->
          <p
            v-if="item.desk_location"
            class="font-label-sm text-[11px] sm:text-label-sm text-tertiary mt-1 font-semibold flex items-center gap-1 truncate"
          >
            <span class="material-symbols-outlined text-[14px] flex-shrink-0">desk</span>
            <span class="truncate">{{ item.desk_location }}</span>
          </p>
          <p
            v-else-if="item.reporter_name"
            class="font-label-sm text-[11px] sm:text-label-sm text-outline mt-1 flex items-center gap-1 truncate"
          >
            <span class="material-symbols-outlined text-[14px] flex-shrink-0">person</span>
            <span class="truncate">Reported by: {{ item.reporter_name }}</span>
          </p>
        </div>
      </div>

      <!-- Description Note Card -->
      <div class="p-2.5 sm:p-3 rounded-xl bg-surface-container-low text-on-surface font-body-sm text-xs sm:text-body-sm line-clamp-2 leading-relaxed border border-outline-variant/10">
        {{ item.description || 'No additional description provided. Inquire at campus lost & found.' }}
      </div>
    </div>

    <!-- Action Row -->
    <div class="pt-1 flex items-center justify-between gap-2 border-t border-outline-variant/20 mt-1">
      <!-- Found status actions -->
      <template v-if="item.status === 'Found'">
        <!-- Listing Owner View: Review Claims -->
        <button
          v-if="isOwner"
          type="button"
          class="flex-1 h-10 sm:h-11 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs sm:text-label-md transition-colors flex items-center justify-center gap-1.5 shadow-xs min-h-[40px] cursor-pointer"
          @click="$emit('review-claims', item)"
        >
          <span class="material-symbols-outlined text-[18px]">rate_review</span>
          <span>Review Claims</span>
          <span
            v-if="item.pending_claims_count > 0"
            class="ml-1 px-1.5 py-0.5 bg-white text-primary text-[10px] font-extrabold rounded-full"
          >
            {{ item.pending_claims_count }}
          </span>
        </button>

        <!-- Other Student View: Claim Belonging -->
        <button
          v-else
          type="button"
          class="flex-1 h-10 sm:h-11 px-3 rounded-lg bg-primary hover:bg-primary-container text-on-primary font-label-md text-xs sm:text-label-md transition-colors flex items-center justify-center gap-1.5 shadow-xs min-h-[40px] cursor-pointer"
          @click="$emit('claim', item)"
        >
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>Claim Belonging</span>
        </button>
      </template>

      <!-- Lost status actions -->
      <button
        v-else-if="item.status === 'Lost'"
        type="button"
        class="flex-1 h-10 sm:h-11 px-3 rounded-lg bg-tertiary hover:bg-tertiary-container text-on-tertiary font-label-md text-xs sm:text-label-md transition-colors flex items-center justify-center gap-1.5 shadow-xs min-h-[40px] cursor-pointer"
        @click="$emit('spotted', item)"
      >
        <span class="material-symbols-outlined text-[18px]">thumb_up</span>
        <span>I Spotted / Found This</span>
      </button>

      <!-- Claimed (Reunited Archive) status actions -->
      <div
        v-else
        class="flex-1 flex items-center gap-2"
      >
        <div class="flex-1 h-10 sm:h-11 px-3 rounded-lg bg-tertiary/10 text-tertiary font-label-md text-xs sm:text-label-md flex items-center justify-center gap-1.5 font-semibold">
          <span class="material-symbols-outlined text-[18px]">verified</span>
          <span>Reunited with Owner</span>
        </div>
        <button
          v-if="isOwner"
          type="button"
          class="h-10 sm:h-11 px-2.5 rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-xs flex items-center justify-center gap-1 border border-outline-variant/30 cursor-pointer"
          title="View approved claim record"
          @click="$emit('review-claims', item)"
        >
          <span class="material-symbols-outlined text-[16px]">history</span>
          <span>Record</span>
        </button>
      </div>
    </div>
  </article>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  item: {
    type: Object,
    required: true
  },
  currentUser: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['claim', 'spotted', 'review-claims']);

const isOwner = computed(() => {
  return (
    props.currentUser &&
    props.item.owner_student_id &&
    props.item.owner_student_id.toUpperCase() === props.currentUser.studentId.toUpperCase()
  );
});

const imgError = ref(false);

function getCategoryIcon(category) {
  const c = (category || '').toLowerCase();
  if (c.includes('elect')) return 'headphones';
  if (c.includes('key')) return 'key';
  if (c.includes('bag')) return 'backpack';
  if (c.includes('id') || c.includes('card')) return 'badge';
  if (c.includes('book') || c.includes('suppl')) return 'calculate';
  if (c.includes('cloth')) return 'apparel';
  if (c.includes('water') || c.includes('bottle')) return 'local_cafe';
  return 'inventory_2';
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Recently';
  const now = new Date();
  const past = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z'));
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return past.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
</script>
