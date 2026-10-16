<script lang="ts" setup>
import type {
  AppStatisticQueryInput,
  PageAnalysisDto,
  PageStatisticDto,
} from '#/api/app-statistic/types';

import { onMounted, ref } from 'vue';

import { Button as AButton, Card as ACard, Alert } from 'antdv-next';
import dayjs from 'dayjs';

import { getPageAnalysisApi } from '#/api/app-statistic/page';
import { $t } from '#/locales';

import {
  AppHeaderSwitch,
  DimensionBarChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import { formatDuration } from '../components/statistics';
import ATable from '../components/StatisticTable.vue';

const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const pageData = ref<null | PageAnalysisDto>(null);

const query = ref<AppStatisticQueryInput>({
  appId: undefined,
  startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

async function loadData() {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const res = await getPageAnalysisApi(query.value);
    if (currentRequest !== requestId) return;
    pageData.value = res;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

const tableColumns = [
  {
    title: $t('appStatistic.text146'),
    dataIndex: 'pageKey',
    key: 'pageKey',
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text147'),
    dataIndex: 'pageName',
    key: 'pageName',
    render: (text: string | undefined, record: PageStatisticDto) =>
      text || record.pageKey,
  },
  {
    title: $t('appStatistic.text148'),
    dataIndex: 'pageViewCount',
    key: 'pageViewCount',
    align: 'right' as const,
    sorter: (a: PageStatisticDto, b: PageStatisticDto) =>
      a.pageViewCount - b.pageViewCount,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text141'),
    dataIndex: 'uniqueVisitorCount',
    key: 'uniqueVisitorCount',
    align: 'right' as const,
    sorter: (a: PageStatisticDto, b: PageStatisticDto) =>
      a.uniqueVisitorCount - b.uniqueVisitorCount,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text149'),
    dataIndex: 'avgVisitsPerUser',
    key: 'avgVisitsPerUser',
    align: 'right' as const,
    render: (text: number) => Number(text ?? 0).toFixed(1),
  },
  {
    title: $t('appStatistic.text150'),
    dataIndex: 'avgDurationSeconds',
    key: 'avgDurationSeconds',
    align: 'right' as const,
    render: (text: number) => (text == null ? '-' : formatDuration(text)),
  },
  {
    title: $t('appStatistic.text151'),
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    render: (text: number) => `${(Number(text ?? 0) * 100).toFixed(1)}%`,
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
          {{ $t('appStatistic.text007') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text184') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppHeaderSwitch v-model="query.appId" @change="loadData" />
        <AButton :loading="loading" size="small" @click="loadData">
          {{ $t('appStatistic.text011') }}
        </AButton>
      </div>
    </div>

    <Alert
      :message="$t('appStatistic.durationUnknown')"
      type="info"
      show-icon
    />
    <!-- Filter Bar -->
    <StatisticFilterBar v-model="query" :loading="loading" @change="loadData" />

    <!-- KPIs -->
    <div v-if="!failed" class="space-y-4">
      <MetricCardGroup :cols="3">
        <MetricCard
          :loading="loading"
          :value="pageData?.totalPageViewCount ?? 0"
          :title="$t('appStatistic.text152')"
          :tooltip="$t('appStatistic.text203')"
        />

        <MetricCard
          :loading="loading"
          :value="pageData?.totalUniqueVisitors ?? 0"
          :title="$t('appStatistic.text153')"
          :tooltip="$t('appStatistic.text204')"
        />

        <MetricCard
          :loading="loading"
          :value="pageData?.pages?.length ?? 0"
          :title="$t('appStatistic.text154')"
          :tooltip="$t('appStatistic.text205')"
          :unit="$t('appStatistic.pagesUnit')"
        />
      </MetricCardGroup>

      <!-- PV Ranking Bar Chart -->
      <DimensionBarChart
        :clickable="false"
        :data="pageData?.pages ?? []"
        :height="300"
        :loading="loading"
        bar-color="#1677ff"
        name-field="pageKey"
        percentage-field="percentage"
        :title="$t('appStatistic.text155')"
        value-field="pageViewCount"
      />

      <!-- Detailed Table -->
      <ACard :bordered="false" class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between py-1">
            <span class="font-medium text-sm">{{
              $t('appStatistic.text156')
            }}</span>
          </div>
        </template>

        <ATable
          :columns="tableColumns"
          :data-source="pageData?.pages ?? []"
          :loading="loading"
          :pagination="{ pageSize: 20, showSizeChanger: true }"
          row-key="pageKey"
          size="small"
        />
      </ACard>
    </div>
  </div>
</template>
