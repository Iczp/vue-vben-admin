<script lang="ts" setup>
import type { DeviceDto, GetDevicesInput } from '#/api/app-statistic/types';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Input as AInput,
  Row as ARow,
  Select as ASelect,
  Tag as ATag,
  DatePicker,
} from 'antdv-next';
import { SelectOption as ASelectOption } from 'antdv-next';
import dayjs from 'dayjs';

import { getStatisticApplicationsApi, type StatisticApplicationDto } from '#/api/app-statistic/applications';
import { getDevicesApi } from '#/api/app-statistic/device';
import { $t } from '#/locales';

import StatisticError from '../components/StatisticError.vue';
import ATable from '../components/StatisticTable.vue';
import { getStoredAppId, setStoredAppId } from '../utils/app-storage';

const router = useRouter();
const route = useRoute();

const applications = ref<StatisticApplicationDto[]>([]);
const appOptions = ref<{ label: string; value: string }[]>([]);
const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const deviceList = ref<DeviceDto[]>([]);
const totalCount = ref(0);

const searchInput = ref<GetDevicesInput>({
  appId: (route.query.appId as string) || getStoredAppId() || undefined,
  deviceKey: undefined,
  platform: undefined,
  appVersion: undefined,
  channel: undefined,
  skipCount: 0,
  maxResultCount: 20,
  sorting: 'LastSeenTime DESC',
});

const currentPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['20', '50', '100'],
  showQuickJumper: true,
  showTotal: (total: number) =>
    $t('appStatistic.devicesTotal', { count: total.toLocaleString() }),
});

const searchFields = [
  'appId',
  'deviceKey',
  'platform',
  'appVersion',
  'channel',
  'manufacturer',
  'model',
  'osVersion',
  'minLastSeenTime',
  'maxLastSeenTime',
] as const;
function syncSearchUrl() {
  const params: Record<string, string> = {};
  for (const key of searchFields) {
    const value = searchInput.value[key];
    if (value) params[key] = value;
  }

  router.replace({ query: params });
}

