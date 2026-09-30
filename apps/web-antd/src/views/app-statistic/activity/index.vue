<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Radio as ARadio,
  Row as ARow,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getActivityAnalysisApi } from '#/api/app-statistic/activity';
import type {
  ActivityAnalysisDto,
  AppStatisticQueryInput,
} from '#/api/app-statistic/types';

import {
  DimensionBarChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
  TrendChart,
} from '../components';

const loading = ref(false);
const activityData = ref<ActivityAnalysisDto | null>(null);

const activeTrendTab = ref<'dau' | 'mau' | 'wau'>('dau');

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(13, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0秒';
  const mins = Math.floor(seconds / 60);
  const remSecs = Math.round(seconds % 60);
  if (mins === 0) return `${remSecs}秒`;
  return remSecs > 0 ? `${mins}分${remSecs}秒` : `${mins}分钟`;
}

async function loadData() {
  loading.value = true;
  try {
    const res = await getActivityAnalysisApi(query.value);
    activityData.value = res;
  } catch (error) {
    console.error('Failed to load activity analysis data', error);
  } finally {
    loading.value = false;
  }
}

const currentTrendMetrics = computed(() => {
  switch (activeTrendTab.value) {
    case 'wau': {
      return [{ key: 'wau', label: '周活跃用户 (WAU)', color: '#52c41a' }];
    }
    case 'mau': {
      return [{ key: 'mau', label: '月活跃用户 (MAU)', color: '#722ed1' }];
    }
    default: {
      return [{ key: 'dau', label: '日活跃用户 (DAU)', color: '#1677ff' }];
    }
  }
});

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">活跃分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          深度分析应用用户黏性 (DAU/MAU)、使用频次与访问时长分布
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

    <!-- Core KPIs -->
    <MetricCardGroup :cols="6">
      <MetricCard
        :loading="loading"
        :value="activityData?.dau ?? 0"
        title="日活跃 (DAU)"
        tooltip="当日产生事件的独立用户数"
      />

      <MetricCard
        :loading="loading"
        :value="activityData?.wau ?? 0"
        title="周活跃 (WAU)"
        tooltip="过去7天去重独立活跃用户数"
      />

      <MetricCard
        :loading="loading"
        :value="activityData?.mau ?? 0"
        title="月活跃 (MAU)"
        tooltip="过去30天去重独立活跃用户数"
      />

      <MetricCard
        :loading="loading"
        :value="`${((activityData?.dauMauRatio ?? 0) * 100).toFixed(1)}%`"
        title="活跃粘性 (DAU/MAU)"
        tooltip="衡量用户使用频率的经典指标，比例越高代表用户黏性越强"
      />

      <MetricCard
        :loading="loading"
        :value="Number(activityData?.avgLaunchCountPerUser ?? 0).toFixed(1)"
        title="人均启动次数"
        tooltip="平均每个活跃用户启动应用的次数"
        unit="次"
      />

      <MetricCard
        :loading="loading"
        :value="formatDuration(activityData?.avgDurationSecondsPerUser ?? 0)"
        title="人均使用时长"
        tooltip="平均每个活跃用户的单日使用时长"
      />
    </MetricCardGroup>

    <!-- Activity Trend with separated Tabs -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <template #title>
        <div class="flex flex-wrap items-center justify-between gap-2 py-1">
          <span class="font-medium text-sm">活跃趋势</span>
          <ARadio.Group v-model:value="activeTrendTab" button-style="solid" size="small">
            <ARadio.Button value="dau">DAU 趋势</ARadio.Button>
            <ARadio.Button value="wau">WAU 趋势</ARadio.Button>
            <ARadio.Button value="mau">MAU 趋势</ARadio.Button>
          </ARadio.Group>
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
          title="用户启动次数分布"
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
          title="用户单日使用时长分布"
          value-field="userCount"
        />
      </ACol>
    </ARow>
  </div>
</template>
