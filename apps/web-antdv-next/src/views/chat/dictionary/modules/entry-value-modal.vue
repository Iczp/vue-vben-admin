<script lang="ts" setup>
import type { EntryValueDto } from '#/api/chat';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, InputNumber, message } from 'antdv-next';

import { createEntryValueApi, updateEntryValueApi } from '#/api/chat';

const emit = defineEmits(['success']);

const currentRecord = ref<EntryValueDto | null>(null);
const currentEntryNameId = ref('');
const currentEntryName = ref('');

const name = ref('');
const value = ref('');
const description = ref('');
const sorting = ref<number | undefined>(0);

const isEdit = computed(() => !!currentRecord.value?.id);
const modalTitle = computed(() =>
  isEdit.value
    ? `编辑字典项 - ${currentRecord.value?.name}`
    : `在【${currentEntryName.value}】下新建字典项`,
);

function resetState() {
  currentRecord.value = null;
  currentEntryNameId.value = '';
  currentEntryName.value = '';
  name.value = '';
  value.value = '';
  description.value = '';
  sorting.value = 0;
}

const [Modal, modalApi] = useVbenModal<{
  entryName?: { id: string; name: string };
  record?: EntryValueDto | null;
}>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.warning('请输入字典项显示名称');
      return;
    }
    if (!value.value.trim()) {
      message.warning('请输入字典项键值 (Value)');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && currentRecord.value?.id) {
        await updateEntryValueApi(currentRecord.value.id, {
          description: description.value.trim() || undefined,
          name: name.value.trim(),
          sorting: sorting.value,
          value: value.value.trim(),
        });
        message.success('字典项更新成功');
      } else {
        await createEntryValueApi({
          description: description.value.trim() || undefined,
          entryNameId: currentEntryNameId.value,
          name: name.value.trim(),
          sorting: sorting.value,
          value: value.value.trim(),
        });
        message.success('字典项创建成功');
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
        currentEntryNameId.value = data.record.entryNameId;
        name.value = data.record.name || '';
        value.value = data.record.value || '';
        description.value = data.record.description || '';
        sorting.value = data.record.sorting ?? 0;
      } else if (data?.entryName) {
        currentEntryNameId.value = data.entryName.id;
        currentEntryName.value = data.entryName.name;
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
    <div class="space-y-3 p-4">
      <div>
        <div class="mb-1 font-medium text-sm">显示标签 (Label / Name) <span class="text-red-500">*</span></div>
        <Input v-model:value="name" placeholder="UI 展示文字，如：互联网/IT、VIP会员" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">键值 (Value) <span class="text-red-500">*</span></div>
        <Input v-model:value="value" placeholder="存入数据库的代码值，如：it, vip, 1, 2" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">排序号</div>
        <InputNumber v-model:value="sorting" class="w-full" :min="0" :max="9999" />
      </div>

      <div>
        <div class="mb-1 font-medium text-sm">说明</div>
        <Input.TextArea v-model:value="description" :rows="2" placeholder="可选填该选项的备注" />
      </div>
    </div>
  </Modal>
</template>
