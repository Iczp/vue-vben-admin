<script lang="ts" setup>
import type { AiRunDetailDto } from '#/api/chat/ai-run';

import { ref } from 'vue';

import { useVbenDrawer } from '@vben/common-ui';

import {
  Button,
  Descriptions,
  DescriptionsItem,
  Empty,
  message,
  Popconfirm,
  Spin,
  Tag,
} from 'antdv-next';

import {
  AiRunStatus,
  cancelAiRunApi,
  getAiRunDetailApi,
  retryAiRunApi,
} from '#/api/chat/ai-run';

import { AI_RUN_STATUS_MAP } from '../data';

const emit = defineEmits<{
  (e: 'reload'): void;
}>();

const loading = ref(false);
const actionLoading = ref(false);
const detail = ref<AiRunDetailDto | null>(null);

const [Drawer, drawerApi] = useVbenDrawer({
  async onOpenChange(isOpen) {
    if (isOpen) {
      const data = drawerApi.getData() as { id?: string } | undefined;
      if (data?.id) {
        await fetchDetail(data.id);
      }
    } else {
      detail.value = null;
    }
  },
});

async function fetchDetail(id: string) {
  loading.value = true;
  try {
    detail.value = await getAiRunDetailApi(id);
  } catch (error) {
    console.error('Failed to get ai run detail', error);
  } finally {
    loading.value = false;
  }
}

async function onRetry() {
  if (!detail.value) return;
  actionLoading.value = true;
  try {
    await retryAiRunApi(detail.value.id);
    message.success('已触发人工重试');
    await fetchDetail(detail.value.id);
    emit('reload');
  } catch (error) {
    console.error('Retry failed', error);
  } finally {
    actionLoading.value = false;
  }
}

async function onCancel() {
  if (!detail.value) return;
  actionLoading.value = true;
  try {
    await cancelAiRunApi(detail.value.id, '管理员人工终止任务');
    message.success('任务已取消');
    await fetchDetail(detail.value.id);
    emit('reload');
  } catch (error) {
    console.error('Cancel failed', error);
  } finally {
    actionLoading.value = false;
  }
}

defineExpose({ drawerApi });
</script>

<template>
  <Drawer title="AI 任务执行详情" class="w-[680px]">
    <Spin :spinning="loading">
      <div v-if="detail" class="p-5 space-y-6 text-sm">
        <!-- 头部关键信息卡片 -->
        <div class="p-4 bg-muted/20 rounded-lg border space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-base font-semibold">任务执行概览</span>
            <Tag :color="AI_RUN_STATUS_MAP[detail.status]?.color">
              {{ AI_RUN_STATUS_MAP[detail.status]?.label || '未知状态' }}
            </Tag>
          </div>
          <div class="text-xs text-muted-foreground">
            {{ AI_RUN_STATUS_MAP[detail.status]?.desc }}
          </div>

          <!-- 操作栏 -->
          <div class="pt-2 flex items-center gap-2 border-t">
            <Popconfirm
              title="确定立即重试该任务吗？"
              :disabled="![AiRunStatus.Failed, AiRunStatus.TimedOut, AiRunStatus.RetryScheduled].includes(detail.status)"
              @confirm="onRetry"
            >
              <Button
                type="primary"
                size="small"
                :loading="actionLoading"
                :disabled="![AiRunStatus.Failed, AiRunStatus.TimedOut, AiRunStatus.RetryScheduled].includes(detail.status)"
              >
                人工重试
              </Button>
            </Popconfirm>

            <Popconfirm
              title="确定要取消此 AI 任务吗？"
              :disabled="![AiRunStatus.Queued, AiRunStatus.Running].includes(detail.status)"
              @confirm="onCancel"
            >
              <Button
                danger
                size="small"
                :loading="actionLoading"
                :disabled="![AiRunStatus.Queued, AiRunStatus.Running].includes(detail.status)"
              >
                取消任务
              </Button>
            </Popconfirm>

            <Button size="small" @click="fetchDetail(detail.id)">
              刷新详情
            </Button>
          </div>
        </div>

        <!-- 详细字段信息 -->
        <Descriptions bordered :column="2" size="small">
          <DescriptionsItem label="Run ID" :span="2">
            <span class="font-mono select-all text-xs">{{ detail.id }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="AI 驱动 (Provider)">
            <Tag color="blue">{{ detail.provider }}</Tag>
          </DescriptionsItem>
          <DescriptionsItem label="重试进度">
            {{ detail.attemptCount }} / {{ detail.maxAttempts }}
          </DescriptionsItem>

          <DescriptionsItem label="源消息 ID">
            <span class="font-mono text-xs">{{ detail.sourceMessageId }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="回复消息 ID">
            <span class="font-mono text-xs">{{ detail.outputMessageId ?? '-' }}</span>
          </DescriptionsItem>

          <DescriptionsItem label="会话 ID" :span="2">
            <span class="font-mono select-all text-xs">{{ detail.sessionId }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="发起者会话单元" :span="2">
            <span class="font-mono select-all text-xs">{{ detail.requesterSessionUnitId }}</span>
          </DescriptionsItem>

          <DescriptionsItem label="工作节点 (LeaseOwner)">
            <span class="font-mono text-xs">{{ detail.leaseOwner ?? '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="租约到期时间">
            <span class="text-xs">{{ detail.leaseUntilTime ?? '-' }}</span>
          </DescriptionsItem>

          <DescriptionsItem label="最近心跳时间">
            <span class="text-xs">{{ detail.lastHeartbeatTime ?? '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="截止时间 (Deadline)">
            <span class="text-xs">{{ detail.deadlineTime ?? '-' }}</span>
          </DescriptionsItem>

          <DescriptionsItem label="开始执行时间">
            <span class="text-xs">{{ detail.startedTime ?? '-' }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="完成时间">
            <span class="text-xs">{{ detail.completedTime ?? '-' }}</span>
          </DescriptionsItem>

          <DescriptionsItem label="创建时间">
            <span class="text-xs">{{ detail.creationTime }}</span>
          </DescriptionsItem>
          <DescriptionsItem label="预计下次重试">
            <span class="text-xs">{{ detail.nextAttemptAt ?? '-' }}</span>
          </DescriptionsItem>
        </Descriptions>

        <!-- 异常报错诊断区 -->
        <div v-if="detail.lastErrorCode || detail.lastErrorMessage" class="p-4 rounded-lg bg-red-500/10 border border-red-500/20 space-y-2">
          <div class="flex items-center gap-2 text-red-600 font-semibold text-xs">
            <span>错误代码:</span>
            <Tag color="error">{{ detail.lastErrorCode || 'Error' }}</Tag>
          </div>
          <div class="text-xs font-mono text-red-700 dark:text-red-400 break-all whitespace-pre-wrap bg-background/50 p-2.5 rounded border">
            {{ detail.lastErrorMessage }}
          </div>
        </div>
      </div>
      <Empty v-else-if="!loading" description="未获取到任务详情" />
    </Spin>
  </Drawer>
</template>
