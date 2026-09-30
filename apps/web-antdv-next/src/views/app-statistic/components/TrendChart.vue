<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import {
  Card as ACard,
  Checkbox as ACheckbox,
  Spin as ASpin,
} from 'antdv-next';

import type { StatisticTrendDto } from '#/api/app-statistic/types';

import StatisticEmpty from './StatisticEmpty.vue';

interface MetricOption {
  key: string;
  label: string;
  color?: string;
}

interface Props {
  title?: string;
  data: StatisticTrendDto[];
  metrics?: MetricOption[];
  loading?: boolean;
  height?: number | string;
  chartType?: 'bar' | 'line';
}

const props = withDefaults(defineProps<Props>(), {
  title: '趋势分析',
  metrics: () => [
    { key: 'dau', label: 'DAU', color: '#1677ff' },
    { key: 'new_users', label: '新增用户', color: '#52c41a' },
    { key: 'new_devices', label: '新增设备', color: '#fa8c16' },
    { key: 'launch_count', label: '启动次数', color: '#722ed1' },
    { key: 'page_view_count', label: 'PV', color: '#13c2c2' },
    { key: 'duration_seconds', label: '使用时长(秒)', color: '#eb2f96' },
  ],
  loading: false,
  height: 360,
  chartType: 'line',
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// Selected metrics (default: first metric in list)
const activeMetrics = ref<string[]>(
  props.metrics.length > 0 ? [props.metrics[0]!.key] : ['dau'],
);

function toggleMetric(key: string) {
  const index = activeMetrics.value.indexOf(key);
  if (index > -1) {
    if (activeMetrics.value.length > 1) {
      activeMetrics.value.splice(index, 1);
    }
  } else {
    if (activeMetrics.value.length >= 3) {
      activeMetrics.value.shift();
    }
    activeMetrics.value.push(key);
  }
}

const distinctDates = computed(() => {
  const dateSet = new Set<string>();
  props.data.forEach((item) => {
    if (item.date) dateSet.add(item.date);
  });
  return Array.from(dateSet).sort();
});

const hasData = computed(() => props.data && props.data.length > 0);

const colorPalette = [
  '#1677ff',
  '#52c41a',
  '#fa8c16',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#faad14',
  '#2f54eb',
];

function updateChart() {
  if (!hasData.value || distinctDates.value.length === 0) return;

  const dates = distinctDates.value;
  const series: any[] = [];
  const legendNames: string[] = [];

  activeMetrics.value.forEach((metricKey, idx) => {
    const meta = props.metrics.find((m) => m.key === metricKey);
    const label = meta?.label || metricKey;
    const color = meta?.color || colorPalette[idx % colorPalette.length];
    legendNames.push(label);

    const dateMap = new Map<string, number>();
    props.data
      .filter((d) => d.metric?.toLowerCase() === metricKey.toLowerCase())
      .forEach((d) => {
        dateMap.set(d.date, Number(d.value) || 0);
      });

    const seriesData = dates.map((date) => dateMap.get(date) ?? 0);

    if (props.chartType === 'line') {
      series.push({
        name: label,
        type: 'line',
        smooth: true,
        showSymbol: dates.length <= 15,
        symbolSize: 6,
        data: seriesData,
        itemStyle: { color },
        lineStyle: { width: 2.5 },
        areaStyle: {
          opacity: 0.15,
        },
      });
    } else {
      series.push({
        name: label,
        type: 'bar',
        barMaxWidth: 28,
        data: seriesData,
        itemStyle: { color, borderRadius: [4, 4, 0, 0] },
      });
    }
  });

  nextTick(() => {
    renderEcharts({
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          crossStyle: { color: '#999' },
        },
      },
      legend: {
        data: legendNames,
        bottom: 0,
      },
      grid: {
        left: '2%',
        right: '3%',
        top: '10%',
        bottom: '12%',
        containLabel: true,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisTick: { alignWithLabel: true },
        boundaryGap: props.chartType === 'bar',
      },
      yAxis: {
        type: 'value',
        splitLine: {
          lineStyle: { type: 'dashed', opacity: 0.3 },
        },
      },
      series,
    });
  });
}

watch(
  [() => props.data, activeMetrics, () => props.chartType],
  () => {
    updateChart();
  },
  { deep: true },
);

watch(
  () => props.loading,
  (isLoading) => {
    if (!isLoading) {
      setTimeout(updateChart, 50);
    }
  },
);
</script>

<template>
  <ACard :bordered="false" class="mb-4 shadow-sm" size="small">
    <template #title>
      <div class="flex flex-wrap items-center justify-between gap-2 py-1">
        <span class="font-medium text-sm">{{ title }}</span>
        <!-- Metric selector tags -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs text-muted-foreground mr-1">指标 (最多3项):</span>
          <ACheckbox
            v-for="item in metrics"
            :key="item.key"
            :checked="activeMetrics.includes(item.key)"
            class="text-xs !ml-0 mr-2"
            @change="toggleMetric(item.key)"
          >
            {{ item.label }}
          </ACheckbox>
        </div>
      </div>
    </template>

    <ASpin :spinning="loading">
      <div
        :style="{ height: typeof height === 'number' ? `${height}px` : height }"
        class="w-full relative"
      >
        <EchartsUI v-if="hasData" ref="chartRef" />
        <StatisticEmpty v-else-if="!loading" />
      </div>
    </ASpin>
  </ACard>
</template>
