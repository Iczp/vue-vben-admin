<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Card as ACard, Spin as ASpin } from 'ant-design-vue';

import StatisticEmpty from './StatisticEmpty.vue';

interface Props {
  title?: string;
  data: any[];
  nameField?: string;
  valueField?: string;
  percentageField?: string;
  loading?: boolean;
  height?: number | string;
  horizontal?: boolean;
  clickable?: boolean;
  barColor?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: '维度分布',
  data: () => [],
  nameField: 'value',
  valueField: 'activeDevices',
  percentageField: 'percentage',
  loading: false,
  height: 320,
  horizontal: true,
  clickable: true,
  barColor: '#1677ff',
});

const emit = defineEmits<{
  (e: 'itemClick', item: { name: string; value: number; raw: any }): void;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const normalizedData = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  return props.data
    .map((item) => {
      const name = item[props.nameField] ?? item.name ?? item.range ?? 'Unknown';
      const val = Number(item[props.valueField] ?? item.value ?? item.userCount ?? 0);
      const pct = Number(item[props.percentageField] ?? item.percentage ?? 0);
      return {
        name: String(name),
        value: val,
        percentage: pct,
        raw: item,
      };
    })
    .sort((a, b) => (props.horizontal ? a.value - b.value : b.value - a.value)); // ascending for horizontal y-axis so largest is at top
});

const hasData = computed(() => normalizedData.value.length > 0);

function updateChart() {
  if (!hasData.value) return;

  const names = normalizedData.value.map((d) => d.name);
  const values = normalizedData.value.map((d) => d.value);

  nextTick(() => {
    if (props.horizontal) {
      renderEcharts({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: (params: any) => {
            const p = Array.isArray(params) ? params[0] : params;
            const item = normalizedData.value[p.dataIndex];
            const pctText = item?.percentage ? ` (${item.percentage}%)` : '';
            return `<div class="font-medium">${p.name}</div><div>${props.title}: <b>${p.value.toLocaleString()}</b>${pctText}</div>`;
          },
        },
        grid: {
          left: '3%',
          right: '8%',
          top: '6%',
          bottom: '3%',
          containLabel: true,
        },
        xAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } },
        },
        yAxis: {
          type: 'category',
          data: names,
          axisTick: { alignWithLabel: true },
          axisLabel: {
            formatter: (val: string) =>
              val.length > 15 ? `${val.slice(0, 15)}...` : val,
          },
        },
        series: [
          {
            name: props.title,
            type: 'bar',
            data: values,
            barMaxWidth: 20,
            itemStyle: {
              color: props.barColor,
              borderRadius: [0, 4, 4, 0],
            },
            label: {
              show: true,
              position: 'right',
              formatter: '{c}',
              fontSize: 11,
              color: '#888',
            },
          },
        ],
      }).then((instance) => {
        if (instance && props.clickable) {
          instance.off('click');
          instance.on('click', (params: any) => {
            const item = normalizedData.value[params.dataIndex];
            if (item) {
              emit('itemClick', item);
            }
          });
        }
      });
    } else {
      renderEcharts({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
        },
        grid: {
          left: '3%',
          right: '4%',
          top: '8%',
          bottom: '10%',
          containLabel: true,
        },
        xAxis: {
          type: 'category',
          data: names,
          axisTick: { alignWithLabel: true },
          axisLabel: {
            interval: 0,
            rotate: names.length > 6 ? 30 : 0,
          },
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', opacity: 0.3 } },
        },
        series: [
          {
            name: props.title,
            type: 'bar',
            data: values,
            barMaxWidth: 28,
            itemStyle: {
              color: props.barColor,
              borderRadius: [4, 4, 0, 0],
            },
          },
        ],
      }).then((instance) => {
        if (instance && props.clickable) {
          instance.off('click');
          instance.on('click', (params: any) => {
            const item = normalizedData.value[params.dataIndex];
            if (item) {
              emit('itemClick', item);
            }
          });
        }
      });
    }
  });
}

watch(
  [() => props.data, () => props.horizontal],
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
      <div class="flex items-center justify-between py-1">
        <span class="font-medium text-sm">{{ title }}</span>
        <span v-if="clickable" class="text-xs text-muted-foreground">
          点击图表项可联动筛选
        </span>
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
