<script lang="ts" setup>
import type { DeviceGroupDto } from '#/api/device';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'antdv-next';

import { createDeviceGroupApi, updateDeviceGroupApi } from '#/api/device';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const groupModel = ref<DeviceGroupDto | null>(null);

const name = ref('');
const description = ref('');

const isEdit = computed(() => Boolean(groupModel.value?.id));
const getTitle = computed(() =>
  isEdit.value
    ? `${$t('common.edit', '编辑分组')} - ${groupModel.value?.name}`
    : $t('common.create', '新建分组'),
);

function resetState() {
  groupModel.value = null;
  name.value = '';
  description.value = '';
}

const [Modal, modalApi] = useVbenModal<DeviceGroupDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!name.value.trim()) {
      message.warning('请输入分组名称');
      return;
    }

    try {
      modalApi.lock();
      if (isEdit.value && groupModel.value?.id) {
        await updateDeviceGroupApi(groupModel.value.id, {
          description: description.value.trim() || undefined,
          name: name.value.trim(),
        });
        message.success('分组修改成功');
      } else {
        await createDeviceGroupApi({
          description: description.value.trim() || undefined,
          name: name.value.trim(),
        });
        message.success('分组创建成功');
      }

      modalApi.close();
      emit('success');
    } catch {
      // 全局拦截器处理
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const payload = modalApi.getData();
      if (payload) {
        groupModel.value = payload;
        name.value = payload.name || '';
        description.value = payload.description || '';
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[480px]">
    <div class="space-y-4 p-4">
      <div>
        <div class="mb-1 font-medium">
          <span class="text-red-500">*</span> 分组名称
        </div>
        <Input
          v-model:value="name"
          placeholder="请输入分组名称（如：研发测试组、售后巡检组）"
          :maxlength="64"
        />
      </div>

      <div>
        <div class="mb-1 font-medium">分组说明</div>
        <Input.TextArea
          v-model:value="description"
          placeholder="请输入分组说明（可选）"
          :rows="3"
          :maxlength="256"
          show-count
        />
      </div>
    </div>
  </Modal>
</template>
