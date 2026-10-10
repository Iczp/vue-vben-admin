<script lang="ts" setup>
import type {
  AppStatisticQueryInput,
  ChannelAnalysisDto,
} from '#/api/app-statistic/types';

import { computed, onMounted, ref } from 'vue';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getChannelAnalysisApi } from '#/api/app-statistic/channel';
import { $t } from '#/locales';

import {
  AppHeaderSwitch,
  DimensionBarChart,
  DimensionPieChart,
  StatisticFilterBar,
  TrendChart,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import ATable from '../components/StatisticTable.vue';

const trendMetrics = computed(() =>
  [
    ...new Set(
      [
        ...(channelData.value?.activeTrends ?? []),
        ...(channelData.value?.newTrends ?? []),
      ].map((item) => item.metric),
    ),
  ]
    .slice(0, 5)
    .map((key) => ({ key, label: key })),
);
const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const channelData = ref<ChannelAnalysisDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: undefined,
  startDate: dayjs().subtract(13, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

async function loadData() {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const res = await getChannelAnalysisApi(query.value);
    if (currentRequest !== requestId) return;
    channelData.value = res;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function handleChannelClick(item: { name: string }) {
  query.value.channel = item.name;
  loadData();
}

const tableColumns = [
  {
    title: $t('appStatistic.channelNewDevices'),
    dataIndex: 'newDevices',
    key: 'newDevices',
    align: 'right' as const,
    render: (text: null | number) => text?.toLocaleString() ?? '—',
  },
  {
    title: $t('appStatistic.channelNewUsers'),
    dataIndex: 'newUsers',
    key: 'newUsers',
    align: 'right' as const,
    render: (text: null | number) => text?.toLocaleString() ?? '—',
  },
  {
    title: $t('appStatistic.channelLaunches'),
    dataIndex: 'launchCount',
    key: 'launchCount',
    align: 'right' as const,
    render: (text: null | number) => text?.toLocaleString() ?? '—',
  },
  {
    title: $t('appStatistic.text068'),
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: $t('appStatistic.text043'),
    dataIndex: 'activeDevices',
    key: 'activeDevices',
    align: 'right' as const,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text044'),
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    align: 'right' as const,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text045'),
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    render: (text: number) => `${(Number(text ?? 0) * 100).toFixed(1)}%`,
  },
  {
    title: $t('appStatistic.text069'),
    dataIndex: 'eventCount',
    key: 'eventCount',
    align: 'right' as const,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text071'),
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
    <StatisticError v-if="failed" @retry="loadData" />
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">
          {{ $t('appStatistic.text002') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text181') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppHeaderSwitch v-model="query.appId" @change="loadData" />
        <AButton :loading="loading" size="small" @click="loadData">
          {{ $t('appStatistic.text011') }}
        </AButton>
      </div>
    </div>

    <!-- Filter Bar -->
    <StatisticFilterBar
      v-model="query"
      :loading="loading"
      @change="loadData"
    />

    <!-- Charts Row: Channel Share & Bar Ranking -->
    <ARow :gutter="16">
      <ACol :lg="10" :md="12" :sm="24" :xs="24">
        <DimensionPieChart
          :data="channelData?.channels ?? []"
          :loading="loading"
          clickable
          name-field="value"
          :title="$t('appStatistic.text072')"
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
          :title="$t('appStatistic.text073')"
          value-field="activeDevices"
          @item-click="handleChannelClick"
        />
      </ACol>
    </ARow>

    <!-- Trend Charts: Acquisition & Active Trends -->
    <ARow :gutter="16">
      <ACol :lg="12" :md="24" :sm="24" :xs="24">
        <TrendChart
          :metrics="trendMetrics"
          :data="channelData?.newTrends ?? []"
          :loading="loading"
          chart-type="line"
          :title="$t('appStatistic.text074')"
        />
      </ACol>

      <ACol :lg="12" :md="24" :sm="24" :xs="24">
        <TrendChart
          :metrics="trendMetrics"
          :data="channelData?.activeTrends ?? []"
          :loading="loading"
          chart-type="line"
          :title="$t('appStatistic.text075')"
        />
      </ACol>
    </ARow>

    <!-- Channel Details Table -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <template #title>
        <div class="flex items-center justify-between py-1">
          <span class="font-medium text-sm">{{
            $t('appStatistic.text076')
          }}</span>
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
              {{ $t('appStatistic.text077') }}
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>
  </div>
</template>
