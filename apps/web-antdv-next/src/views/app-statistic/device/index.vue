<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Row as ARow,
  Table as ATable,
  Tag as ATag,
} from 'antdv-next';
import dayjs from 'dayjs';

import { getDeviceAnalysisApi } from '#/api/app-statistic/device';
import type {
  AppStatisticQueryInput,
  DeviceAnalysisDto,
} from '#/api/app-statistic/types';

import {
  DimensionBarChart,
  DimensionPieChart,
  MetricCard,
  MetricCardGroup,
  StatisticFilterBar,
} from '../components';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const deviceData = ref<DeviceAnalysisDto | null>(null);

const query = ref<AppStatisticQueryInput>({
  appId: 'default',
  startDate: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
  endDate: dayjs().format('YYYY-MM-DD'),
});

const selectedManufacturer = ref<string | null>(null);

const activeFilterTags = computed(() => {
  const tags: { key: string; label: string; value: string }[] = [];
  if (query.value.platform) {
    tags.push({ key: 'platform', label: '平台', value: query.value.platform });
  }
  if (selectedManufacturer.value) {
    tags.push({
      key: 'manufacturer',
      label: '品牌',
      value: selectedManufacturer.value,
    });
  }
  if (query.value.appVersion) {
    tags.push({ key: 'appVersion', label: '版本', value: query.value.appVersion });
  }
  if (query.value.channel) {
    tags.push({ key: 'channel', label: '渠道', value: query.value.channel });
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
  loading.value = true;
  try {
    const res = await getDeviceAnalysisApi(query.value);
    deviceData.value = res;
  } catch (error) {
    console.error('Failed to load device analysis data', error);
  } finally {
    loading.value = false;
  }
}

function handlePlatformClick(item: any) {
  query.value.platform = item.name;
  loadData();
}

function handleManufacturerClick(item: any) {
  selectedManufacturer.value = item.name;
}

function goToDeviceList() {
  router.push({
    path: '/app-statistic/devices',
    query: {
      appId: query.value.appId,
      platform: query.value.platform,
      appVersion: query.value.appVersion,
      channel: query.value.channel,
    },
  });
}

const modelColumns = [
  {
    title: '设备型号',
    dataIndex: 'value',
    key: 'value',
    ellipsis: true,
  },
  {
    title: '活跃设备数',
    dataIndex: 'activeDevices',
    key: 'activeDevices',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '活跃用户数',
    dataIndex: 'activeUsers',
    key: 'activeUsers',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => text?.toLocaleString() ?? 0,
  },
  {
    title: '设备占比',
    dataIndex: 'percentage',
    key: 'percentage',
    align: 'right' as const,
    customRender: ({ text }: { text: number }) => `${Number(text ?? 0).toFixed(1)}%`,
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
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">设备分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          全面分析应用在各种操作系统、终端品牌、设备型号及系统版本的覆盖分布
        </p>
      </div>
      <div class="flex items-center space-x-2">
        <AButton size="small" type="primary" @click="goToDeviceList">
          查看设备明细列表 →
        </AButton>
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

    <!-- Active filter tags for drill-down -->
    <div
      v-if="activeFilterTags.length > 0"
      class="flex flex-wrap items-center gap-2 bg-muted/30 p-2.5 rounded-md text-xs"
    >
      <span class="font-medium text-muted-foreground">当前下钻条件:</span>
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
        清空全部下钻
      </AButton>
    </div>

    <!-- Top KPIs -->
    <MetricCardGroup :cols="4">
      <MetricCard
        :loading="loading"
        :value="deviceData?.totalDevices ?? 0"
        title="累计设备总数"
        tooltip="自应用接入以来上报的所有独立物理设备数量"
      />

      <MetricCard
        :loading="loading"
        :value="deviceData?.activeDevices ?? 0"
        title="筛选区间活跃设备"
        tooltip="在指定日期范围内产生活跃事件的设备数"
      />

      <MetricCard
        :loading="loading"
        :value="deviceData?.newDevices ?? 0"
        title="筛选区间新增设备"
        tooltip="在指定日期范围内首次出现的新设备数"
      />

      <MetricCard
        :loading="loading"
        :value="deviceData?.monthlyActiveDevices ?? 0"
        title="30日活跃设备 (MAU Devices)"
        tooltip="过去30天内产生活跃行为的设备去重总数"
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
          title="系统平台分布"
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
          title="设备品牌分布 (Top 10)"
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
          title="操作系统版本分布"
          value-field="activeDevices"
        />
      </ACol>

      <ACol :lg="12" :md="24" :sm="24" :xs="24">
        <ACard :bordered="false" class="shadow-sm h-full" size="small">
          <template #title>
            <div class="flex items-center justify-between py-1">
              <span class="font-medium text-sm">热门设备型号 Top 10</span>
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
</template>
