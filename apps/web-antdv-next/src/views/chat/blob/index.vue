<script lang="ts" setup>
import type { VxeTableGridOptions } from '#/adapter/vxe-table';
import type { BlobDto } from '#/api/chat/blob';

import { ref } from 'vue';

import { Page, useVbenDrawer, useVbenModal } from '@vben/common-ui';

import { Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteBlobApi, getBlobListApi } from '#/api/chat/blob';
import { $t } from '#/locales';

import { useColumns } from './data';
import BlobDetailDrawer from './modules/blob-detail-drawer.vue';
import BlobEditModal from './modules/blob-edit-modal.vue';

const filterText = ref('');
const isPublicFilter = ref<boolean | undefined>(undefined);
const isStaticFilter = ref<boolean | undefined>(undefined);

const [EditModalComp, editModalApi] = useVbenModal({
  connectedComponent: BlobEditModal,
  destroyOnClose: true,
});

const [DetailDrawerComp, detailDrawerApi] = useVbenDrawer({
  connectedComponent: BlobDetailDrawer,
  destroyOnClose: true,
});

function onDetail(row: BlobDto) {
  detailDrawerApi.setData({ id: row.id }).open();
}

function onEdit(row: BlobDto) {
  editModalApi.setData(row).open();
}

function onDelete(row: BlobDto) {
  Modal.confirm({
    cancelText: $t('common.cancel', '取消'),
    content: `确定要删除对象【${row.fileName || row.id}】吗？删除后文件将被移除。`,
    okText: $t('common.confirm', '确认'),
    okType: 'danger',
    async onOk() {
      await deleteBlobApi(row.id);
      message.success('对象已删除');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: BlobDto;
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
  }
}

const [Grid, gridApi] = useVbenVxeGrid({
  gridEvents: {
    cellDblclick: (params: { row: any }) => {
      onDetail(params.row as BlobDto);
    },
  },
  gridOptions: {
    columns: useColumns(onActionClick),
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

          return await getBlobListApi({
            isPublic: isPublicFilter.value,
            isStatic: isStaticFilter.value,
            keyword: filterText.value || undefined,
            maxResultCount,
            skipCount,
            sorting: sorting || 'creationTime desc',
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
    <EditModalComp @success="refreshGrid" />
    <DetailDrawerComp />

    <Grid>
      <!-- 第一行左侧：面包屑与标题 -->
      <template #table-title>
        <div class="flex items-center gap-1.5 text-sm font-medium">
          <span class="text-muted-foreground">即时通讯管理</span>
          <span class="text-muted-foreground/60">/</span>
          <span class="font-bold text-base text-foreground">对象存储 (Blob)</span>
        </div>
      </template>

      <!-- 搜索与筛选工具栏 -->
      <template #top>
        <div
          class="flex items-center justify-between py-2 px-1 flex-wrap gap-2 mb-1"
        >
          <div class="flex items-center gap-2 flex-wrap">
            <Input.Search
              v-model:value="filterText"
              placeholder="搜索文件名、容器或 ID..."
              allow-clear
              class="w-64"
              @search="refreshGrid"
            />
            <Select
              v-model:value="isPublicFilter"
              placeholder="访问权限"
              allow-clear
              class="w-32"
              :options="[
                { label: '公开', value: true as any },
                { label: '私有', value: false as any },
              ]"
              @change="refreshGrid"
            />
            <Select
              v-model:value="isStaticFilter"
              placeholder="是否静态"
              allow-clear
              class="w-32"
              :options="[
                { label: '静态资源', value: true as any },
                { label: '普通文件', value: false as any },
              ]"
              @change="refreshGrid"
            />
          </div>
        </div>
      </template>
    </Grid>
  </Page>
</template>
