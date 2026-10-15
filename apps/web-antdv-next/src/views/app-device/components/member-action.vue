<script setup lang="ts">
import type { DeviceGroup, DeviceOperation, GroupOperationInput } from '#/api/modules/app-device';
import { computed, onScopeDispose, ref, watch } from 'vue';
import { Alert, Button, message, Modal, Progress } from 'antdv-next';
import { getAppDeviceOperation, submitAppDeviceOperation, updateAppDeviceGroupMembers } from '#/api/modules/app-device';
import { deviceDate } from '../context';
const props = defineProps<{ appId: string }>();
const emit = defineEmits<{ success: []; busy: [value: boolean] }>();
const open = ref(false); const saving = ref(false); const querying = ref(false); const pollFailed = ref(false);
const operation = ref<DeviceOperation>(); const input = ref<GroupOperationInput>(); const groupName = ref('');
let timer: ReturnType<typeof setTimeout> | undefined; let generation = 0; let notified = '';
const terminal = computed(() => operation.value && ['Completed', 'Failed'].includes(operation.value.state));
const busy = computed(() => saving.value || Boolean(operation.value && !terminal.value));
watch(busy, (value) => emit('busy', value));
function stop() { clearTimeout(timer); generation++; querying.value = false; }
function start(group: DeviceGroup, ids: string[], add: boolean) {
  if (busy.value) { open.value = true; void poll(); return; }
  stop(); operation.value = undefined; pollFailed.value = false; notified = '';
  groupName.value = group.name;
  // getRandomValues works on HTTP pages; the backend accepts an opaque idempotency key.
  const requestKey = [...crypto.getRandomValues(new Uint8Array(16))].map((b) => b.toString(16).padStart(2, '0')).join('');
  input.value = { appId: props.appId, groupId: group.id, deviceRecordIds: [...new Set(ids)], add, requestKey };
  open.value = true;
}
async function poll() {
  if (!operation.value || terminal.value || !open.value || querying.value) return;
  clearTimeout(timer); const version = ++generation; querying.value = true; pollFailed.value = false;
  try {
    const result = await getAppDeviceOperation(props.appId, operation.value.id);
    if (version !== generation || !open.value) return;
    operation.value = result;
    if (result.state === 'Completed' && notified !== result.id) { notified = result.id; message.success('分组成员调整已完成'); emit('success'); }
    if (!terminal.value) timer = setTimeout(() => void poll(), 2000);
  } catch { if (version === generation) pollFailed.value = true; }
  finally { if (version === generation) querying.value = false; }
}
async function submit() {
  if (!input.value || saving.value || operation.value) return;
  saving.value = true;
  const request = input.value; const version = generation;
  try {
    if (request.deviceRecordIds.length <= 200) {
      await updateAppDeviceGroupMembers(request.appId, request.groupId, request.deviceRecordIds, request.add);
      if (version !== generation) return;
      message.success('分组成员已更新'); emit('success'); open.value = false;
    } else {
      const result = await submitAppDeviceOperation(request);
      if (version !== generation) return;
      operation.value = result; void poll();
    }
  } catch { /* Retain the same request key and payload for a network retry. */ }
  finally { saving.value = false; }
}
watch(open, (value) => { if (value) void poll(); else stop(); });
watch(() => props.appId, () => { stop(); open.value = false; operation.value = undefined; input.value = undefined; });
onScopeDispose(stop);
defineExpose({ start });
</script>
<template>
  <Button v-if="operation && !open" :type="terminal ? 'default' : 'primary'" @click="open = true">查看上次成员任务</Button>
  <Modal v-model:open="open" :title="input?.add ? '添加分组成员' : '移除分组成员'" :footer="null" :mask-closable="!saving" :closable="!saving">
    <p class="mb-4">{{ input?.add ? '将' : '从' }}分组「{{ groupName }}」{{ input?.add ? '添加' : '移除' }} {{ input?.deviceRecordIds.length }} 台设备。</p>
    <template v-if="operation">
      <p class="mb-2 break-all text-muted-foreground">任务 ID：{{ operation.id }}</p>
      <Progress :percent="operation.total ? Math.floor(operation.processed * 100 / operation.total) : 0" :status="operation.state === 'Failed' ? 'exception' : operation.state === 'Completed' ? 'success' : 'active'" />
      <p>{{ operation.state === 'Completed' ? '已完成' : operation.state === 'Failed' ? '失败' : '等待处理' }} · {{ operation.processed }} / {{ operation.total }} · 重试 {{ operation.attempts }} 次</p>
      <Alert v-if="operation.errorCode" class="my-3" type="warning" :message="operation.errorCode" :description="operation.nextAttemptAt ? `下次重试：${deviceDate(operation.nextAttemptAt)}` : '请根据错误修正后重新提交。'" />
      <Alert v-if="pollFailed" class="my-3" type="warning" message="进度查询失败，任务可能仍在后台执行。" />
      <div class="mt-4 flex justify-end gap-2"><Button v-if="!terminal" :loading="querying" @click="poll">刷新进度</Button><Button @click="open = false">关闭</Button></div>
    </template>
    <template v-else>
      <Alert type="info" :message="(input?.deviceRecordIds.length ?? 0) > 200 ? '使用后台任务分批处理，关闭窗口不会取消任务。' : '确认后更新成员；重复请求不会重复添加。'" />
      <div class="mt-4 flex justify-end gap-2"><Button :disabled="saving" @click="open = false">取消</Button><Button type="primary" :loading="saving" @click="submit">确认{{ input?.add ? '添加' : '移除' }}</Button></div>
    </template>
  </Modal>
</template>
