<script lang="ts" setup>
import type { EchartsUIType } from '@vben/plugins/echarts';
import type { MessageReportDto } from '#/api/chat/message-report';

import { onMounted, ref, watch } from 'vue';

import { EchartsUI, useEcharts } from '@vben/plugins/echarts';
import { Empty, Spin } from 'antdv-next';

import {
  getMessageReportListApi,
  MessageReportTypes,
  MessageTypes,
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
 * 加载并聚合趋势数据
 */
async function loadTrendData() {
  loading.value = true;
  try {
    // 默认拉取近期聚合条目（按 dateBucket 升序）
    const res = await getMessageReportListApi({
      maxResultCount: 100,
      reportType: props.reportType,
      sorting: 'dateBucket asc',
    });

    const items: MessageReportDto[] = res?.items ?? [];
    if (items.length === 0) {
      hasData.value = false;
      renderFallback();
      return;
    }

    hasData.value = true;

    // 1. 提取去重并排序的时间桶 (X 轴)
    const bucketSet = new Set<number>();
    items.forEach((item) => {
      bucketSet.add(item.dateBucket);
    });
    const sortedBuckets = Array.from(bucketSet).sort((a, b) => a - b);
    const xAxisData = sortedBuckets.map((b) => formatDateBucket(b));

    // 2. 统计各时间桶的总消息数、文本消息、多媒体消息 (图片/语音/视频/文件)
    const totalMap = new Map<number, number>();
    const textMap = new Map<number, number>();
    const mediaMap = new Map<number, number>();

    const mediaTypes = new Set([
      MessageTypes.Image,
      MessageTypes.Sound,
      MessageTypes.Video,
      MessageTypes.File,
    ]);

    items.forEach((item) => {
      const bucket = item.dateBucket;
      const count = Number(item.count) || 0;

      totalMap.set(bucket, (totalMap.get(bucket) || 0) + count);

      if (item.messageType === MessageTypes.Text) {
        textMap.set(bucket, (textMap.get(bucket) || 0) + count);
      } else if (mediaTypes.has(item.messageType)) {
        mediaMap.set(bucket, (mediaMap.get(bucket) || 0) + count);
      }
    });

    const totalSeriesData = sortedBuckets.map((b) => totalMap.get(b) || 0);
    const textSeriesData = sortedBuckets.map((b) => textMap.get(b) || 0);
    const mediaSeriesData = sortedBuckets.map((b) => mediaMap.get(b) || 0);

    renderEcharts({
      grid: {
        bottom: 24,
        containLabel: true,
        left: '2%',
        right: '3%',
        top: 36,
      },
      legend: {
        data: ['全部消息', '文本消息', '媒体文件(图/音/视/件)'],
        top: 0,
      },
      series: [
        {
          areaStyle: {
            opacity: 0.25,
          },
          data: totalSeriesData,
          itemStyle: {
            color: '#3b82f6',
          },
          name: '全部消息',
          smooth: true,
          type: 'line',
        },
        {
          areaStyle: {
            opacity: 0.2,
          },
          data: textSeriesData,
          itemStyle: {
            color: '#10b981',
          },
          name: '文本消息',
          smooth: true,
          type: 'line',
        },
        {
          areaStyle: {
            opacity: 0.2,
          },
          data: mediaSeriesData,
          itemStyle: {
            color: '#f59e0b',
          },
          name: '媒体文件(图/音/视/件)',
          smooth: true,
          type: 'line',
        },
      ],
      tooltip: {
        axisPointer: {
          lineStyle: {
            color: '#3b82f6',
            width: 1,
          },
        },
        trigger: 'axis',
      },
      xAxis: {
        axisTick: {
          show: false,
        },
        boundaryGap: false,
        data: xAxisData,
        splitLine: {
          lineStyle: {
            type: 'dashed',
          },
          show: true,
        },
        type: 'category',
      },
      yAxis: {
        axisTick: {
          show: false,
        },
        minInterval: 1,
        splitArea: {
          show: true,
        },
        type: 'value',
      },
    });
  } catch (error) {
    console.error('Failed to load message trends:', error);
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
    loadTrendData();
  },
);

onMounted(() => {
  loadTrendData();
});
</script>

<template>
  <div class="relative h-[320px] w-full">
    <Spin :spinning="loading" class="h-full w-full">
      <div v-if="!hasData && !loading" class="flex h-[300px] items-center justify-center">
        <Empty description="暂无该统计维度的消息报表数据" />
      </div>
      <EchartsUI v-else ref="chartRef" />
    </Spin>
  </div>
</template>
