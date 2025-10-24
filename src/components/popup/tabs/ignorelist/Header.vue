<script setup lang="ts">
interface Props {
  modelValue: string
}defineProps<Props>()
</script>
<template>
  <h2 class="dark:text-gray-600 flex gap-2 mb-4 mt-1 text-2xl text-gray-700">
    <span>Ignore</span>
    <span class="capitalize">{{ modelValue }}</span>
    <span>Management</span>
  </h2>
</template>
