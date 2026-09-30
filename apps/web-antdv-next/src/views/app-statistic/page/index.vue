<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button as AButton,
  Card as ACard,
  Table as ATable,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getPageAnalysisApi } from '#/api/app-statistic/page';
import type {
  AppStatisticQueryInput,
  PageAnalysisDto,
} from '#/api/app-statistic/types';

import {
  DimensionBarChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
} from '../components';

const loading = ref(false);
const pageData = ref<PageAnalysisDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0秒';
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  return remSecs > 0 ? `${mins}分${remSecs}秒` : `${mins}分钟`;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getPageAnalysisApi(query.value);
    pageData.value = res;
  } catch (error) {
    console.error('Failed to load page analysis data', error);
  } finally {
    loading.value = false;
  }
}

const tableColumns = [
  {
    title: '页面标识 (PageKey)',
    dataIndex: 'pageKey',
    key: 'pageKey',
    ellipsis: true,
  },
  {
    title: '页面名称',
    dataIndex: 'pageName',
    key: 'pageName',
    customRender: ({ text, record }: any) => text || record.pageKey,
  },
  {
    title: '浏览量 (PV)',
    dataIndex: 'pageViewCount',
    key: 'pageViewCount',
    align: 'right' as const,
    sorter: (a: any, b: any) => a.pageViewCount - b.pageViewCount,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '独立访客 (UV)',
    dataIndex: 'uniqueVisitorCount',
    key: 'uniqueVisitorCount',
    align: 'right' as const,
    sorter: (a: any, b: any) => a.uniqueVisitorCount - b.uniqueVisitorCount,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '人均访问次数',
    dataIndex: 'avgVisitsPerUser',
    key: 'avgVisitsPerUser',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => Number(text ?? 0).toFixed(1),
  },
  {
    title: '平均停留时长',
    dataIndex: 'avgDurationSeconds',
    key: 'avgDurationSeconds',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => formatDuration(text),
  },
  {
    title: 'PV 占比',
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => `${Number(text ?? 0).toFixed(1)}%`,
  },
];

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">页面分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          统计各个功能模块页面的访问深度、独立访客与平均停留时间
        </p>
      </div>
      <AButton :loading="loading" size="small" @click="loadData">刷新</AButton>
    </div>

    <!-- Filter Bar -->
    <StatisticFilterBar
      v-model="query"
      :loading="loading"
      @change="loadData"
      @reset="loadData"
    />

    <!-- KPIs -->
    <MetricCardGroup :cols="3">
      <MetricCard
        :loading="loading"
        :value="pageData?.totalPageViewCount ?? 0"
        title="页面浏览总量 (Total PV)"
        tooltip="应用在指定周期内的所有页面浏览事件累计总量"
      />

      <MetricCard
        :loading="loading"
        :value="pageData?.totalUniqueVisitors ?? 0"
        title="独立访客总量 (Total UV)"
        tooltip="访问页面的独立用户去重总数"
      />

      <MetricCard
        :loading="loading"
        :value="pageData?.pages?.length ?? 0"
        title="被访问页面数"
        tooltip="在周期内有访问记录的不同 PageKey 数量"
        unit="个"
      />
    </MetricCardGroup>

    <!-- PV Ranking Bar Chart -->
    <DimensionBarChart
      :clickable="false"
      :data="pageData?.pages ?? []"
      :height="300"
      :loading="loading"
      bar-color="#1677ff"
      name-field="pageKey"
      percentage-field="percentage"
      title="页面浏览量 (PV) 排行 Top 10"
      value-field="pageViewCount"
    />

    <!-- Detailed Table -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <template #title>
        <div class="flex items-center justify-between py-1">
          <span class="font-medium text-sm">页面访问明细报表</span>
        </div>
      </template>

      <ATable
        :columns="tableColumns"
        :data-source="pageData?.pages ?? []"
        :loading="loading"
        :pagination="{ pageSize: 20, showSizeChanger: true }"
        row-key="pageKey"
        size="small"
      />
    </ACard>
  </div>
</template>
