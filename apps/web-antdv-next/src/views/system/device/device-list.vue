<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DeviceDto } from '#/api/device';

import { nextTick, ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import {
  Button,
  Input,
  message,
  Modal,
  Select,
} from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteDeviceApi,
  deleteDevicesManyApi,
  getDevicesApi,
} from '#/api/device';
import { $t } from '#/locales';

import { useColumns } from './data';
import DeviceGroupPanel from './modules/device-group-panel.vue';
import DeviceModal from './modules/device-modal.vue';
import SetGroupsModal from './modules/set-groups-modal.vue';

// ==================== 1. 设备分组关联 ====================
const groupPanelRef = ref<InstanceType<typeof DeviceGroupPanel>>();
const selectedGroupId = ref<string | undefined>(undefined);
const totalAllDevices = ref(0);

function onGroupSelect(groupId?: string) {
  selectedGroupId.value = groupId;
  refreshGrid();
}

function onGroupChanged() {
  refreshGrid();
}

// ==================== 2. 设备列表与筛选 ====================
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

function onDetail(row: DeviceDto) {
  deviceFormModalApi.setData({ id: row.id, isDetail: true, row }).open();
}

function onEdit(row: DeviceDto) {
  deviceFormModalApi.setData({ id: row.id, isDetail: false, row }).open();
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
    title: '强制下线设备',
    async onOk() {
      await deleteDeviceApi(row.id);
      message.success('设备已强制下线');
      groupPanelRef.value?.reload();
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
    title: '批量下线设备',
    async onOk() {
      const ids = records.map((r: DeviceDto) => r.id);
      await deleteDevicesManyApi(ids);
      message.success(`已成功批量下线 ${records.length} 台设备`);
      groupPanelRef.value?.reload();
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
    case 'detail': {
      onDetail(row);
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
      onDetail(params.row as DeviceDto);
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

function onDeviceSaved() {
  groupPanelRef.value?.reload();
  refreshGrid();
}
</script>

<template>
  <Page auto-content-height>
    <DeviceFormModal @success="onDeviceSaved" />
    <SetGroupsModalComp @success="onDeviceSaved" />

    <div class="flex h-full gap-3 overflow-hidden p-1">
      <!-- 左侧：独立封装的分页+虚拟滚动设备分组卡片 -->
      <DeviceGroupPanel
        ref="groupPanelRef"
        v-model="selectedGroupId"
        :total-devices-count="totalAllDevices"
        @change="onGroupSelect"
        @group-change="onGroupChanged"
      />

      <!-- 右侧：设备列表与监控表格 -->
      <div class="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Grid>
          <!-- 表格上方标题栏与快捷批量操作 -->
          <template #toolbar-tools>
            <div class="flex items-center gap-2 mr-2 flex-wrap">
              <Input.Search
                v-model:value="filterText"
                placeholder="搜索名称 / 设备ID / IMEI / 用户"
                allow-clear
                class="w-64"
                size="small"
                @search="refreshGrid"
              />

              <Select
                v-model:value="platformFilter"
                placeholder="系统平台"
                allow-clear
                class="w-28"
                size="small"
                :options="[
                  { label: 'Android', value: 'Android' },
                  { label: 'iOS', value: 'iOS' },
                  { label: 'Windows', value: 'Windows' },
                  { label: 'macOS', value: 'macOS' },
                  { label: 'Linux', value: 'Linux' },
                  { label: 'Web', value: 'Web' },
                ]"
                @change="refreshGrid"
              />

              <Select
                v-model:value="isEnabledFilter"
                placeholder="状态"
                allow-clear
                class="w-24"
                size="small"
                :options="[
                  { label: '启用', value: 'true' },
                  { label: '禁用', value: 'false' },
                ]"
                @change="refreshGrid"
              />

              <Button
                danger
                size="small"
                @click="onBatchDelete"
              >
                批量下线
              </Button>
            </div>
          </template>
        </Grid>
      </div>
    </div>
  </Page>
</template>
