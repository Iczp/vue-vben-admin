<script lang="ts" setup>
import type {
  AppStatisticDashboardDto,
  AppStatisticQueryInput,
} from '#/api/app-statistic/types';

import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import { useAccess } from '@vben/access';

import { message, Popconfirm } from 'antdv-next';
import { Alert } from 'antdv-next';
import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
} from 'antdv-next';
import dayjs from 'dayjs';

import { rebuildDailyDataApi } from '#/api/app-statistic';
import { getDashboardApi } from '#/api/app-statistic/dashboard';
import { $t } from '#/locales';

import {
  DimensionBarChart,
  DimensionPieChart,
  MetricCard,
  MetricCardGroup,
  RetentionHeatmap,
  StatisticEmpty,
  StatisticFilterBar,
  TrendChart,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import { formatDuration } from '../components/statistics';

const router = useRouter();
const { hasAccessByCodes } = useAccess();
const rebuilding = ref(false);

const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const lastUpdated = ref<string>('-');
const dashboardData = ref<AppStatisticDashboardDto | null>(null);

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
    const res = await getDashboardApi(query.value);
    if (currentRequest !== requestId) return;
    dashboardData.value = res;
    lastUpdated.value = dayjs().format('HH:mm:ss');
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

async function rebuild() {
  rebuilding.value = true;
  try {
    await rebuildDailyDataApi({
      appId: query.value.appId || 'default',
      date: query.value.endDate,
    });
    message.success($t('appStatistic.rebuildSuccess'));
    await loadData();
  } catch {
    message.error($t('appStatistic.loadError'));
  } finally {
    rebuilding.value = false;
  }
}

function handlePlatformClick(item: { name: string }) {
  router.push({
    path: '/app-statistic/device',
    query: {
      appId: query.value.appId,
      platform: item.name,
      startDate: query.value.startDate,
      endDate: query.value.endDate,
    },
  });
}

function handleVersionClick(item: { name: string }) {
  router.push({
    path: '/app-statistic/version',
    query: {
      appId: query.value.appId,
      appVersion: item.name,
      startDate: query.value.startDate,
      endDate: query.value.endDate,
    },
  });
}

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
          {{ $t('appStatistic.text006') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text178') }}
        </p>
      </div>
      <div class="flex items-center space-x-2 text-xs text-muted-foreground">
        <Popconfirm
          v-if="hasAccessByCodes(['AppStatistic.Admin.Manage'])"
          :title="
            $t('appStatistic.rebuildConfirm', {
              appId: query.appId,
              date: query.endDate,
            })
          "
          @confirm="rebuild"
        >
          <AButton :loading="rebuilding" :disabled="loading" size="small">
            {{ $t('appStatistic.rebuild') }}
          </AButton>
        </Popconfirm>
        <span>{{ $t('appStatistic.updated', { time: lastUpdated }) }}</span>
        <AButton :loading="loading" size="small" @click="loadData">
          {{ $t('appStatistic.text011') }}
        </AButton>
      </div>
    </div>

    <Alert :message="$t('appStatistic.aggregateNote')" type="info" show-icon />
    <!-- Filter Bar -->
    <StatisticFilterBar
      v-model="query"
      :loading="loading"
      @change="loadData"
    />

    <!-- KPI Metric Cards -->
    <div v-if="!failed" class="space-y-4">
      <MetricCardGroup
        v-if="loading || dashboardData?.summary.hasData"
        :cols="3"
      >
        <MetricCard
          :loading="loading"
          :previous-value="dashboardData?.summary?.yesterdayDau"
          :value="dashboardData?.summary?.todayDau ?? 0"
          :title="$t('appStatistic.text057')"
          :tooltip="$t('appStatistic.text193')"
        />

        <MetricCard
          :loading="loading"
          :previous-value="dashboardData?.summary?.yesterdayNewUsers"
          :value="dashboardData?.summary?.todayNewUsers ?? 0"
          :title="$t('appStatistic.text039')"
          :tooltip="$t('appStatistic.text194')"
        />

        <MetricCard
          :loading="loading"
          :previous-value="dashboardData?.summary?.yesterdayNewDevices"
          :value="dashboardData?.summary?.todayNewDevices ?? 0"
          :title="$t('appStatistic.text040')"
          :tooltip="$t('appStatistic.text195')"
        />

        <MetricCard
          :loading="loading"
          :value="dashboardData?.summary?.todayLaunchCount ?? 0"
          :title="$t('appStatistic.text048')"
          :tooltip="$t('appStatistic.text196')"
        />

        <MetricCard
          :loading="loading"
          :value="dashboardData?.summary?.todayPageViewCount ?? 0"
          :title="$t('appStatistic.text140')"
          :tooltip="$t('appStatistic.text197')"
        />

        <MetricCard
          :loading="loading"
          :value="
            formatDuration(
              dashboardData?.summary?.todayAverageDurationSeconds ?? 0,
            )
          "
          :title="$t('appStatistic.text051')"
          :tooltip="$t('appStatistic.text198')"
        />
        <MetricCard
          :loading="loading"
          :value="dashboardData?.summary?.todayActiveDevices ?? 0"
          :title="$t('appStatistic.text041')"
        />
        <MetricCard
          :loading="loading"
          :value="dashboardData?.summary?.todaySessionCount ?? 0"
          :title="$t('appStatistic.text054')"
        />
        <MetricCard
          :loading="loading"
          :value="dashboardData?.summary?.todayUniqueVisitorCount ?? 0"
          :title="$t('appStatistic.text141')"
        />
      </MetricCardGroup>
      <StatisticEmpty v-else />

      <!-- Trend Chart -->
      <TrendChart
        :data="dashboardData?.trends ?? []"
        :loading="loading"
        :metrics="[
          { key: 'dau', label: 'DAU', color: '#1677ff' },
          {
            key: 'new_users',
            label: $t('appStatistic.text039'),
            color: '#52c41a',
          },
          {
            key: 'new_devices',
            label: $t('appStatistic.text040'),
            color: '#fa8c16',
          },
          {
            key: 'launch_count',
            label: $t('appStatistic.text047'),
            color: '#722ed1',
          },
          { key: 'session_count', label: 'Session', color: '#f59e0b' },
          { key: 'page_view_count', label: 'PV', color: '#13c2c2' },
          {
            key: 'duration_seconds',
            label: $t('appStatistic.text049'),
            color: '#eb2f96',
          },
        ]"
        :title="$t('appStatistic.text036')"
      />

      <!-- Dimensional Breakdown: Platforms & Versions -->
      <ARow :gutter="16">
        <ACol :lg="10" :md="12" :sm="24" :xs="24">
          <DimensionPieChart
            :data="dashboardData?.platforms ?? []"
            :loading="loading"
            clickable
            name-field="value"
            :title="$t('appStatistic.text142')"
            value-field="activeDevices"
            @item-click="handlePlatformClick"
          />
        </ACol>

        <ACol :lg="14" :md="12" :sm="24" :xs="24">
          <DimensionBarChart
            :data="dashboardData?.versions ?? []"
            :loading="loading"
            clickable
            name-field="value"
            :title="$t('appStatistic.text143')"
            value-field="activeDevices"
            @item-click="handleVersionClick"
          />
        </ACol>
      </ARow>

      <!-- Retention Summary Section -->
      <ACard :bordered="false" class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between py-1">
            <span class="font-medium text-sm">{{
              $t('appStatistic.text144')
            }}</span>
            <AButton
              size="small"
              type="link"
              @click="
                router.push({
                  path: '/app-statistic/retention',
                  query: {
                    appId: query.appId,
                    startDate: query.startDate,
                    endDate: query.endDate,
                  },
                })
              "
            >
              {{ $t('appStatistic.text145') }}
            </AButton>
          </div>
        </template>

        <RetentionHeatmap
          :data="dashboardData?.retention ?? []"
          :loading="loading"
        />
      </ACard>
    </div>
  </div>
</template>
