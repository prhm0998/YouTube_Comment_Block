<template>
  <div id="WXT-FIELD">
    <button class="name-button" @click="emits('click')">Add Id
      <span class="tooltip">{{ name }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">

interface Props {
  name: string
}
defineProps<Props>()

const emits = defineEmits<{
  (e: 'click'): void
}>()

</script>

<style lang="scss" scoped>
.name-button {
  position: relative;
  display: inline-block;
  margin: 4px;
  padding: 5px 10px;
  font-size: 10px;
  border: none;
  border-radius: 5px;
  background-color: #b6e4b6;
  cursor: pointer;
  margin-left: 36px;

  .tooltip {
    visibility: hidden;
    width: 120px;
    background-color: #000;
    color: #fff;
    text-align: center;
    border-radius: 6px;
    padding: 5px 0;
    position: absolute;
    z-index: 1;
    bottom: 125%;
    left: 50%;
    margin-left: -60px;
    opacity: 0;
    transition: opacity 0.5s;

    &::after {
      content: "";
      position: absolute;
      top: 100%;
      left: 50%;
      margin-left: -5px;
      border-width: 5px;
      border-style: solid;
      border-color: #000 transparent transparent transparent;
    }
  }

  &:not(:hover) {
    opacity: 0.2;
  }

  &:hover {
    opacity: 1;
    background-color: #6adf6a;
    color: rgb(0, 0, 0);
  }

  &:hover .tooltip {
    visibility: visible;
    opacity: 1;
  }
}
</style>
