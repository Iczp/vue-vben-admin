<script lang="ts" setup>
import type { CategoryDto } from '#/api/cms';

import { computed, onMounted, ref, watch } from 'vue';

import { TreeSelect } from 'antdv-next';

import { getCategoriesApi } from '#/api/cms';

const props = withDefaults(
  defineProps<{
    allowClear?: boolean;
    disabled?: boolean;
    dropdownStyle?: Record<string, any>;
    maxTagCount?: 'responsive' | number;
    multiple?: boolean;
    placeholder?: string;
    showSearch?: boolean;
    treeCheckable?: boolean;
    treeCheckStrictly?: boolean;
    treeData?: any[];
    value?: any;
  }>(),
  {
    allowClear: true,
    disabled: false,
    dropdownStyle: () => ({ maxHeight: '350px', overflow: 'auto' }),
    maxTagCount: 'responsive',
    multiple: false,
    placeholder: '请选择栏目分类',
    showSearch: true,
    treeCheckable: false,
    treeCheckStrictly: false,
    treeData: undefined,
    value: undefined,
  },
);

const emit = defineEmits<{
  'update:value': [val: any];
  change: [val: any];
}>();

const internalTreeData = ref<any[]>([]);
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

  items.forEach((item) => {
    const node = map.get(item.id)!;
    if (node.children && node.children.length === 0) {
      delete node.children;
    }
  });

  return roots;
}

async function loadData() {
  if (props.treeData && props.treeData.length > 0) {
    internalTreeData.value = props.treeData;
    return;
  }
  loading.value = true;
  try {
    const res = await getCategoriesApi({ maxResultCount: 500 });
    internalTreeData.value = buildTree(res.items || []);
  } catch (error) {
    console.error('加载分类树失败', error);
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.treeData,
  (val) => {
    if (val && val.length > 0) {
      internalTreeData.value = val;
    }
  },
  { deep: true },
);

// 当使用 treeCheckStrictly 时，TreeSelect 绑定的值为 { label, value } 格式
// 为方便外部使用，此处做双向适配：外部可继续传入 string[]，内部自动适配
const treeSelectValue = computed(() => {
  if (!props.treeCheckStrictly) {
    return props.value;
  }
  if (!props.value) return [];
  const rawList = Array.isArray(props.value) ? props.value : [props.value];
  return rawList.map((item) => {
    if (typeof item === 'object' && item !== null && 'value' in item) {
      return item;
    }
    return { value: item, label: item };
  });
});

function onValueChange(val: any) {
  if (!props.treeCheckStrictly) {
    emit('update:value', val);
    emit('change', val);
    return;
  }
  if (Array.isArray(val)) {
    const ids = val.map((item: any) =>
      typeof item === 'object' && item !== null && 'value' in item
        ? item.value
        : item,
    );
    emit('update:value', ids);
    emit('change', ids);
  } else if (typeof val === 'object' && val !== null && 'value' in val) {
    emit('update:value', val.value);
    emit('change', val.value);
  } else {
    emit('update:value', val);
    emit('change', val);
  }
}

onMounted(() => {
  loadData();
});

defineExpose({
  loadData,
  treeData: internalTreeData,
});
</script>

<template>
  <TreeSelect
    :value="treeSelectValue"
    :tree-data="internalTreeData"
    :placeholder="placeholder"
    :multiple="multiple || treeCheckable"
    :tree-checkable="treeCheckable"
    :tree-check-strictly="treeCheckStrictly"
    :allow-clear="allowClear"
    :disabled="disabled"
    :show-search="showSearch"
    tree-node-filter-prop="title"
    :max-tag-count="maxTagCount"
    tree-default-expand-all
    :dropdown-style="dropdownStyle"
    class="w-full"
    @update:value="onValueChange"
  />
</template>