async function loadData() {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
  try {
    const params: GetDevicesInput = {
      ...searchInput.value,
      skipCount:
        (currentPagination.value.current - 1) *
        currentPagination.value.pageSize,
      maxResultCount: currentPagination.value.pageSize,
    };

    const res = await getDevicesApi(params);
    if (currentRequest !== requestId) return;
    deviceList.value = res.items;
    totalCount.value = res.totalCount;
    currentPagination.value.total = res.totalCount;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
}

function setMinSeen(value: dayjs.Dayjs | dayjs.Dayjs[] | null) {
  const v = Array.isArray(value) ? value[0] : value;
  searchInput.value.minLastSeenTime = v?.startOf('day').toISOString();
}
function setMaxSeen(value: dayjs.Dayjs | dayjs.Dayjs[] | null) {
  const v = Array.isArray(value) ? value[0] : value;
  searchInput.value.maxLastSeenTime = v?.endOf('day').toISOString();
}
function handleTableChange(pag: { current?: number; pageSize?: number }) {
  currentPagination.value.current = pag.current ?? 1;
  currentPagination.value.pageSize = Math.min(100, pag.pageSize ?? 20);
  loadData();
}

function handleSearch() {
  syncSearchUrl();
  currentPagination.value.current = 1;
  loadData();
}

function handleReset() {
  searchInput.value = {
    appId: undefined,
    deviceKey: undefined,
    platform: undefined,
    appVersion: undefined,
    channel: undefined,
    skipCount: 0,
    maxResultCount: 20,
    sorting: 'LastSeenTime DESC',
  };
  handleSearch();
}

function viewDetail(record: DeviceDto) {
  router.push({
    path: `/app-statistic/devices/${record.id}`,
    query: route.query,
  });
}

const tableColumns = [
  {
    title: $t('appStatistic.text119'),
    dataIndex: 'lastUserId',
    key: 'lastUserId',
    width: 180,
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text115'),
    dataIndex: 'lastLoginTime',
    key: 'lastLoginTime',
    width: 160,
    render: (text: string) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: $t('appStatistic.text120'),
    dataIndex: 'deviceKey',
    key: 'deviceKey',
    width: 200,
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text015'),
    dataIndex: 'platform',
    key: 'platform',
    width: 90,
  },
  {
    title: $t('appStatistic.text016'),
    dataIndex: 'manufacturer',
    key: 'manufacturer',
    width: 100,
  },
  {
    title: $t('appStatistic.text121'),
    dataIndex: 'model',
    key: 'model',
    width: 120,
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text122'),
    dataIndex: 'osVersion',
    key: 'osVersion',
    width: 100,
  },
  {
    title: $t('appStatistic.text123'),
    dataIndex: 'appVersion',
    key: 'appVersion',
    width: 100,
  },
  {
    title: $t('appStatistic.text018'),
    dataIndex: 'channel',
    key: 'channel',
    width: 100,
  },
  {
    title: $t('appStatistic.text113'),
    dataIndex: 'firstSeenTime',
    key: 'firstSeenTime',
    width: 160,
    render: (text: string) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: $t('appStatistic.text114'),
    dataIndex: 'lastSeenTime',
    key: 'lastSeenTime',
    width: 160,
    render: (text: string) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: $t('appStatistic.text071'),
    key: 'action',
    width: 80,
    fixed: 'right' as const,
    align: 'center' as const,
  },
];

onMounted(async () => {
  try {
    applications.value = await getStatisticApplicationsApi();
    appOptions.value = applications.value.map(app => ({ label: app.name, value: app.appId }));
  } catch {
    // ignore
  }

  for (const key of searchFields) {
    const value = route.query[key];
    if (typeof value === 'string') searchInput.value[key] = value;
  }
  const q = route.query;
  const storedAppId = getStoredAppId();
  if (q.appId && typeof q.appId === 'string' && q.appId !== 'default') {
    searchInput.value.appId = q.appId;
    setStoredAppId(q.appId);
  } else if (!searchInput.value.appId && storedAppId) {
    searchInput.value.appId = storedAppId;
  } else if (!searchInput.value.appId && applications.value[0]?.appId) {
    searchInput.value.appId = applications.value[0].appId;
    setStoredAppId(applications.value[0].appId);
  }

  if (q.platform && typeof q.platform === 'string')
    searchInput.value.platform = q.platform;
  if (q.appVersion && typeof q.appVersion === 'string')
    searchInput.value.appVersion = q.appVersion;
  if (q.channel && typeof q.channel === 'string')
    searchInput.value.channel = q.channel;

  if (typeof q.manufacturer === 'string')
    searchInput.value.manufacturer = q.manufacturer;
  if (typeof q.startDate === 'string')
    searchInput.value.minLastSeenTime = dayjs(q.startDate)
      .startOf('day')
      .toISOString();
  if (typeof q.endDate === 'string')
    searchInput.value.maxLastSeenTime = dayjs(q.endDate)
      .endOf('day')
      .toISOString();
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
          {{ $t('appStatistic.text004') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text182') }}
        </p>
      </div>
      <AButton :loading="loading" size="small" @click="loadData">
        {{ $t('appStatistic.text011') }}
      </AButton>
    </div>

    <!-- Search Form Card -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <ARow :gutter="[12, 10]" align="middle">
        <ACol :lg="4" :md="6" :sm="12" :xs="24">
          <ASelect
            v-if="applications.length"
            v-model:value="searchInput.appId"
            :options="appOptions"
            allow-clear
            show-search
            option-filter-prop="label"
            placeholder="App"
            size="small"
            class="w-full"
            @change="(val: unknown) => { if (typeof val === 'string') setStoredAppId(val); handleSearch(); }"
          />
          <AInput
            v-else
            v-model:value="searchInput.appId"
            allow-clear
            placeholder="AppId"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="6" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.deviceKey"
            allow-clear
            placeholder="DeviceKey"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="4" :md="6" :sm="12" :xs="24">
          <ASelect
            v-model:value="searchInput.platform"
            allow-clear
            class="w-full"
            :placeholder="$t('appStatistic.text015')"
            size="small"
          >
            <ASelectOption value="android">Android</ASelectOption>
            <ASelectOption value="ios">iOS</ASelectOption>
            <ASelectOption value="windows">Windows</ASelectOption>
            <ASelectOption value="macos">macOS</ASelectOption>
            <ASelectOption value="web">Web</ASelectOption>
          </ASelect>
        </ACol>

        <ACol :lg="4" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.appVersion"
            allow-clear
            placeholder="AppVersion"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="6" :md="24" :sm="24" :xs="24">
          <div class="flex items-center justify-end space-x-2">
            <AButton
              :loading="loading"
              size="small"
              type="primary"
              @click="handleSearch"
            >
              {{ $t('appStatistic.text012') }}
            </AButton>
            <AButton size="small" @click="handleReset">
              {{ $t('appStatistic.text013') }}
            </AButton>
          </div>
        </ACol>
        <ACol :lg="6" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.channel"
            allow-clear
            :placeholder="$t('appStatistic.text018')"
            @press-enter="handleSearch"
          />
        </ACol>
        <ACol :lg="6" :md="6" :sm="12" :xs="24">
<AInput
            v-model:value="searchInput.manufacturer"
            allow-clear
            :placeholder="$t('appStatistic.text016')"
            @press-enter="handleSearch"
        />
</ACol>
        <ACol :lg="6" :md="6" :sm="12" :xs="24">
<DatePicker
            :value="
              searchInput.minLastSeenTime
                ? dayjs(searchInput.minLastSeenTime)
                : null
            "
            :placeholder="$t('appStatistic.text131')"
            @change="setMinSeen"
        />
</ACol>
        <ACol :lg="6" :md="6" :sm="12" :xs="24">
<DatePicker
            :value="
              searchInput.maxLastSeenTime
                ? dayjs(searchInput.maxLastSeenTime)
                : null
            "
            :placeholder="$t('appStatistic.text132')"
            @change="setMaxSeen"
        />
</ACol>
      </ARow>
    </ACard>

    <!-- Table Card -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <ATable
        :columns="tableColumns"
        :data-source="deviceList"
        :loading="loading"
        :pagination="currentPagination"
        :scroll="{ x: 1200 }"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'platform'">
            <ATag :color="record.platform === 'ios' ? 'black' : 'green'">
              {{ record.platform }}
            </ATag>
          </template>

          <template v-else-if="column.key === 'action'">
            <AButton size="small" type="link" @click="viewDetail(record)">
              {{ $t('appStatistic.text014') }}
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>
  </div>
</template>
