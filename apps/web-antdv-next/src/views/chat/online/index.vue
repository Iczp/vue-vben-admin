<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ConnectionPoolDto, OnlineHostDto } from '#/api/chat';

import { onMounted, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Card,
  Input,
  InputNumber,
  message,
  Avatar,
  Modal,
  Select,
  Statistic,
  Tabs,
  Tag,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  clearAllOnlineConnectionsApi,
  getChatObjectApi,
  getChatObjectAvatarUrl,
  getLastOnlineApi,
  getOnlineConnectionsApi,
  getOnlineConnectionsByOwnerApi,
  getOnlineConnectionsByUserApi,
  getOnlineCountByOwnerApi,
  getOnlineCountByUserApi,
  getOnlineFriendsCountApi,
  getOnlineHostsApi,
  getOnlineTotalCountApi,
} from '#/api/chat';
import type { ChatObjectDto } from '#/api/chat';
import {
  getObjectTypeName,
  getObjectTypeColor,
} from '#/views/chat/chat-object/data';

import { useConnectionColumns, useHostColumns, useLastOnlineColumns } from './data';
import AbortModal from './modules/abort-modal.vue';
import DetailModal from './modules/detail-modal.vue';

// 当前活动的 Tab: 'hosts' | 'users' | 'owners' | 'all'
const activeTab = ref<'hosts' | 'users' | 'owners' | 'all'>('hosts');

// 全局统计数据
const totalOnlineCount = ref(0);
const totalHostsCount = ref(0);
const statsLoading = ref(false);

// 弹窗管理
const [AbortConnectionModal, abortModalApi] = useVbenModal({
  connectedComponent: AbortModal,
  destroyOnClose: true,
});

const [ConnectionDetailModal, detailModalApi] = useVbenModal({
  connectedComponent: DetailModal,
  destroyOnClose: true,
});

async function fetchStats() {
  try {
    statsLoading.value = true;
    const [count, hostsRes] = await Promise.all([
      getOnlineTotalCountApi().catch(() => 0),
      getOnlineHostsApi({ maxResultCount: 1 }).catch(() => ({
        items: [],
        totalCount: 0,
      })),
    ]);
    totalOnlineCount.value = count;
    totalHostsCount.value = hostsRes.totalCount || 0;
  } finally {
    statsLoading.value = false;
  }
}

function onShowDetail(row: ConnectionPoolDto) {
  detailModalApi.setData(row).open();
}

function onAbortSingle(row: ConnectionPoolDto) {
  abortModalApi
    .setData({
      connectionIds: [row.connectionId],
      reason: '管理员主动断开该连接',
    })
    .open();
}

function safeQuery(gridApi: any) {
  if (gridApi?.grid?.commitProxy) {
    gridApi.query();
  }
}

function refreshActiveGrid() {
  fetchStats();
  if (activeTab.value === 'hosts') {
    safeQuery(hostGridApi);
  } else if (activeTab.value === 'users') {
    safeQuery(userGridApi);
  } else if (activeTab.value === 'owners') {
    safeQuery(ownerGridApi);
    safeQuery(lastOnlineGridApi);
  } else if (activeTab.value === 'all') {
    safeQuery(allGridApi);
  }
}

function onTabChange(key: any) {
  (document.activeElement as HTMLElement)?.blur();
  setTimeout(() => {
    if (key === 'hosts') {
      safeQuery(hostGridApi);
    } else if (key === 'users' && searchUserId.value.trim()) {
      safeQuery(userGridApi);
    } else if (key === 'owners' && searchOwnerId.value) {
      safeQuery(ownerGridApi);
      safeQuery(lastOnlineGridApi);
    } else if (key === 'all') {
      safeQuery(allGridApi);
    }
  }, 60);
}

function onClearAllConnections(hosts?: string[]) {
  const isSingleHost = hosts && hosts.length === 1;
  const title = isSingleHost
    ? `确认清空主机【${hosts[0]}】的全部连接？`
    : '高危警告：确认清空所有主机的全部长连接？';
  const content = isSingleHost
    ? `该操作将强行中断所有连接到主机【${hosts[0]}】的客户端长连接！`
    : '此操作将强行断开当前系统所有集群节点上的长连接！请谨慎操作。';

  Modal.confirm({
    cancelText: '取消',
    content,
    okText: '确认执行',
    okType: 'danger',
    title,
    async onOk() {
      await clearAllOnlineConnectionsApi(hosts, '管理员指令清空连接');
      message.success('已清空指定连接');
      refreshActiveGrid();
    },
  });
}

