<script lang="ts" setup>
interface Props {
  cols?: number;
}

withDefaults(defineProps<Props>(), {
  cols: 5,
});
</script>

<template>
  <div
    class="grid gap-3 mb-4"
    :class="{
      'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6': cols === 6,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5': cols === 5,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4': cols === 4,
      'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3': cols === 3,
      'grid-cols-1 sm:grid-cols-2': cols === 2,
    }"
  >
    <slot></slot>
  </div>
</template>
