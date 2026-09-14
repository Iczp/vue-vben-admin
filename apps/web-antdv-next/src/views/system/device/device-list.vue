import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DeviceDto, DeviceGroupDto } from '#/api/device';

import { computed, nextTick, onMounted, ref, watch } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { useDebounceFn, useVirtualList } from '@vueuse/core';
import {
  Badge,
  Button,
  Card,
  Empty,
  Input,
  message,
  Modal,
  Select,
  Spin,
  Tooltip,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDeviceApi,
  deleteDeviceGroupApi,
  deleteDevicesManyApi,
  getDeviceGroupListApi,
  getDevicesApi,
} from '#/api/device';
import { $t } from '#/locales';

import { useColumns } from './data';
import DeviceModal from './modules/device-modal.vue';
import GroupModal from './modules/group-modal.vue';
import SetGroupsModal from './modules/set-groups-modal.vue';

// ==================== 1. 设备分组 (DeviceGroup) 分页与虚拟列表 ====================
const PAGE_SIZE = 30;
const groupLoading = ref(false);
const groupLoadingMore = ref(false);
const groupList = ref<DeviceGroupDto[]>([]);
const totalGroups = ref(0);
const totalAllDevices = ref(0);
const selectedGroupId = ref<string | undefined>(undefined);
const groupKeyword = ref('');

const hasMoreGroups = computed(
  () => groupList.value.length < totalGroups.value,
);

const currentGroup = computed(() =>
  groupList.value.find((g) => g.id === selectedGroupId.value),
);

// 虚拟列表 hook: 单项高度约 48px，预加载 5 项
const {
  containerProps,
  list: virtualGroups,
  wrapperProps,
} = useVirtualList(groupList, {
  itemHeight: 52,
  overscan: 5,
});

// 设备分组弹窗
const [GroupModalComp, groupModalApi] = useVbenModal({
  connectedComponent: GroupModal,
  destroyOnClose: true,
});

// 加载第 1 页分组
async function loadGroups(isInitial = false) {
  try {
    if (isInitial) {
      groupLoading.value = true;
    }
    const res = await getDeviceGroupListApi({
      keyword: groupKeyword.value.trim() || undefined,
      maxResultCount: PAGE_SIZE,
      skipCount: 0,
    });
    groupList.value = res.items || [];
    totalGroups.value = res.totalCount || 0;
  } catch (error) {
    console.error('获取设备分组失败', error);
  } finally {
    groupLoading.value = false;
  }
}

// 分页加载下一页
async function loadMoreGroups() {
  if (groupLoading.value || groupLoadingMore.value || !hasMoreGroups.value)
    return;

  try {
    groupLoadingMore.value = true;
    const res = await getDeviceGroupListApi({
      keyword: groupKeyword.value.trim() || undefined,
      maxResultCount: PAGE_SIZE,
      skipCount: groupList.value.length,
    });
    const newItems = res.items || [];
    groupList.value = [...groupList.value, ...newItems];
    totalGroups.value = res.totalCount || groupList.value.length;
  } catch (error) {
    console.error('加载更多设备分组失败', error);
  } finally {
    groupLoadingMore.value = false;
  }
}

// 虚拟滚动容器触底检测
function onContainerScroll(e: Event) {
  const target = e.target as HTMLElement;
  if (!target) return;
  const { clientHeight, scrollHeight, scrollTop } = target;
  if (scrollHeight - scrollTop - clientHeight < 60) {
    loadMoreGroups();
  }
}

// 搜索防抖
const onSearchChange = useDebounceFn(() => {
  loadGroups();
}, 300);

watch(groupKeyword, () => {
  onSearchChange();
});

function onSelectGroup(groupId?: string) {
  selectedGroupId.value = groupId;
  refreshGrid();
}

function onCreateGroup() {
  groupModalApi.setData(null).open();
}

function onEditGroup(group: DeviceGroupDto) {
  groupModalApi.setData(group).open();
}

