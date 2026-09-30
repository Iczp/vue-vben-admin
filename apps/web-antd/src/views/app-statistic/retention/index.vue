<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import { Button as AButton } from 'ant-design-vue';
import dayjs from 'dayjs';

import { getRetentionApi } from '#/api/app-statistic/retention';
import type {
  AppStatisticQueryInput,
  RetentionDto,
  StatisticTrendDto,
} from '#/api/app-statistic/types';

import {
  MetricCard,
  MetricCardGroup,
  RetentionHeatmap,
  StatisticFilterBar,
  TrendChart,
} from '../components';

const loading = ref(false);
const retentionList = ref<RetentionDto[]>([]);

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getRetentionApi({
      appId: query.value.appId,
      startDate: query.value.startDate,
      endDate: query.value.endDate,
    });
    retentionList.value = res ?? [];
  } catch (error) {
    console.error('Failed to load retention data', error);
  } finally {
    loading.value = false;
  }
}

// Compute average retention rates
const avgRates = computed(() => {
  const sums: Record<number, { count: number; total: number }> = {
    1: { count: 0, total: 0 },
    3: { count: 0, total: 0 },
    7: { count: 0, total: 0 },
    14: { count: 0, total: 0 },
    30: { count: 0, total: 0 },
  };

  retentionList.value.forEach((item) => {
    if (sums[item.retentionDay]) {
      sums[item.retentionDay]!.count += 1;
      sums[item.retentionDay]!.total += Number(item.retentionRate ?? 0);
    }
  });

  return {
    d1:
      sums[1]!.count > 0 ? (sums[1]!.total / sums[1]!.count).toFixed(1) : '0.0',
    d3:
      sums[3]!.count > 0 ? (sums[3]!.total / sums[3]!.count).toFixed(1) : '0.0',
    d7:
      sums[7]!.count > 0 ? (sums[7]!.total / sums[7]!.count).toFixed(1) : '0.0',
    d14:
      sums[14]!.count > 0
        ? (sums[14]!.total / sums[14]!.count).toFixed(1)
        : '0.0',
    d30:
      sums[30]!.count > 0
        ? (sums[30]!.total / sums[30]!.count).toFixed(1)
        : '0.0',
  };
});

// Convert RetentionDto into trend data for Line Chart
const retentionTrends = computed<StatisticTrendDto[]>(() => {
  const trends: StatisticTrendDto[] = [];
  retentionList.value.forEach((item) => {
    if ([1, 7, 30].includes(item.retentionDay)) {
      trends.push({
        date: item.cohortDate,
        metric: `d${item.retentionDay}`,
        value: Number(item.retentionRate ?? 0),
      });
    }
  });
  return trends;
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">留存分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          通过同期群（Cohort）矩阵与长期衰退曲线评估产品健康度与用户忠诚度
        </p>
      </div>
      <AButton :loading="loading" size="small" @click="loadData">刷新</AButton>
    </div>

    <!-- Filter Bar -->
    <StatisticFilterBar
      v-model="query"
      :loading="loading"
      :show-channel="false"
      :show-platform="false"
      :show-version="false"
      @change="loadData"
      @reset="loadData"
    />

    <!-- Average Retention KPIs -->
    <MetricCardGroup :cols="5">
      <MetricCard
        :loading="loading"
        :value="`${avgRates.d1}%`"
        title="平均次日留存 (D1)"
        tooltip="新增用户在次日继续使用应用的平均比例"
      />

      <MetricCard
        :loading="loading"
        :value="`${avgRates.d3}%`"
        title="平均3日留存 (D3)"
        tooltip="新增用户在第3天继续使用应用的平均比例"
      />

      <MetricCard
        :loading="loading"
        :value="`${avgRates.d7}%`"
        title="平均7日留存 (D7)"
        tooltip="新增用户在第7天继续使用应用的平均比例"
      />

      <MetricCard
        :loading="loading"
        :value="`${avgRates.d14}%`"
        title="平均14日留存 (D14)"
        tooltip="新增用户在第14天继续使用应用的平均比例"
      />

      <MetricCard
        :loading="loading"
        :value="`${avgRates.d30}%`"
        title="平均30日留存 (D30)"
        tooltip="新增用户在第30天继续使用应用的平均比例"
      />
    </MetricCardGroup>

    <!-- Cohort Heatmap -->
    <RetentionHeatmap :data="retentionList" :loading="loading" />

    <!-- Retention Trends Chart -->
    <TrendChart
      :data="retentionTrends"
      :loading="loading"
      :metrics="[
        { key: 'd1', label: '次日留存率(%)', color: '#1677ff' },
        { key: 'd7', label: '7日留存率(%)', color: '#52c41a' },
        { key: 'd30', label: '30日留存率(%)', color: '#fa8c16' },
      ]"
      title="留存率变动趋势 (D1 / D7 / D30)"
    />
  </div>
</template>
