<script lang="ts" setup>
import type {
  AppStatisticQueryInput,
  RetentionDto,
  StatisticTrendDto,
} from '#/api/app-statistic/types';

import { computed, onMounted, ref } from 'vue';

import { Button as AButton } from 'antdv-next';
import dayjs from 'dayjs';

import { getRetentionApi } from '#/api/app-statistic/retention';
import { $t } from '#/locales';

import {
  AppHeaderSwitch,
  MetricCard,
  MetricCardGroup,
  RetentionHeatmap,
  StatisticFilterBar,
  TrendChart,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import { weightedRetention } from '../components/statistics';

const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const retentionList = ref<RetentionDto[]>([]);

const query = ref<AppStatisticQueryInput>({
  appId: undefined,
  startDate: dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

async function loadData() {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const res = await getRetentionApi(query.value);
    if (currentRequest !== requestId) return;
    retentionList.value = res ?? [];
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

// Compute average retention rates
const avgRates = computed(() => {
  const rate = (day: number) => {
    const value = weightedRetention(retentionList.value, day);
    return value === undefined ? '-' : (value * 100).toFixed(1);
  };
  return {
    d1: rate(1),
    d3: rate(3),
    d7: rate(7),
    d14: rate(14),
    d30: rate(30),
  };
});

// Convert RetentionDto into trend data for Line Chart
const retentionTrends = computed<StatisticTrendDto[]>(() => {
  const trends: StatisticTrendDto[] = [];
  retentionList.value.forEach((item) => {
    if ([1, 7, 30].includes(item.retentionDay)) {
      trends.push({
        date: item.cohortDate,
        metric: `d${item.retentionDay}`,
        value: Number(item.retentionRate ?? 0) * 100,
      });
    }
  });
  return trends;
});

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
          {{ $t('appStatistic.text008') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text185') }}
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
    <StatisticFilterBar v-model="query" :loading="loading" @change="loadData" />

    <!-- Average Retention KPIs -->
    <div v-if="!failed" class="space-y-4">
      <MetricCardGroup :cols="5">
        <MetricCard
          :loading="loading"
          :value="`${avgRates.d1}%`"
          :title="$t('appStatistic.text157')"
          :tooltip="$t('appStatistic.text206')"
        />

        <MetricCard
          :loading="loading"
          :value="`${avgRates.d3}%`"
          :title="$t('appStatistic.text158')"
          :tooltip="$t('appStatistic.text207')"
        />

        <MetricCard
          :loading="loading"
          :value="`${avgRates.d7}%`"
          :title="$t('appStatistic.text159')"
          :tooltip="$t('appStatistic.text208')"
        />

        <MetricCard
          :loading="loading"
          :value="`${avgRates.d14}%`"
          :title="$t('appStatistic.text160')"
          :tooltip="$t('appStatistic.text209')"
        />

        <MetricCard
          :loading="loading"
          :value="`${avgRates.d30}%`"
          :title="$t('appStatistic.text161')"
          :tooltip="$t('appStatistic.text210')"
        />
      </MetricCardGroup>

      <!-- Cohort Heatmap -->
      <RetentionHeatmap :data="retentionList" :loading="loading" />

      <!-- Retention Trends Chart -->
      <TrendChart
        :data="retentionTrends"
        :loading="loading"
        :metrics="[
          { key: 'd1', label: $t('appStatistic.text162'), color: '#1677ff' },
          { key: 'd7', label: $t('appStatistic.text163'), color: '#52c41a' },
          { key: 'd30', label: $t('appStatistic.text164'), color: '#fa8c16' },
        ]"
        :title="$t('appStatistic.text165')"
      />
    </div>
  </div>
</template>
