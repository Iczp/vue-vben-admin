<script setup lang="ts">
import type { AppDevice, DeviceProfile } from '#/api/modules/app-device';

import { nextTick, ref, watch } from 'vue';

import { Alert, message, Modal, Spin } from 'antdv-next';

import { useVbenForm } from '#/adapter/form';
import { editAppDevice, getAppDevice } from '#/api/modules/app-device';

import { isDeviceConflict } from '../../context';

const props = defineProps<{ appId: string; deviceId?: string }>();
const emit = defineEmits<{ success: [] }>();
const open = defineModel<boolean>('open', { default: false });
const record = ref<AppDevice>();
const loading = ref(false);
const saving = ref(false);
let generation = 0;
const fields = [
  ['name', '设备名称', 128],
  ['platform', '平台', 64],
  ['deviceType', '设备类型', 64],
  ['brand', '品牌', 128],
  ['model', '型号', 128],
  ['osVersion', '系统版本', 128],
  ['appVersion', '应用版本', 64],
] as const;
const [Form, form] = useVbenForm<Record<keyof DeviceProfile, string>>({
  showDefaultActions: false,
  layout: 'vertical',
  schema: fields.map(([fieldName, label, maxLength]) => ({
    fieldName,
    label,
    component: 'Input',
    componentProps: { maxLength, placeholder: label },
  })),
});
async function load() {
  if (!props.deviceId || !open.value) return;
  const version = ++generation;
  loading.value = true;
  record.value = undefined;
  try {
    const result = await getAppDevice(props.appId, props.deviceId);
    if (version !== generation) return;
    record.value = result;
    await nextTick();
    await form.setValues(
      Object.fromEntries(
        fields.map(([key]) => [key, result.profile[key] ?? '']),
      ),
    );
  } catch {
    // Keep the form unavailable until an authoritative record can be loaded.
  } finally {
    if (version === generation) loading.value = false;
  }
}
watch([open, () => props.appId, () => props.deviceId], () => {
  if (open.value) void load().catch(() => {});
  else {
    generation++;
    record.value = undefined;
  }
});
async function save() {
  if (!record.value || saving.value || loading.value) return;
  const { valid } = await form.validate();
  if (!valid) return;
  const values = await form.getValues();
  saving.value = true;
  try {
    await editAppDevice(record.value.id, {
      appId: props.appId,
      concurrencyStamp: record.value.concurrencyStamp,
      profile: Object.fromEntries(
        fields.map(([key]) => [key, values[key]?.trim() || null]),
      ),
    });
    message.success('设备资料已保存');
    emit('success');
    open.value = false;
  } catch (error) {
    if (isDeviceConflict(error)) {
      message.warning('设备已被其他操作修改，已重新加载，请确认后再保存');
      await load().catch(() => {});
      emit('success');
    }
  } finally {
    saving.value = false;
  }
}
</script>
<template>
  <Modal
    v-model:open="open"
    title="编辑设备资料"
    :width="620"
    :keyboard="!saving"
    :cancel-button-props="{ disabled: saving }"
    :mask-closable="!saving"
    :closable="!saving"
    :confirm-loading="saving"
    :ok-button-props="{ disabled: loading || !record }"
    @ok="save"
  >
    <Spin :spinning="loading">
      <Alert
        class="mb-4"
        type="info"
        message="只修改设备资料；设备标识、应用和租户不可修改。"
      />
      <Form />
      <a v-if="!loading && !record" @click="load"> 重新加载 </a>
    </Spin>
  </Modal>
</template>
