<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';

import { computed, nextTick, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Card as ACard, Spin as ASpin } from 'antdv-next';

import StatisticEmpty from './StatisticEmpty.vue';

interface Props {
  title?: string;
  data: any[];
  nameField?: string;
  valueField?: string;
  percentageField?: string;
  loading?: boolean;
  height?: number | string;
  donut?: boolean;
  clickable?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  title: '占比分布',
  data: () => [],
  nameField: 'value',
  valueField: 'activeDevices',
  percentageField: 'percentage',
  loading: false,
  height: 320,
  donut: true,
  clickable: true,
});

const emit = defineEmits<{
  (e: 'itemClick', item: { name: string; value: number; raw: any }): void;
}>();

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);

const normalizedData = computed(() => {
  if (!props.data || props.data.length === 0) return [];

  return props.data.map((item) => {
    const name = item[props.nameField] ?? item.name ?? 'Unknown';
    const val = Number(item[props.valueField] ?? item.value ?? 0);
    const pct = Number(item[props.percentageField] ?? item.percentage ?? 0);
    return {
      name: String(name),
      value: val,
      percentage: pct,
      raw: item,
    };
  });
});

const hasData = computed(() => normalizedData.value.length > 0);

const colorPalette = [
  '#1677ff',
  '#52c41a',
  '#fa8c16',
  '#722ed1',
  '#13c2c2',
  '#eb2f96',
  '#faad14',
  '#2f54eb',
  '#a0d911',
  '#fa541c',
];

function updateChart() {
  if (!hasData.value) return;

  const chartData = normalizedData.value.map((d) => ({
    name: d.name,
    value: d.value,
  }));

  nextTick(() => {
    renderEcharts({
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          return `<div class="font-medium">${params.name}</div><div>数量: <b>${params.value.toLocaleString()}</b> (${params.percent}%)</div>`;
        },
      },
      legend: {
        orient: 'vertical',
        right: '4%',
        top: 'center',
        itemWidth: 10,
        itemHeight: 10,
        formatter: (name: string) => {
          const item = normalizedData.value.find((d) => d.name === name);
          if (item) {
            return `${name.length > 10 ? `${name.slice(0, 10)}...` : name} (${item.value.toLocaleString()})`;
          }
          return name;
        },
      },
      color: colorPalette,
      series: [
        {
          name: props.title,
          type: 'pie',
          radius: props.donut ? ['40%', '70%'] : '65%',
          center: ['40%', '50%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 4,
            borderColor: '#fff',
            borderWidth: 2,
          },
          label: {
            show: false,
            position: 'center',
          },
          emphasis: {
            label: {
              show: props.donut,
              fontSize: 16,
              fontWeight: 'bold',
              formatter: '{b}\n{d}%',
            },
          },
          labelLine: {
            show: false,
          },
          data: chartData,
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
  });
}

watch(
  [() => props.data, () => props.donut],
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
          点击扇区可联动筛选
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
