<script lang="ts" setup>
import { onMounted, ref } from 'vue';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Descriptions as ADescriptions,
  Drawer as ADrawer,
  Input as AInput,
  RangePicker as ARangePicker,
  Row as ARow,
  Select as ASelect,
  Table as ATable,
  Tag as ATag,
  message,
} from 'ant-design-vue';
import dayjs, { type Dayjs } from 'dayjs';

import { getEventsApi } from '#/api/app-statistic/event';
import type { EventDto, GetEventsInput } from '#/api/app-statistic/types';

const loading = ref(false);
const eventList = ref<EventDto[]>([]);
const totalCount = ref(0);

const searchInput = ref<GetEventsInput>({
  appId: 'default',
  eventName: undefined,
  userId: undefined,
  deviceId: undefined,
  sessionId: undefined,
  page: undefined,
  platform: undefined,
  appVersion: undefined,
  channel: undefined,
  skipCount: 0,
  maxResultCount: 20,
  sorting: 'EventTime DESC',
});

const dateRange = ref<[Dayjs, Dayjs] | undefined>(undefined);

const currentPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number) => `共 ${total.toLocaleString()} 条事件日志`,
});

// Detail Drawer
const drawerVisible = ref(false);
const selectedEvent = ref<EventDto | null>(null);

async function loadData() {
  loading.value = true;
  try {
    const params: GetEventsInput = {
      ...searchInput.value,
      skipCount:
        (currentPagination.value.current - 1) *
        currentPagination.value.pageSize,
      maxResultCount: currentPagination.value.pageSize,
    };

    if (dateRange.value && dateRange.value[0] && dateRange.value[1]) {
      params.startTime = dateRange.value[0].toISOString();
      params.endTime = dateRange.value[1].toISOString();
    } else {
      params.startTime = undefined;
      params.endTime = undefined;
    }

    const res = await getEventsApi(params);
    eventList.value = res.items;
    totalCount.value = res.totalCount;
    currentPagination.value.total = res.totalCount;
  } catch (error) {
    console.error('Failed to load events data', error);
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
    eventName: undefined,
    userId: undefined,
    deviceId: undefined,
    sessionId: undefined,
    page: undefined,
    platform: undefined,
    appVersion: undefined,
    channel: undefined,
    skipCount: 0,
    maxResultCount: 20,
    sorting: 'EventTime DESC',
  };
  dateRange.value = undefined;
  handleSearch();
}

function openDrawer(record: any) {
  selectedEvent.value = record;
  drawerVisible.value = true;
}

function formatJson(jsonStr?: string): string {
  if (!jsonStr) return '无附加属性';
  try {
    const obj = JSON.parse(jsonStr);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonStr;
  }
}

function copyJson(text?: string) {
  if (!text) return;
  navigator.clipboard.writeText(text);
  message.success('已复制到剪贴板');
}

const tableColumns = [
  {
    title: '事件时间',
    dataIndex: 'eventTime',
    key: 'eventTime',
    width: 170,
    customRender: ({ text }: { text: string }) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: '事件名称',
    dataIndex: 'eventName',
    key: 'eventName',
    width: 160,
  },
  {
    title: '平台',
    dataIndex: 'platform',
    key: 'platform',
    width: 90,
  },
  {
    title: '版本',
    dataIndex: 'appVersion',
    key: 'appVersion',
    width: 90,
  },
  {
    title: '页面',
    dataIndex: 'page',
    key: 'page',
    ellipsis: true,
  },
  {
    title: '用户 ID',
    dataIndex: 'userId',
    key: 'userId',
    width: 140,
    ellipsis: true,
  },
  {
    title: '设备 ID',
    dataIndex: 'deviceId',
    key: 'deviceId',
    width: 140,
    ellipsis: true,
  },
  {
    title: '操作',
    key: 'action',
    width: 90,
    align: 'center' as const,
  },
];

onMounted(() => {
  loadData();
});
</script>

