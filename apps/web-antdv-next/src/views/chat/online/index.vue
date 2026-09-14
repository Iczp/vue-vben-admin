<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ConnectionPoolDto, OnlineHostDto } from '#/api/chat';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  message,
  Modal,
  Select,
  Space,
  Statistic,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  clearAllOnlineConnectionsApi,
  getOnlineConnectionsApi,
  getOnlineHostsApi,
  getOnlineTotalCountApi,
} from '#/api/chat';

import { useColumns } from './data';
import AbortModal from './modules/abort-modal.vue';

const filterText = ref('');
const platformFilter = ref<string | undefined>(undefined);
const totalOnlineCount = ref(0);
const hostsList = ref<OnlineHostDto[]>([]);
const statsLoading = ref(false);

const [AbortConnectionModal, abortModalApi] = useVbenModal({
  connectedComponent: AbortModal,
  destroyOnClose: true,
});

async function fetchStats() {
  try {
    statsLoading.value = true;
    const [count, hostsRes] = await Promise.all([
      getOnlineTotalCountApi().catch(() => 0),
      getOnlineHostsApi({ maxResultCount: 20 }).catch(() => ({
        items: [],
        totalCount: 0,
      })),
    ]);
    totalOnlineCount.value = count;
    hostsList.value = hostsRes.items || [];
  } finally {
    statsLoading.value = false;
  }
}

function onAbortSingle(row: ConnectionPoolDto) {
  abortModalApi
    .setData({
      connectionIds: [row.connectionId],
      reason: '管理员主动断开该连接',
    })
    .open();
}

function onAbortBatch() {
  const selectRecords = gridApi.grid?.getCheckboxRecords() || [];
  if (selectRecords.length === 0) {
    message.warning('请先勾选需要断开的连接');
    return;
  }
  const connectionIds = selectRecords.map(
    (item: ConnectionPoolDto) => item.connectionId,
  );
  abortModalApi
    .setData({
      connectionIds,
      reason: '管理员批量断开连接',
    })
    .open();
}

function onClearAll() {
  let clearReason = '系统维护，清空所有在线连接';
  Modal.confirm({
    cancelText: '取消',
    content: '此操作将强行断开当前所有用户的 SignalR 长连接！确定要清空吗？',
    okText: '确认清空所有',
    okType: 'danger',
    title: '高危警告：清空所有在线连接',
    async onOk() {
      await clearAllOnlineConnectionsApi(clearReason);
      message.success('已触发清空所有在线连接指令');
      refreshGrid();
      fetchStats();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ConnectionPoolDto;
}) {
  if (code === 'abort') {
    onAbortSingle(row);
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50, 100],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page, sorts }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          let sorting: string | undefined;
          if (sorts && sorts.length > 0 && sorts[0]) {
            sorting = `${sorts[0].field} ${sorts[0].order}`;
          }

          const res = await getOnlineConnectionsApi({
            keyword: filterText.value || undefined,
            maxResultCount,
            platform: platformFilter.value,
            skipCount,
            sorting: sorting || 'activeTime desc',
          });
          fetchStats();
          return res;
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <Page auto-content-height>
    <AbortConnectionModal @success="refreshGrid" />

    <!-- 顶部状态统计卡片 -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-3 mb-3">
      <Card size="small">
        <Statistic
          title="当前在线总连接数 (Total Connections)"
          :value="totalOnlineCount"
          :value-style="{ color: '#10b981', fontWeight: 600 }"
        >
          <template #suffix>
            <span class="text-xs text-muted-foreground font-normal">个活跃通道</span>
          </template>
        </Statistic>
      </Card>

      <Card size="small" class="md:col-span-2">
        <div class="flex items-center justify-between mb-1">
          <span class="text-xs font-medium text-muted-foreground">活跃集群宿主 (Online Hosts)</span>
          <Button type="link" size="small" :loading="statsLoading" @click="fetchStats">刷新节点</Button>
        </div>
        <div class="flex flex-wrap gap-2 items-center min-h-[32px]">
          <template v-if="hostsList.length > 0">
            <Tag
              v-for="h in hostsList"
              :key="h.host"
              color="blue"
              class="px-2.5 py-1 text-xs"
            >
              <strong>{{ h.host }}</strong>: {{ h.connectionCount }} 连接 ({{ h.ipAddress || '内网' }})
            </Tag>
          </template>
          <span v-else class="text-xs text-muted-foreground">暂无独立节点数据</span>
        </div>
      </Card>
    </div>

    <!-- 连接列表表格 -->
    <Grid>
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">即时通讯管理</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">在线连接池 (Online Cache)</span>
        </div>
      </template>

      <template #top>
        <div class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1">
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              placeholder="搜索连接ID / 用户名 / IP..."
              allow-clear
              class="w-64"
              @search="refreshGrid"
            />
            <Select
              v-model:value="platformFilter"
              placeholder="平台筛选"
              allow-clear
              class="w-32"
              :options="[
                { label: 'Android', value: 'android' },
                { label: 'iOS', value: 'ios' },
                { label: 'Windows', value: 'windows' },
                { label: 'macOS', value: 'macos' },
                { label: 'Web', value: 'web' },
              ]"
              @change="refreshGrid"
            />
          </div>

          <Space>
            <Button danger @click="onAbortBatch">
              批量强制断开
            </Button>
            <Button type="primary" danger @click="onClearAll">
              清空所有连接
            </Button>
          </Space>
        </div>
      </template>
    </Grid>
  </Page>
</template>
