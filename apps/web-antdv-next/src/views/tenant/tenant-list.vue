<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { TenantDto } from '#/api/multi-tenancy';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, message, Modal } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteTenantApi, getTenantsApi } from '#/api/multi-tenancy';
import { $t } from '#/locales';
import PermissionModal from '#/views/permission/permission-modal.vue';

import { useColumns } from './data';
import ConnectionStringModal from './modules/connection-string-modal.vue';
import FeatureModal from './modules/feature-modal.vue';
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

const [TenantFeatureModal, tenantFeatureModalApi] = useVbenModal({
  connectedComponent: FeatureModal,
  destroyOnClose: true,
});

function onCreate() {
  tenantFormModalApi.setData(null).open();
}

function onEdit(row: TenantDto) {
  tenantFormModalApi.setData(row).open();
}

function onFeatures(row: TenantDto) {
  tenantFeatureModalApi
    .setData({
      providerKey: row.id,
      providerName: 'T',
      title: `${$t('page.tenant.features', '功能特性')} - ${row.name}`,
    })
    .open();
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
    cancelText: $t('common.cancel', '取消'),
    content: $t('page.tenant.deleteConfirm', [row.name]),
    okText: $t('common.confirm', '确认'),
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
    case 'features': {
      onFeatures(row);
      break;
    }
    case 'permission': {
      onPermission(row);
      break;
    }
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as TenantDto);
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
    <TenantFeatureModal />
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.tenant.title', '租户管理')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">{{
            $t('page.tenant.title', '租户列表')
          }}</span>
        </div>
      </template>

      <!-- 第二行：左侧搜索表单，右侧操作按钮 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              :placeholder="$t('common.searchPlaceholder', '关键字搜索...')"
              allow-clear
              class="w-64"
              @search="refreshGrid"
            />
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="primary"
              v-access="['AbpTenantManagement.Tenants.Create', 'admin']"
              @click="onCreate"
            >
              <Plus class="size-4 mr-1" />
              {{ $t('common.create', '新建租户') }}
            </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
