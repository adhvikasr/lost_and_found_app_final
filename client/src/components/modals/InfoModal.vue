<template>
  <BaseModal
    :is-open="isOpen"
    :title="modalTitle"
    :subtitle="modalSubtitle"
    icon="help"
    icon-variant="primary"
    @close="$emit('close')"
  >
    <div v-if="contentType === 'faq'" class="flex flex-col gap-3 text-sm">
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">How quickly are found items logged?</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          Concierge desks scan and log items immediately upon receipt. Good Samaritans can log items right from their phones.
        </p>
      </div>
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">What happens to unclaimed items?</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          Items are held for 90 days in accordance with university policy. After 90 days, reusable items are donated to student assistance programs.
        </p>
      </div>
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">How are high-value items protected?</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          Laptops, phones, and wallets are held in secure campus safety vaults and require photo ID + device unlock or serial number verification.
        </p>
      </div>
    </div>

    <div v-else-if="contentType === 'verification'" class="flex flex-col gap-3 text-sm">
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">Required Identification</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          Every claimant must produce a valid State University ID or government photo ID matching student enrollment records.
        </p>
      </div>
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">Device Authentication</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          For electronics, claimants must unlock the device with passcode or biometric verification in the presence of an authorized staff member.
        </p>
      </div>
    </div>

    <div v-else class="flex flex-col gap-3 text-sm">
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">State University Honor Code</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          Filing fraudulent ownership claims is a direct violation of the University Student Honor Code and will be referred to the Office of Student Conduct.
        </p>
      </div>
      <div class="p-3 bg-surface-container-low rounded-xl">
        <h4 class="font-bold text-on-surface mb-1">Privacy Notice</h4>
        <p class="text-on-surface-variant text-xs leading-relaxed">
          Personal contact details entered in claims are securely handled and never publicly broadcast on community boards.
        </p>
      </div>
    </div>

    <template #footer>
      <button
        type="button"
        class="h-11 px-5 rounded-xl bg-primary text-on-primary font-label-md text-label-md shadow-sm min-h-[44px]"
        @click="$emit('close')"
      >
        Understood
      </button>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue';
import BaseModal from '../common/BaseModal.vue';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  contentType: {
    type: String,
    default: 'faq'
  }
});

defineEmits(['close']);

const modalTitle = computed(() => {
  if (props.contentType === 'faq') return 'Campus Lost Item FAQs';
  if (props.contentType === 'verification') return 'Verification & Ownership Rules';
  return 'Terms of Service & Honor Code';
});

const modalSubtitle = computed(() => {
  return 'Official State University Campus Life Policy';
});
</script>
