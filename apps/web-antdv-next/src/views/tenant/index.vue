<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TenantDto } from '#/api/multi-tenancy';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, Modal, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTenantApi, getTenantsApi } from '#/api/multi-tenancy';
import { $t } from '#/locales';
import PermissionModal from '#/views/permission/permission-modal.vue';

import { useColumns } from './data';
import ConnectionStringModal from './modules/connection-string-modal.vue';
import TenantModal from './modules/tenant-modal.vue';

const filterText = ref('');

const [TenantFormModal, tenantFormModalApi] = useVbenModal({
  connectedComponent: TenantModal,
  destroyOnClose: true,
});

const [ConnStrModal, connStrModalApi] = useVbenModal({
  connectedComponent: ConnectionStringModal,
  destroyOnClose: true,
});

const [TenantPermModal, tenantPermModalApi] = useVbenModal({
  connectedComponent: PermissionModal,
  destroyOnClose: true,
});

function onCreate() {
  tenantFormModalApi.setData(null).open();
}

function onEdit(row: TenantDto) {
  tenantFormModalApi.setData(row).open();
}

function onConnectionString(row: TenantDto) {
  connStrModalApi.setData(row).open();
}

function onPermission(row: TenantDto) {
  tenantPermModalApi
    .setData({
      displayName: row.name,
      providerKey: row.id,
      providerName: 'T',
    })
    .open();
}

function onDelete(row: TenantDto) {
  Modal.confirm({
    content: $t('page.tenant.deleteConfirm', [row.name]),
    okText: $t('common.confirm', '确认'),
    cancelText: $t('common.cancel', '取消'),
    okType: 'danger',
    async onOk() {
      await deleteTenantApi(row.id);
      message.success($t('common.deleteSuccess', '删除成功'));
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: TenantDto;
}) {
  switch (code) {
    case 'connection-string': {
      onConnectionString(row);
      break;
    }
    case 'delete': {
      onDelete(row);
      break;
    }
    case 'edit': {
      onEdit(row);
      break;
    }
    case 'permission': {
      onPermission(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {},
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
        query: async ({ page }) => {
          const skipCount = (page.currentPage - 1) * page.pageSize;
          const maxResultCount = page.pageSize;
          return await getTenantsApi({
            filter: filterText.value || undefined,
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

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <TenantFormModal @success="refreshGrid" />
    <ConnStrModal />
    <TenantPermModal />
    <Grid :table-title="$t('page.tenant.title', '租户列表')">
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Input.Search
            v-model:value="filterText"
            :placeholder="$t('common.searchPlaceholder', '关键字搜索...')"
            allow-clear
            class="w-64"
            @search="refreshGrid"
          />
          <Button
            type="primary"
            v-access="['AbpTenantManagement.Tenants.Create']"
            @click="onCreate"
          >
            <Plus class="size-4 mr-1" />
            {{ $t('common.create', '新建租户') }}
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
