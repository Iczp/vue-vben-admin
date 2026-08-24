<script lang="ts" setup>
import type { DeviceDto } from '#/api/device';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message, Switch } from 'antdv-next';

import { updateDeviceApi } from '#/api/device';
import { $t } from '#/locales';

const emit = defineEmits(['success']);

const deviceModel = ref<DeviceDto | null>(null);

const name = ref('');
const isEnabled = ref(true);

const getTitle = computed(
  () => `${$t('common.edit', '编辑设备')} - ${deviceModel.value?.name || deviceModel.value?.deviceId}`,
);

function resetState() {
  deviceModel.value = null;
  name.value = '';
  isEnabled.value = true;
}

const [Modal, modalApi] = useVbenModal<DeviceDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!deviceModel.value?.id) return;

    try {
      modalApi.lock();
      await updateDeviceApi(deviceModel.value.id, {
        isEnabled: isEnabled.value,
        name: name.value.trim(),
      });

      message.success($t('common.saveSuccess', '保存成功'));
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      resetState();
      const payload = modalApi.getData();
      if (payload) {
        deviceModel.value = payload;
        name.value = payload.name || '';
        isEnabled.value = payload.isEnabled ?? true;
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
        <div class="mb-1 font-medium">设备备注名称</div>
        <Input v-model:value="name" placeholder="如：张三的 iPhone 15 Pro" />
      </div>

      <div class="flex items-center justify-between py-2 border-t pt-3">
        <div>
          <div class="font-medium">允许该设备登录</div>
          <div class="text-xs text-muted-foreground">
            禁用后该设备将无法通过凭据或 Token 登录
          </div>
        </div>
        <Switch v-model:checked="isEnabled" />
      </div>
    </div>
  </Modal>
</template>
