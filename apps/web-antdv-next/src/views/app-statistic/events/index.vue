<script lang="ts" setup>
import type { EventDto, GetEventsInput } from '#/api/app-statistic/types';

import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  Descriptions as ADescriptions,
  Drawer as ADrawer,
  Input as AInput,
  Row as ARow,
  Select as ASelect,
  Tag as ATag,
  DatePicker,
  message,
} from 'antdv-next';
import { SelectOption as ASelectOption } from 'antdv-next';
import { DescriptionsItem as ADescriptionsItem } from 'antdv-next';
import dayjs, { type Dayjs } from 'dayjs';

import { getEventsApi } from '#/api/app-statistic/event';
import { $t } from '#/locales';

import StatisticError from '../components/StatisticError.vue';
import ATable from '../components/StatisticTable.vue';

const router = useRouter();
const route = useRoute();
const loading = ref(false);
const failed = ref(false);
let requestId = 0;
const eventList = ref<EventDto[]>([]);
const totalCount = ref(0);

const searchInput = ref<GetEventsInput>({
  appId: undefined,
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

const dateRange = ref<[Dayjs, Dayjs] | undefined>([
  dayjs().subtract(6, 'day').startOf('day'),
  dayjs(),
]);

const currentPagination = ref({
  current: 1,
  pageSize: 20,
  total: 0,
  showSizeChanger: true,
  pageSizeOptions: ['20', '50', '100'],
  showQuickJumper: true,
  showTotal: (total: number) =>
    $t('appStatistic.eventsTotal', { count: total.toLocaleString() }),
});

// Detail Drawer
const drawerVisible = ref(false);
const selectedEvent = ref<EventDto | null>(null);

const searchFields = [
  'appId',
  'eventName',
  'userId',
  'deviceId',
  'sessionId',
  'page',
  'platform',
  'appVersion',
  'channel',
] as const;
function syncSearchUrl() {
  const params: Record<string, string> = {};
  for (const key of searchFields) {
    const value = searchInput.value[key];
    if (value) params[key] = value;
  }
  if (dateRange.value) {
    params.startTime = dateRange.value[0].toISOString();
    params.endTime = dateRange.value[1].toISOString();
  }
  router.replace({ query: params });
}

async function loadData() {
  const currentRequest = ++requestId;
  loading.value = true;
  failed.value = false;
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
    if (currentRequest !== requestId) return;
    eventList.value = res.items;
    totalCount.value = res.totalCount;
    currentPagination.value.total = res.totalCount;
  } catch {
    if (currentRequest === requestId) failed.value = true;
  } finally {
    if (currentRequest === requestId) loading.value = false;
  }
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

function openDrawer(record: EventDto) {
  selectedEvent.value = record;
  drawerVisible.value = true;
}

function formatJson(jsonStr?: string): string {
  if (!jsonStr) return $t('appStatistic.text124');
  try {
    const obj = JSON.parse(jsonStr);
    return JSON.stringify(obj, null, 2);
  } catch {
    return jsonStr;
  }
}

async function copyJson(text?: string) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    message.success($t('appStatistic.text125'));
  } catch {
    message.error($t('appStatistic.text126'));
  }
}

const tableColumns = [
  {
    title: $t('appStatistic.text099'),
    dataIndex: 'eventTime',
    key: 'eventTime',
    width: 170,
    render: (text: string) =>
      text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-',
  },
  {
    title: $t('appStatistic.text100'),
    dataIndex: 'eventName',
    key: 'eventName',
    width: 160,
  },
  {
    title: $t('appStatistic.text015'),
    dataIndex: 'platform',
    key: 'platform',
    width: 90,
  },
  {
    title: $t('appStatistic.text017'),
    dataIndex: 'appVersion',
    key: 'appVersion',
    width: 90,
  },
  {
    title: $t('appStatistic.text101'),
    dataIndex: 'page',
    key: 'page',
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text127'),
    dataIndex: 'userId',
    key: 'userId',
    width: 140,
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text128'),
    dataIndex: 'deviceId',
    key: 'deviceId',
    width: 140,
    ellipsis: true,
  },
  {
    title: $t('appStatistic.text071'),
    key: 'action',
    width: 90,
    align: 'center' as const,
  },
];

