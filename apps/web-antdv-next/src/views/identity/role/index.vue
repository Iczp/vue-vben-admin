<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IdentityRoleDto } from '#/api/identity';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, Modal, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRoleApi, getRolesApi } from '#/api/identity';
import { $t } from '#/locales';
import PermissionModal from '#/views/permission/permission-modal.vue';

import { useColumns } from './data';
import RoleModal from './modules/role-modal.vue';

const filterText = ref('');

const [RoleFormModal, roleFormModalApi] = useVbenModal({
  connectedComponent: RoleModal,
  destroyOnClose: true,
});

const [RolePermModal, rolePermModalApi] = useVbenModal({
  connectedComponent: PermissionModal,
  destroyOnClose: true,
});

function onCreate() {
  roleFormModalApi.setData(null).open();
}

function onEdit(row: IdentityRoleDto) {
  roleFormModalApi.setData(row).open();
}

function onPermission(row: IdentityRoleDto) {
  rolePermModalApi
    .setData({
      displayName: row.name,
      providerKey: row.name,
      providerName: 'R',
    })
    .open();
}

function onDelete(row: IdentityRoleDto) {
  Modal.confirm({
    content: $t('page.identity.role.deleteConfirm', [row.name]),
    okText: $t('common.confirm', '确认'),
    cancelText: $t('common.cancel', '取消'),
    okType: 'danger',
    async onOk() {
      await deleteRoleApi(row.id);
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
  row: IdentityRoleDto;
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
          return await getRolesApi({
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
    <RoleFormModal @success="refreshGrid" />
    <RolePermModal />
    <Grid :table-title="$t('page.identity.role.title', '角色列表')">
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
            v-access="['AbpIdentity.Roles.Create']"
            @click="onCreate"
          >
            <Plus class="size-4 mr-1" />
            {{ $t('common.create', '新建角色') }}
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
