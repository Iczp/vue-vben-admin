<script lang="ts" setup>
import type {
  AppStatisticQueryInput,
  VersionAnalysisDto,
} from '#/api/app-statistic/types';

import { computed, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
  Tag as ATag,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getVersionAnalysisApi } from '#/api/app-statistic/version';
import { $t } from '#/locales';

import {
  AppHeaderSwitch,
  DimensionPieChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
  TrendChart,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import ATable from '../components/StatisticTable.vue';

const route = useRoute();

const trendMetrics = computed(() =>
  [
    ...new Set(
      (versionData.value?.versionTrends ?? []).map((item) => item.metric),
    ),
  ]
    .slice(0, 5)
    .map((key) => ({ key, label: key })),
);
const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const versionData = ref<null | VersionAnalysisDto>(null);

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
    const res = await getVersionAnalysisApi(query.value);
    if (currentRequest !== requestId) return;
    versionData.value = res;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function handleVersionClick(item: { name: string }) {
  query.value.appVersion = item.name;
  loadData();
}

const tableColumns = [
  { title: $t('appStatistic.firstSeenDate'), dataIndex: 'firstSeenDate', key: 'firstSeenDate' },
  { title: $t('appStatistic.lastActiveDate'), dataIndex: 'lastActiveDate', key: 'lastActiveDate' },
  {
    title: $t('appStatistic.text166'),
    dataIndex: 'value',
    key: 'value',
  },
  {
    title: $t('appStatistic.text041'),
    dataIndex: 'activeDevices',
    key: 'activeDevices',
    align: 'right' as const,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text042'),
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    align: 'right' as const,
    render: (text: number) => text?.toLocaleString() ?? 0,
  },
  {
    title: $t('appStatistic.text046'),
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    render: (text: number) => `${(Number(text ?? 0) * 100).toFixed(1)}%`,
  },
  {
    title: $t('appStatistic.text070'),
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
  if (route.query.appVersion && typeof route.query.appVersion === 'string') {
    query.value.appVersion = route.query.appVersion;
  }
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
          {{ $t('appStatistic.text009') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text186') }}
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

    <!-- Active filter tag -->
    <div
      v-if="query.appVersion"
      class="flex items-center gap-2 bg-muted/30 p-2.5 rounded-md text-xs"
    >
      <span class="font-medium text-muted-foreground">{{
        $t('appStatistic.text167')
      }}</span>
      <ATag
        closable
        color="blue"
        @close="
          () => {
            query.appVersion = undefined;
            loadData();
          }
        "
      >
        {{ query.appVersion }}
      </ATag>
    </div>

    <!-- Core KPIs -->
    <div v-if="!failed" class="space-y-4">
      <MetricCardGroup :cols="4">
        <MetricCard
          :loading="loading"
          :value="versionData?.latestVersion || $t('appStatistic.text168')"
          :title="$t('appStatistic.text169')"
          :tooltip="$t('appStatistic.text211')"
        />

        <MetricCard
          :loading="loading"
          :value="versionData?.activeVersionCount ?? 0"
          :title="$t('appStatistic.text170')"
          :tooltip="$t('appStatistic.text212')"
          :unit="$t('appStatistic.versionsUnit')"
        />

        <MetricCard
          :loading="loading"
          :value="`${(Number(versionData?.latestVersionShare ?? 0) * 100).toFixed(1)}%`"
          :title="$t('appStatistic.text171')"
          :tooltip="$t('appStatistic.text213')"
        />

        <MetricCard
          :loading="loading"
          :value="versionData?.legacyVersionActiveDevices ?? 0"
          :title="$t('appStatistic.text172')"
          :tooltip="$t('appStatistic.text214')"
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
            :title="$t('appStatistic.text173')"
            value-field="activeDevices"
            @item-click="handleVersionClick"
          />
        </ACol>

        <ACol :lg="14" :md="12" :sm="24" :xs="24">
          <TrendChart
            :max-metrics="5"
            :initial-metrics="5"
            :metrics="trendMetrics"
            :data="versionData?.versionTrends ?? []"
            :loading="loading"
            :title="$t('appStatistic.text174')"
          />
        </ACol>
      </ARow>

      <!-- Detailed Version Table -->
      <ACard :bordered="false" class="shadow-sm" size="small">
        <template #title>
          <div class="flex items-center justify-between py-1">
            <span class="font-medium text-sm">{{
              $t('appStatistic.text175')
            }}</span>
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
                {{ $t('appStatistic.text176') }}
              </AButton>
            </template>
          </template>
        </ATable>
      </ACard>
    </div>
  </div>
</template>
