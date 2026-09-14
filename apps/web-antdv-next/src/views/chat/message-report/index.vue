<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';

import { onMounted, ref } from 'vue';

import { Page } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Statistic,
  Tabs,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  flushMessageReportApi,
  getMessageReportListApi,
  getMessageReportOptionsApi,
  getMessageReportSummaryApi,
  type MessageReportOptions,
} from '#/api/chat/message-report';

import { useReportColumns, useSummaryColumns } from './data';

const activeTab = ref<'detail' | 'summary'>('detail');

// 过滤参数
const sessionIdFilter = ref('');
const messageTypeFilter = ref<number | undefined>(undefined);
const dateBucketFilter = ref('');

// 报表选项与缓存
const reportOptions = ref<MessageReportOptions | null>(null);
const flushing = ref(false);

async function loadOptions() {
  try {
    reportOptions.value = await getMessageReportOptionsApi();
  } catch (error) {
    console.error('Failed to load message report options', error);
  }
}

async function onFlushCache() {
  Modal.confirm({
    cancelText: '取消',
    content: '确定要立即将内存/Redis中的即时统计数据刷写固化至数据库吗？',
    okText: '确认刷写',
    title: '刷写统计缓存',
    async onOk() {
      try {
        flushing.value = true;
        await flushMessageReportApi();
        message.success('已成功刷写统计缓存');
        refreshAll();
      } finally {
        flushing.value = false;
      }
    },
  });
}

// 1. 明细报表 Grid
const [DetailGrid, detailGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useReportColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          return await getMessageReportListApi({
            dateBucket: dateBucketFilter.value || undefined,
            maxResultCount,
            messageTypes:
              messageTypeFilter.value !== undefined
                ? [messageTypeFilter.value]
                : undefined,
            sessionId: sessionIdFilter.value || undefined,
            skipCount,
            sorting,
          });
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

// 2. 汇总报表 Grid
const [SummaryGrid, summaryGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useSummaryColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          return await getMessageReportSummaryApi({
            dateBucket: dateBucketFilter.value || undefined,
            maxResultCount,
            sessionId: sessionIdFilter.value || undefined,
            skipCount,
            sorting,
          });
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

function refreshAll() {
  if (activeTab.value === 'detail') {
    detailGridApi.query();
  } else {
    summaryGridApi.query();
  }
}

onMounted(() => {
  loadOptions();
});
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 顶部统计概览卡片 -->
      <div class="grid grid-cols-3 gap-3">
        <Card size="small">
          <Statistic
            title="消息统计收集状态"
            :value="reportOptions?.enable ? '已启用' : '未启用'"
            :value-style="{ color: reportOptions?.enable ? '#52c41a' : '#ff4d4f' }"
          />
        </Card>
        <Card size="small">
          <Statistic
            title="定时刷写周期 (秒)"
            :value="reportOptions?.flushToDbTimerPeriodSeconds ?? '-'"
            suffix="s"
          />
        </Card>
        <Card size="small">
          <Statistic
            title="分布式锁状态"
            :value="reportOptions?.useDistributedLock ? '已启用' : '未启用'"
          />
        </Card>
      </div>

      <!-- 选项卡与数据表格 -->
      <div class="flex-1 bg-background rounded-lg p-3 flex flex-col overflow-hidden">
        <Tabs v-model:active-key="activeTab" class="flex-1 flex flex-col overflow-hidden" @change="refreshAll">
          <!-- 明细报表 -->
          <Tabs.TabPane key="detail" tab="消息明细分析" class="h-full flex flex-col">
            <DetailGrid>
              <template #top>
                <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <Input
                      v-model:value="sessionIdFilter"
                      placeholder="按会话 ID 筛选..."
                      allow-clear
                      class="w-56"
                    />
                    <Input
                      v-model:value="dateBucketFilter"
                      placeholder="时间桶 (如 2026-09-14)..."
                      allow-clear
                      class="w-48"
                    />
                    <Select
                      v-model:value="messageTypeFilter"
                      placeholder="消息类型"
                      allow-clear
                      class="w-32"
                      :options="[
                        { label: '全部类型', value: undefined },
                        { label: '文本', value: 0 },
                        { label: '图片', value: 1 },
                        { label: '语音', value: 2 },
                        { label: '视频', value: 3 },
                        { label: '文件', value: 4 },
                        { label: '位置', value: 5 },
                        { label: '红包', value: 6 },
                      ]"
                    />
                    <Button type="primary" @click="detailGridApi.query()">
                      查询
                    </Button>
                  </div>
                  <div>
                    <Button :loading="flushing" @click="onFlushCache">
                      立即刷写统计缓存
                    </Button>
                  </div>
                </div>
              </template>
            </DetailGrid>
          </Tabs.TabPane>

          <!-- 汇总报表 -->
          <Tabs.TabPane key="summary" tab="会话统计汇总" class="h-full flex flex-col">
            <SummaryGrid>
              <template #top>
                <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <Input
                      v-model:value="sessionIdFilter"
                      placeholder="按会话 ID 筛选..."
                      allow-clear
                      class="w-56"
                    />
                    <Input
                      v-model:value="dateBucketFilter"
                      placeholder="时间桶 (如 2026-09-14)..."
                      allow-clear
                      class="w-48"
                    />
                    <Button type="primary" @click="summaryGridApi.query()">
                      查询
                    </Button>
                  </div>
                  <div>
                    <Button :loading="flushing" @click="onFlushCache">
                      立即刷写统计缓存
                    </Button>
                  </div>
                </div>
              </template>
            </SummaryGrid>
          </Tabs.TabPane>
        </Tabs>
      </div>
    </div>
  </Page>
</template>
