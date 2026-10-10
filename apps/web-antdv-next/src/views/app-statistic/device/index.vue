<script lang="ts" setup>
import type {
  AppStatisticQueryInput,
  DeviceAnalysisDto,
} from '#/api/app-statistic/types';

import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { Alert } from 'antdv-next';
import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
  Tag as ATag,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getDeviceAnalysisApi } from '#/api/app-statistic/device';
import { $t } from '#/locales';

import {
  AppHeaderSwitch,
  DimensionBarChart,
  DimensionPieChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
} from '../components';
import StatisticError from '../components/StatisticError.vue';
import ATable from '../components/StatisticTable.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const deviceData = ref<DeviceAnalysisDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: undefined,
  startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

const selectedManufacturer = computed({
  get: () => query.value.manufacturer ?? null,
  set: (value: null | string) => {
    query.value.manufacturer = value ?? undefined;
  },
});

const activeFilterTags = computed(() => {
  const tags: { key: string; label: string; value: string }[] = [];
  if (query.value.platform) {
    tags.push({
      key: 'platform',
      label: $t('appStatistic.text015'),
      value: query.value.platform,
    });
  }
  if (selectedManufacturer.value) {
    tags.push({
      key: 'manufacturer',
      label: $t('appStatistic.text016'),
      value: selectedManufacturer.value,
    });
  }
  if (query.value.appVersion) {
    tags.push({
      key: 'appVersion',
      label: $t('appStatistic.text017'),
      value: query.value.appVersion,
    });
  }
  if (query.value.channel) {
    tags.push({
      key: 'channel',
      label: $t('appStatistic.text018'),
      value: query.value.channel,
    });
  }
  return tags;
});

function removeTag(key: string) {
  if (key === 'platform') query.value.platform = undefined;
  if (key === 'manufacturer') selectedManufacturer.value = null;
  if (key === 'appVersion') query.value.appVersion = undefined;
  if (key === 'channel') query.value.channel = undefined;
  loadData();
}

function clearAllFilters() {
  query.value.platform = undefined;
  selectedManufacturer.value = null;
  query.value.appVersion = undefined;
  query.value.channel = undefined;
  loadData();
}

async function loadData() {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const res = await getDeviceAnalysisApi({
      ...query.value,
      manufacturer: selectedManufacturer.value ?? undefined,
    });
    if (currentRequest !== requestId) return;
    deviceData.value = res;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function handlePlatformClick(item: { name: string }) {
  query.value.platform = item.name;
  loadData();
}

function handleManufacturerClick(item: { name: string }) {
  selectedManufacturer.value = item.name;
  query.value.manufacturer = item.name;
  loadData();
}

function goToDeviceList() {
  router.push({
    path: '/app-statistic/devices',
    query: {
      appId: query.value.appId,
      platform: query.value.platform,
      manufacturer: selectedManufacturer.value,
      startDate: query.value.startDate,
      endDate: query.value.endDate,
      appVersion: query.value.appVersion,
      channel: query.value.channel,
    },
  });
}

const modelColumns = [
  {
    title: $t('appStatistic.text087'),
    dataIndex: 'value',
    key: 'value',
    ellipsis: true,
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
];

onMounted(() => {
  if (route.query.platform && typeof route.query.platform === 'string') {
    query.value.platform = route.query.platform;
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
          {{ $t('appStatistic.text003') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text180') }}
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <AppHeaderSwitch v-model="query.appId" @change="loadData" />
        <AButton size="small" type="primary" @click="goToDeviceList">
          {{ $t('appStatistic.text088') }}
        </AButton>
        <AButton :loading="loading" size="small" @click="loadData">
          {{ $t('appStatistic.text011') }}
        </AButton>
      </div>
    </div>

    <Alert :message="$t('appStatistic.profileNote')" type="info" show-icon />
    <!-- Filter Bar -->
    <StatisticFilterBar v-model="query" :loading="loading" @change="loadData" />

    <!-- Active filter tags for drill-down -->
    <div
      v-if="activeFilterTags.length > 0"
      class="flex flex-wrap items-center gap-2 bg-muted/30 p-2.5 rounded-md text-xs"
    >
      <span class="font-medium text-muted-foreground">{{
        $t('appStatistic.text089')
      }}</span>
      <ATag
        v-for="tag in activeFilterTags"
        :key="tag.key"
        closable
        color="processing"
        @close="removeTag(tag.key)"
      >
        {{ tag.label }}: {{ tag.value }}
      </ATag>
      <AButton size="small" type="link" @click="clearAllFilters">
        {{ $t('appStatistic.text090') }}
      </AButton>
    </div>

    <!-- Top KPIs -->
    <div v-if="!failed" class="space-y-4">
      <MetricCardGroup :cols="4">
        <MetricCard
          :loading="loading"
          :value="deviceData?.totalDevices ?? 0"
          :title="$t('appStatistic.text091')"
          :tooltip="$t('appStatistic.text199')"
        />

        <MetricCard
          :loading="loading"
          :value="deviceData?.activeDevices ?? 0"
          :title="$t('appStatistic.text092')"
          :tooltip="$t('appStatistic.text200')"
        />

        <MetricCard
          :loading="loading"
          :value="deviceData?.newDevices ?? 0"
          :title="$t('appStatistic.text093')"
          :tooltip="$t('appStatistic.text201')"
        />

        <MetricCard
          :loading="loading"
          :value="deviceData?.monthlyActiveDevices ?? 0"
          :title="$t('appStatistic.text094')"
          :tooltip="$t('appStatistic.text202')"
        />
      </MetricCardGroup>

      <!-- Row 1: Platform & Manufacturer -->
      <ARow :gutter="16">
        <ACol :lg="10" :md="12" :sm="24" :xs="24">
          <DimensionPieChart
            :data="deviceData?.platforms ?? []"
            :loading="loading"
            clickable
            name-field="value"
            :title="$t('appStatistic.text095')"
            value-field="activeDevices"
            @item-click="handlePlatformClick"
          />
        </ACol>

        <ACol :lg="14" :md="12" :sm="24" :xs="24">
          <DimensionBarChart
            :data="deviceData?.manufacturers ?? []"
            :loading="loading"
            bar-color="#52c41a"
            clickable
            name-field="value"
            :title="$t('appStatistic.text096')"
            value-field="activeDevices"
            @item-click="handleManufacturerClick"
          />
        </ACol>
      </ARow>

      <!-- Row 2: OS Versions & Models -->
      <ARow :gutter="16">
        <ACol :lg="12" :md="24" :sm="24" :xs="24">
          <DimensionBarChart
            :clickable="false"
            :data="deviceData?.osVersions ?? []"
            :loading="loading"
            bar-color="#fa8c16"
            name-field="value"
            :title="$t('appStatistic.text097')"
            value-field="activeDevices"
          />
        </ACol>

        <ACol :lg="12" :md="24" :sm="24" :xs="24">
          <ACard :bordered="false" class="shadow-sm h-full" size="small">
            <template #title>
              <div class="flex items-center justify-between py-1">
                <span class="font-medium text-sm">{{
                  $t('appStatistic.text098')
                }}</span>
              </div>
            </template>
            <ATable
              :columns="modelColumns"
              :data-source="deviceData?.models ?? []"
              :loading="loading"
              :pagination="false"
              row-key="value"
              size="small"
            />
          </ACard>
        </ACol>
      </ARow>
    </div>
  </div>
</template>
