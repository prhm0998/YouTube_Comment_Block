<template>
  <button type="button"
    class="border border-red-700 dark:border-red-500 dark:focus:ring-red-900 dark:hover:bg-red-500 dark:hover:text-white dark:text-red-500 focus:outline-none focus:ring-4 focus:ring-red-300 font-medium h-7 hover:bg-red-500 hover:text-white min-w-16 rounded-lg select-none text-center text-red-700"
    @click="remove(id)">
    <span class="font-bold text-nowrap text-xs">{{ i18n.t("dialog.button.delete") }}</span>
  </button>
</template>

<script lang="ts" setup>

interface Props {
  id: string,
  remove: (id: string) => void
}
defineProps<Props>()
</script>

<style></style>