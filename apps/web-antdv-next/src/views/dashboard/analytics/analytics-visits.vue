<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { MessageSummaryDto } from '#/api/chat/message-report';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Empty, Spin } from 'antdv-next';

import {
  getMessageReportSummaryApi,
  MessageReportTypes,
} from '#/api/chat/message-report';
import { formatDateBucket } from '#/views/chat/message-report/data';

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

/**
 * 加载并聚合消息量柱状图数据
 */
async function loadVisitData() {
  loading.value = true;
  try {
    const res = await getMessageReportSummaryApi({
      maxResultCount: 100,
      reportType: props.reportType,
      sorting: 'dateBucket asc',
    });

    const items: MessageSummaryDto[] = res?.items ?? [];
    if (items.length === 0) {
      hasData.value = false;
      renderFallback();
      return;
    }

    hasData.value = true;

    // 按时间桶聚合全部会话产生的总消息数
    const bucketMap = new Map<number, number>();
    items.forEach((item) => {
      const bucket = item.dateBucket;
      const count = Number(item.totalCount) || 0;
      bucketMap.set(bucket, (bucketMap.get(bucket) || 0) + count);
    });

    const sortedBuckets = Array.from(bucketMap.keys()).sort((a, b) => a - b);
    const xAxisData = sortedBuckets.map((b) => formatDateBucket(b));
    const seriesData = sortedBuckets.map((b) => bucketMap.get(b) || 0);

    renderEcharts({
      grid: {
        bottom: 24,
        containLabel: true,
        left: '2%',
        right: '3%',
        top: 24,
      },
      series: [
        {
          barMaxWidth: 48,
          data: seriesData,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: '#4f46e5', // indigo-600
          },
          name: '产生消息量',
          type: 'bar',
        },
      ],
      tooltip: {
        axisPointer: {
          type: 'shadow',
        },
        trigger: 'axis',
      },
      xAxis: {
        axisTick: {
          show: false,
        },
        data: xAxisData,
        type: 'category',
      },
      yAxis: {
        axisTick: {
          show: false,
        },
        minInterval: 1,
        type: 'value',
      },
    });
  } catch (error) {
    console.error('Failed to load message visits summary:', error);
    renderFallback();
  } finally {
    loading.value = false;
  }
}

function renderFallback() {
  renderEcharts({
    grid: {
      bottom: 20,
      containLabel: true,
      left: '1%',
      right: '1%',
      top: 30,
    },
    series: [],
    xAxis: {
      data: [],
      type: 'category',
    },
    yAxis: {
      type: 'value',
    },
  });
}

watch(
  () => props.reportType,
  () => {
    loadVisitData();
  },
);

onMounted(() => {
  loadVisitData();
});
</script>

<template>
  <div class="relative h-[320px] w-full">
    <Spin :spinning="loading" class="h-full w-full">
      <div v-if="!hasData && !loading" class="flex h-[300px] items-center justify-center">
        <Empty description="暂无该统计维度的消息汇总数据" />
      </div>
      <EchartsUI v-else ref="chartRef" />
    </Spin>
  </div>
</template>
