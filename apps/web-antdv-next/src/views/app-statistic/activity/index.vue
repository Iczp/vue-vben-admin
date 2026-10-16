<script lang="ts" setup>
import type {
  ActivityAnalysisDto,
  AppStatisticQueryInput,
} from '#/api/app-statistic/types';

import { computed, onMounted, ref } from 'vue';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Alert,
  RadioButton as ARadioButton,
  RadioGroup as ARadioGroup,
  Row as ARow,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getActivityAnalysisApi } from '#/api/app-statistic/activity';
import { $t } from '#/locales';

import {
  AppHeaderSwitch,
  DimensionBarChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
  TrendChart,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import { formatDuration } from '../components/statistics';

const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const activityData = ref<ActivityAnalysisDto | null>(null);

const activeTrendTab = ref<'dau' | 'mau' | 'wau'>('dau');

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
    const res = await getActivityAnalysisApi(query.value);
    if (currentRequest !== requestId) return;
    activityData.value = res;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

const currentTrendMetrics = computed(() => {
  switch (activeTrendTab.value) {
    case 'mau': {
      return [
        { key: 'mau', label: $t('appStatistic.text056'), color: '#722ed1' },
      ];
    }
    case 'wau': {
      return [
        { key: 'wau', label: $t('appStatistic.text055'), color: '#52c41a' },
      ];
    }
    default: {
      return [
        { key: 'dau', label: $t('appStatistic.text057'), color: '#1677ff' },
      ];
    }
  }
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
          {{ $t('appStatistic.text001') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text179') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppHeaderSwitch v-model="query.appId" @change="loadData" />
        <AButton :loading="loading" size="small" @click="loadData">
          {{ $t('appStatistic.text011') }}
        </AButton>
      </div>
    </div>

    <Alert :message="$t('appStatistic.aggregateNote')" type="info" show-icon />
    <!-- Filter Bar -->
    <StatisticFilterBar v-model="query" :loading="loading" @change="loadData" />

    <Alert
      v-if="activityData && !activityData.hasRollingMetrics"
      :message="$t('appStatistic.rollingNote')"
      type="warning"
    />
    <!-- Core KPIs -->
    <div v-if="!failed" class="space-y-4">
      <MetricCardGroup :cols="6">
        <MetricCard
          :loading="loading"
          :value="activityData?.dau ?? 0"
          :title="$t('appStatistic.text058')"
          :tooltip="$t('appStatistic.text187')"
        />

        <MetricCard
          :loading="loading"
          :value="activityData?.hasRollingMetrics ? activityData.wau : '-'"
          :title="$t('appStatistic.text059')"
          :tooltip="$t('appStatistic.text188')"
        />

        <MetricCard
          :loading="loading"
          :value="activityData?.hasRollingMetrics ? activityData.mau : '-'"
          :title="$t('appStatistic.text060')"
          :tooltip="$t('appStatistic.text189')"
        />

        <MetricCard
          :loading="loading"
          :value="
            activityData?.hasRollingMetrics
              ? `${(activityData.dauMauRatio * 100).toFixed(1)}%`
              : '-'
          "
          :title="$t('appStatistic.text061')"
          :tooltip="$t('appStatistic.text190')"
        />

        <MetricCard
          :loading="loading"
          :value="Number(activityData?.avgLaunchCountPerUser ?? 0).toFixed(1)"
          :title="$t('appStatistic.text053')"
          :tooltip="$t('appStatistic.text191')"
          :unit="$t('appStatistic.launchesUnit')"
        />

        <MetricCard
          :loading="loading"
          :value="formatDuration(activityData?.avgDurationSecondsPerUser ?? 0)"
          :title="$t('appStatistic.text052')"
          :tooltip="$t('appStatistic.text192')"
        />
      </MetricCardGroup>

      <!-- Activity Trend with separated Tabs -->
      <ACard :bordered="false" class="shadow-sm" size="small">
        <template #title>
          <div class="flex flex-wrap items-center justify-between gap-2 py-1">
            <span class="font-medium text-sm">{{
              $t('appStatistic.text062')
            }}</span>
            <ARadioGroup
              v-model:value="activeTrendTab"
              button-style="solid"
              size="small"
            >
              <ARadioButton value="dau">
                {{ $t('appStatistic.text063') }}
              </ARadioButton>
              <ARadioButton value="wau">
                {{ $t('appStatistic.text064') }}
              </ARadioButton>
              <ARadioButton value="mau">
                {{ $t('appStatistic.text065') }}
              </ARadioButton>
            </ARadioGroup>
          </div>
        </template>

        <TrendChart
          :data="activityData?.trends ?? []"
          :loading="loading"
          :metrics="currentTrendMetrics"
          title=""
        />
      </ACard>

      <!-- Frequency & Duration Distributions -->
      <ARow :gutter="16">
        <ACol :lg="12" :md="24" :sm="24" :xs="24">
          <DimensionBarChart
            :clickable="false"
            :data="activityData?.launchDistributions ?? []"
            :loading="loading"
            bar-color="#722ed1"
            name-field="range"
            percentage-field="percentage"
            :title="$t('appStatistic.text066')"
            value-field="userCount"
          />
        </ACol>

        <ACol :lg="12" :md="24" :sm="24" :xs="24">
          <DimensionBarChart
            :clickable="false"
            :data="activityData?.durationDistributions ?? []"
            :loading="loading"
            bar-color="#13c2c2"
            name-field="range"
            percentage-field="percentage"
            :title="$t('appStatistic.text067')"
            value-field="userCount"
          />
        </ACol>
      </ARow>
    </div>
  </div>
</template>
