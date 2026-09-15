<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { MessageReportOptions } from '#/api/chat/message-report';

import { computed, onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  RadioGroup,
  Select,
  Statistic,
  Tabs,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  getMessageReportListApi,
  getMessageReportOptionsApi,
  getMessageReportSummaryApi,
  MessageReportTypes,
} from '#/api/chat/message-report';

import {
  messageTypeOptions,
  reportTypeOptions,
  useReportColumns,
  useSummaryColumns,
} from './data';
import FlushModal from './modules/flush-modal.vue';

const activeTab = ref<'detail' | 'summary'>('detail');

// 核心维度：消息报表类型 (20: Month, 30: Day, 40: Hour)
const currentReportType = ref<MessageReportTypes>(MessageReportTypes.Day);

// 过滤参数
const sessionIdFilter = ref('');
const messageTypesFilter = ref<number[]>([]);
const dateBucketFilter = ref('');
const startDateBucketFilter = ref('');
const endDateBucketFilter = ref('');

// 报表选项与缓存
const reportOptions = ref<MessageReportOptions | null>(null);

// 落库弹窗
const [FlushModalComp, flushModalApi] = useVbenModal({
  connectedComponent: FlushModal,
  destroyOnClose: true,
});

async function loadOptions() {
  try {
    reportOptions.value = await getMessageReportOptionsApi();
  } catch (error) {
    console.error('Failed to load message report options', error);
  }
}

function onOpenFlushModal() {
  flushModalApi.setData({ defaultType: currentReportType.value }).open();
}

