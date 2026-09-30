<script lang="ts" setup>
import { Empty as AEmpty } from 'antdv-next';

interface Props {
  description?: string;
}

withDefaults(defineProps<Props>(), {
  description: '当前筛选范围暂无统计数据',
});
</script>

<template>
  <div class="flex h-64 w-full items-center justify-center p-6">
    <AEmpty :description="description" />
  </div>
</template>
