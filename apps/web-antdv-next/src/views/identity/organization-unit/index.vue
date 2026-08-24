<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { OrganizationUnitDto } from '#/api/identity';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, Modal, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteOrganizationUnitApi,
  getAllOrganizationUnitsApi,
} from '#/api/identity';
import { $t } from '#/locales';
import PermissionModal from '#/views/permission/permission-modal.vue';

import { useColumns } from './data';
import OUModal from './modules/ou-modal.vue';

const filterText = ref('');

const [OUFormModal, ouFormModalApi] = useVbenModal({
  connectedComponent: OUModal,
  destroyOnClose: true,
});

const [OUPermModal, ouPermModalApi] = useVbenModal({
  connectedComponent: PermissionModal,
  destroyOnClose: true,
});

function onCreate() {
  ouFormModalApi.setData(null).open();
}

function onAddChild(row: OrganizationUnitDto) {
  ouFormModalApi
    .setData({
      isAddChild: true,
      parent: row,
    })
    .open();
}

function onEdit(row: OrganizationUnitDto) {
  ouFormModalApi
    .setData({
      dept: row,
    })
    .open();
}

function onPermission(row: OrganizationUnitDto) {
  ouPermModalApi
    .setData({
      displayName: row.displayName,
      providerKey: row.id,
      providerName: 'O',
    })
    .open();
}

function onDelete(row: OrganizationUnitDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: $t('page.identity.dept.deleteConfirm', [row.displayName]),
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteOrganizationUnitApi(row.id);
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
  row: OrganizationUnitDto;
}) {
  switch (code) {
    case 'add-child': {
      onAddChild(row);
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
      enabled: false,
    },
    proxyConfig: {
      ajax: {
        query: async () => {
          const res = await getAllOrganizationUnitsApi();
          const items = res?.items || (res as any) || [];
          if (filterText.value) {
            return items.filter((item: OrganizationUnitDto) =>
              item.displayName
                ?.toLowerCase()
                .includes(filterText.value.toLowerCase()),
            );
          }
          return items;
        },
      },
    },
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
    treeConfig: {
      parentField: 'parentId',
      rowField: 'id',
      transform: true,
    },
  } as VxeTableGridOptions,
});

function refreshGrid() {
  gridApi.query();
}
</script>

<template>
  <Page auto-content-height>
    <OUFormModal @success="refreshGrid" />
    <OUPermModal />
    <Grid :table-title="$t('page.identity.dept.title', '组织机构 / 部门管理')">
      <template #toolbar-tools>
        <div class="flex items-center gap-2">
          <Input.Search
            v-model:value="filterText"
            :placeholder="$t('common.searchPlaceholder', '搜索部门名称...')"
            allow-clear
            class="w-64"
            @search="refreshGrid"
          />
          <Button
            type="primary"
            v-access="['AbpIdentity.OrganizationUnits.Create']"
            @click="onCreate"
          >
            <Plus class="size-4 mr-1" />
            {{ $t('page.identity.dept.create', '新建根部门') }}
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
