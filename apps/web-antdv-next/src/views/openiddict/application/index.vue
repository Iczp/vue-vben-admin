<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { ApplicationDto } from '#/api/openiddict';

import { ref } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus } from '@vben/icons';

import { Button, Input, Modal, message } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import {
  deleteApplicationApi,
  getApplicationsApi,
} from '#/api/openiddict';
import { $t } from '#/locales';

import { useColumns } from './data';
import ApplicationModal from './modules/application-modal.vue';

const filterText = ref('');

const [AppFormModal, appFormModalApi] = useVbenModal({
  connectedComponent: ApplicationModal,
  destroyOnClose: true,
});

function onCreate() {
  appFormModalApi.setData(null).open();
}

function onEdit(row: ApplicationDto) {
  appFormModalApi.setData(row).open();
}

function onDelete(row: ApplicationDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: $t('page.openiddict.deleteConfirm', [
      row.displayName || row.clientId,
    ]),
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteApplicationApi(row.id);
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
  row: ApplicationDto;
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
      onEdit(params.row as ApplicationDto);
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
          return await getApplicationsApi({
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
    <AppFormModal @success="refreshGrid" />
    <Grid :table-title="$t('page.openiddict.title', '客户端应用列表')">
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
            v-access="['OpenIddict.Applications', 'admin']"
            @click="onCreate"
          >
            <Plus class="size-4 mr-1" />
            {{ $t('common.create', '新建应用') }}
          </Button>
        </div>
      </template>
    </Grid>
  </Page>
</template>
