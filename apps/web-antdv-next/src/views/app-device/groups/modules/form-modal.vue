<script setup lang="ts">
import type { DeviceGroup } from '#/api/modules/app-device';
import { nextTick, ref, watch } from 'vue';
import { message, Modal } from 'antdv-next';
import { useVbenForm } from '#/adapter/form';
import { createAppDeviceGroup, editAppDeviceGroup } from '#/api/modules/app-device';
import { isDeviceConflict } from '../../context';
const props = defineProps<{ appId: string; record?: DeviceGroup }>();
const open = defineModel<boolean>('open', { default: false });
const emit = defineEmits<{ success: [] }>();
const saving = ref(false);
const [Form, form] = useVbenForm<{ name: string; description: string }>({ showDefaultActions: false, layout: 'vertical', schema: [
  { fieldName: 'name', label: '分组名称', component: 'Input', rules: 'required', componentProps: { maxLength: 64 } },
  { fieldName: 'description', label: '说明', component: 'Textarea', componentProps: { maxLength: 500, rows: 4 } },
] });
watch(open, async (value) => { if (value) { await nextTick(); await form.setValues({ name: props.record?.name ?? '', description: props.record?.description ?? '' }); } });
async function save() {
  if (saving.value) return;
  const { valid } = await form.validate(); if (!valid) return;
  const values = await form.getValues();
  if (!values.name.trim()) { message.warning('请输入分组名称'); return; }
  saving.value = true;
  try {
    const input = { appId: props.appId, name: values.name.trim(), description: values.description?.trim() || '', concurrencyStamp: props.record?.concurrencyStamp };
    if (props.record) await editAppDeviceGroup(props.record.id, input); else await createAppDeviceGroup(input);
    message.success('分组已保存'); emit('success'); open.value = false;
  } catch (error) {
    if (isDeviceConflict(error)) { message.warning('分组已被其他操作修改，请重新打开编辑'); emit('success'); open.value = false; }
  } finally { saving.value = false; }
}
</script>
<template><Modal v-model:open="open" :title="record ? '编辑分组' : '新建分组'" :mask-closable="!saving" :closable="!saving" :confirm-loading="saving" @ok="save"><Form /></Modal></template>
