<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { IdentityRoleDto } from '#/api/identity';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, message, Modal } from 'antdv-next';

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
    cancelText: $t('common.cancel', '取消'),
    content: $t('page.identity.role.deleteConfirm', [row.name]),
    okText: $t('common.confirm', '确认'),
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
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onEdit(params.row as IdentityRoleDto);
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
    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">{{
            $t('page.system.title', '系统管理')
          }}</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">{{
            $t('page.identity.role.title', '角色管理')
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
              v-access="['AbpIdentity.Roles.Create', 'admin']"
              @click="onCreate"
            >
              <Plus class="size-4 mr-1" />
              {{ $t('common.create', '新建角色') }}
            </Button>
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