function onReportTypeChange() {
  dateBucketFilter.value = '';
  startDateBucketFilter.value = '';
  endDateBucketFilter.value = '';
  refreshAll();
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
            dateBucket: dateBucketFilter.value.trim() ? Number(dateBucketFilter.value.trim()) : undefined,
            endDateBucket: endDateBucketFilter.value.trim() ? Number(endDateBucketFilter.value.trim()) : undefined,
            maxResultCount,
            messageTypes: messageTypesFilter.value.length > 0 ? messageTypesFilter.value : undefined,
            reportType: currentReportType.value,
            sessionId: sessionIdFilter.value.trim() || undefined,
            skipCount,
            sorting,
            startDateBucket: startDateBucketFilter.value.trim() ? Number(startDateBucketFilter.value.trim()) : undefined,
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
            dateBucket: dateBucketFilter.value.trim() ? Number(dateBucketFilter.value.trim()) : undefined,
            endDateBucket: endDateBucketFilter.value.trim() ? Number(endDateBucketFilter.value.trim()) : undefined,
            maxResultCount,
            messageTypes: messageTypesFilter.value.length > 0 ? messageTypesFilter.value : undefined,
            reportType: currentReportType.value,
            sessionId: sessionIdFilter.value.trim() || undefined,
            skipCount,
            sorting,
            startDateBucket: startDateBucketFilter.value.trim() ? Number(startDateBucketFilter.value.trim()) : undefined,
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

const currentGranularityTitle = computed(() => {
  switch (currentReportType.value) {
    case MessageReportTypes.Hour: {
      return '时报 (Hour) 格式如: 2026091417';
    }
    case MessageReportTypes.Month: {
      return '月报 (Month) 格式如: 202609';
    }
    default: {
      return '日报 (Day) 格式如: 20260914';
    }
  }
});

onMounted(() => {
  loadOptions();
});
</script>

<template>
  <Page auto-content-height>
    <FlushModalComp @success="refreshAll" />

    <div class="h-full flex flex-col gap-3">
      <!-- 顶部控制大栏与指标卡片 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
        <!-- 核心粒度维度切换控制器 (重点突出) -->
        <Card
          size="small"
          class="lg:col-span-5 shadow-sm border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-transparent to-transparent dark:from-primary/10"
        >
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-foreground">📊 报表统计粒度 (ReportType)</span>
              <Tag color="processing" class="text-xs font-medium">当前核心分析维度</Tag>
            </div>
            <span class="text-xs text-muted-foreground">{{ currentGranularityTitle }}</span>
          </div>
          <RadioGroup
            v-model:value="currentReportType"
            :options="reportTypeOptions"
            option-type="button"
            button-style="solid"
            size="middle"
            class="report-type-radio-group"
            @change="onReportTypeChange"
          />
        </Card>

        <!-- 状态指标 1: 引擎收集状态 -->
        <Card size="small" class="lg:col-span-2 shadow-sm flex flex-col justify-center">
          <Statistic
            title="统计引擎收集状态"
            :value="reportOptions?.enable ? '已启用' : '未启用'"
            :value-style="{ color: reportOptions?.enable ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '18px' }"
          />
        </Card>

        <!-- 状态指标 2: 自动落库周期 -->
        <Card size="small" class="lg:col-span-2 shadow-sm flex flex-col justify-center">
          <Statistic
            title="自动落库周期 (Seconds)"
            :value="reportOptions?.flushToDbTimerPeriodSeconds ?? '-'"
            suffix="秒"
            :value-style="{ fontWeight: 600, fontSize: '18px' }"
          />
        </Card>

        <!-- 统计落库操作入口 -->
        <Card size="small" class="lg:col-span-3 shadow-sm flex items-center justify-between bg-muted/20">
          <div>
            <div class="text-xs font-semibold text-foreground mb-1">持久化固化落库</div>
            <div class="text-xs text-primary font-medium">即时落盘 Redis 统计指标</div>
          </div>
          <Button type="primary" @click="onOpenFlushModal">
            统计落库 (Flush)
          </Button>
        </Card>
      </div>

      <!-- 选项卡与数据表格大盘 -->
      <Card
        size="small"
        class="flex-1 flex flex-col h-full shadow-sm overflow-hidden"
        :styles="{ body: { padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } }"
      >
        <Tabs
          v-model:active-key="activeTab"
          type="card"
          class="h-full flex flex-col"
          @change="refreshAll"
        >
          <!-- 1. 消息明细分析 -->
          <Tabs.TabPane key="detail" tab="📊 消息类型明细分析 (Detail)">
            <div class="flex flex-col h-full overflow-hidden">
              <DetailGrid>
                <template #toolbar-tools>
                  <div class="flex items-center gap-2 mr-2 flex-wrap">
                    <Input
                      v-model:value="dateBucketFilter"
                      :placeholder="currentGranularityTitle"
                      allow-clear
                      class="w-52"
                      size="small"
                      @press-enter="detailGridApi.query"
                    />

                    <Select
                      v-model:value="messageTypesFilter"
                      mode="multiple"
                      placeholder="按消息类型筛选 (多选)"
                      allow-clear
                      class="w-64"
                      size="small"
                      :max-tag-count="2"
                      :options="messageTypeOptions"
                      @change="detailGridApi.query"
                    />

                    <Input
                      v-model:value="sessionIdFilter"
                      placeholder="会话 ID (SessionId)..."
                      allow-clear
                      class="w-48"
                      size="small"
                      @press-enter="detailGridApi.query"
                    />

                    <Button type="primary" size="small" @click="detailGridApi.query">
                      查询明细
                    </Button>
                  </div>
                </template>
              </DetailGrid>
            </div>
          </Tabs.TabPane>

          <!-- 2. 会话统计汇总 -->
          <Tabs.TabPane key="summary" tab="📈 周期会话统计汇总 (Summary)">
            <div class="flex flex-col h-full overflow-hidden">
              <SummaryGrid>
                <template #toolbar-tools>
                  <div class="flex items-center gap-2 mr-2 flex-wrap">
                    <Input
                      v-model:value="dateBucketFilter"
                      :placeholder="currentGranularityTitle"
                      allow-clear
                      class="w-52"
                      size="small"
                      @press-enter="summaryGridApi.query"
                    />

                    <Input
                      v-model:value="sessionIdFilter"
                      placeholder="会话 ID (SessionId)..."
                      allow-clear
                      class="w-52"
                      size="small"
                      @press-enter="summaryGridApi.query"
                    />

                    <Button type="primary" size="small" @click="summaryGridApi.query">
                      查询汇总
                    </Button>
                  </div>
                </template>
              </SummaryGrid>
            </div>
          </Tabs.TabPane>
        </Tabs>
      </Card>
    </div>
  </Page>
</template>

<style scoped>
.report-type-radio-group {
  display: flex;
  width: 100%;
}

.report-type-radio-group :deep(.ant-radio-button-wrapper) {
  flex: 1;
  text-align: center;
  font-weight: 600;
  font-size: 13px;
  height: 36px;
  line-height: 34px;
}
</style>
