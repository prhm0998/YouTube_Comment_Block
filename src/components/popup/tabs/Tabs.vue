<script setup lang="ts">
import { IconRaiseHandOff, IconPenOff, IconGear } from '@iconify-prerendered/vue-pepicons-pop'

import IgnoreList from '@/components/popup/tabs/ignorelist/IgnoreList.vue'
import UserOption from '@/components/popup/tabs/useroption/UserOption.vue'

export interface TabType {
  key: StorageItemKey
  name: 'Word' | 'Name' | 'Option'
}

const tabs: TabType[] = [
  { key: 'local:Word', name: 'Word' },
  { key: 'local:Name', name: 'Name' },
  { key: 'local:Option', name: 'Option' },
]

const activeTab = ref<TabType>(tabs[0])

</script>

<template>
  <div class="">
    <div class="border-b border-gray-200 dark:border-gray-700">
      <ul class="dark:text-gray-400 flex flex-wrap font-medium gap-3 text-gray-500 text-lg">
        <li v-for="tab in tabs" :key="tab.key" class="me-2" @click="activeTab = tab">
          <a href="#"
            class="border-b-2 border-transparent dark:hover:text-gray-300 hover:border-gray-300 hover:text-gray-600 inline-flex items-center justify-center p-4 rounded-t-lg select-none">
            <IconGear v-if="tab.name === `Option`" class="mr-2" color="#393f4c" />
            <IconPenOff v-if="tab.name === `Word`" class="mr-2" color="#393f4c" />
            <IconRaiseHandOff v-if="tab.name === `Name`" class="mr-2" color="#393f4c" />
            {{ tab.name }}
          </a>
        </li>
      </ul>
      <div class="px-2">
        <IgnoreList v-if="activeTab.key === 'local:Word'" ref="ignoreListRef" :model-value="activeTab" :regexp="true"
          :edit="true" />
        <IgnoreList v-else-if="activeTab.key === 'local:Name'" ref="ignoreListRef" :model-value="activeTab" />
        <UserOption v-else :model-value="activeTab" />
      </div>
    </div>
  </div>
</template>