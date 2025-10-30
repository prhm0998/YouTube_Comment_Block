<script setup lang="ts">
import dayjs from 'dayjs'

import Header from '@/components/popup/tabs/ignorelist/Header.vue'
import RemoveButton from '@/components/popup/tabs/ignorelist/RemoveButton.vue'
import type { TabType } from '@/components/popup/tabs/Tabs.vue'
import isValidRegex from '@/utils/isValidRegex'

interface Props {
  modelValue: TabType
  regexp?: boolean
  edit?: boolean
}
const props = withDefaults(defineProps<Props>(), {
  regexp: false,
  edit: false,
})
const { state, insert, remove } = useIgnore(props.modelValue.key)

const userInput = ref('')
const now = dayjs()
const validateUserInput = computed(() => {
  if (!userInput?.value) return false
  if (props.regexp && !isValidRegex(userInput.value)) return false
  return true
})
const submitIgnore = () => {
  if (!validateUserInput.value) return
  insert(userInput.value)
  userInput.value = ''
}

const inputRef = ref()
const focus = () => {
  inputRef.value?.focus()
}

const dataEdit = (key: string) => {
  if (props.edit)
    userInput.value = key
}

defineExpose({ focus })
const isLongId = (length: number) => {
  return length > 27 // この値は適宜調整してください
}

</script>

<template>
  <div class="box-border flex flex-col h-[420px] w-[520px]">
    <Header :model-value="modelValue.name" />
    <!-- 入力フォーム部分（そのまま） -->
    <div class="flex items-center justify-center">
      <input :id="modelValue.name" ref="inputRef" v-model="userInput" :placeholder="`Enter Ignore ${modelValue.name}`"
        type="text"
        class="bg-gray-100 block border border-gray-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:border-blue-500 dark:focus:ring-blue-500 dark:placeholder-gray-400 dark:text-gray-400 flex-1 focus:border-blue-500 focus:ring-blue-500 mb-2 mx-2 p-2.5 rounded-lg text-gray-900 text-sm w-full"
        @keydown.enter="submitIgnore" />
      <button type="button" :disabled="!validateUserInput"
        class="border border-gray-800 dark:border-gray-600 dark:disabled:border-gray-700 dark:focus:ring-gray-800 dark:hover:bg-gray-600 dark:hover:text-white dark:text-gray-400 disabled:cursor-not-allowed disabled:shadow-none disabled:text-gray-500 enabled:hover:bg-blue-400 enabled:hover:text-white focus:outline-none focus:ring-4 focus:ring-gray-300 font-medium h-8 mb-2 me-2 px-5 rounded-lg text-blue-500 text-xs"
        @click="submitIgnore">
        {{ i18n.t("dialog.button.submit") }}
      </button>
    </div>

    <!-- テーブルレイアウト -->
    <div>{{ }}</div>
    <div class="grow gutter-stable mr-2 overflow-y-auto">
      <table class="table table-fixed table-pin-rows table-sm table-zebra w-full">
        <thead>
          <tr class="shadow">
            <th class="w-auto">{{ modelValue.name }}</th>
            <th class="w-[100px]">Submit At</th>
            <th class="w-[100px]">Last Find (days)</th>
            <th class="w-[82px]"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(key, index) in [...state.values()]" :key="index">
            <!-- 名前列 -->
            <td :class="{
              'is-long-id': isLongId(key.id.length),
            }" class="cursor-pointer font-bold hover:overflow-visible hover:whitespace-normal max-w-[200px] truncate"
              @click="dataEdit(key.id)">
              {{ key.id }}
            </td>

            <!-- SubmitAt -->
            <td class="italic text-center">
              {{ key.submitAt.format(i18n.t('format.date')) }}
            </td>

            <!-- Last Find -->
            <td class="text-center">
              {{ now.diff(key.lastFindAt, "d") }}
            </td>

            <!-- 削除ボタン -->
            <td class="text-center">
              <RemoveButton :id="key.id" :remove="remove" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
