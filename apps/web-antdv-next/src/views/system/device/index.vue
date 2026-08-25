<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { DeviceDto } from '#/api/device';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';

import { Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteDeviceApi, getDevicesApi } from '#/api/device';
import { $t } from '#/locales';

import { useColumns } from './data';
import DeviceModal from './modules/device-modal.vue';

const filterText = ref('');
const platformFilter = ref<string | undefined>(undefined);

const [DeviceFormModal, deviceFormModalApi] = useVbenModal({
  connectedComponent: DeviceModal,
  destroyOnClose: true,
});

function onEdit(row: DeviceDto) {
  deviceFormModalApi.setData(row).open();
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

          return await getDevicesApi({
            keyword: filterText.value || undefined,
            maxResultCount,
            platform: platformFilter.value,
            skipCount,
            sorting: sorting || 'lastActiveTime desc',
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

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <DeviceFormModal @success="refreshGrid" />
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.system.title', '系统管理')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground"
            >登录设备与安全监控</span
          >
        </div>
      </template>

      <!-- 第二行：左侧搜索表单 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              placeholder="搜索设备备注或 UUID..."
              allow-clear
              class="w-60"
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
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
