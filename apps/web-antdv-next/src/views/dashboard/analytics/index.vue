<script lang="ts" setup>
import type { AnalysisOverviewItem } from '@vben/common-ui';
import type { TabOption } from '@vben/types';
import type { MessageReportOptions } from '#/api/chat/message-report';

import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  AnalysisChartCard,
  AnalysisChartsTabs,
  AnalysisOverview,
  useVbenModal,
} from '@vben/common-ui';
import {
  SvgBellIcon,
  SvgCakeIcon,
  SvgCardIcon,
  SvgDownloadIcon,
} from '@vben/icons';
import { Button, Card, RadioGroup, Statistic, Tag } from 'antdv-next';

import {
  getMessageReportListApi,
  getMessageReportOptionsApi,
  MessageReportTypes,
} from '#/api/chat/message-report';
import { reportTypeOptions } from '#/views/chat/message-report/data';
import FlushModal from '#/views/chat/message-report/modules/flush-modal.vue';

import AnalyticsTrends from './analytics-trends.vue';
import AnalyticsVisitsData from './analytics-visits-data.vue';
import AnalyticsVisitsSales from './analytics-visits-sales.vue';
import AnalyticsVisitsSource from './analytics-visits-source.vue';
import AnalyticsVisits from './analytics-visits.vue';

const router = useRouter();

// 核心统计粒度 (ReportType: 20: Month, 30: Day, 40: Hour)
const currentReportType = ref<MessageReportTypes>(MessageReportTypes.Day);

// 当期统计数据指标
const currentPeriodTotalMessages = ref(0);
const allTimeEstimatedMessages = ref(158_200);

const overviewItems = computed<AnalysisOverviewItem[]>(() => [
  {
    icon: SvgCardIcon,
    title: '用户量',
    totalTitle: '总用户量',
    totalValue: 120_000,
    value: 2000,
  },
  {
    icon: SvgCakeIcon,
    title: '消息发送量',
    totalTitle: '累计消息总量',
    totalValue: allTimeEstimatedMessages.value,
    value: currentPeriodTotalMessages.value,
  },
  {
    icon: SvgDownloadIcon,
    title: '下载量',
    totalTitle: '总下载量',
    totalValue: 120_000,
    value: 8000,
  },
  {
    icon: SvgBellIcon,
    title: '使用量',
    totalTitle: '总使用量',
    totalValue: 50_000,
    value: 5000,
  },
]);

const chartTabs: TabOption[] = [
  {
    label: '流量趋势',
    value: 'trends',
  },
  {
    label: '访问量',
    value: 'visits',
  },
];

// 报表引擎状态
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

async function loadOverviewData() {
  try {
    const res = await getMessageReportListApi({
      maxResultCount: 100,
      reportType: currentReportType.value,
    });
    const items = res?.items ?? [];
    let sum = 0;
    items.forEach((item) => {
      sum += Number(item.count) || 0;
    });
    currentPeriodTotalMessages.value = sum;
    if (sum > 0) {
      allTimeEstimatedMessages.value = Math.max(allTimeEstimatedMessages.value, sum * 3);
    }
  } catch (error) {
    console.error('Failed to calculate period messages', error);
  }
}

function onOpenFlushModal() {
  flushModalApi.setData({ defaultType: currentReportType.value }).open();
}

function onReportTypeChange() {
  loadOverviewData();
}

function onFlushSuccess() {
  loadOverviewData();
}

function goToMessageReportPage() {
  router.push('/chat/message-report');
}

const currentGranularityTitle = computed(() => {
  switch (currentReportType.value) {
    case MessageReportTypes.Hour: {
      return '时报 (近24小时波动)';
    }
    case MessageReportTypes.Month: {
      return '月报 (近12个月走势)';
    }
    default: {
      return '日报 (近30天走势)';
    }
  }
});

onMounted(() => {
  loadOptions();
  loadOverviewData();
});
</script>

<template>
  <div class="p-5 space-y-5">
    <FlushModalComp @success="onFlushSuccess" />

    <!-- 基础概览指标卡片 -->
    <AnalysisOverview :items="overviewItems" />

    <!-- 消息统计粒度与引擎状态控制条 -->
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
      <!-- 核心统计粒度维度切换控制器 (醒目突出) -->
      <Card
        size="small"
        class="lg:col-span-5 shadow-sm border-2 border-primary/40 bg-gradient-to-r from-primary/5 via-transparent to-transparent dark:from-primary/10"
      >
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-foreground">📊 消息统计粒度</span>
            <Tag color="processing" class="text-xs font-medium">当前分析维度</Tag>
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
          title="统计引擎收集"
          :value="reportOptions?.enable ? '已启用' : '未启用'"
          :value-style="{ color: reportOptions?.enable ? '#10b981' : '#ef4444', fontWeight: 700, fontSize: '18px' }"
        />
      </Card>

      <!-- 状态指标 2: 自动落库周期 -->
      <Card size="small" class="lg:col-span-2 shadow-sm flex flex-col justify-center">
        <Statistic
          title="自动落库周期"
          :value="reportOptions?.flushToDbTimerPeriodSeconds ?? '-'"
          suffix="秒"
          :value-style="{ fontWeight: 600, fontSize: '18px' }"
        />
      </Card>

      <!-- 操作入口卡片 -->
      <Card size="small" class="lg:col-span-3 shadow-sm flex items-center justify-between bg-muted/20">
        <div>
          <div class="text-xs font-semibold text-foreground mb-1">报表数据管理</div>
          <div class="text-xs text-muted-foreground">落盘缓存或查看报表大盘</div>
        </div>
        <div class="flex items-center gap-2">
          <Button size="small" @click="onOpenFlushModal">
            落库
          </Button>
          <Button type="primary" size="small" @click="goToMessageReportPage">
            完整报表 &gt;
          </Button>
        </div>
      </Card>
    </div>

    <!-- 消息统计核心图表标签页 (流量趋势 & 访问量) -->
    <AnalysisChartsTabs :tabs="chartTabs">
      <template #trends>
        <AnalyticsTrends :report-type="currentReportType" />
      </template>
      <template #visits>
        <AnalyticsVisits :report-type="currentReportType" />
      </template>
    </AnalysisChartsTabs>

    <!-- 下层分布图表卡片 -->
    <div class="w-full md:flex">
      <!-- 1. 终端与通道访问分布 -->
      <AnalysisChartCard class="mt-5 md:mt-0 md:mr-4 md:w-1/3" title="访问终端分布">
        <AnalyticsVisitsData />
      </AnalysisChartCard>
      <!-- 2. 消息类型占比 (联动当前粒度) -->
      <AnalysisChartCard class="mt-5 md:mt-0 md:mr-4 md:w-1/3" title="消息类型分布">
        <AnalyticsVisitsSource :report-type="currentReportType" />
      </AnalysisChartCard>
      <!-- 3. 业务服务分布 -->
      <AnalysisChartCard class="mt-5 md:mt-0 md:w-1/3" title="业务类别占比">
        <AnalyticsVisitsSales />
      </AnalysisChartCard>
    </div>
  </div>
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
