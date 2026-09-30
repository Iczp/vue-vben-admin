<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
  Table as ATable,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getChannelAnalysisApi } from '#/api/app-statistic/channel';
import type {
  AppStatisticQueryInput,
  ChannelAnalysisDto,
} from '#/api/app-statistic/types';

import {
  DimensionBarChart,
  DimensionPieChart,
  StatisticFilterBar,
  TrendChart,
} from '../components';

const loading = ref(false);
const channelData = ref<ChannelAnalysisDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(13, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getChannelAnalysisApi(query.value);
    channelData.value = res;
  } catch (error) {
    console.error('Failed to load channel analysis data', error);
  } finally {
    loading.value = false;
  }
}

function handleChannelClick(item: any) {
  query.value.channel = item.name;
  loadData();
}

const tableColumns = [
  {
    title: '渠道名称',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '活跃设备数',
    dataIndex: 'activeDevices',
    key: 'activeDevices',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '活跃用户数',
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '设备占比',
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => `${Number(text ?? 0).toFixed(1)}%`,
  },
  {
    title: '事件总数',
    dataIndex: 'eventCount',
    key: 'eventCount',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '操作',
    key: 'action',
    align: 'center' as const,
    width: 100,
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
        <h2 class="text-xl font-bold tracking-tight text-foreground">渠道分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          分析官方、各大应用商店及分发渠道的用户获客与活跃质量
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

    <!-- Charts Row: Channel Share & Bar Ranking -->
    <ARow :gutter="16">
      <ACol :lg="10" :md="12" :sm="24" :xs="24">
        <DimensionPieChart
          :data="channelData?.channels ?? []"
          :loading="loading"
          clickable
          name-field="value"
          title="渠道设备占比"
          value-field="activeDevices"
          @item-click="handleChannelClick"
        />
      </ACol>

      <ACol :lg="14" :md="12" :sm="24" :xs="24">
        <DimensionBarChart
          :data="channelData?.channels ?? []"
          :loading="loading"
          bar-color="#722ed1"
          clickable
          name-field="value"
          title="渠道活跃排行"
          value-field="activeDevices"
          @item-click="handleChannelClick"
        />
      </ACol>
    </ARow>

    <!-- Trend Charts: Acquisition & Active Trends -->
    <ARow :gutter="16">
      <ACol :lg="12" :md="24" :sm="24" :xs="24">
        <TrendChart
          :data="channelData?.newTrends ?? []"
          :loading="loading"
          chart-type="line"
          title="渠道新增趋势"
        />
      </ACol>

      <ACol :lg="12" :md="24" :sm="24" :xs="24">
        <TrendChart
          :data="channelData?.activeTrends ?? []"
          :loading="loading"
          chart-type="line"
          title="渠道活跃趋势"
        />
      </ACol>
    </ARow>

    <!-- Channel Details Table -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <template #title>
        <div class="flex items-center justify-between py-1">
          <span class="font-medium text-sm">渠道明细报表</span>
        </div>
      </template>

      <ATable
        :columns="tableColumns"
        :data-source="channelData?.channels ?? []"
        :loading="loading"
        :pagination="false"
        row-key="value"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'action'">
            <AButton
              size="small"
              type="link"
              @click="handleChannelClick({ name: record.value })"
            >
              锁定渠道
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>
  </div>
</template>
