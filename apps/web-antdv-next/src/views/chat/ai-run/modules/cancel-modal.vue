<script lang="ts" setup>
import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import { Input, message } from 'antdv-next';

import { cancelAiRunApi } from '#/api/chat/ai-run';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const runId = ref('');
const reason = ref('');

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    if (!runId.value) return;
    modalApi.lock();
    try {
      await cancelAiRunApi(runId.value, reason.value.trim() || undefined);
      message.success('已成功取消该 AI 任务');
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('Failed to cancel ai run', error);
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { id?: string } | undefined;
      runId.value = data?.id || '';
      reason.value = '';
    } else {
      runId.value = '';
      reason.value = '';
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal title="取消 AI 执行任务" class="w-[480px]">
    <div class="p-4 space-y-4">
      <div class="text-sm text-muted-foreground">
        确定要中止该任务的执行吗？取消后该任务将无法被工作节点继续认领与生成。
      </div>
      <div>
        <div class="mb-1 text-sm font-medium">取消原因 / 备注（可选）</div>
        <Input.TextArea
          v-model:value="reason"
          placeholder="如：管理员手动终止、用户已离开会话等"
          :rows="3"
        />
      </div>
    </div>
  </Modal>
</template>

