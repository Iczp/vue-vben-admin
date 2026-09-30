<script lang="ts" setup>
import { computed } from 'vue';

import { Image, Input } from 'antdv-next';

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    placeholder?: string;
    value?: string;
  }>(),
  {
    disabled: false,
    placeholder: '请输入媒体文件/图片访问 URL',
    value: '',
  },
);

const emit = defineEmits<{
  'update:value': [val: string];
}>();

const modelValue = computed({
  get: () => props.value,
  set: (val) => emit('update:value', val),
});
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="flex-1">
      <Input
        v-model:value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        allow-clear
      />
    </div>
    <div
      v-if="modelValue"
      class="size-10 border rounded overflow-hidden shrink-0 flex items-center justify-center bg-muted/20"
    >
      <Image
        :src="modelValue"
        :width="40"
        :height="40"
        class="object-cover"
        fallback="https://via.placeholder.com/40"
      />
    </div>
  </div>
</template>
