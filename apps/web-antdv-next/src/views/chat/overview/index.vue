<script setup lang="ts">
import type { ChatOverviewSummaryDto } from '#/api/chat/overview';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { Page } from '@vben/common-ui';

import { Button, Card, Col, Row, Statistic, Tag } from 'antdv-next';

import { getChatOverviewSummaryApi } from '#/api/chat/overview';
import { getRequestErrorMessage } from '#/utils/request-error';

const router = useRouter();
const loading = ref(false);
const error = ref('');
const summary = ref<ChatOverviewSummaryDto>();

const quickLinks = [
  { path: '/chat/chat-object', title: '聊天对象管理' },
  { path: '/chat/session', title: '会话档案管理' },
  { path: '/chat/message', title: '消息档案查询' },
  { path: '/chat/session-request', title: '入群与好友申请' },
  { path: '/chat/session-role', title: '群角色管理' },
  { path: '/chat/session-announcement', title: '群公告管理' },
  { path: '/chat/security-report', title: '违规举报工单' },
  { path: '/chat/online', title: '在线连接池' },
  { path: '/chat/ai-run', title: 'AI 任务执行记录' },
  { path: '/chat/blob', title: '对象存储 (Blob)' },
];

async function loadSummary() {
  loading.value = true;
  error.value = '';
  try {
    summary.value = await getChatOverviewSummaryApi();
  } catch (err) {
    error.value = getRequestErrorMessage(err).message;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadSummary();
});
</script>

<template>
  <Page
    description="即时通讯管理端核心指标、在线连接与治理待办总览。"
    title="Chat 运营总览"
  >
    <div class="space-y-4">
      <Card>
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Tag color="blue">ChatAdmin</Tag>
            <span class="text-sm text-gray-500">
              观测时间：{{ summary?.observedAt || '-' }}
            </span>
          </div>
          <Button :loading="loading" type="primary" @click="loadSummary">
            刷新统计
          </Button>
        </div>
        <p v-if="error" class="mt-2 text-sm text-red-500">{{ error }}</p>
      </Card>

      <Row :gutter="[16, 16]">
        <Col :xs="24" :sm="12" :lg="6">
          <Card>
            <Statistic
              :value="summary?.chatObjectCount ?? 0"
              title="聊天对象总数"
            />
            <div class="mt-1 text-xs text-gray-500">
              已启用：{{ summary?.activeChatObjectCount ?? 0 }}
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card>
            <Statistic :value="summary?.sessionCount ?? 0" title="会话总数" />
            <div class="mt-1 text-xs text-gray-500">
              在线连接：{{ summary?.onlineConnectionCount ?? 0 }}
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card>
            <Statistic :value="summary?.messageCount ?? 0" title="消息总量" />
            <div class="mt-1 text-xs text-gray-500">
              模板数量：{{ summary?.templateCount ?? 0 }}
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card>
            <Statistic
              :value="summary?.pendingSecurityReportCount ?? 0"
              title="待处理举报"
            />
            <div class="mt-1 text-xs text-gray-500">
              历史举报：{{ summary?.totalSecurityReportCount ?? 0 }}
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card>
            <Statistic
              :value="summary?.runningAiRunCount ?? 0"
              title="运行中 AI 任务"
            />
            <div class="mt-1 text-xs text-gray-500">
              失败任务：{{ summary?.failedAiRunCount ?? 0 }}
            </div>
          </Card>
        </Col>
        <Col :xs="24" :sm="12" :lg="6">
          <Card>
            <Statistic :value="summary?.blobCount ?? 0" title="逻辑附件数" />
          </Card>
        </Col>
      </Row>

      <Card title="治理模块快捷入口">
        <div class="flex flex-wrap gap-2">
          <Button
            v-for="item in quickLinks"
            :key="item.path"
            @click="router.push(item.path)"
          >
            {{ item.title }}
          </Button>
        </div>
      </Card>
    </div>
  </Page>
</template>
