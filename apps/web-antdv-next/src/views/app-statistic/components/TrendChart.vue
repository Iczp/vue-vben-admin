<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { StatisticTrendDto } from '#/api/app-statistic/types';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import {
  Card as ACard,
  Checkbox as ACheckbox,
  Spin as ASpin,
} from 'antdv-next';

import { $t } from '#/locales';

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
  maxMetrics?: number;
  initialMetrics?: number;
}

const props = withDefaults(defineProps<Props>(), {
  title: $t('appStatistic.text035'),
  metrics: () => [
    { key: 'dau', label: 'DAU', color: '#1677ff' },
    { key: 'new_users', label: $t('appStatistic.text039'), color: '#52c41a' },
    { key: 'new_devices', label: $t('appStatistic.text040'), color: '#fa8c16' },
    {
      key: 'launch_count',
      label: $t('appStatistic.text047'),
      color: '#722ed1',
    },
    { key: 'page_view_count', label: 'PV', color: '#13c2c2' },
    {
      key: 'duration_seconds',
      label: $t('appStatistic.text050'),
      color: '#eb2f96',
    },
  ],
  loading: false,
  height: 360,
  chartType: 'line',
  maxMetrics: 3,
  initialMetrics: 1,
});

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

// Selected metrics (default: first metric in list)
const activeMetrics = ref<string[]>(
  props.metrics.slice(0, props.initialMetrics).map((item) => item.key),
);

function toggleMetric(key: string) {
  const index = activeMetrics.value.indexOf(key);
  if (index > -1) {
    if (activeMetrics.value.length > 1) {
      activeMetrics.value.splice(index, 1);
    }
  } else {
    if (activeMetrics.value.length >= props.maxMetrics) {
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

const hasData = computed(() =>
  props.data.some((item) => activeMetrics.value.includes(item.metric)),
);

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
  const series: {
    [key: string]: unknown;
    data: (null | number)[];
    name: string;
    type: 'bar' | 'line';
  }[] = [];
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

    const seriesData = dates.map((date) => dateMap.get(date) ?? null);

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
  [() => props.data, activeMetrics, () => props.chartType, chartRef],
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
watch(
  () => props.metrics,
  (metrics) => {
    const keys = new Set(metrics.map((item) => item.key));
    const retained = activeMetrics.value.filter((key) => keys.has(key));
    activeMetrics.value = retained.length
      ? retained
      : metrics.slice(0, props.initialMetrics).map((item) => item.key);
  },
  { deep: true },
);
</script>

<template>
  <ACard :bordered="false" class="mb-4 shadow-sm" size="small">
    <template #title>
      <div class="flex flex-wrap items-center justify-between gap-2 py-1">
        <span class="font-medium text-sm">{{ title }}</span>
        <!-- Metric selector tags -->
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs text-muted-foreground mr-1">{{
            $t('appStatistic.metricSelection', { count: maxMetrics })
          }}</span>
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
