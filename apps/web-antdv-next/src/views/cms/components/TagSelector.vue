<script lang="ts" setup>
import type { TagDto } from '#/api/cms';

import { onMounted, ref } from 'vue';

import { Select } from 'antdv-next';

import { getTagsApi } from '#/api/cms';

withDefaults(
  defineProps<{
    disabled?: boolean;
    placeholder?: string;
    value?: string[];
  }>(),
  {
    disabled: false,
    placeholder: '输入或选择标签，回车新增',
    value: () => [],
  },
);

const emit = defineEmits<{
  'update:value': [val: string[]];
}>();

const tagOptions = ref<{ label: string; value: string }[]>([]);

onMounted(async () => {
  try {
    const res = await getTagsApi({ maxResultCount: 200 });
    tagOptions.value = (res.items || []).map((t: TagDto) => ({
      label: t.name,
      value: t.name,
    }));
  } catch (error) {
    console.error('加载标签失败', error);
  }
});
</script>

<template>
  <Select
    :value="value"
    mode="tags"
    :options="tagOptions"
    :placeholder="placeholder"
    :disabled="disabled"
    class="w-full"
    @update:value="(val) => emit('update:value', val as string[])"
  />
</template>
