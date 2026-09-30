<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
  Table as ATable,
  Tag as ATag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import type {
  AppStatisticQueryInput,
  VersionAnalysisDto,
} from '#/api/app-statistic/types';
import { getVersionAnalysisApi } from '#/api/app-statistic/version';

import {
  DimensionPieChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
  TrendChart,
} from '../components';

const route = useRoute();

const loading = ref(false);
const versionData = ref<VersionAnalysisDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(13, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

async function loadData() {
  loading.value = true;
  try {
    const res = await getVersionAnalysisApi(query.value);
    versionData.value = res;
  } catch (error) {
    console.error('Failed to load version analysis data', error);
  } finally {
    loading.value = false;
  }
}

function handleVersionClick(item: any) {
  query.value.appVersion = item.name;
  loadData();
}

const tableColumns = [
  {
    title: '版本号',
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: '活跃设备',
    dataIndex: 'activeDevices',
    key: 'activeDevices',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '活跃用户',
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '占比',
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => `${Number(text ?? 0).toFixed(1)}%`,
  },
  {
    title: '上报事件数',
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
  if (route.query.appVersion && typeof route.query.appVersion === 'string') {
    query.value.appVersion = route.query.appVersion;
  }
  loadData();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">版本分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          追踪各客户端应用版本分布、升级替换速度及旧版本衰退态势
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

    <!-- Active filter tag -->
    <div
      v-if="query.appVersion"
      class="flex items-center gap-2 bg-muted/30 p-2.5 rounded-md text-xs"
    >
      <span class="font-medium text-muted-foreground">当前锁定版本:</span>
      <ATag
        closable
        color="blue"
        @close="() => { query.appVersion = undefined; loadData(); }"
      >
        {{ query.appVersion }}
      </ATag>
    </div>

    <!-- Core KPIs -->
    <MetricCardGroup :cols="4">
      <MetricCard
        :loading="loading"
        :value="versionData?.latestVersion || '暂无'"
        title="最新版本"
        tooltip="当前上报的最高版本号"
      />

      <MetricCard
        :loading="loading"
        :value="versionData?.activeVersionCount ?? 0"
        title="在用活跃版本数"
        tooltip="在统计周期内有活跃记录的不同版本总数"
        unit="个"
      />

      <MetricCard
        :loading="loading"
        :value="`${Number(versionData?.latestVersionShare ?? 0).toFixed(1)}%`"
        title="最新版本设备占比"
        tooltip="最新版本设备数占全部活跃设备数的百分比"
      />

      <MetricCard
        :loading="loading"
        :value="versionData?.legacyVersionActiveDevices ?? 0"
        title="旧版本活跃设备数"
        tooltip="除最新版本以外所有旧版本的活跃设备总数"
      />
    </MetricCardGroup>

    <!-- Version Distribution & Trends -->
    <ARow :gutter="16">
      <ACol :lg="10" :md="12" :sm="24" :xs="24">
        <DimensionPieChart
          :data="versionData?.versions ?? []"
          :loading="loading"
          clickable
          name-field="value"
          title="当前版本分布"
          value-field="activeDevices"
          @item-click="handleVersionClick"
        />
      </ACol>

      <ACol :lg="14" :md="12" :sm="24" :xs="24">
        <TrendChart
          :data="versionData?.versionTrends ?? []"
          :loading="loading"
          title="Top 5 版本设备趋势"
        />
      </ACol>
    </ARow>

    <!-- Detailed Version Table -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <template #title>
        <div class="flex items-center justify-between py-1">
          <span class="font-medium text-sm">版本明细列表</span>
        </div>
      </template>

      <ATable
        :columns="tableColumns"
        :data-source="versionData?.versions ?? []"
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
              @click="handleVersionClick({ name: record.value })"
            >
              仅看此版本
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>
  </div>
</template>