function onDeleteGroup(group: DeviceGroupDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除设备分组【${group.name}】吗？删除后该分组下的设备将移出本分组。`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    title: '删除设备分组',
    async onOk() {
      await deleteDeviceGroupApi(group.id);
      message.success('设备分组已删除');
      if (selectedGroupId.value === group.id) {
        selectedGroupId.value = undefined;
      }
      loadGroups();
      refreshGrid();
    },
  });
}

// ==================== 2. 设备管理 (Device) ====================
const filterText = ref('');
const platformFilter = ref<string | undefined>(undefined);
const isEnabledFilter = ref<string | undefined>(undefined);

// 设备编辑弹窗
const [DeviceFormModal, deviceFormModalApi] = useVbenModal({
  connectedComponent: DeviceModal,
  destroyOnClose: true,
});

// 为设备设置分组弹窗
const [SetGroupsModalComp, setGroupsModalApi] = useVbenModal({
  connectedComponent: SetGroupsModal,
  destroyOnClose: true,
});

function onEdit(row: DeviceDto) {
  deviceFormModalApi.setData(row).open();
}

function onSetGroups(row: DeviceDto) {
  setGroupsModalApi.setData(row).open();
}

function onDelete(row: DeviceDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要强制将设备【${row.name || row.deviceId}】下线吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteDeviceApi(row.id);
      message.success('设备已强制下线');
      loadGroups();
      refreshGrid();
    },
  });
}

function onBatchDelete() {
  const records = gridApi.grid?.getCheckboxRecords() || [];
  if (records.length === 0) {
    message.warning('请勾选要下线的设备');
    return;
  }

  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要批量下线选中的 ${records.length} 台设备吗？`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      const ids = records.map((r: DeviceDto) => r.id);
      await deleteDevicesManyApi(ids);
      message.success(`已成功批量下线 ${records.length} 台设备`);
      loadGroups();
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: DeviceDto;
}) {
  switch (code) {
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'set-groups': {
      onSetGroups(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as DeviceDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
    height: 'auto',
    keepSource: true,
    pagerConfig: {
      autoHidden: false,
      enabled: true,
      pageSize: 10,
      pageSizes: [10, 20, 50, 100],
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

          const res = await getDevicesApi({
            deviceGroupId: selectedGroupId.value,
            isEnabled:
              isEnabledFilter.value === undefined
                ? undefined
                : isEnabledFilter.value === 'true',
            keyword: filterText.value || undefined,
            maxResultCount,
            platform: platformFilter.value,
            skipCount,
            sorting: sorting || 'lastActiveTime desc',
          });

          if (selectedGroupId.value === undefined && !filterText.value) {
            totalAllDevices.value = res.totalCount || 0;
          }

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
  nextTick(() => {
    gridApi.query();
  });
}

function onGroupSaved() {
  loadGroups();
  refreshGrid();
}

function onDeviceSaved() {
  loadGroups();
  refreshGrid();
}

onMounted(() => {
  loadGroups(true);
});
</script>

<template>
  <Page auto-content-height>
    <GroupModalComp @success="onGroupSaved" />
    <DeviceFormModal @success="onDeviceSaved" />
    <SetGroupsModalComp @success="onDeviceSaved" />

    <div class="flex h-full gap-3 overflow-hidden p-1">
      <!-- 左侧：设备分组卡片列表 -->
      <Card
        size="small"
        class="w-72 shrink-0 flex flex-col h-full shadow-sm border-border"
        :styles="{
          body: {
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            overflow: 'hidden',
          },
        }"
      >
        <div class="flex items-center justify-between mb-2 shrink-0">
          <span class="font-bold text-base flex items-center gap-1.5">
            设备分组
          </span>
          <Button size="small" type="primary" @click="onCreateGroup">
            + 新建分组
          </Button>
        </div>

        <div class="mb-2 shrink-0">
          <Input.Search
            v-model:value="groupKeyword"
            placeholder="搜索分组名称..."
            size="small"
            allow-clear
            @search="() => loadGroups(true)"
          />
        </div>

        <!-- 全部设备（常驻置顶） -->
        <div
          class="shrink-0 flex items-center justify-between px-3 py-2 rounded cursor-pointer transition-colors text-sm mb-1.5"
          :class="
            selectedGroupId === undefined
              ? 'bg-primary/10 text-primary font-bold'
              : 'hover:bg-muted text-foreground'
          "
          @click="onSelectGroup(undefined)"
        >
          <span>全部设备</span>
          <Badge
            :count="totalAllDevices || groupList.reduce((acc, cur) => acc + (cur.deviceCount || 0), 0)"
            :overflow-count="999"
            :number-style="{ backgroundColor: '#108ee9' }"
          />
        </div>

        <!-- 虚拟滚动分组列表 -->
        <div class="flex-1 overflow-hidden flex flex-col relative">
          <Spin :spinning="groupLoading" class="h-full">
            <div
              v-bind="containerProps"
              class="h-full overflow-y-auto pr-1 select-none"
              @scroll="onContainerScroll"
            >
              <div v-bind="wrapperProps">
                <div
                  v-for="{ data: group } in virtualGroups"
                  :key="group.id"
                  class="group flex items-center justify-between px-3 py-1.5 rounded cursor-pointer transition-colors text-sm h-[48px] mb-1 box-border"
                  :class="
                    selectedGroupId === group.id
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted text-foreground'
                  "
                  @click="onSelectGroup(group.id)"
                >
                  <div class="truncate flex-1 mr-2" :title="group.name">
                    <div class="truncate">{{ group.name }}</div>
                    <div
                      v-if="group.description"
                      class="text-[11px] text-muted-foreground truncate"
                    >
                      {{ group.description }}
                    </div>
                  </div>

                  <div class="flex items-center gap-1 shrink-0">
                    <Badge
                      :count="group.deviceCount || 0"
                      :overflow-count="999"
                      :number-style="{
                        backgroundColor:
                          selectedGroupId === group.id ? '#1890ff' : '#8c8c8c',
                      }"
                    />
                    <div class="hidden group-hover:flex items-center gap-1 ml-1">
                      <Tooltip title="编辑分组">
                        <Button
                          size="small"
                          type="link"
                          class="p-0 h-auto text-xs"
                          @click.stop="onEditGroup(group)"
                        >
                          改
                        </Button>
                      </Tooltip>
                      <Tooltip title="删除分组">
                        <Button
                          size="small"
                          type="link"
                          danger
                          class="p-0 h-auto text-xs"
                          @click.stop="onDeleteGroup(group)"
                        >
                          删
                        </Button>
                      </Tooltip>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 滚动加载指示器 -->
              <div
                v-if="groupLoadingMore"
                class="py-2 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5"
              >
                <Spin size="small" /> 正在加载更多...
              </div>
              <div
                v-else-if="!hasMoreGroups && groupList.length > 0"
                class="py-2 text-center text-[11px] text-muted-foreground/60"
              >
                已加载全部 (共 {{ totalGroups }} 个)
              </div>

              <Empty
                v-if="!groupLoading && groupList.length === 0"
                description="暂无分组"
                class="mt-6"
              />
            </div>
          </Spin>
        </div>
      </Card>

      <!-- 右侧：设备列表与监控表格 -->
      <div class="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Grid>
          <!-- 表格上方标题栏与分组指示 -->
          <template #table-title>
            <div class="flex items-center gap-2 text-sm font-medium">
              <span class="text-muted-foreground">{{
                $t('page.system.title', '系统管理')
              }}</span>
              <span class="text-muted-foreground/60">/</span>
              <span class="font-bold text-base text-foreground">
                设备管理
              </span>
              <span
                v-if="currentGroup"
                class="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs ml-2 font-normal"
              >
                当前查看分组：{{ currentGroup.name }}
              </span>
            </div>
          </template>

          <!-- 搜索过滤与批量操作 -->
          <template #top>
            <div
              class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
            >
              <div class="flex items-center gap-2 flex-wrap">
                <Input.Search
                  v-model:value="filterText"
                  placeholder="搜索设备备注、型号或 UUID..."
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
                    { label: 'Web/H5', value: 'web' },
                  ]"
                  @change="refreshGrid"
                />
                <Select
                  v-model:value="isEnabledFilter"
                  placeholder="授权状态"
                  allow-clear
                  class="w-28"
                  :options="[
                    { label: '允许登录', value: 'true' },
                    { label: '已禁止', value: 'false' },
                  ]"
                  @change="refreshGrid"
                />
              </div>

              <div class="flex items-center gap-2">
                <Button danger @click="onBatchDelete">
                  批量强制下线
                </Button>
              </div>
            </div>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>

