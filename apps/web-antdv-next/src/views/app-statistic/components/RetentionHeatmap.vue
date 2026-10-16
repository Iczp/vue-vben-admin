<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import type { RetentionDto } from '#/api/app-statistic/types';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';

import { Card as ACard, Spin as ASpin } from 'antdv-next';

import { $t } from '#/locales';

import StatisticEmpty from './StatisticEmpty.vue';

const props = withDefaults(
  defineProps<{
    data?: RetentionDto[];
    loading?: boolean;
  }>(),
  { data: () => [], loading: false },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const days = [1, 3, 7, 14, 30];
const cohorts = computed(() =>
  [...new Set(props.data.map((item) => item.cohortDate))].sort(),
);
const height = computed(() => Math.max(320, cohorts.value.length * 32 + 110));

async function updateChart() {
  await nextTick();
  if (!chartRef.value || cohorts.value.length === 0) return;
  const cells = props.data
    .filter(
      (item) =>
        days.includes(item.retentionDay) && Number.isFinite(item.retentionRate),
    )
    .map((item) => ({
      value: [
        days.indexOf(item.retentionDay),
        cohorts.value.indexOf(item.cohortDate),
        Math.min(100, Math.max(0, item.retentionRate * 100)),
      ],
      cohortDate: item.cohortDate,
      retentionDay: item.retentionDay,
      retainedUsers: item.retainedUsers,
      baseUsers: item.baseUsers,
    }));
  await renderEcharts({
    grid: { left: 110, right: 20, top: 35, bottom: 65 },
    tooltip: {
      renderMode: 'richText',
      position: 'top',
      formatter: (params) => {
        const param = Array.isArray(params) ? params[0] : params;
        const cell = param?.data as (typeof cells)[number] | undefined;
        if (!cell) return '';
        return `${cell.cohortDate} · D${cell.retentionDay}: ${cell.value[2]?.toFixed(1)}%\n${$t('appStatistic.cohortTooltip', { retained: cell.retainedUsers, base: cell.baseUsers })}`;
      },
    },
    xAxis: {
      type: 'category',
      data: days.map((day) => `D${day}`),
      position: 'top',
      splitArea: { show: true },
    },
    yAxis: { type: 'category', data: cohorts.value, splitArea: { show: true } },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#eff6ff', '#60a5fa', '#1d4ed8'] },
    },
    series: [
      {
        type: 'heatmap',
        data: cells,
        label: {
          show: true,
          formatter: (params) =>
            `${Number((params.value as number[])[2]).toFixed(1)}%`,
        },
        emphasis: { itemStyle: { borderColor: '#1677ff', borderWidth: 2 } },
      },
    ],
  });
}

watch([() => props.data, chartRef], updateChart, { deep: true });
</script>

<template>
  <ACard :bordered="false" class="mb-4 shadow-sm" size="small">
    <template #title>
      <div class="flex items-center justify-between py-1">
        <span class="font-medium text-sm">{{
          $t('appStatistic.text085')
        }}</span>
        <span class="text-xs text-muted-foreground">{{
          $t('appStatistic.text086')
        }}</span>
      </div>
    </template>
    <ASpin :spinning="loading">
      <div
        v-if="cohorts.length"
        :style="{ height: `${height}px` }"
        class="w-full"
      >
        <EchartsUI ref="chartRef" />
      </div>
      <StatisticEmpty v-else-if="!loading" />
    </ASpin>
  </ACard>
</template>
