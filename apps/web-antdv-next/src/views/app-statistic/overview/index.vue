<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getDashboardApi } from '#/api/app-statistic/dashboard';
import type {
  AppStatisticDashboardDto,
  AppStatisticQueryInput,
} from '#/api/app-statistic/types';

import {
  DimensionBarChart,
  DimensionPieChart,
  MetricCard,
  MetricCardGroup,
  RetentionHeatmap,
  StatisticFilterBar,
  TrendChart,
} from '../components';

const router = useRouter();

const loading = ref(false);
const lastUpdated = ref<string>('-');
const dashboardData = ref<AppStatisticDashboardDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

function calcChangeRate(current: number, previous: number): number | undefined {
  if (!previous || previous === 0) return undefined;
  return Number((((current - previous) / previous) * 100).toFixed(1));
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0秒';
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const remSecs = seconds % 60;
  if (mins < 60) {
    return remSecs > 0 ? `${mins}分${remSecs}秒` : `${mins}分钟`;
  }
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return `${hours}小时${remMins}分`;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getDashboardApi(query.value);
    dashboardData.value = res;
    lastUpdated.value = dayjs().format('HH:mm:ss');
  } catch (error) {
    console.error('Failed to load dashboard data', error);
  } finally {
    loading.value = false;
  }
}

function handlePlatformClick(item: any) {
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

function handleVersionClick(item: any) {
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
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">数据概览</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          监控应用核心指标、活跃趋势与用户留存情况
        </p>
      </div>
      <div class="flex items-center space-x-2 text-xs text-muted-foreground">
        <span>更新时间: {{ lastUpdated }}</span>
        <AButton :loading="loading" size="small" @click="loadData">刷新</AButton>
      </div>
    </div>

    <!-- Filter Bar -->
    <StatisticFilterBar
      v-model="query"
      :loading="loading"
      @change="loadData"
      @reset="loadData"
    />

    <!-- KPI Metric Cards -->
    <MetricCardGroup :cols="6">
      <MetricCard
        :change-rate="
          calcChangeRate(
            dashboardData?.summary?.todayDau ?? 0,
            dashboardData?.summary?.yesterdayDau ?? 0,
          )
        "
        :loading="loading"
        :previous-value="dashboardData?.summary?.yesterdayDau"
        :value="dashboardData?.summary?.todayDau ?? 0"
        title="日活跃用户 (DAU)"
        tooltip="当日产生任意事件的独立用户数"
      />

      <MetricCard
        :change-rate="
          calcChangeRate(
            dashboardData?.summary?.todayNewUsers ?? 0,
            dashboardData?.summary?.yesterdayNewUsers ?? 0,
          )
        "
        :loading="loading"
        :previous-value="dashboardData?.summary?.yesterdayNewUsers"
        :value="dashboardData?.summary?.todayNewUsers ?? 0"
        title="新增用户"
        tooltip="当日首次记录的新用户数"
      />

      <MetricCard
        :change-rate="
          calcChangeRate(
            dashboardData?.summary?.todayNewDevices ?? 0,
            dashboardData?.summary?.yesterdayNewDevices ?? 0,
          )
        "
        :loading="loading"
        :previous-value="dashboardData?.summary?.yesterdayNewDevices"
        :value="dashboardData?.summary?.todayNewDevices ?? 0"
        title="新增设备"
        tooltip="当日首次上传统计的独立物理设备数"
      />

      <MetricCard
        :loading="loading"
        :value="dashboardData?.summary?.todayLaunchCount ?? 0"
        title="应用启动次数"
        tooltip="当日会话或启动事件的总次数"
      />

      <MetricCard
        :loading="loading"
        :value="dashboardData?.summary?.todayPageViewCount ?? 0"
        title="页面浏览量 (PV)"
        tooltip="当日页面访问事件总次数"
      />

      <MetricCard
        :loading="loading"
        :value="formatDuration(dashboardData?.summary?.todayAverageDurationSeconds ?? 0)"
        title="平均使用时长"
        tooltip="当日活跃用户的人均单日使用总时长"
      />
    </MetricCardGroup>

    <!-- Trend Chart -->
    <TrendChart
      :data="dashboardData?.trends ?? []"
      :loading="loading"
      :metrics="[
        { key: 'dau', label: 'DAU', color: '#1677ff' },
        { key: 'new_users', label: '新增用户', color: '#52c41a' },
        { key: 'new_devices', label: '新增设备', color: '#fa8c16' },
        { key: 'launch_count', label: '启动次数', color: '#722ed1' },
        { key: 'page_view_count', label: 'PV', color: '#13c2c2' },
        { key: 'duration_seconds', label: '使用时长', color: '#eb2f96' },
      ]"
      title="核心指标趋势"
    />

    <!-- Dimensional Breakdown: Platforms & Versions -->
    <ARow :gutter="16">
      <ACol :lg="10" :md="12" :sm="24" :xs="24">
        <DimensionPieChart
          :data="dashboardData?.platforms ?? []"
          :loading="loading"
          clickable
          name-field="value"
          title="平台分布"
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
          title="版本分布 (Top 10)"
          value-field="activeDevices"
          @item-click="handleVersionClick"
        />
      </ACol>
    </ARow>

    <!-- Retention Summary Section -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <template #title>
        <div class="flex items-center justify-between py-1">
          <span class="font-medium text-sm">用户留存概览</span>
          <AButton
            size="small"
            type="link"
            @click="router.push('/app-statistic/retention')"
          >
            查看完整留存分析 →
          </AButton>
        </div>
      </template>

      <RetentionHeatmap
        :data="dashboardData?.retention ?? []"
        :loading="loading"
      />
    </ACard>
  </div>
</template>