<template>
  <div class="p-4 space-y-4">
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">事件分析</h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          实时检索应用埋点事件、追踪异常、调试客户端上报与数据核对
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

        <ACol :lg="5" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.eventName"
            allow-clear
            placeholder="事件名 (如 app_launch)"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="5" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.page"
            allow-clear
            placeholder="页面 PageKey"
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

        <ACol :lg="6" :md="12" :sm="24" :xs="24">
          <ARangePicker
            v-model:value="dateRange"
            :placeholder="['开始时间', '结束时间']"
            class="w-full"
            format="YYYY-MM-DD HH:mm:ss"
            show-time
            size="small"
          />
        </ACol>

        <ACol :lg="6" :md="8" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.userId"
            allow-clear
            placeholder="UserId (GUID)"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="6" :md="8" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.sessionId"
            allow-clear
            placeholder="SessionId"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="4" :md="8" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.appVersion"
            allow-clear
            placeholder="AppVersion"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="8" :md="24" :sm="24" :xs="24">
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
        :data-source="eventList"
        :loading="loading"
        :pagination="currentPagination"
        row-key="id"
        size="small"
        @change="handleTableChange"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.dataIndex === 'eventName'">
            <ATag color="blue">{{ record.eventName }}</ATag>
          </template>

          <template v-else-if="column.key === 'action'">
            <AButton size="small" type="link" @click="openDrawer(record)">
              详情
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>

    <!-- Event Detail Drawer -->
    <ADrawer
      v-model:open="drawerVisible"
      :width="640"
      title="事件日志详情"
    >
      <div v-if="selectedEvent" class="space-y-4">
        <ADescriptions :column="2" bordered size="small">
          <ADescriptions.Item label="Event ID" :span="2">
            <span class="font-mono text-xs">{{ selectedEvent.eventId }}</span>
          </ADescriptions.Item>

          <ADescriptions.Item label="App ID">
            {{ selectedEvent.appId }}
          </ADescriptions.Item>

          <ADescriptions.Item label="事件名称">
            <ATag color="blue">{{ selectedEvent.eventName }}</ATag>
          </ADescriptions.Item>

          <ADescriptions.Item label="客户端时间">
            {{ dayjs(selectedEvent.eventTime).format('YYYY-MM-DD HH:mm:ss.SSS') }}
          </ADescriptions.Item>

          <ADescriptions.Item label="服务端接收时间">
            {{ dayjs(selectedEvent.receivedTime).format('YYYY-MM-DD HH:mm:ss.SSS') }}
          </ADescriptions.Item>

          <ADescriptions.Item label="页面 (Page)">
            {{ selectedEvent.page || '-' }}
          </ADescriptions.Item>

          <ADescriptions.Item label="操作系统版本">
            {{ selectedEvent.osVersion || '-' }}
          </ADescriptions.Item>

          <ADescriptions.Item label="平台">
            {{ selectedEvent.platform || '-' }}
          </ADescriptions.Item>

          <ADescriptions.Item label="应用版本">
            {{ selectedEvent.appVersion || '-' }}
          </ADescriptions.Item>

          <ADescriptions.Item label="渠道">
            {{ selectedEvent.channel || '-' }}
          </ADescriptions.Item>

          <ADescriptions.Item label="Session ID" :span="2">
            <span class="font-mono text-xs">{{ selectedEvent.sessionId || '-' }}</span>
          </ADescriptions.Item>

          <ADescriptions.Item label="User ID" :span="2">
            <span class="font-mono text-xs">{{ selectedEvent.userId || '-' }}</span>
          </ADescriptions.Item>

          <ADescriptions.Item label="Device ID" :span="2">
            <span class="font-mono text-xs">{{ selectedEvent.deviceId || '-' }}</span>
          </ADescriptions.Item>
        </ADescriptions>

        <!-- Properties JSON Viewer -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-xs text-muted-foreground">事件附加属性 (Properties JSON):</span>
            <AButton
              v-if="selectedEvent.properties"
              size="small"
              type="dashed"
              @click="copyJson(selectedEvent.properties)"
            >
              复制 JSON
            </AButton>
          </div>
          <pre
            class="bg-muted/50 p-3 rounded text-xs font-mono overflow-auto max-h-96 border border-border"
          >{{ formatJson(selectedEvent.properties) }}</pre>
        </div>
      </div>
    </ADrawer>
  </div>
</template>
