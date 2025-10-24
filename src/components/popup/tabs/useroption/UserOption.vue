<script setup lang="ts">
import CheckBox from '@/components/popup/tabs/useroption/CheckBox.vue'
import Header from '@/components/popup/tabs/useroption/Header.vue'
import useUserOption, { type UserOption } from '@/composables/useUserOption'
const { state, updateUserOption } = useUserOption()

export interface UserOptionEntry {
  key: keyof UserOption,
  label: string
}
const options: UserOptionEntry[] = [
  { key: 'enabled', label: i18n.t('userOption.enabled') },
  { key: 'useNormalize', label: i18n.t('userOption.useNormalize') },
  { key: 'useCaseInsensitive', label: i18n.t('userOption.useCaseInsensitive') },
  { key: 'useTemporaryWordSensitive', label: i18n.t('userOption.useTemporaryWordSensitive') },
  { key: 'useWordSensitive', label: i18n.t('userOption.useWordSensitive') },
  { key: 'useTemporaryMentionSensitive', label: i18n.t('userOption.useTemporaryMentionSensitive') },
  { key: 'useMentionSensitive', label: i18n.t('userOption.useMentionSensitive') },
]
</script>

<template>
  <div class="box-border flex flex-col h-[420px] w-[520px]">
    <Header />
    <div v-if="state" class="flex flex-col gap-2 grow">
      <CheckBox v-for="option in options" :id="option.key" :key="option.key" :label="option.label"
        :model-value="state[option.key]" @update:model-value="updateUserOption({ type: 'toggle', key: option.key })" />
    </div>
  </div>
</template>