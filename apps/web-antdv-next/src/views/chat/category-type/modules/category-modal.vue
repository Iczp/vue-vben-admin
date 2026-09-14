<script lang="ts" setup>
import type { ChatObjectCategoryDto } from '#/api/chat';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, InputNumber, message } from 'antdv-next';

import { createCategoryApi, updateCategoryApi } from '#/api/chat';

const emit = defineEmits(['success']);

const currentRecord = ref<ChatObjectCategoryDto | null>(null);
const parentCategory = ref<ChatObjectCategoryDto | null>(null);

const name = ref('');
const description = ref('');
const sorting = ref<number | undefined>(0);

const isEdit = computed(() => !!currentRecord.value?.id);
const modalTitle = computed(() => {
  if (isEdit.value) {
    return `编辑分类 - ${currentRecord.value?.name}`;
  }
  if (parentCategory.value) {
    return `添加【${parentCategory.value.name}】的子分类`;
  }
  return '新建顶层分类';
});

function resetState() {
  currentRecord.value = null;
  parentCategory.value = null;
  name.value = '';
  description.value = '';
  sorting.value = 0;
}

const [Modal, modalApi] = useVbenModal<{
  parent?: ChatObjectCategoryDto | null;
  record?: ChatObjectCategoryDto | null;
}>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.warning('请输入分类名称');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateCategoryApi(currentRecord.value.id, {
          description: description.value.trim() || undefined,
          name: name.value.trim(),
          parentId: currentRecord.value.parentId,
          sorting: sorting.value,
        });
        message.success('分类更新成功');
      } else {
        await createCategoryApi({
          description: description.value.trim() || undefined,
          name: name.value.trim(),
          parentId: parentCategory.value?.id || null,
          sorting: sorting.value,
        });
        message.success('分类创建成功');
      }
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const data = modalApi.getData();
      if (data?.record) {
        currentRecord.value = data.record;
        name.value = data.record.name || '';
        description.value = data.record.description || '';
        sorting.value = data.record.sorting ?? 0;
      } else if (data?.parent) {
        parentCategory.value = data.parent;
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="modalTitle" class="w-[480px]">
    <div class="space-y-4 p-4">
      <div v-if="parentCategory" class="rounded bg-muted/50 p-2.5 text-xs text-muted-foreground">
        上级分类：<strong>{{ parentCategory.name }}</strong>
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">分类名称 <span class="text-red-500">*</span></div>
        <Input v-model:value="name" placeholder="请输入分类名称，如：部门组织、兴趣社群" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">排序号</div>
        <InputNumber v-model:value="sorting" class="w-full" :min="0" :max="9999" placeholder="数字越小越靠前" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">分类描述</div>
        <Input.TextArea v-model:value="description" :rows="3" placeholder="可选填分类描述" />
      </div>
    </div>
  </Modal>
</template>
