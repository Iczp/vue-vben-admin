<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'antdv-next';

import { abortOnlineConnectionsApi } from '#/api/chat';

const emit = defineEmits(['success']);

const connectionIds = ref<string[]>([]);
const reason = ref('');

const [Modal, modalApi] = useVbenModal<{
  connectionIds: string[];
  reason?: string;
}>({
  fullscreenButton: false,
  async onConfirm() {
    if (!reason.value.trim()) {
      message.warning('请输入断开连接的原因');
      return;
    }

    try {
      modalApi.lock();
      await abortOnlineConnectionsApi({
        connectionIdList: connectionIds.value,
        reason: reason.value.trim(),
      });
      message.success(`已断开 ${connectionIds.value.length} 个在线连接`);
      modalApi.close();
      emit('success');
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData();
      connectionIds.value = data?.connectionIds || [];
      reason.value = data?.reason || '管理员主动断开连接';
    } else {
      connectionIds.value = [];
      reason.value = '';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="强制断开在线连接" class="w-[500px]">
    <div class="space-y-4 p-4">
      <div class="rounded-md bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
        已选择 <strong>{{ connectionIds.length }}</strong> 个连接，强制断开后客户端的 SignalR 长连接将被直接关闭。
      </div>

      <div>
        <div class="mb-1.5 font-medium">断开原因说明</div>
        <Input.TextArea
          v-model:value="reason"
          :rows="3"
          placeholder="请输入断开原因（将推送到客户端日志或关闭提示）..."
        />
      </div>
    </div>
  </Modal>
</template>
