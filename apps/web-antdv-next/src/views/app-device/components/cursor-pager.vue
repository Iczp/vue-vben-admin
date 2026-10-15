<script setup lang="ts">
import { Button, Select } from 'antdv-next';
defineProps<{
  count: number;
  hasNext: boolean;
  hasPrevious: boolean;
  loading: boolean;
  page: number;
  take: number;
}>();
defineEmits<{ next: []; previous: []; resize: [value: number] }>();
</script>
<template>
  <div
    class="flex flex-wrap items-center justify-end gap-3 border-t px-3 py-3 text-sm"
  >
    <span class="text-muted-foreground">
      第 {{ page }} 页 · 本页 {{ count }} 条
    </span>
    <Select
      :value="take"
      aria-label="每页条数"
      class="w-28"
      :disabled="loading"
      :options="
        [20, 50, 100, 200].map((value) => ({ label: `${value} 条/页`, value }))
      "
      @change="(value) => $emit('resize', Number(value))"
    />
    <Button :disabled="loading || !hasPrevious" @click="$emit('previous')">
      上一页
    </Button>
    <Button :disabled="loading || !hasNext" @click="$emit('next')">
      下一页
    </Button>
  </div>
</template>
