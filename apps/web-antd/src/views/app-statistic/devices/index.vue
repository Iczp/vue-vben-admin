<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Input as AInput,
  Row as ARow,
  Select as ASelect,
  Table as ATable,
  Tag as ATag,
} from 'ant-design-vue';
import dayjs from 'dayjs';

import { getDevicesApi } from '#/api/app-statistic/device';
import type { DeviceDto, GetDevicesInput } from '#/api/app-statistic/types';

const router = useRouter();
const route = useRoute();

const loading = ref(false);
const deviceList = ref<DeviceDto[]>([]);
const totalCount = ref(0);

const searchInput = ref<GetDevicesInput>({
  appId: 'default',
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
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total.toLocaleString()} 台设备`,
});

async function loadData() {
  loading.value = true;
  try {
    const params: GetDevicesInput = {
      ...searchInput.value,
      skipCount:
        (currentPagination.value.current - 1) *
        currentPagination.value.pageSize,
      maxResultCount: currentPagination.value.pageSize,
    };

    const res = await getDevicesApi(params);
    deviceList.value = res.items;
    totalCount.value = res.totalCount;
    currentPagination.value.total = res.totalCount;
  } catch (error) {
    console.error('Failed to load device list', error);
  } finally {
    loading.value = false;
  }
}

function handleTableChange(pag: any) {
  currentPagination.value.current = pag.current;
  currentPagination.value.pageSize = pag.pageSize;
  loadData();
}

function handleSearch() {
  currentPagination.value.current = 1;
  loadData();
}

function handleReset() {
  searchInput.value = {
    appId: 'default',
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

function viewDetail(record: any) {
  router.push(`/app-statistic/devices/${record.id}`);
}

const tableColumns = [
  {
    title: '设备唯一标识 (DeviceKey)',
    dataIndex: 'deviceKey',
    key: 'deviceKey',
    width: 200,
    ellipsis: true,
  },
  {
    title: '平台',
    dataIndex: 'platform',
    key: 'platform',
    width: 90,
  },
  {
    title: '品牌',
    dataIndex: 'manufacturer',
    key: 'manufacturer',
    width: 100,
  },
  {
    title: '型号',
    dataIndex: 'model',
    key: 'model',
    width: 120,
    ellipsis: true,
  },
  {
    title: '系统版本',
    dataIndex: 'osVersion',
    key: 'osVersion',
    width: 100,
  },
  {
    title: 'App 版本',
    dataIndex: 'appVersion',
    key: 'appVersion',
    width: 100,
  },
  {
    title: '渠道',
    dataIndex: 'channel',
    key: 'channel',
    width: 100,
  },
  {
    title: '首次活跃时间',
    dataIndex: 'firstSeenTime',
    key: 'firstSeenTime',
    width: 160,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '最近活跃时间',
    dataIndex: 'lastSeenTime',
    key: 'lastSeenTime',
    width: 160,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '操作',
    key: 'action',
    width: 80,
    fixed: 'right' as const,
    align: 'center' as const,
  },
];

onMounted(() => {
  const q = route.query;
  if (q.appId && typeof q.appId === 'string') searchInput.value.appId = q.appId;
  if (q.platform && typeof q.platform === 'string')
    searchInput.value.platform = q.platform;
  if (q.appVersion && typeof q.appVersion === 'string')
    searchInput.value.appVersion = q.appVersion;
  if (q.channel && typeof q.channel === 'string')
    searchInput.value.channel = q.channel;

  loadData();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">设备列表</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          检索终端物理设备、查看首次与最近活跃、排查特定设备统计信息
        </p>
      </div>
      <AButton :loading="loading" size="small" @click="loadData">刷新</AButton>
    </div>

    <!-- Search Form Card -->
    <ACard :bordered="false" class="shadow-sm" size="small">
      <ARow :gutter="[12, 10]" align="middle">
        <ACol :lg="4" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.appId"
            allow-clear
            placeholder="AppId"
            size="small"
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
            placeholder="平台"
            size="small"
          >
            <ASelect.Option value="android">Android</ASelect.Option>
            <ASelect.Option value="ios">iOS</ASelect.Option>
            <ASelect.Option value="windows">Windows</ASelect.Option>
            <ASelect.Option value="macos">macOS</ASelect.Option>
            <ASelect.Option value="web">Web</ASelect.Option>
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
            <AButton :loading="loading" size="small" type="primary" @click="handleSearch">
              查询
            </AButton>
            <AButton size="small" @click="handleReset">重置</AButton>
          </div>
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
              详情
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>
  </div>
</template>
