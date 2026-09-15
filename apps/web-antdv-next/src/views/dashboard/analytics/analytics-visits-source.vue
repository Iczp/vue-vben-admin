<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { MessageReportDto } from '#/api/chat/message-report';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Empty, Spin } from 'antdv-next';

import {
  getMessageReportListApi,
  MessageReportTypes,
} from '#/api/chat/message-report';
import { messageTypeOptions } from '#/views/chat/message-report/data';

const props = withDefaults(
  defineProps<{
    reportType?: MessageReportTypes;
  }>(),
  {
    reportType: MessageReportTypes.Day,
  },
);

const chartRef = ref<EchartsUIType>();
const { renderEcharts } = useEcharts(chartRef);
const loading = ref(false);
const hasData = ref(true);

const typeLabelMap = new Map<number, string>(
  messageTypeOptions.map((o) => [o.value, o.label]),
);

async function loadTypeDistribution() {
  loading.value = true;
  try {
    const res = await getMessageReportListApi({
      maxResultCount: 100,
      reportType: props.reportType,
    });

    const items: MessageReportDto[] = res?.items ?? [];
    if (items.length === 0) {
      hasData.value = false;
      renderFallback();
      return;
    }

    hasData.value = true;

    // 统计每种消息类型发送总量
    const typeCountMap = new Map<number, number>();
    items.forEach((item) => {
      const type = item.messageType;
      const count = Number(item.count) || 0;
      typeCountMap.set(type, (typeCountMap.get(type) || 0) + count);
    });

    const pieData = Array.from(typeCountMap.entries())
      .map(([type, value]) => ({
        name: typeLabelMap.get(type) || `类型 ${type}`,
        value,
      }))
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);

    if (pieData.length === 0) {
      hasData.value = false;
      renderFallback();
      return;
    }

    renderEcharts({
      legend: {
        bottom: '2%',
        left: 'center',
        type: 'scroll',
      },
      series: [
        {
          animationDelay() {
            return Math.random() * 100;
          },
          animationEasing: 'exponentialInOut',
          animationType: 'scale',
          avoidLabelOverlap: false,
          color: [
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#ec4899',
            '#8b5cf6',
            '#06b6d4',
            '#6366f1',
          ],
          data: pieData,
          emphasis: {
            label: {
              fontSize: '12',
              fontWeight: 'bold',
              show: true,
            },
          },
          itemStyle: {
            borderRadius: 8,
            borderWidth: 2,
          },
          label: {
            position: 'center',
            show: false,
          },
          labelLine: {
            show: false,
          },
          name: '消息类型',
          radius: ['40%', '65%'],
          type: 'pie',
        },
      ],
      tooltip: {
        formatter: '{a} <br/>{b}: {c} 条 ({d}%)',
        trigger: 'item',
      },
    });
  } catch (error) {
    console.error('Failed to load message type distribution:', error);
    renderFallback();
  } finally {
    loading.value = false;
  }
}

function renderFallback() {
  renderEcharts({
    series: [],
  });
}

watch(
  () => props.reportType,
  () => {
    loadTypeDistribution();
  },
);

onMounted(() => {
  loadTypeDistribution();
});
</script>

<template>
  <div class="relative h-[300px] w-full">
    <Spin :spinning="loading" class="h-full w-full">
      <div v-if="!hasData && !loading" class="flex h-[280px] items-center justify-center">
        <Empty description="暂无消息类型数据" />
      </div>
      <EchartsUI v-else ref="chartRef" />
    </Spin>
  </div>
</template>
