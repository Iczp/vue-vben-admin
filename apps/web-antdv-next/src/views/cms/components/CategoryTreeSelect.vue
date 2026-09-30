<script lang="ts" setup>
import type { CategoryDto } from '#/api/cms';

import { onMounted, ref } from 'vue';

import { TreeSelect } from 'antdv-next';

import { getCategoriesApi } from '#/api/cms';

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    multiple?: boolean;
    placeholder?: string;
    value?: string | string[];
  }>(),
  {
    allowClear: true,
    multiple: false,
    placeholder: '请选择栏目分类',
    value: undefined,
  },
);

const emit = defineEmits<{
  'update:value': [val: any];
}>();

const treeData = ref<any[]>([]);
const loading = ref(false);

function buildTree(items: CategoryDto[]): any[] {
  const map = new Map<string, any>();
  const roots: any[] = [];

  items.forEach((item) => {
    map.set(item.id, {
      children: [],
      key: item.id,
      title: item.name,
      value: item.id,
    });
  });

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

onMounted(async () => {
  loading.value = true;
  try {
    const res = await getCategoriesApi({ maxResultCount: 300 });
    treeData.value = buildTree(res.items || []);
  } catch (error) {
    console.error('加载分类树失败', error);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <TreeSelect
    :value="value"
    :tree-data="treeData"
    :placeholder="placeholder"
    :multiple="multiple"
    :allow-clear="allowClear"
    tree-default-expand-all
    :dropdown-style="{ maxHeight: '350px', overflow: 'auto' }"
    class="w-full"
    @update:value="(val) => emit('update:value', val)"
  />
</template>