// ==========================================
// 1. 主机视角 (Hosts View)
// ==========================================
const hostFilter = ref('');

function onHostActionClick({
  code,
  row,
}: {
  code: string;
  row: OnlineHostDto;
}) {
  if (code === 'view-connections') {
    (document.activeElement as HTMLElement)?.blur();
    allHostFilter.value = row.host;
    activeTab.value = 'all';
    setTimeout(() => {
      safeQuery(allGridApi);
    }, 100);
  } else if (code === 'clear-host') {
    onClearAllConnections([row.host]);
  }
}

const [HostGrid, hostGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useHostColumns(onHostActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50],
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

          const res = await getOnlineHostsApi({
            host: hostFilter.value.trim() || undefined,
            maxResultCount,
            skipCount,
            sorting,
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

// ==========================================
// 2. 用户视角 (User View)
// ==========================================
const searchUserId = ref('');
const userOnlineCount = ref<number | null>(null);

function onUserConnActionClick({
  code,
  row,
}: {
  code: string;
  row: ConnectionPoolDto;
}) {
  if (code === 'detail') {
    onShowDetail(row);
  } else if (code === 'abort') {
    onAbortSingle(row);
  }
}

const [UserGrid, userGridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onShowDetail(params.row as ConnectionPoolDto);
    },
  },
  gridOptions: {
    columns: useConnectionColumns(onUserConnActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!searchUserId.value.trim()) {
            return { items: [], totalCount: 0 };
          }
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;

          getOnlineCountByUserApi(searchUserId.value.trim())
            .then((count) => {
              userOnlineCount.value = count;
            })
            .catch(() => {
              userOnlineCount.value = 0;
            });

          return await getOnlineConnectionsByUserApi(searchUserId.value.trim(), {
            maxResultCount,
            skipCount,
          });
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

function onSearchUser() {
  if (!searchUserId.value.trim()) {
    message.warning('请输入要查询的用户 GUID');
    return;
  }
  userGridApi.query();
}

// ==========================================
// 3. 聊天对象视角 (ChatObject / Owner View)
const searchOwnerId = ref<number | undefined>(undefined);
const ownerOnlineCount = ref<number | null>(null);
const ownerFriendsCount = ref<number | null>(null);
const ownerChatObject = ref<ChatObjectDto | null>(null);

async function fetchOwnerChatObject(id: number) {
  try {
    ownerChatObject.value = await getChatObjectApi(id);
  } catch (err) {
    console.warn(`Failed to fetch owner chat object id=${id}`, err);
    ownerChatObject.value = null;
  }
}

function onOwnerConnActionClick({
  code,
  row,
}: {
  code: string;
  row: ConnectionPoolDto;
}) {
  if (code === 'detail') {
    onShowDetail(row);
  } else if (code === 'abort') {
    onAbortSingle(row);
  }
}

const [OwnerGrid, ownerGridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onShowDetail(params.row as ConnectionPoolDto);
    },
  },
  gridOptions: {
    columns: useConnectionColumns(onOwnerConnActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 15,
      pageSizes: [15, 30, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!searchOwnerId.value) {
            return { items: [], totalCount: 0 };
          }
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;

          getOnlineCountByOwnerApi(searchOwnerId.value)
            .then((count) => {
              ownerOnlineCount.value = count;
            })
            .catch(() => {
              ownerOnlineCount.value = 0;
            });

          getOnlineFriendsCountApi(searchOwnerId.value)
            .then((count) => {
              ownerFriendsCount.value = count;
            })
            .catch(() => {
              ownerFriendsCount.value = 0;
            });

          // 联动拉取最近在线记录
          lastOnlineGridApi.query();

          return await getOnlineConnectionsByOwnerApi(searchOwnerId.value, {
            maxResultCount,
            skipCount,
          });
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

const [LastOnlineGrid, lastOnlineGridApi] = useVbenVxeGrid({
  gridOptions: {
    columns: useLastOnlineColumns(),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 10,
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }) => {
          if (!searchOwnerId.value) {
            return { items: [], totalCount: 0 };
          }
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          return await getLastOnlineApi(searchOwnerId.value, {
            maxResultCount,
            skipCount,
          });
        },
      },
    },
  } as VxeTableGridOptions,
});

