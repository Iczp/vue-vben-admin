<script lang="ts" setup>
import type { DeviceDto, DeviceGroupDto } from '#/api/device';

import { computed, ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Checkbox, CheckboxGroup, Empty, message, Spin } from 'antdv-next';

import { getDeviceGroupsApi, setDeviceGroupsApi } from '#/api/device';

const emit = defineEmits(['success']);

const loading = ref(false);
const deviceModel = ref<DeviceDto | null>(null);
const allGroups = ref<DeviceGroupDto[]>([]);
const selectedGroupIds = ref<string[]>([]);

const getTitle = computed(
  () =>
    `分配设备分组 - ${deviceModel.value?.name || deviceModel.value?.deviceId || ''}`,
);

const [Modal, modalApi] = useVbenModal<DeviceDto | null>({
  fullscreenButton: false,
  async onConfirm() {
    if (!deviceModel.value?.id) return;

    try {
      modalApi.lock();
      await setDeviceGroupsApi(deviceModel.value.id, selectedGroupIds.value);
      message.success('设备分组分配成功');
      modalApi.close();
      emit('success');
    } catch {
      // 全局拦截器提示
    } finally {
      modalApi.lock(false);
    }
  },
  async onOpenChange(isOpen) {
    if (isOpen) {
      deviceModel.value = modalApi.getData() || null;
      selectedGroupIds.value = [...(deviceModel.value?.deviceGroupIdList || [])];
      loading.value = true;
      try {
        const groups = await getDeviceGroupsApi();
        allGroups.value = groups || [];
      } finally {
        loading.value = false;
      }
    } else {
      deviceModel.value = null;
      allGroups.value = [];
      selectedGroupIds.value = [];
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="getTitle" class="w-[520px]">
    <Spin :spinning="loading">
      <div class="p-4 space-y-4">
        <div class="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded">
          请勾选该设备归属的分组，可同时加入多个分组：
        </div>

        <div v-if="allGroups.length > 0" class="max-h-72 overflow-y-auto space-y-2 pr-1">
          <CheckboxGroup v-model:value="selectedGroupIds" class="w-full space-y-2">
            <div
              v-for="grp in allGroups"
              :key="grp.id"
              class="flex items-center justify-between p-2.5 rounded border border-border/70 hover:border-primary/50 transition-colors"
            >
              <Checkbox :value="grp.id" class="text-sm font-medium">
                {{ grp.name }}
              </Checkbox>
              <span v-if="grp.description" class="text-xs text-muted-foreground truncate max-w-[200px]" :title="grp.description">
                {{ grp.description }}
              </span>
            </div>
          </CheckboxGroup>
        </div>
        <Empty v-else description="暂无设备分组，请先在左侧新建分组" class="my-4" />
      </div>
    </Spin>
  </Modal>
</template>