onMounted(() => {
  for (const key of searchFields) {
    const value = route.query[key];
    if (typeof value === 'string') searchInput.value[key] = value;
  }
  const start = route.query.startTime;
  const end = route.query.endTime;
  if (
    typeof start === 'string' &&
    typeof end === 'string' &&
    dayjs(start).isValid() &&
    dayjs(end).isValid()
  )
    dateRange.value = [dayjs(start), dayjs(end)];
  loadData();
});
const ARangePicker = DatePicker.RangePicker;
</script>

<template>
  <div class="p-4 space-y-4">
    <StatisticError v-if="failed" @retry="loadData" />
    <!-- Header -->
    <div class="flex flex-wrap items-center justify-between gap-2">
      <div>
        <h2 class="text-xl font-bold tracking-tight text-foreground">
          {{ $t('appStatistic.text010') }}
        </h2>
        <p class="text-xs text-muted-foreground mt-0.5">
          {{ $t('appStatistic.text183') }}
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
            :placeholder="$t('appStatistic.text129')"
            size="small"
            @press-enter="handleSearch"
          />
        </ACol>

        <ACol :lg="5" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.page"
            allow-clear
            :placeholder="$t('appStatistic.text130')"
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

        <ACol :lg="6" :md="12" :sm="24" :xs="24">
          <ARangePicker
            v-model:value="dateRange"
            :placeholder="[
              $t('appStatistic.text131'),
              $t('appStatistic.text132'),
            ]"
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
            v-model:value="searchInput.deviceId"
            allow-clear
            placeholder="Device ID"
            @press-enter="handleSearch"
          />
        </ACol>
        <ACol :lg="6" :md="6" :sm="12" :xs="24">
          <AInput
            v-model:value="searchInput.channel"
            allow-clear
            :placeholder="$t('appStatistic.text018')"
            @press-enter="handleSearch"
          />
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
              {{ $t('appStatistic.text014') }}
            </AButton>
          </template>
        </template>
      </ATable>
    </ACard>

    <!-- Event Detail Drawer -->
    <ADrawer
      v-model:open="drawerVisible"
      :width="640"
      :title="$t('appStatistic.text133')"
    >
      <div v-if="selectedEvent" class="space-y-4">
        <ADescriptions :column="2" bordered size="small">
          <ADescriptionsItem label="Event ID" :span="2">
            <span class="font-mono text-xs">{{ selectedEvent.eventId }}</span>
          </ADescriptionsItem>

          <ADescriptionsItem label="App ID">
            {{ selectedEvent.appId }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text100')">
            <ATag color="blue">{{ selectedEvent.eventName }}</ATag>
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text134')">
            {{
              dayjs(selectedEvent.eventTime).format('YYYY-MM-DD HH:mm:ss.SSS')
            }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text135')">
            {{
              dayjs(selectedEvent.receivedTime).format(
                'YYYY-MM-DD HH:mm:ss.SSS',
              )
            }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text136')">
            {{ selectedEvent.page || '-' }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text137')">
            {{ selectedEvent.osVersion || '-' }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text015')">
            {{ selectedEvent.platform || '-' }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text102')">
            {{ selectedEvent.appVersion || '-' }}
          </ADescriptionsItem>

          <ADescriptionsItem :label="$t('appStatistic.text018')">
            {{ selectedEvent.channel || '-' }}
          </ADescriptionsItem>

          <ADescriptionsItem label="Session ID" :span="2">
            <span class="font-mono text-xs">{{
              selectedEvent.sessionId || '-'
            }}</span>
          </ADescriptionsItem>

          <ADescriptionsItem label="User ID" :span="2">
            <span class="font-mono text-xs">{{
              selectedEvent.userId || '-'
            }}</span>
          </ADescriptionsItem>

          <ADescriptionsItem label="Device ID" :span="2">
            <span class="font-mono text-xs">{{
              selectedEvent.deviceId || '-'
            }}</span>
          </ADescriptionsItem>
        </ADescriptions>

        <!-- Properties JSON Viewer -->
        <div>
          <div class="flex items-center justify-between mb-2">
            <span class="font-medium text-xs text-muted-foreground">{{
              $t('appStatistic.text138')
            }}</span>
            <AButton
              v-if="selectedEvent.properties"
              size="small"
              type="dashed"
              @click="copyJson(selectedEvent.properties)"
            >
              {{ $t('appStatistic.text139') }}
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