function onSearchOwner() {
  if (!searchOwnerId.value) {
    message.warning('请输入聊天对象 ID (OwnerId)');
    return;
  }
  fetchOwnerChatObject(searchOwnerId.value);
  ownerGridApi.query();
}

// ==========================================
// 4. 全局连接池明细 (All Connections)
// ==========================================
const allFilterText = ref('');
const allPlatformFilter = ref<string | undefined>(undefined);
const allHostFilter = ref<string | undefined>(undefined);

function onAllActionClick({
  code,
  row,
}: {
  code: string;
  row: ConnectionPoolDto;
}) {
  if (code === 'detail') {
    onShowDetail(row);
  } else if (code === 'abort') {
    onAbortSingle(row);
  }
}

function onAbortBatchAll() {
  const records = allGridApi.grid?.getCheckboxRecords() || [];
  if (records.length === 0) {
    message.warning('请勾选要强制断开的连接');
    return;
  }
  const connectionIds = records.map((r: ConnectionPoolDto) => r.connectionId);
  abortModalApi
    .setData({
      connectionIds,
      reason: '管理员批量断开连接',
    })
    .open();
}

const [AllGrid, allGridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onShowDetail(params.row as ConnectionPoolDto);
    },
  },
  gridOptions: {
    columns: useConnectionColumns(onAllActionClick),
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
            host: allHostFilter.value?.trim() || undefined,
            keyword: allFilterText.value.trim() || undefined,
            maxResultCount,
            platform: allPlatformFilter.value,
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

onMounted(() => {
  fetchStats();
});
</script>

<template>
  <Page auto-content-height>
    <AbortConnectionModal @success="refreshActiveGrid" />
    <ConnectionDetailModal />

    <!-- 顶部状态卡片 -->
    <div class="grid grid-cols-1 gap-3 md:grid-cols-3 mb-3">
      <Card size="small" class="shadow-sm">
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

      <Card size="small" class="shadow-sm">
        <Statistic
          title="活跃集群主机节点数 (Cluster Hosts)"
          :value="totalHostsCount"
          :value-style="{ color: '#3b82f6', fontWeight: 600 }"
        >
          <template #suffix>
            <span class="text-xs text-muted-foreground font-normal">台服务器</span>
          </template>
        </Statistic>
      </Card>

      <Card size="small" class="shadow-sm flex items-center justify-between">
        <div>
          <div class="text-xs text-muted-foreground mb-1">全局运维操作</div>
          <div class="text-xs text-red-500 font-medium">清空所有节点长连接</div>
        </div>
        <Button danger type="primary" size="small" @click="() => onClearAllConnections()">
          清空所有连接
        </Button>
      </Card>
    </div>

    <!-- 视角分类切换 Tabs -->
    <Card
      size="small"
      class="flex-1 flex flex-col h-full shadow-sm overflow-hidden"
      :styles="{ body: { padding: '12px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' } }"
    >
      <Tabs
        v-model:activeKey="activeTab"
        type="card"
        class="h-full flex flex-col"
        @change="onTabChange"
      >
        <!-- 1. 主机视角 -->
        <Tabs.TabPane key="hosts" tab="🖥️ 主机维度 (Hosts)">
          <div class="flex flex-col h-full overflow-hidden">
            <HostGrid>
              <template #toolbar-tools>
                <div class="flex items-center gap-2 mr-2">
                  <Input.Search
                    v-model:value="hostFilter"
                    placeholder="搜索主机名称..."
                    allow-clear
                    class="w-56"
                    size="small"
                    @search="() => hostGridApi.query()"
                  />
                  <Button size="small" @click="hostGridApi.query">刷新主机</Button>
                </div>
              </template>
            </HostGrid>
          </div>
        </Tabs.TabPane>

        <!-- 2. 用户视角 -->
        <Tabs.TabPane key="users" tab="👤 用户维度 (Users)">
          <div class="flex flex-col h-full overflow-hidden">
            <UserGrid>
              <template #toolbar-tools>
                <div class="flex items-center gap-2 mr-2 flex-wrap">
                  <Input.Search
                    v-model:value="searchUserId"
                    placeholder="输入用户 GUID (UserId)..."
                    allow-clear
                    class="w-80"
                    size="small"
                    @search="onSearchUser"
                  />
                  <Button type="primary" size="small" @click="onSearchUser">
                    查询用户连接
                  </Button>
                  <Tag v-if="userOnlineCount !== null" color="blue" class="ml-2">
                    该用户当前在线连接: <strong>{{ userOnlineCount }}</strong>
                  </Tag>
                </div>
              </template>
            </UserGrid>
          </div>
        </Tabs.TabPane>

        <!-- 3. 聊天对象视角 -->
        <Tabs.TabPane key="owners" tab="💬 聊天对象维度 (ChatObjects)">
          <div class="flex flex-col h-full overflow-hidden">
            <div class="flex gap-2 mb-2 items-center shrink-0 flex-wrap">
              <InputNumber
                v-model:value="searchOwnerId"
                placeholder="输入聊天对象 ID (OwnerId)..."
                class="w-60"
                size="small"
                @press-enter="onSearchOwner"
              />
              <Button type="primary" size="small" @click="onSearchOwner">
                查询聊天对象
              </Button>

              <!-- 查询到的聊天对象头像与基础信息 -->
              <div
                v-if="ownerChatObject"
                class="flex items-center gap-2 p-1 px-2.5 rounded-md bg-muted/40 border border-border shrink-0 ml-1"
              >
                <Avatar
                  :src="getChatObjectAvatarUrl(ownerChatObject.id, ownerChatObject.portrait, ownerChatObject.thumbnail)"
                  shape="square"
                  :size="26"
                  class="rounded"
                  :style="{ backgroundColor: '#3b82f6' }"
                >
                  {{ (ownerChatObject.displayName || ownerChatObject.name || '客').slice(0, 1) }}
                </Avatar>
                <span class="text-xs font-semibold text-foreground max-w-[140px] truncate">
                  {{ ownerChatObject.displayName || ownerChatObject.name }}
                </span>
                <Tag :color="getObjectTypeColor(ownerChatObject.objectType)" class="text-[10px] px-1 py-0 mr-0">
                  {{ getObjectTypeName(ownerChatObject.objectType) }}
                </Tag>
              </div>

              <Tag v-if="ownerOnlineCount !== null" color="purple" class="ml-1">
                在线连接数: <strong>{{ ownerOnlineCount }}</strong>
              </Tag>
              <Tag v-if="ownerFriendsCount !== null" color="cyan">
                在线好友数: <strong>{{ ownerFriendsCount }}</strong>
              </Tag>
            </div>

            <!-- 拆分为当前连接列表与最近在线记录 -->
            <div class="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 overflow-hidden">
              <div class="lg:col-span-2 flex flex-col h-full overflow-hidden">
                <div class="text-xs font-semibold mb-1 text-muted-foreground">当前在线连接列表</div>
                <div class="flex-1 overflow-hidden">
                  <OwnerGrid />
                </div>
              </div>

              <div class="flex flex-col h-full overflow-hidden border-l pl-2">
                <div class="text-xs font-semibold mb-1 text-muted-foreground">最近在线记录 (Last Online)</div>
                <div class="flex-1 overflow-hidden">
                  <LastOnlineGrid />
                </div>
              </div>
            </div>
          </div>
        </Tabs.TabPane>

        <!-- 4. 全局连接池 -->
        <Tabs.TabPane key="all" tab="🌐 全局连接池 (All Connections)">
          <div class="flex flex-col h-full overflow-hidden">
            <AllGrid>
              <template #toolbar-tools>
                <div class="flex items-center gap-2 mr-2 flex-wrap">
                  <Input.Search
                    v-model:value="allFilterText"
                    placeholder="搜索连接ID / 用户名 / IP..."
                    allow-clear
                    class="w-60"
                    size="small"
                    @search="() => allGridApi.query()"
                  />

                  <Input
                    v-model:value="allHostFilter"
                    placeholder="主机过滤"
                    allow-clear
                    class="w-36"
                    size="small"
                    @press-enter="() => allGridApi.query()"
                  />

                  <Select
                    v-model:value="allPlatformFilter"
                    placeholder="平台"
                    allow-clear
                    class="w-28"
                    size="small"
                    :options="[
                      { label: 'Android', value: 'android' },
                      { label: 'iOS', value: 'ios' },
                      { label: 'Windows', value: 'windows' },
                      { label: 'macOS', value: 'macos' },
                      { label: 'Web', value: 'web' },
                    ]"
                    @change="allGridApi.query"
                  />

                  <Button danger size="small" @click="onAbortBatchAll">
                    批量强制断开
                  </Button>
                </div>
              </template>
            </AllGrid>
          </div>
        </Tabs.TabPane>
      </Tabs>
    </Card>
  </Page>
</template>
