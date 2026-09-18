<script lang="ts" setup>
import type { AiRunDto } from '#/api/chat/ai-run';

import { ref } from 'vue';

import { useVbenModal } from '@vben/common-ui';

import {
  Form,
  FormItem,
  Input,
  InputNumber,
  message,
  Select,
} from 'antdv-next';

import {
  AiRunStatus,
  createAiRunApi,
  updateAiRunApi,
} from '#/api/chat/ai-run';

const emit = defineEmits<{
  (e: 'success'): void;
}>();

const isEdit = ref(false);
const recordId = ref<string>('');

const createFormState = ref({
  maxAttempts: 3,
  provider: 'OpenAI',
  requesterSessionUnitId: '',
  sessionId: '',
  sourceMessageId: undefined as number | undefined,
});

const updateFormState = ref({
  maxAttempts: 3,
  nextAttemptAt: '',
  status: AiRunStatus.Queued,
});

function resetState() {
  isEdit.value = false;
  recordId.value = '';
  createFormState.value = {
    maxAttempts: 3,
    provider: 'OpenAI',
    requesterSessionUnitId: '',
    sessionId: '',
    sourceMessageId: undefined,
  };
  updateFormState.value = {
    maxAttempts: 3,
    nextAttemptAt: '',
    status: AiRunStatus.Queued,
  };
}

const [Modal, modalApi] = useVbenModal({
  fullscreenButton: false,
  async onConfirm() {
    modalApi.lock();
    try {
      if (isEdit.value) {
        await updateAiRunApi(recordId.value, {
          maxAttempts: updateFormState.value.maxAttempts,
          nextAttemptAt: updateFormState.value.nextAttemptAt || undefined,
          status: updateFormState.value.status,
        });
        message.success('修改 AI 任务成功');
      } else {
        if (!createFormState.value.sourceMessageId) {
          message.warning('请输入源消息 ID');
          return;
        }
        if (!createFormState.value.sessionId.trim()) {
          message.warning('请输入会话 ID');
          return;
        }
        if (!createFormState.value.requesterSessionUnitId.trim()) {
          message.warning('请输入请求者 SessionUnitId');
          return;
        }

        await createAiRunApi({
          maxAttempts: createFormState.value.maxAttempts,
          provider: createFormState.value.provider,
          requesterSessionUnitId: createFormState.value.requesterSessionUnitId.trim(),
          sessionId: createFormState.value.sessionId.trim(),
          sourceMessageId: createFormState.value.sourceMessageId,
        });
        message.success('创建 AI 任务成功');
      }
      emit('success');
      modalApi.close();
    } catch (error) {
      console.error('Failed to submit ai run form', error);
    } finally {
      modalApi.lock(false);
    }
  },
  onOpenChange(isOpen) {
    if (isOpen) {
      const data = modalApi.getData() as { record?: AiRunDto } | undefined;
      if (data?.record) {
        isEdit.value = true;
        recordId.value = data.record.id;
        updateFormState.value = {
          maxAttempts: data.record.maxAttempts,
          nextAttemptAt: data.record.nextAttemptAt || '',
          status: data.record.status,
        };
      } else {
        resetState();
      }
    } else {
      resetState();
    }
  },
});

defineExpose({ modalApi });
</script>

<template>
  <Modal :title="isEdit ? '修改 AI 执行任务' : '新建 AI 执行任务'" class="w-[560px]">
    <div class="p-4 space-y-4">
      <!-- 新增模式表单 -->
      <Form v-if="!isEdit" layout="vertical">
        <FormItem label="AI 驱动 (Provider)" required>
          <Select
            v-model:value="createFormState.provider"
            :options="[
              { label: 'OpenAI', value: 'OpenAI' },
              { label: 'Claude', value: 'Claude' },
              { label: 'DeepSeek', value: 'DeepSeek' },
              { label: 'Qwen (通义千问)', value: 'Qwen' },
              { label: 'Ollama (本地私有)', value: 'Ollama' },
              { label: 'Gemini', value: 'Gemini' },
            ]"
          />
        </FormItem>

        <FormItem label="源消息 ID (SourceMessageId)" required>
          <InputNumber
            v-model:value="createFormState.sourceMessageId"
            placeholder="触发 AI 回复的消息数字 ID"
            class="w-full"
            :min="1"
          />
        </FormItem>

        <FormItem label="会话 ID (SessionId)" required>
          <Input
            v-model:value="createFormState.sessionId"
            placeholder="会话 Guid 字符串"
          />
        </FormItem>

        <FormItem label="发起者会话单元 ID (RequesterSessionUnitId)" required>
          <Input
            v-model:value="createFormState.requesterSessionUnitId"
            placeholder="发起请求的用户所属会话单元 Guid"
          />
        </FormItem>

        <FormItem label="最大重试次数 (MaxAttempts)">
          <InputNumber
            v-model:value="createFormState.maxAttempts"
            class="w-full"
            :min="1"
            :max="10"
          />
        </FormItem>
      </Form>

      <!-- 编辑模式表单 -->
      <Form v-else layout="vertical">
        <FormItem label="任务状态 (Status)" required>
          <Select
            v-model:value="updateFormState.status"
            :options="[
              { label: '排队中 (Queued)', value: AiRunStatus.Queued },
              { label: '执行中 (Running)', value: AiRunStatus.Running },
              { label: '已完成 (Completed)', value: AiRunStatus.Completed },
              { label: '等待重试 (RetryScheduled)', value: AiRunStatus.RetryScheduled },
              { label: '执行失败 (Failed)', value: AiRunStatus.Failed },
              { label: '执行超时 (TimedOut)', value: AiRunStatus.TimedOut },
              { label: '已取消 (Cancelled)', value: AiRunStatus.Cancelled },
            ]"
          />
        </FormItem>

        <FormItem label="最大允许尝试次数 (MaxAttempts)">
          <InputNumber
            v-model:value="updateFormState.maxAttempts"
            class="w-full"
            :min="1"
            :max="20"
          />
        </FormItem>

        <FormItem label="下次重试时间 (NextAttemptAt)">
          <Input
            v-model:value="updateFormState.nextAttemptAt"
            placeholder="ISO 8601 格式，如 2026-09-17T14:00:00Z（可选）"
          />
        </FormItem>
      </Form>
    </div>
  </Modal>
</template>
