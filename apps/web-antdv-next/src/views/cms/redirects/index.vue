<script lang="ts" setup>
import type { ContentRedirectDto } from '#/api/cms';

import { reactive } from 'vue';

import { Page, useVbenModal } from '@vben/common-ui';
import { Plus, RotateCw } from '@vben/icons';

import { Button, Card, Input, message, Modal, Select } from 'antdv-next';

import { useVbenVxeGrid } from '#/adapter/vxe-table';
import { deleteRedirectApi, getRedirectsApi } from '#/api/cms';

import { useColumns } from './data';
import RedirectModal from './modules/redirect-modal.vue';

const filters = reactive<{
  enabledFilter?: number;
  entityType?: string;
  keyword: string;
}>({
  enabledFilter: undefined,
  entityType: undefined,
  keyword: '',
});

const [FormModal, formModalApi] = useVbenModal({
  connectedComponent: RedirectModal,
  destroyOnClose: true,
});

function onCreate() {
  formModalApi.setData(undefined).open();
}

function onEdit(row: ContentRedirectDto) {
  formModalApi.setData(row).open();
}

function onDelete(row: ContentRedirectDto) {
  Modal.confirm({
    content: `确定要删除该条重定向映射规则吗？`,
    okText: '确认删除',
    okType: 'danger',
    title: '删除确认',
    async onOk() {
      await deleteRedirectApi(row.id);
      message.success('重定向删除成功');
      refreshGrid();
    },
  });
}

function onActionClick({
  code,
  row,
}: {
  code: string;
  row: ContentRedirectDto;
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
      onEdit(params.row as ContentRedirectDto);
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
      pageSizes: [10, 15, 20, 50],
    },
    proxyConfig: {
      ajax: {
        query: async ({ page }: any) => {
          return await getRedirectsApi({
            entityType: filters.entityType || undefined,
            isEnabled:
              filters.enabledFilter === undefined
                ? undefined
                : filters.enabledFilter === 1,
            keyword: filters.keyword.trim() || undefined,
            maxResultCount: page.pageSize,
            skipCount: (page.currentPage - 1) * page.pageSize,
          });
        },
      },
    },
    round: true,
    size: 'small',
    toolbarConfig: {
      custom: true,
      export: false,
      refresh: true,
      zoom: true,
    },
  },
});

function refreshGrid() {
  gridApi.query();
}

function onFilterChange() {
  gridApi.reload();
}
</script>

<template>
  <Page auto-content-height>
    <div class="h-full flex flex-col gap-3">
      <!-- 搜索过滤栏 -->
      <Card :bordered="false" class="shrink-0 shadow-sm" :body-style="{ padding: '12px 16px' }">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <Input.Search
              v-model:value="filters.keyword"
              placeholder="搜索源路径或目标代码..."
              class="w-[260px]"
              allow-clear
              @search="onFilterChange"
            />

            <Select
              v-model:value="filters.enabledFilter"
              placeholder="状态筛选"
              class="w-[120px]"
              allow-clear
              :options="[
                { label: '启用', value: 1 },
                { label: '停用', value: 0 },
              ]"
              @change="onFilterChange"
            />
          </div>

          <div class="flex items-center gap-2">
            <Button type="primary" @click="onCreate">
              <template #icon><Plus class="size-4" /></template>
              新建重定向
            </Button>
            <Button @click="refreshGrid">
              <template #icon><RotateCw class="size-4" /></template>
              刷新
            </Button>
          </div>
        </div>
      </Card>

      <!-- 表格展示 -->
      <div class="flex-1 min-h-0 bg-background rounded-lg shadow-sm overflow-hidden p-2">
        <Grid />
      </div>
    </div>

    <!-- 弹窗 -->
    <FormModal @success="refreshGrid" />
  </Page>
</template>
